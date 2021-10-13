import { InstructionField } from './instruction-field';
import type { Settings } from '../settings';
import { getRegisterName, getRegisterNumber } from './extractors';

type RegisterName = 'rs' | 'rt' | 'rd';

export abstract class RegisterField extends InstructionField<5> {
  constructor(registerName: RegisterName, binary: string, settings: Settings) {
    super(registerName, binary, 5, settings.registerMode === 'names' ? getRegisterName : getRegisterNumber);
  }
}

export class RsField extends RegisterField {
  static fieldLength: 5 = 5;
  constructor(binary: string, settings: Settings) {
    super('rs', binary, settings);
  }
}

export class RtField extends RegisterField {
  static fieldLength: 5 = 5;
  constructor(binary: string, settings: Settings) {
    super('rt', binary, settings);
  }
}

export class RdField extends RegisterField {
  static fieldLength: 5 = 5;
  constructor(binary: string, settings: Settings) {
    super('rd', binary, settings);
  }
}