import type Instruction from "./instruction";
import RInstruction from "./r-instruction";
import IInstruction from "./i-instruction";
import JInstruction from "./j-instruction";
import { getOpcodeValue, getShiftAmount, getFunctionCode, getImmediate, getJumpAddress, getUnknown, getRegisterName, getRegisterNumber, getRegisterNumberFromName } from './parser/extractors';
import instructionSpecs from './data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import type { InstructionType } from "./types";
import UnknownInstruction from './unknown-instruction';
import InstructionField from "./instruction-field";

const shiftMnemonics = ['sll', 'srl', 'sra'];

function getType(binary: string): InstructionType | 'U' {
  if (binary.length < 6) {
    return 'U';
  }
  const opcode = parseInt(binary.substring(0, 6), 2);
  if (opcode === 0) {
    // R-type instruction
    return 'R';
  } else {
    const instruction = instructionSpecs.find(i => i.opcode === opcode);
    return instruction?.type as InstructionType;
  }
}

export function parseInstruction(binary: string, showRegisterName: boolean): Instruction {
  const extractor = new FieldExtractor(binary);
  const type = getType(binary);
  const opcode = extractor.extractField('opcode', 6, getOpcodeValue);

  const getRegister = showRegisterName ? getRegisterName : getRegisterNumber;

  switch (type) {
    case 'R': {
      const rs = extractor.extractField('rs', 5, getRegister);
      const rt = extractor.extractField('rt', 5, getRegister);
      const rd = extractor.extractField('rd', 5, getRegister);
      const shamt = extractor.extractField('shamt', 5, getShiftAmount);
      const funct = extractor.extractField('funct', 6, getFunctionCode);

      return new RInstruction(opcode, rs, rt, rd, shamt, funct);
    }
    case 'I': {
      const rs = extractor.extractField('rs', 5, getRegister);
      const rt = extractor.extractField('rt', 5, getRegister);
      const immediate = extractor.extractField('immed', 16, getImmediate);

      return new IInstruction(opcode, rs, rt, immediate);
    }
    case 'J': {
      const jumpAddress = extractor.extractField('jaddr', 26, getJumpAddress);
      return new JInstruction(opcode, jumpAddress);
    }
    case 'U':
      const unknown = extractor.extractField('unknown', 26, getUnknown);
      return new UnknownInstruction(opcode, unknown);
  }
}

function parseMipsInstructionWithImmediate(mnemonic: string, rDest: string, rSource: string, immediate: string) {
  const instructionSpec = instructionSpecs.find(i => i.mnemonic === mnemonic) ?? null;

  if (instructionSpec === null) {
    return null;
  }

  if (instructionSpec.type !== 'I' && !(shiftMnemonics.includes(instructionSpec.mnemonic))) {
    console.log("Valid syntax but invalid mnenonic for given format");
    return null;
  }

  const rDestNumber = getRegisterNumberFromName(rDest);
  if (rDestNumber === null) {
    console.log('Invalid register number');
    return null;
  }

  const rSourceNumber = getRegisterNumberFromName(rSource);
  if (rSourceNumber === null) {
    console.log('Invalid register number');
    return null;
  }

  const opcodeBits = instructionSpec.opcode.toString(2).padStart(6, '0');
  const rSourceBits = rSourceNumber.toString(2).padStart(5, '0');
  const rDestBits = rDestNumber.toString(2).padStart(5, '0');
  const functBits = (instructionSpec.functionCode ?? 0).toString(2).padStart(6, '0');
  
  if (shiftMnemonics.includes(mnemonic)) {
    // TODO: Check that immediate can fit inside shamt

    // rt is shifted and stored in rd; rs is unused
    const rsBits = '00000';
    const shamtBits = parseInt(immediate).toString(2).padStart(5, '0');
    return opcodeBits + rsBits + rSourceBits + rDestBits + shamtBits + functBits;
  } else {
    // Actual immediate instruction
    const immediateBits = parseInt(immediate).toString(2).padStart(16, '0');
    return opcodeBits + rSourceBits + rDestBits + immediateBits;
  }

}


