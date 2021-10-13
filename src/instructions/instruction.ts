import type { OpcodeField } from './fields/opcode-field';
import type { InstructionField } from './fields/instruction-field';
import type { InstructionSpec } from './types';

const shiftMnemonics = ['sll', 'srl', 'sra'];
const loadStoreMnemonics = ['lbu', 'lhu', 'll', 'lui', 'lw', 'lb', 'sb', 'sc', 'sh', 'sw'];

/**
 * Returns if the instruction in MIPS is declared in the form "mne $r1, $r2, $r3"
 */
export function isInstructionDeclaredAsR(instructionSpec: InstructionSpec): boolean {
  return instructionSpec.type === 'R' && !isShiftInstruction(instructionSpec);
}

/**
 * Returns if the instruction in MIPS is declared in the form "mne $r1, $r2, immed"
 */
export function isInstructionDeclaredAsI(instructionSpec: InstructionSpec): boolean {
  return (instructionSpec.type === 'I' && !isLoadStoreInstruction(instructionSpec))
    || isShiftInstruction(instructionSpec);
}

export function isShiftInstruction(instructionSpec: InstructionSpec): boolean {
  return shiftMnemonics.includes(instructionSpec.mnemonic);
}

export function isLoadStoreInstruction(instructionSpec: InstructionSpec): boolean {
  return loadStoreMnemonics.includes(instructionSpec.mnemonic);
}

export function isJumpInstruction(instructionSpec: InstructionSpec): boolean {
  return instructionSpec.type === 'J';
}

export function isUnsignedImmediateInstruction(instructionSpec: InstructionSpec): boolean {
  return instructionSpec.mnemonic.endsWith('u');
}

export default abstract class Instruction {
  opcode: OpcodeField;
  fields: InstructionField<number>[];
  spec: InstructionSpec | null;

  protected constructor(opcode: OpcodeField, fields: InstructionField<number>[], spec: InstructionSpec | null) {
    this.opcode = opcode;
    this.fields = fields;
    this.spec = spec;
  }

  abstract toMips(): string | null;
}