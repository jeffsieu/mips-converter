import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';

import Instruction from "./instruction";
import type InstructionField from './instruction-field';
import { getJumpAddress, getOpcodeValue } from './parser/extractors';
import type { Settings } from './settings';

export default class JInstruction extends Instruction {
  readonly jumpAddress: InstructionField<26>;

  static fromBinary(binary: string, settings: Settings): JInstruction {
    const extractor = new FieldExtractor(binary);

    const opcode = extractor.extractField('opcode', 6, getOpcodeValue);
    const jumpAddress = extractor.extractField('jaddr', 26, getJumpAddress(settings.immediateFormat));
    
    return new JInstruction(opcode, jumpAddress);
  }

  constructor(opcode: InstructionField<6>, jumpAddress: InstructionField<26>) {
    super(
      opcode,
      [opcode, jumpAddress], // fields
      instructionSpecs.find(spec => spec.opcode === opcode.interpolatedValue) ?? null, // instructionSpec
    );
    this.jumpAddress = jumpAddress;
  }

  override toMips(): string {
    const mipsInstruction = this.opcode.value + ' ' + this.jumpAddress.value;
    return mipsInstruction;
  }
}