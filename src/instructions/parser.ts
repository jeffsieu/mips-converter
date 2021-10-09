import type Instruction from "./instruction";
import RInstruction from "./r-instruction";
import IInstruction from "./i-instruction";
import JInstruction from "./j-instruction";
import { getOpcodeValue, getShiftAmount, getFunctionCode, getImmediate, getJumpAddress, getUnknown, getRegisterName, getRegisterNumber } from './parser/extractors';
import instructionSpecs from './data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import type { InstructionType } from "./types";
import UnknownInstruction from './unknown-instruction';

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
