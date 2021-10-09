import type InstructionField from "./instruction-field";
import type { InstructionSpec } from "./types";

export default abstract class Instruction {
  opcode: InstructionField<6>;
  fields: Array<InstructionField<number>>;
  spec: InstructionSpec | null;

  constructor(opcode: InstructionField<6>) {
    this.opcode = opcode;
  }

  abstract toMips(): string | null;
}