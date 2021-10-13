import { InstructionField } from './instruction-field';
import type { Settings } from '../settings';
import { getJumpAddress } from './extractors';

export class JumpAddressField extends InstructionField<26> {
  static fieldLength: 26 = 26;
  constructor(binary: string, settings: Settings) {
    super('jaddr', binary, 26, getJumpAddress(settings.immediateFormat));
  }
}