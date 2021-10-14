import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import Instruction, { isUnsignedImmediateInstruction, MipsPart } from './instruction';
import type { InstructionField } from './fields/instruction-field';
import type { Settings } from './settings';
import type { FieldName, InstructionSpec } from './types';
import { OpcodeField, RsField, RtField, ImmediateField, UnsignedImmediateField, SignedImmediateField } from './fields';
import type { FieldRole } from './field-role';

function formatIInstruction(mnemonic: string, fields: InstructionField<number>[]): MipsPart[] {
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
    return [
      {
        value: fieldValues[1],
        fieldRole: mnemonic.startsWith('s') ? 'source' : 'destination',
      },
      {
        value: ', ',
        fieldRole: null,
      },
      {
        value: fieldValues[2],
        fieldRole: 'immediate',
      },
      {
        value: '(',
        fieldRole: null,
      },
      {
        value: fieldValues[0],
        fieldRole: mnemonic.startsWith('s') ? 'destination' : 'source',
      },
      {
        value: ')',
        fieldRole: null,
      },
    ];
  case 'beq':
  case 'bne':
  default:
    // format: addi r1, r2, immed
    return [
      {
        value: fieldValues[1],
        fieldRole: 'source1',
      },
      {
        value: ', ',
        fieldRole: null,
      },
      {
        value: fieldValues[0],
        fieldRole: 'source2',
      },
      {
        value: ', ',
        fieldRole: null,
      },
      {
        value: fieldValues[2],
        fieldRole: 'immediate'
      }
    ];
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

    const fields = [opcode, rs, rt, immediate];

    function isFieldRole(fieldRole: FieldRole | null): fieldRole is FieldRole {
      return fieldRole !== null;
    }

    const fieldRoles = instructionSpec ? formatIInstruction(instructionSpec.mnemonic, fields)
      .map(f => f.fieldRole)
      .filter(isFieldRole) : null;

    return new IInstruction(
      opcode,
      rs,
      rt,
      immediate,
      fields,
      instructionSpec,
      fieldRoles
        ? ['instruction', ...fieldRoles]
        : ['instruction', 'source', 'destination', 'immediate'],
    );
  }

  private constructor(
    opcode: OpcodeField,
    rs: RsField,
    rt: RtField,
    immediate: ImmediateField,
    fields: InstructionField<number>[],
    instructionSpec: InstructionSpec | null,
    fieldRoles: FieldRole[],
  ) {
    super(
      opcode,
      fields,
      instructionSpec,
      fieldRoles,
    );
    this.rs = rs;
    this.rt = rt;
    this.immediate = immediate;
  }

  override toMips(): MipsPart[] | null {
    if (!this.spec?.mnemonic) {
      return null;
    }
    const fieldsInInstruction: FieldName[] = ['rs', 'rt', 'immed'];
    
    const filteredFields = this.fields
      .filter(f => fieldsInInstruction.includes(f.name))
      .sort((f1, f2) => fieldsInInstruction.indexOf(f1.name) - fieldsInInstruction.indexOf(f2.name));
        
    const argumentMipsParts = formatIInstruction(this.spec?.mnemonic, filteredFields);

    return [
      {
        value: this.spec.mnemonic,
        fieldRole: 'instruction',
      },
      {
        value: ' ',
        fieldRole: null,
      },
      ...argumentMipsParts,
    ];
  }
}