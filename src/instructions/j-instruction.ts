import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import { JumpAddressField, OpcodeField } from './fields';

import Instruction from './instruction';
import type { Settings } from './settings';

export default class JInstruction extends Instruction {
  readonly jumpAddress: JumpAddressField;

  static fromBinary(binary: string, settings: Settings): JInstruction {
    const extractor = new FieldExtractor(binary, settings);

    const opcode = extractor.extractField(OpcodeField);
    const jumpAddress = extractor.extractField(JumpAddressField);
    
    return new JInstruction(opcode, jumpAddress);
  }

  private constructor(opcode: OpcodeField, jumpAddress: JumpAddressField) {
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