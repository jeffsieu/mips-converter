import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import Instruction from "./instruction";
import type InstructionField from './instruction-field';
import { getFunctionCode, getOpcodeValue, getRegisterName, getRegisterNumber, getShiftAmount } from './parser/extractors';
import type { Settings } from './settings';
import type { RegisterField, FieldName, InstructionSpec } from "./types";

function getRelevantFields(spec: InstructionSpec): FieldName[] {
  // all
  // rs (jr)
  // shift (rd, rt, shamt) (sll, srl, sra)
  // rs and rt (div/ divu mult multu)
  // rd only (mfhi, mflo)
  // rd and rs (mfc0)
  switch (spec?.mnemonic) {
    case 'jr':
      return ['rs', 'funct'];
    case 'sll':
    case 'srl':
    case 'sra':
      return ['rd', 'rt', 'shamt', 'funct'];
    case 'div':
    case 'divu':
    case 'mult':
    case 'multu':
      return ['rs', 'rt', 'funct'];
    case 'mfhi':
    case 'mflo':
      return ['rd', 'funct'];
    // case 'mfc0':
      // The opcode is 10 in hex
      // return ['rd', 'rs', 'fcode'];
    default:
      return ['rd', 'rs', 'rt', 'funct'];
  }
}

export default class RInstruction extends Instruction {
  readonly rs: RegisterField;
  readonly rt: RegisterField;
  readonly rd: RegisterField;
  readonly shamt: InstructionField<5>;
  readonly funct: InstructionField<6>;

  static fromBinary(binary: string, settings: Settings) {
    const extractor = new FieldExtractor(binary);
    const getRegister = settings.registerMode === 'names' ? getRegisterName : getRegisterNumber;
    
    const opcode = extractor.extractField('opcode', 6, getOpcodeValue);
    const rs = extractor.extractField('rs', 5, getRegister);
    const rt = extractor.extractField('rt', 5, getRegister);
    const rd = extractor.extractField('rd', 5, getRegister);
    const shamt = extractor.extractField('shamt', 5, getShiftAmount);
    const funct = extractor.extractField('funct', 6, getFunctionCode);

    return new RInstruction(opcode, rs, rt, rd, shamt, funct);
  }

  constructor(
    opcode: InstructionField<6>,
    rs: RegisterField,
    rt: RegisterField,
    rd: RegisterField,
    shamt: InstructionField<5>,
    funct: InstructionField<6>,
  ) {
    super(opcode,
      [opcode, rs, rt, rd, shamt, funct], // fields
      instructionSpecs.find(spec => spec.functionCode === this.funct.interpolatedValue) ?? null, // instructionSpec
    );
    this.rs = rs;
    this.rt = rt;
    this.rd = rd;
    this.shamt = shamt;
    this.funct = funct;
  }

  toMips(): string | null {
    if (!this.spec) return null;
    const usedFieldNames = getRelevantFields(this.spec);

    const fieldsInInstruction: FieldName[] = ['rd', 'rs', 'rt', 'shamt'];
    
    const commaDelimitedRegisters = this.fields
        .filter(f => fieldsInInstruction.includes(f.name) && usedFieldNames.includes(f.name))
        .sort((f1, f2) => fieldsInInstruction.indexOf(f1.name) - fieldsInInstruction.indexOf(f2.name))
        .map(f => f.value).join(', ');

    const mipsInstruction = this.spec!.mnemonic + ' ' + commaDelimitedRegisters;
    return mipsInstruction;
  }
}