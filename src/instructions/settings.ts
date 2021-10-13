import type { ImmediateFormat } from './format/immediate-format';

type RegisterMode = 'names' | 'numbers';
type InputMode = 'encoded' | 'mips';
type EncodedInputMode = 'hex' | 'binary';

export type Settings = {
    inputMode: InputMode,
    encodedInputMode: EncodedInputMode,
    registerMode: RegisterMode,
    immediateFormat: ImmediateFormat,
}