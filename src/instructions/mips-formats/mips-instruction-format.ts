import { getInstructionSpecWithMnemonic, getRegisterNumberFromName } from "../parser/extractors";
import type { ParseResult } from "../parser/parse-info";
import type { InstructionSpec } from "../types";

const shiftMnemonics = ['sll', 'srl', 'sra'];
const loadStoreMnemonics = ['lbu', 'lhu', 'll', 'lui', 'lw', 'lb', 'sb', 'sc', 'sh', 'sw'];

/**
 * Returns if the instruction in MIPS is declared in the form "mne $r1, $r2, $r3"
 */
function isInstructionDeclaredAsR(instructionSpec: InstructionSpec): boolean {
  return instructionSpec.type === 'R' && !isShiftInstruction(instructionSpec);
}

/**
 * Returns if the instruction in MIPS is declared in the form "mne $r1, $r2, immed"
 */
function isInstructionDeclaredAsI(instructionSpec: InstructionSpec): boolean {
  return (instructionSpec.type === 'I' && !isLoadStoreInstruction(instructionSpec))
    || isShiftInstruction(instructionSpec);
}

function isShiftInstruction(instructionSpec: InstructionSpec): boolean {
  return shiftMnemonics.includes(instructionSpec.mnemonic);
}

function isLoadStoreInstruction(instructionSpec: InstructionSpec): boolean {
  return loadStoreMnemonics.includes(instructionSpec.mnemonic);
}

function isJumpInstruction(instructionSpec: InstructionSpec): boolean {
  return instructionSpec.type === 'J';
}

function parseRegisterToBits(registerName: string): ParseResult<string> {
  const registerNumber = getRegisterNumberFromName(registerName);
  if (registerNumber === null) {
    return {
      value: null,
      message: {
        value: 'Unknown register: $' + registerName,
        severity: 'error',
      }
    };
  }
  return {
    value: registerNumber.toString(2).padStart(5, '0'),
    message: null,
  };
}

function parseImmediateWithLengthToBits(fieldName: string, immediate: string, length: number, signed: boolean): ParseResult<string> {
  // No error will be thrown since regex always matches a valid immediate
  const bits = parseInt(immediate).toString(2).padStart(length, '0');

  // Throw error if out of range
  if (bits.length > length) {
    return {
      value: null,
      message: {
        value: fieldName + ' value is too large: ' + immediate,
        severity: 'error',
      },
    };
  }

  return {
    value: bits,
    message: null,
  }
}

function parseImmediateToBits(immediate: string): ParseResult<string> {
  // TODO: handle negative value for signed immediate instructions
  // aka everything (including lw, sw), except those like addiu

  return parseImmediateWithLengthToBits('immediate', immediate, 16, false);
}

function parseShiftAmountToBits(shiftAmount: string): ParseResult<string> {
  return parseImmediateWithLengthToBits('shift amount', shiftAmount, 5, false);
}

function parseJumpAddressToBits(jumpAddress: string): ParseResult<string> {
  return parseImmediateWithLengthToBits('shift amount', jumpAddress, 26, false);
}

function getThreeRegistersBits(instructionSpec: InstructionSpec, args: string[]): ParseResult<string> {
  if (args.length !== 3) {
    // TODO: Better error name
    throw new Error('???');
  }

  const registers = args.map(parseRegisterToBits);

  const message: string = registers
                            .filter(result => result.message !== null)
                            .map(result => result.message!.value)
                            .reduce((m1, m2) => m1 + '\n' + m2, '');

  if (registers.some(result => result.message?.severity === 'error')) {
    // Has an error, then return all the errors
    return {
      value: null,
      message: {
        value: message,
        severity: 'error',
      },
    };
  }

  // All valid registers
  const [rdBits, rsBits, rtBits] = registers.map(result => result.value!);
  const shamtBits = '00000';
  const functBits = (instructionSpec.functionCode ?? 0).toString(2).padStart(6, '0');

  return {
    value: rsBits + rtBits + rdBits + shamtBits + functBits,
    message: null,
  }; 
}

function getImmediateInstructionBits(instructionSpec: InstructionSpec, args: string[]): ParseResult<string> {
  if (args.length !== 3) {
    // TODO: Better error name
    throw new Error('???');
  }

  const isShift = isShiftInstruction(instructionSpec);

  // args = [rDest, rSource, immediate]
  const results = [parseRegisterToBits(args[0]), parseRegisterToBits(args[1]), isShift ? parseShiftAmountToBits(args[2]) : parseImmediateToBits(args[2])];

  const message: string = results
                            .filter(result => result.message !== null)
                            .map(result => result.message!.value)
                            .reduce((m1, m2) => m1 + '\n' + m2, '');

  if (results.some(result => result.message?.severity === 'error')) {
    // Has an error, then return all the errors
    return {
      value: null,
      message: {
        value: message,
        severity: 'error',
      },
    };
  }

  if (isShift) {
    // rt is shifted and stored in rd; rs is unused
    const rsBits = '00000';
    const functBits = instructionSpec.functionCode?.toString(2).padStart(6);
    const [rdBits, rtBits, shamtBits] = results.map(r => r.value!);
    return {
      value: rsBits + rtBits + rdBits + shamtBits + functBits,
      message: null,
    };
  } else {
    // Actual immediate instruction
    const [rtBits, rsBits, immediateBits] = results.map(r => r.value!);
    return {
      value: rsBits + rtBits + immediateBits,
      message: null,
    };
  }
}

