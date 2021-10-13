import RInstruction from '../r-instruction';
import IInstruction from '../i-instruction';
import JInstruction from '../j-instruction';
import instructionSpecs from '../../data/instructionSpec.json';
import type { InstructionType } from '../types';
import UnknownInstruction from '../unknown-instruction';
import type Instruction from '../instruction';
import { Parser } from './input-parser';
import type { Settings } from '../settings';
import { MipsInstructionFormat } from '../mips-formats/mips-instruction-format';
import type { ParseInfo, ParseResult } from './parse-info';


function getType(binary: string): InstructionType | 'U' {
  if (binary.length < 6) {
    return 'U';
  }
  const opcode = parseInt(binary.substring(0, 6), 2);
  if (opcode === 0) {
    // R-type instruction
    return 'R';
  } else {
    const instruction = instructionSpecs.find(i => i.opcode === opcode);
    return instruction?.type as InstructionType;
  }
}

/**
 * Parses a MIPS instruction and returns an Instruction.
 */
export class MipsDecoder extends Parser<Instruction> {
  private readonly instruction: Instruction;

  constructor(binary: string, settings: Settings) {
    super();
    this.instruction = MipsDecoder.decode(binary, settings);
  }

  private static decode(binary: string, settings: Settings): Instruction {
    const type = getType(binary);
    switch (type) {
    case 'R': {
      return RInstruction.fromBinary(binary, settings);
    }
    case 'I': {
      return IInstruction.fromBinary(binary, settings);
    }
    case 'J': {
      return JInstruction.fromBinary(binary, settings);
    }
    case 'U': {
      return UnknownInstruction.fromBinary(binary, settings);
    }
    }
  }

  override get(): Instruction {
    return this.instruction;
  }

  override getParseInfo(): ParseInfo | null {
    return null;
  }
}

// TODO: Make this return an Instruction to be more consistent.
/**
 * Parses a MIPS instruction and returns its binary form.
 */
export class MipsEncoder extends Parser<string | null> {
  private readonly result: ParseResult<string>;

  constructor(mipsString: string) {
    super();
    // this.encodedInstruction = this.getMipsInstructionBinary(mipsInstruction);

    // Try to map instruction to every format
    const results = MipsInstructionFormat.FORMATS
      .map(format => format.parseMips(mipsString));

    const instructionResult = results
      .find(result => result.value !== null) ?? null;

    const message = results.map(f => f.message?.value ?? '').join('');

    if (instructionResult !== null) {
      // Found instruction
      this.result = instructionResult;
    } else {
      // No instruction found
      this.result = {
        value: null,
        message: {
          value: message,
          severity: 'error',
        }
      };
    }
  }

  override get(): string | null {
    return this.result.value;
  }

  override getParseInfo(): ParseInfo | null {
    return this.result.message;
  }
}

