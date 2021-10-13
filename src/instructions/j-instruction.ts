import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import type { FieldRole } from './field-role';
import { JumpAddressField, OpcodeField } from './fields';

import Instruction from './instruction';
import type { Settings } from './settings';
import type { InstructionSpec } from './types';

export default class JInstruction extends Instruction {
  readonly jumpAddress: JumpAddressField;

  static fromBinary(binary: string, settings: Settings): JInstruction {
    const extractor = new FieldExtractor(binary, settings);

    const opcode = extractor.extractField(OpcodeField);
    const jumpAddress = extractor.extractField(JumpAddressField);
    const instructionSpec = instructionSpecs.find(spec => spec.opcode === opcode.interpolatedValue) ?? null;
    
    return new JInstruction(opcode, jumpAddress, instructionSpec);
  }

  private constructor(
    opcode: OpcodeField,
    jumpAddress: JumpAddressField,
    instructionSpec: InstructionSpec | null,
  ) {
    super(
      opcode,
      [opcode, jumpAddress], // fields
      instructionSpec,
      ['instruction', 'jump address'],
    );
    this.jumpAddress = jumpAddress;
  }

  override toMips(): string {
    const mipsInstruction = this.opcode.value + ' ' + this.jumpAddress.value;
    return mipsInstruction;
  }
}