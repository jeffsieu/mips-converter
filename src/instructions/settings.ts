import type { ImmediateFormat } from "./format/format";

type RegisterMode = 'names' | 'numbers';
type InputMode = 'encoded' | 'mips';
type EncodedInputMode = 'hex' | 'binary';

export type Settings = {
    inputMode: InputMode,
    encodedInputMode: EncodedInputMode,
    registerMode: RegisterMode,
    immediateFormat: ImmediateFormat,
}