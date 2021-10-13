import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import type { FieldRole } from './field-role';
import { RsField, RtField, RdField, ShiftAmountField, OpcodeField, FunctionCodeField } from './fields';
import Instruction from './instruction';
import type { Settings } from './settings';
import type { FieldName, InstructionSpec } from './types';

function getRelevantFields(spec: InstructionSpec | null): FieldName[] {
  // all
  // rs (jr)
  // shift (rd, rt, shamt) (sll, srl, sra)
  // rs and rt (div/ divu mult multu)
  // rd only (mfhi, mflo)
  // rd and rs (mfc0)
  switch (spec?.mnemonic) {
  case 'jr':
    return ['opcode', 'rs', 'funct'];
  case 'sll':
  case 'srl':
  case 'sra':
    return ['opcode', 'rd', 'rt', 'shamt', 'funct'];
  case 'div':
  case 'divu':
  case 'mult':
  case 'multu':
    return ['opcode', 'rs', 'rt', 'funct'];
  case 'mfhi':
  case 'mflo':
    return ['opcode', 'rd', 'funct'];
    // case 'mfc0':
    // The opcode is 10 in hex
    // return ['rd', 'rs', 'fcode'];
  default:
    return ['opcode', 'rd', 'rs', 'rt', 'funct'];
  }
}

function getFieldRoles(spec: InstructionSpec | null): FieldRole[] {
  // all
  // rs (jr)
  // shift (rd, rt, shamt) (sll, srl, sra)
  // rs and rt (div/ divu mult multu)
  // rd only (mfhi, mflo)
  // rd and rs (mfc0)
  switch (spec?.mnemonic) {
  case 'jr':
    return ['instruction', 'source', 'unused', 'unused', 'unused', 'instruction'];
  case 'sll':
  case 'srl':
  case 'sra':
    return ['instruction', 'unused', 'source', 'destination', 'shift amount', 'instruction'];
  case 'div':
  case 'divu':
  case 'mult':
  case 'multu':
    return ['instruction', 'source1', 'source2', 'unused', 'unused', 'instruction'];
  case 'mfhi':
  case 'mflo':
    return ['instruction', 'unused', 'unused', 'destination', 'unused', 'instruction'];
    // case 'mfc0':
    // The opcode is 10 in hex
    // return ['rd', 'rs', 'fcode'];
  default:
    return ['instruction', 'destination', 'source1', 'source2', 'shift amount', 'instruction'];
  }
}

export default class RInstruction extends Instruction {
  readonly rs: RsField;
  readonly rt: RtField;
  readonly rd: RdField;
  readonly shamt: ShiftAmountField;
  readonly funct: FunctionCodeField;

  static fromBinary(binary: string, settings: Settings) {
    const extractor = new FieldExtractor(binary, settings);
    
    const opcode = extractor.extractField(OpcodeField);
    const rs = extractor.extractField(RsField);
    const rt = extractor.extractField(RtField);
    const rd = extractor.extractField(RdField);
    const shamt = extractor.extractField(ShiftAmountField);
    const funct = extractor.extractField(FunctionCodeField);
    
    const instructionSpec = instructionSpecs.find(spec => spec.functionCode === funct.interpolatedValue) ?? null;
    const fieldRoles = getFieldRoles(instructionSpec);

    return new RInstruction(opcode, rs, rt, rd, shamt, funct, instructionSpec, fieldRoles);
  }

  private constructor(
    opcode: OpcodeField,
    rs: RsField,
    rt: RtField,
    rd: RdField,
    shamt: ShiftAmountField,
    funct: FunctionCodeField,
    instructionSpec: InstructionSpec | null,
    fieldRoles: FieldRole[],
  ) {
    super(opcode,
      [opcode, rs, rt, rd, shamt, funct], // fields
      instructionSpec,
      fieldRoles,
    );
    this.rs = rs;
    this.rt = rt;
    this.rd = rd;
    this.shamt = shamt;
    this.funct = funct;
  }

  override toMips(): string | null {
    if (!this.spec) return null;
    const usedFieldNames = getRelevantFields(this.spec);

    const fieldsInInstruction: FieldName[] = ['rd', 'rs', 'rt', 'shamt'];
    
    const commaDelimitedRegisters = this.fields
      .filter(f => fieldsInInstruction.includes(f.name) && usedFieldNames.includes(f.name))
      .sort((f1, f2) => fieldsInInstruction.indexOf(f1.name) - fieldsInInstruction.indexOf(f2.name))
      .map(f => f.value).join(', ');

    const mipsInstruction = this.spec.mnemonic + ' ' + commaDelimitedRegisters;
    return mipsInstruction;
  }
}