import FieldExtractor from './field-extractor';
import { OpcodeField, UnknownField } from './fields';
import Instruction, { MipsPart } from './instruction';
import type { Settings } from './settings';

export default class UnknownInstruction extends Instruction {
  readonly unknown: UnknownField;

  static fromBinary(binary: string, settings: Settings): UnknownInstruction {
    const extractor = new FieldExtractor(binary, settings);

    const opcode = extractor.extractField(OpcodeField);
    const unknown = extractor.extractField(UnknownField);
    return new UnknownInstruction(opcode, unknown);
  }

  constructor(opcode: OpcodeField, unknown: UnknownField) {
    super(
      opcode,
      [opcode, unknown], // fields
      null,
      ['instruction', 'unknown'],
    );
    this.unknown = unknown;
  }

  toMips(): MipsPart[] | null {
    return null;
  }
}