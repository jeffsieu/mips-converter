import { InstructionField } from './instruction-field';
import type { Settings } from '../settings';
import { getFunctionCode } from './extractors';

export class FunctionCodeField extends InstructionField<6> {
  static fieldLength: 6 = 6;

  constructor(binary: string, settings: Settings) {
    super('funct', binary, 6, getFunctionCode);
  }
}