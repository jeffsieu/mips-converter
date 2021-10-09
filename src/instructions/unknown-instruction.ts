import Instruction from "./instruction";
import type InstructionField from "./instruction-field";

export type UnknownField = InstructionField<26>;

export default class UnknownInstruction extends Instruction {
  readonly unknown: UnknownField;

  constructor(opcode: InstructionField<6>, unknown: UnknownField) {
    super(opcode);
    this.unknown = unknown;
    this.fields = [opcode, unknown];
  }

  toMips(): string | null {
    return null;
  }
}