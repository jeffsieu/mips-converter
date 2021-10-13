export type InstructionSpec = {
  fullName: string,
  functionCode: number | null,
  mnemonic: string,
  opcode: number,
  type: string,
}
export type InstructionType = 'R' | 'J' | 'I';
export type JFieldName = 'jaddr';
export type IFieldName = 'immed';
export type RFieldName = 'rs' | 'rt' | 'rd' | 'shamt' | 'funct';
export type FieldName = 'unknown' | 'opcode' | RFieldName | IFieldName | JFieldName;