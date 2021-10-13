import { InstructionField } from './instruction-field';
import type { Settings } from '../settings';
import { getUnknown } from './extractors';

export class UnknownField extends InstructionField<26> {
  static fieldLength: 26 = 26;

  constructor(binary: string, settings: Settings) {
    super('unknown', binary, 26, getUnknown);
  }
}
