import instructions from '../data/instructionSpec.json';
import registers from '../data/registers.json';

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

export function getImmediate(immediate: string) {
  return parseInt(immediate, 2).toString(10);
}

export function getJumpAddress(address: string) {
  return '0x' + (parseInt(address, 2) * 4).toString(16);
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