export function getMipsInstructionBinary(mipsInstruction: string): string | null {
  const mnemonicRegex = '(\\w+)';
  const registerRegex = '\\$(\\w+)';
  const immediateRegex = '((?:0x|0b)?\\d+)';

  const instructionRegex = `^${mnemonicRegex}\\s+${registerRegex}\\s*,\\s*${registerRegex}\\s*,\\s*(?:${registerRegex}|${immediateRegex})$`;
  const loadInstructionRegex = `^${mnemonicRegex}\\s+${registerRegex}\\s*,\\s*${immediateRegex}?\\s*\\(\\s*${registerRegex}\\s*\\)$`;
  const jumpInstructionRegex = `^${mnemonicRegex}\\s+${immediateRegex}$`;

  const matches = mipsInstruction.toLowerCase().match(instructionRegex);
  if (matches !== null) {
    // Instruction matches one of the following:
    // mne $t1, $t2, 1   (R (shift) or I type)
    // mne $t1, $t2, $t3 (R type)

    const mnemonic = matches[1];
    const rDest = matches[2];
    const r1 = matches[3];
    const r2 = matches[4];
    const immediate = matches[5];
    const instructionSpec = instructionSpecs.find(i => i.mnemonic === mnemonic) ?? null;

    if (instructionSpec === null) {
      console.log('Unknown mnemonic');
      return null;
    }

    console.log(r2);

    if (r2) {
      // mne $t1, $t2, $3 format

      if (shiftMnemonics.includes(instructionSpec.mnemonic)) {
        console.log("Valid three-register format but invalid mnemonic (shift instruction)");
        return null;
      }

      const rdNumber = getRegisterNumberFromName(rDest);
      if (rdNumber === null) {
        console.log('Invalid register number');
        return null;
      }

      const r1Number = getRegisterNumberFromName(r1);
      if (r1Number === null) {
        console.log('Invalid register number');
        return null;
      }

      const r2Number = getRegisterNumberFromName(r2);
      if (r2Number === null) {
        console.log('Invalid register number');
        return null;
      }

      const opcodeBits = instructionSpec.opcode.toString(2).padStart(6, '0');
      const rdBits = rdNumber.toString(2).padStart(5, '0');
      const rsBits = r1Number.toString(2).padStart(5, '0');
      const rtBits = r2Number.toString(2).padStart(5, '0');
      const shamtBits = '00000';
      const functBits = (instructionSpec.functionCode ?? 0).toString(2).padStart(6, '0');

      const instructionBinary = opcodeBits + rsBits + rtBits + rdBits + shamtBits + functBits;

      return instructionBinary;
    } else {
      // mne $t1, $t2, 0x1 format
      return parseMipsInstructionWithImmediate(mnemonic, rDest, r1, immediate);
    }
  }

  const matchesLoad = mipsInstruction.match(loadInstructionRegex);
  if (matchesLoad !== null) {
    // TODO: Assert that only load/store mnemonics are used
    const mnemonic = matchesLoad[1];
    const rDest = matchesLoad[2];
    const immediate = matchesLoad[3];
    const rSource = matchesLoad[4];

    return parseMipsInstructionWithImmediate(mnemonic, rDest, rSource, immediate);
  }

  const matchesJump = mipsInstruction.match(jumpInstructionRegex);
  if (matchesJump !== null) {
    const mnemonic = matchesJump[1];
    const jumpAddress = matchesJump[2];

    const instructionSpec = instructionSpecs.find(i => i.mnemonic === mnemonic) ?? null;

    if (instructionSpec === null) {
      return null;
    }

    // TODO: Assert that mnenomic is a jump instruction
    const opcodeBits = instructionSpec.opcode.toString(2).padStart(6, '0');
    const jumpAddressBits = parseInt(jumpAddress).toString(2).padStart(26, '0');

    return opcodeBits + jumpAddressBits;
  }

  return null;
}