import instructions from '../../data/instructionSpec.json';
import registers from '../../data/registers.json';
import type { ImmediateFormat } from '../format/format';
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
  )!.mnemonic;
}

export function getImmediate(immediateFormat: ImmediateFormat) {
  return (immediate: string) => immediateFormat.format(immediate);
}

export function getJumpAddress(immediateFormat: ImmediateFormat) {
  return (address: string) => immediateFormat.format(address);
}

export function getUnknown(bits: string) {
  return bits;
}

export function getRegisterNumber(binary: string): string {
  const registerNumber = parseInt(binary, 2);
  return `\$${registerNumber}`;
}

export function getRegisterName(binary: string): string {
  const registerNumber = parseInt(binary, 2);
  const registerName = registers.find(r => r.number === registerNumber)?.name ?? 'unknown';
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