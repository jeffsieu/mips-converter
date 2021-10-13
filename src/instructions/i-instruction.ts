import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import Instruction, { isUnsignedImmediateInstruction } from './instruction';
import type { InstructionField } from './fields/instruction-field';
import type { Settings } from './settings';
import type { FieldName, InstructionSpec } from './types';
import { OpcodeField, RsField, RtField, ImmediateField, UnsignedImmediateField, SignedImmediateField } from './fields';
import type { FieldRole } from './field-role';

function formatIInstruction(mnemonic: string, fields: InstructionField<number>[]): string {
  // Fields = [rs, rt, immed]
  const fieldValues = fields.map(f => f.value);
  switch (mnemonic) {
  case 'lbu':
  case 'lhu':
  case 'll':
  case 'lui':
  case 'lw':
  case 'lb':
  case 'sb':
  case 'sc':
  case 'sh':
  case 'sw':
    return `${fieldValues[1]}, ${fieldValues[2]}(${fieldValues[0]})`;
  case 'beq':
  case 'bne':
  default:
    // format: addi r1, r2, immed
    return `${fieldValues[1]}, ${fieldValues[0]}, ${fieldValues[2]}`;
  }
}

export default class IInstruction extends Instruction {
  readonly rs: RtField;
  readonly rt: RtField;
  readonly immediate: ImmediateField;

  static fromBinary(binary: string, settings: Settings): IInstruction {
    const extractor = new FieldExtractor(binary, settings);

    const opcode = extractor.extractField(OpcodeField);
    const instructionSpec = instructionSpecs.find(spec => spec.opcode === opcode.interpolatedValue) ?? null;
    
    const signed = instructionSpec ? !isUnsignedImmediateInstruction(instructionSpec) : false;

    const rs = extractor.extractField(RsField);
    const rt = extractor.extractField(RtField);
    const immediate = extractor.extractField(signed ? SignedImmediateField : UnsignedImmediateField);

    return new IInstruction(opcode, rs, rt, immediate, instructionSpec);
  }

  private constructor(
    opcode: OpcodeField,
    rs: RsField,
    rt: RtField,
    immediate: ImmediateField,
    instructionSpec: InstructionSpec | null,
  ) {
    super(
      opcode,
      [opcode, rs, rt, immediate], // fields
      instructionSpec,
      ['instruction', 'source', 'destination', 'immediate'],
    );
    this.rs = rs;
    this.rt = rt;
    this.immediate = immediate;
  }

  override toMips(): string | null {
    if (!this.spec?.mnemonic) {
      return null;
    }
    const fieldsInInstruction: FieldName[] = ['rs', 'rt', 'immed'];
    
    const filteredFields = this.fields
      .filter(f => fieldsInInstruction.includes(f.name))
      .sort((f1, f2) => fieldsInInstruction.indexOf(f1.name) - fieldsInInstruction.indexOf(f2.name));
        
    const formatString = formatIInstruction(this.spec?.mnemonic, filteredFields);

    const mipsInstruction = this.spec.mnemonic + ' ' + formatString;
    return mipsInstruction;
  }
}