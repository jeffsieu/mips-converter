import Instruction from "./instruction";
import RInstruction from "./r-instruction";
import IInstruction from "./i-instruction";
import JInstruction from "./j-instruction";
import { parseInstruction } from "./parser";

export type {Instruction, RInstruction, IInstruction, JInstruction};
export {parseInstruction}
