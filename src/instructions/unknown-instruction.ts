import FieldExtractor from "./field-extractor";
import Instruction from "./instruction";
import type InstructionField from "./instruction-field";
import { getOpcodeValue, getUnknown } from "./parser/extractors";
import type { Settings } from "./settings";

export type UnknownField = InstructionField<26>;

export default class UnknownInstruction extends Instruction {
  readonly unknown: UnknownField;

  static fromBinary(binary: string, settings: Settings): UnknownInstruction {
    const extractor = new FieldExtractor(binary);

    const opcode = extractor.extractField('opcode', 6, getOpcodeValue);
    const unknown = extractor.extractField('unknown', 26, getUnknown);
    return new UnknownInstruction(opcode, unknown);
  }

  constructor(opcode: InstructionField<6>, unknown: UnknownField) {
    super(
      opcode,
      [opcode, unknown], // fields
      null, // instructionSpec
    );
    this.unknown = unknown;
  }

  toMips(): string | null {
    return null;
  }
}