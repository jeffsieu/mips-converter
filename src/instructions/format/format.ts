export abstract class ImmediateFormat {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract format(value: number): string;
}

export class HexFormat extends ImmediateFormat {
    constructor() {
        super('hex');
    }
    
    override format(value: number): string {
        if (value >= 0) {
            return this.formatUnsigned(value);
        } else {
            return '-' + this.formatUnsigned(-value);
        }
    }

    formatUnsigned(value: number): string {
        return '0x' + value.toString(16);
    }
}

export class DecFormat extends ImmediateFormat {
    constructor() {
        super('decimal');
    }

    override format(value: number): string {
        return value.toString(10);
    }
}

export class BinFormat extends ImmediateFormat {
    constructor() {
        super('binary');
    }
    
    override format(value: number): string {
        if (value >= 0) {
            return this.formatUnsigned(value);
        } else {
            return '-' + this.formatUnsigned(-value);
        }
    }

    formatUnsigned(value: number): string {
        return '0b' + value.toString(2);
    }
}