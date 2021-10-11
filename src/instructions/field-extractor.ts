import InstructionField from "./instruction-field";
import type { FieldName } from "./types";



class RInstructionFieldExtract {
  extractFields() {

  }

}
export default class FieldExtractor {
  bits: string;

  constructor(binary: string) {
    this.bits = binary;
  }

  extractBits(length: number): string {
    const extracted = this.bits.substring(0, length);
    this.bits = this.bits.substring(length);
    return extracted;
  }
		
  extractField<L extends number>(name: FieldName, length: L, getValue: (bits: string) => string): InstructionField<L> {
    let fieldValue = 'unknown';

    const extractedBits = this.extractBits(length);
     {
      try {
        fieldValue = getValue(extractedBits.padEnd(length, '0'));
      } catch (e) {
        fieldValue = 'error';
      }
    }
    return new InstructionField(
      name,
      fieldValue,
      extractedBits,
      length,
    );
  }
}