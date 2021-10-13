import { InstructionField } from './instruction-field';
import type { Settings } from '../settings';
import { getShiftAmount } from './extractors';

export class ShiftAmountField extends InstructionField<5> {
  static fieldLength: 5 = 5;
  constructor(binary: string, settings: Settings) {
    super('shamt', binary, 5, getShiftAmount);
  }
}