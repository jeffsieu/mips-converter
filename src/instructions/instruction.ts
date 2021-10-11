import type InstructionField from "./instruction-field";
import type { InstructionSpec } from "./types";

export default abstract class Instruction {
  opcode: InstructionField<6>;
  fields: InstructionField<number>[];
  spec: InstructionSpec | null;

  protected constructor(opcode: InstructionField<6>, fields: InstructionField<number>[], spec: InstructionSpec | null) {
    this.opcode = opcode;
    this.fields = fields;
    this.spec = spec;
  }

  abstract toMips(): string | null;
}