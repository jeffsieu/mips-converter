import { isShiftInstruction, isUnsignedImmediateInstruction, isInstructionDeclaredAsR, isInstructionDeclaredAsI, isLoadStoreInstruction, isJumpInstruction } from '../instruction';
import { getInstructionSpecWithMnemonic, getRegisterNumberFromName } from '../fields/extractors';
import type { ParseInfo, ParseResult } from '../parser/parse-info';
import type { InstructionSpec } from '../types';

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

function parseTwosComplement(value: number, length: number): ParseResult<string> {
  // Check range
  const twoToNMinusOne = 2 ** (length - 1);
  if (value >= twoToNMinusOne || value < -twoToNMinusOne) {
    return {
      value: null,
      message: {
        value: 'Signed immediate out of range: ' + value,
        severity: 'error',
      },
    };
  }
  if (value >= 0) {
    return {
      value: value.toString(2).padStart(length, '0'),
      message: null,
    };
  } else {
    // Calculate the complement
    const positiveValue = -value;
    const positiveBits = positiveValue.toString(2).padStart(length, '0');
    const flippedBits = positiveBits.split('').map(c => c === '0' ? '1' : '0').join('');
    const flippedAsUnsigned = parseInt(flippedBits, 2);
    const twosComplementUnsignedValue = flippedAsUnsigned + 1;
    return {
      value: twosComplementUnsignedValue.toString(2).padStart(length, '1'),
      message: null,
    };
  }
}

function parseImmediateWithLengthToBits(fieldName: string, immediate: string, length: number, signed: boolean): ParseResult<string> {
  // No error will be thrown since regex always matches a valid immediate
  const immediateNumber = parseInt(immediate);

  // Unsigned but given negative value
  if (!signed && immediateNumber < 0) {
    return {
      value: null,
      message: {
        value: fieldName + ' is unsigned but given a negative value: ' + immediate,
        severity: 'error',
      },
    };
  }

  if (signed) {
    return parseTwosComplement(immediateNumber, length);
  }

  // Parse as unsigned number
  const bits = immediateNumber.toString(2).padStart(length, '0');

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
  };
}

function parseImmediateToBits(immediate: string, signed: boolean): ParseResult<string> {
  return parseImmediateWithLengthToBits('immediate', immediate, 16, signed);
}

function parseShiftAmountToBits(shiftAmount: string): ParseResult<string> {
  return parseImmediateWithLengthToBits('shift amount', shiftAmount, 5, false);
}

function parseJumpAddressToBits(jumpAddress: string): ParseResult<string> {
  return parseImmediateWithLengthToBits('shift amount', jumpAddress, 26, false);
}

function isParseInfo(parseInfo: ParseInfo | null): parseInfo is ParseInfo {
  return parseInfo !== null;
}

function getThreeRegistersBits(instructionSpec: InstructionSpec, args: string[]): ParseResult<string> {
  if (args.length !== 3) {
    // TODO: Better error name
    throw new Error('???');
  }

  const registers = args.map(parseRegisterToBits);

  const message: string = registers
    .map(result => result.message)
    .filter(isParseInfo)
    .map(message => message.value)
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
  const signed = !isUnsignedImmediateInstruction(instructionSpec);

  // args = [rDest, rSource, immediate]
  const results = [
    parseRegisterToBits(args[0]),
    parseRegisterToBits(args[1]),
    isShift ? parseShiftAmountToBits(args[2]) : parseImmediateToBits(args[2], signed),
  ];

  const message: string = results
    .map(result => result.message)
    .filter(isParseInfo)
    .map(message => message.value)
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
    throw new Error('???');
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