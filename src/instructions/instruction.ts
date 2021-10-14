import type { OpcodeField } from './fields/opcode-field';
import type { InstructionField } from './fields/instruction-field';
import type { InstructionSpec } from './types';
import type { FieldRole } from './field-role';

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

export type MipsPart = {
  value: string,
  fieldRole: FieldRole | null;
}

export default abstract class Instruction {
  readonly opcode: OpcodeField;
  readonly fields: InstructionField<number>[];
  readonly spec: InstructionSpec | null;
  readonly fieldRoles: FieldRole[];

  protected constructor(
    opcode: OpcodeField,
    fields: InstructionField<number>[],
    spec: InstructionSpec | null,
    fieldRoles: FieldRole[],
  ) {
    this.opcode = opcode;
    this.fields = fields;
    this.spec = spec;
    this.fieldRoles = fieldRoles;
  }

  abstract toMips(): MipsPart[] | null;
}