import instructionSpecs from './data/instructionSpec.json';

import Instruction from "./instruction";
import type InstructionField from './instruction-field';

export default class JInstruction extends Instruction {
  readonly jumpAddress: InstructionField<26>;

  constructor(opcode: InstructionField<6>, jumpAddress: InstructionField<26>) {
    super(opcode);
    this.jumpAddress = jumpAddress;
    this.spec = instructionSpecs.find(spec => spec.opcode === this.opcode.interpolatedValue) ?? null;
  }

  toMips(): string {
    const mipsInstruction = this.opcode.value + ' ' + this.jumpAddress.value;
    return mipsInstruction;
  }
}