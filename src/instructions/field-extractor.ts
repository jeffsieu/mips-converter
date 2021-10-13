import type { InstructionField } from './fields/instruction-field';
import type { Settings } from './settings';

export type FieldConstructor<L extends number, F extends InstructionField<L>> = {
  new(binary: string, settings: Settings): F,
  fieldLength: L,
};

export default class FieldExtractor {
  bits: string;
  settings: Settings;

  constructor(binary: string, settings: Settings) {
    this.bits = binary;
    this.settings = settings;
  }

  private extractBits(length: number): string {
    const extracted = this.bits.substring(0, length);
    this.bits = this.bits.substring(length);
    return extracted;
  }
		
  extractField<FieldType extends InstructionField<number>>(fieldType: FieldConstructor<number, FieldType>): FieldType {
    const extractedBits = this.extractBits(fieldType.fieldLength);
    return new fieldType(extractedBits, this.settings);
  }
}