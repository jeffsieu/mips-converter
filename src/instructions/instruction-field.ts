import type { FieldName } from "./types";

export default class InstructionField<L extends number> {
  name: FieldName;
  value: string;
  binary: string;
  interpolatedValue: number;
  length: L;

  constructor(name: FieldName, value: string, binary: string, length: L) {
    this.name = name;
    this.value = value;
    this.binary = binary;
    this.length = length;
    this.interpolatedValue = parseInt(binary.padEnd(length, '0'), 2);
  }
};