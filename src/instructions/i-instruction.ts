import instructionSpecs from './data/instructionSpec.json';
import type { ImmediateFormat } from './format/format';

import Instruction from "./instruction";
import type InstructionField from './instruction-field';
import type { RegisterField, FieldName } from "./types";

function formatIInstruction(mnemonic: string, fields: InstructionField<number>[]): string {
  // Fields = [rs, rt, immed]
  const fieldValues = fields.map(f => f.value);
  switch (mnemonic) {
    case 'beq':
    case 'bne':
      return `${fieldValues[1]}, ${fieldValues[0]}, ${fieldValues[2]}`;
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
    default:
      // format: addi r1, r2, immed
      return `${fieldValues[1]}, ${fieldValues[0]}, ${fieldValues[2]}`;
  }
}

export default class IInstruction extends Instruction {
  readonly rs: RegisterField;
  readonly rt: RegisterField;
  readonly immediate: InstructionField<16>;

  constructor(
    opcode: InstructionField<6>,
    rs: RegisterField,
    rt: RegisterField,
    immediate: InstructionField<16>,
  ) {
    super(opcode);
    this.rs = rs;
    this.rt = rt;
    this.immediate = immediate;
    this.fields = [opcode, rs, rt, immediate];
    this.spec = instructionSpecs.find(spec => spec.opcode === this.opcode.interpolatedValue) ?? null;
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