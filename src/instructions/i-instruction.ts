import instructionSpecs from '../data/instructionSpec.json';
import FieldExtractor from './field-extractor';
import Instruction from "./instruction";
import type InstructionField from './instruction-field';
import { getImmediate, getOpcodeValue, getRegisterName, getRegisterNumber } from './parser/extractors';
import type { Settings } from './settings';
import type { RegisterField, FieldName } from "./types";

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
  readonly rs: RegisterField;
  readonly rt: RegisterField;
  readonly immediate: InstructionField<16>;

  static fromBinary(binary: string, settings: Settings): IInstruction {
    const extractor = new FieldExtractor(binary);
    const getRegister = settings.registerMode === 'names' ? getRegisterName : getRegisterNumber;
    
    const opcode = extractor.extractField('opcode', 6, getOpcodeValue);
    const rs = extractor.extractField('rs', 5, getRegister);
    const rt = extractor.extractField('rt', 5, getRegister);
    const immediate = extractor.extractField('immed', 16, getImmediate(settings.immediateFormat));

    return new IInstruction(opcode, rs, rt, immediate);
  }

  constructor(
    opcode: InstructionField<6>,
    rs: RegisterField,
    rt: RegisterField,
    immediate: InstructionField<16>,
  ) {
    super(
      opcode,
      [opcode, rs, rt, immediate], // fields
      instructionSpecs.find(spec => spec.opcode === this.opcode.interpolatedValue) ?? null // instructionSpec
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

    const mipsInstruction = this.spec!.mnemonic + ' ' + formatString;
    return mipsInstruction;
  }
}