function getLoadStoreInstructionBits(instructionSpec: InstructionSpec, args: string[]) {
  // TODO: Better error
  if (args.length !== 3) {
    throw new Error("???");
  }
  // Same as normal immediate, just that order in args is different
  // args: [rDest, immediate, rSource]
  // required: [rDest, rSource, immediate]
  const newArgs = [args[0], args[2], args[1]];
  return getImmediateInstructionBits(instructionSpec, newArgs);
}

function getJumpInstructionBits(instructionSpec: InstructionSpec, args: string[]) {
  // TODO: Better error
  if (args.length !== 1) {
    throw new Error('???');
  }

  return parseJumpAddressToBits(args[0]);
}


export class MipsInstructionFormat {
  /**
   * Represents a MIPS register.
   */
  private static readonly REGEX_REGISTER: string = '\\$(\\w+)';
  /**
   * Represents an immediate value.
   */
  private static readonly REGEX_IMMEDIATE: string = '(-?(?:0x|0b)?\\d+)';
  /**
   * Represents an instruction mnemonic.
   */
  private static readonly REGEX_MNEMONIC: string = '(\\w+)';

  /**
   * Represents instructions  with the format "mne $t1, $t2, $t3".
   */
  private static readonly REGEX_THREE_REGISTER = `^${this.REGEX_MNEMONIC}\\s+${this.REGEX_REGISTER}\\s*,\\s*${this.REGEX_REGISTER}\\s*,\\s*${this.REGEX_REGISTER}$`;

  /**
   * Represents instructions with the format "mne $t1, $t2, immed".
   */
  private static readonly REGEX_TWO_R_ONE_I = `^${this.REGEX_MNEMONIC}\\s+${this.REGEX_REGISTER}\\s*,\\s*${this.REGEX_REGISTER}\\s*,\\s*${this.REGEX_IMMEDIATE}$`;

  /**
   * Represents instructions with the format "mne $t1, immed($t2)".
   */
  private static readonly REGEX_LOAD_STORE = `^${this.REGEX_MNEMONIC}\\s+${this.REGEX_REGISTER}\\s*,\\s*${this.REGEX_IMMEDIATE}?\\s*\\(\\s*${this.REGEX_REGISTER}\\s*\\)$`;

  /**
   * Represents instructions with the format "mne jaddress".
   */
  private static readonly REGEX_JUMP = `^${this.REGEX_MNEMONIC}\\s+${this.REGEX_IMMEDIATE}$`;

  static readonly FORMAT_THREE_REGISTER: MipsInstructionFormat
    = new MipsInstructionFormat(this.REGEX_THREE_REGISTER, isInstructionDeclaredAsR, getThreeRegistersBits);
  static readonly FORMAT_TWO_R_ONE_I: MipsInstructionFormat
    = new MipsInstructionFormat(this.REGEX_TWO_R_ONE_I, isInstructionDeclaredAsI, getImmediateInstructionBits);
  static readonly FORMAT_LOAD_STORE: MipsInstructionFormat
    = new MipsInstructionFormat(this.REGEX_LOAD_STORE, isLoadStoreInstruction, getLoadStoreInstructionBits);
  static readonly FORMAT_JUMP: MipsInstructionFormat
    = new MipsInstructionFormat(this.REGEX_JUMP, isJumpInstruction, getJumpInstructionBits);

  static readonly FORMATS = [
    MipsInstructionFormat.FORMAT_THREE_REGISTER,
    MipsInstructionFormat.FORMAT_TWO_R_ONE_I,
    MipsInstructionFormat.FORMAT_LOAD_STORE,
    MipsInstructionFormat.FORMAT_JUMP,
  ];

  readonly instructionRegex: string;
  readonly getSpecMatchesFormat: (instructionSpec: InstructionSpec) => boolean;
  readonly getArgBits: (instructionSpec: InstructionSpec, args: string[]) => ParseResult<string>;

  private constructor(
    instructionRegex: string,
    getSpecMatchesFormat: (instructionSpec: InstructionSpec) => boolean,
    getArgBits: (instructionSpec: InstructionSpec, args: string[]) => ParseResult<string>,
  ) {
    this.instructionRegex = instructionRegex;
    this.getSpecMatchesFormat = getSpecMatchesFormat;
    this.getArgBits = getArgBits;
  }

  parseMips(mipsString: string): ParseResult<string> {
    const matches = mipsString.toLowerCase().match(this.instructionRegex);

    // Unknown format
    if (matches === null) {
      return {
        value: null,
        message: null,
      };
    }

    const mnemonic = matches[1];
    const instructionSpec = getInstructionSpecWithMnemonic(mnemonic);

    // Unknown mnemonic but valid overall format
    if (instructionSpec === null) {
      return {
        value: null,
        message: {
          value: 'Unknown mnemonic ' + mnemonic,
          severity: 'error',
        }
      };
    }

    const args = matches.slice(2);

    let message: string | null = null;

    // Validate arguments and convert to bits
    const argBits = this.getArgBits(instructionSpec, args);
    if (argBits.message !== null && argBits.message.severity === 'error') {
      return {
        value: null,
        message: argBits.message,
      };
    } else if (argBits.message !== null) {
      message = argBits.message.value;
    }


    // At this point all arguments are valid

    // Everything is valid, but mnemonic does not match format
    // e.g. "addi $t1, $t2, $t3"
    if (!this.getSpecMatchesFormat(instructionSpec)) {
      return {
        value: null,
        message: {
          value: 'Format is valid but not for ' + instructionSpec.mnemonic,
          severity: 'error',
        }
      };
    }

    const opcodeBits = instructionSpec.opcode.toString(2).padStart(6, '0');
    const instructionBinary = opcodeBits + argBits.value;

    return {
      value: instructionBinary,
      message: message !== null ? {
        value: message,
        severity: 'info',
      } : null,
    };
  }
}