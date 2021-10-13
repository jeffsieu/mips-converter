import { InstructionField } from './instruction-field';
import type { Settings } from '../settings';
import { getOpcodeValue } from './extractors';

export class OpcodeField extends InstructionField<6> {
  static fieldLength: 6 = 6;

  constructor(binary: string, settings: Settings) {
    super('opcode', binary, 6, getOpcodeValue);
  }
}
