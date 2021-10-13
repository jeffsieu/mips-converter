import instructions from '../../data/instructionSpec.json';
import registers from '../../data/registers.json';
import type { ImmediateFormat } from '../format/immediate-format';
import type { InstructionSpec } from '../types';

const rInstructions = instructions.filter(i => i.functionCode !== null);

export function getOpcodeValue(bits: string): string {
  const opcode = parseInt(bits, 2);
  if (opcode === 0) {
    // R-type instruction
    return 'R';
  } else {
    const instruction = instructions.find(i => i.opcode === opcode);
    return instruction?.mnemonic ?? 'unknown';
  }
}

export function getShiftAmount(shiftAmount: string): string {
  return parseInt(shiftAmount, 2).toString(10);
}

export function getFunctionCode(functionCode: string): string {
  return rInstructions.find(
    (i) => i.functionCode === parseInt(functionCode, 2)
  )?.mnemonic ?? 'unknown';
}

function getSignedImmediate(binary: string): number {
  const firstBit = binary[0];
  if (firstBit === '0') {
    return getUnsignedImmediate(binary);
  } else {
    const flippedBits = binary.split('').map(b => b === '0' ? '1' : '0').join('');
    const complement = parseInt(flippedBits, 2) + 1;
    return -complement;
  }
}

function getUnsignedImmediate(binary: string): number {
  return parseInt(binary, 2);
}

export function getImmediate(signed: boolean, immediateFormat: ImmediateFormat) {
  const parseImmediate = signed ? getSignedImmediate : getUnsignedImmediate;
  return (immediate: string) => immediateFormat.format(parseImmediate(immediate));
}

export function getJumpAddress(immediateFormat: ImmediateFormat) {
  return (address: string) => immediateFormat.format(parseInt(address, 2));
}

export function getUnknown(bits: string) {
  return 'unknown';
}

export function getRegisterNumber(binary: string): string {
  const registerNumber = parseInt(binary, 2);
  // eslint-disable-next-line no-useless-escape
  return `\$${registerNumber}`;
}

export function getRegisterName(binary: string): string {
  const registerNumber = parseInt(binary, 2);
  const registerName = registers.find(r => r.number === registerNumber)?.name ?? 'unknown';
  // eslint-disable-next-line no-useless-escape
  return `\$${registerName}`;
}

export function getRegisterNumberFromName(name: string): number | null {
  const nameAsNumber = parseInt(name);
  if (isNaN(nameAsNumber)) {
    return registers.find(r => r.name === name)?.number ?? null;
  } else {
    return nameAsNumber;
  }
}

export function getInstructionSpecWithMnemonic(mnemonic: string): InstructionSpec | null {
  return instructions.find(i => i.mnemonic === mnemonic) ?? null;
}