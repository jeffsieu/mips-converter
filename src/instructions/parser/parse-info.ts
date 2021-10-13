import type { Severity } from './input-parser';

export type ParseResult<T> = {
  value: T | null,
  message: ParseInfo | null,
}

export type ParseInfo = {
  value: string,
  severity: Severity
}
