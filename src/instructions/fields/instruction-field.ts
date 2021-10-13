import type { FieldName } from '../types';

export abstract class InstructionField<L extends number> {
  name: FieldName;
  value: string;
  binary: string;
  interpolatedValue: number;
  length: L;

  protected constructor(name: FieldName, binary: string, length: L, getValue: (binary: string) => string) {
    this.name = name;
    this.binary = binary;
    this.length = length;
    const interpolatedBinary = binary.padEnd(length, '0');
    try {
      this.value = getValue(interpolatedBinary);
    } catch (e) {
      this.value = 'unknown';
    }
    this.interpolatedValue = parseInt(interpolatedBinary, 2);
  }
}
