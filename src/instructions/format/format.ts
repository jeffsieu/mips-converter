export abstract class ImmediateFormat {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    abstract format(binary: string): string;
}

export class HexFormat extends ImmediateFormat {
    constructor() {
        super('hex');
    }

    override format(binary: string): string {
        return '0x' + parseInt(binary, 2).toString(16);
    }
}

export class DecFormat extends ImmediateFormat {
    constructor() {
        super('decimal');
    }

    override format(binary: string): string {
        return parseInt(binary, 2).toString(10);
    }
}

export class BinFormat extends ImmediateFormat {
    constructor() {
        super('binary');
    }
    
    override format(binary: string): string {
        return '0b' + parseInt(binary, 2).toString(2);
    }
}