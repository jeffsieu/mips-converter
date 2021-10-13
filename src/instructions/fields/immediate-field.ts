import type { Settings } from '../settings';
import { getImmediate } from './extractors';
import { InstructionField } from './instruction-field';

export abstract class ImmediateField extends InstructionField<16> {
  static fieldLength: 16 = 16;
  constructor(binary: string, signed: boolean, settings: Settings) {
    super('immed', binary, 16, getImmediate(signed, settings.immediateFormat));
  }
}

export class UnsignedImmediateField extends ImmediateField {
  constructor(binary: string, settings: Settings) {
    super(binary, false, settings);
  }
}

export class SignedImmediateField extends ImmediateField {
  constructor(binary: string, settings: Settings) {
    super(binary, true, settings);
  }
}