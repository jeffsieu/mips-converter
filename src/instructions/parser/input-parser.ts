import type { ParseInfo } from "./parse-info";

export type Severity = 'info' | 'error';


export abstract class Parser<T> {
  abstract get(): T;
  abstract getParseInfo(): ParseInfo | null;
}

export abstract class InputParser extends Parser<string> {
  private extracted: string;
  private parseInfo: ParseInfo | null;

  protected constructor(regex: RegExp, formatName: string, toParse: string) {
    super();
    const matches = toParse.match(regex);
    const extracted = matches ? matches[1] : '';

    if (toParse.length > 8 && extracted.length === 8) {
      this.parseInfo = {
        value: formatName + ' truncated to "' + extracted + '"',
        severity: 'info',
      };
    } else if (extracted.length < toParse.length) {
      this.parseInfo = {
        value: 'Invalid ' + formatName + ' input',
        severity: 'info',
      };
    } else {
      this.parseInfo = null;
    }

    this.extracted = extracted;
  }

  override get(): string {
    return this.extracted;
  }

  override getParseInfo(): ParseInfo | null {
    return this.parseInfo;
  }
}

export class BinInputParser extends InputParser {
  constructor(toParse: string) {
    super(/^(?:0x)?([0-1]{0,32})/, 'binary', toParse);
  }
}

export class HexInputParser extends InputParser {
  constructor(toParse: string) {
    super(/^(?:0x)?([0-9a-fA-F]{0,8})/, 'hex', toParse);
  }
}

