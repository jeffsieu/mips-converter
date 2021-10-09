<script lang="ts">
	import instructions from './instructions.json';
	import registers from './registers.json';

	type Instruction = typeof instructions[number];

	export let name: string;
	let hexInput: string;
	let binInput: string;
	let isInputHex = true;
	let showRegisterName = true;
	type InstructionType = 'R' | 'J' | 'I';
	
	type JFieldName = 'jaddr';
	type IFieldName = 'immed';
	type RFieldName = 'rs' | 'rt' | 'rd' | 'shamt' | 'fcode';
	type FieldName = 'unknown' | 'opcode' | RFieldName | IFieldName | JFieldName;
	type Field = {
		name: FieldName,
		value: string,
		binary: string,
		length: number,
	};

	const rInstructions = instructions.filter(i => i.functionCode !== 'NA');

	function hexToBin(hex: string) {
		if (!hex) return '';
		const newLength = hex.length * 4;
		return parseInt(hex, 16).toString(2).padStart(newLength, '0');
	}

	function binToHex(bin: string) {
		if (!bin) return '';
		const newLength = Math.ceil(bin.length / 4) * 4;
		const paddedBin = bin.padEnd(newLength, '0');
		return paddedBin.match(/.{1,4}/g)!.map(bits => parseInt(bits, 2).toString(16)).join('');
	}

	function getPadding(binary: string) {
		return '0'.repeat(Math.max(0, 32 - binary.length));
	}

	function getType(binary: string): InstructionType {
		if (binary.length < 6) {
			return null;
		}
		const opcode = parseInt(binary.substring(0, 6), 2);
		if (opcode === 0) {
			// R-type instruction
			return 'R';
		} else {
			const instruction = instructions.find(i => i.opcode === opcode);
			return instruction?.type as InstructionType;
		}
	}

	function getOpcode(opcodeString: string) {
		const opcode = parseInt(opcodeString, 2);
		if (opcode === 0) {
			// R-type instruction
			return 'R';
		} else {
			const instruction = instructions.find(i => i.opcode === opcode);
			return instruction?.mnemonic;
		}
	}

	function getRegisterNumber(binary: string): string {
		const registerNumber = parseInt(binary, 2);
		return `\$${registerNumber}`;
	}
	
	function getRegisterName(binary: string) {
		const registerNumber = parseInt(binary, 2);
		const registerName = registers.find(r => r.number === registerNumber).name;
		return `\$${registerName}`;
	}

	function getAddressHex(address: string) {
		return '0x' + (parseInt(address, 2) * 4).toString(16);
	}

	function getShiftAmount(shiftAmount: string) {
		return parseInt(shiftAmount, 2).toString(10);
	}

	function getFunctionCode(functionCode: string) {
		return rInstructions.find(i => parseInt(i.functionCode, 16) === parseInt(functionCode, 2)).mnemonic;
	}

	function getImmediate(immediate: string) {
		return parseInt(immediate, 2).toString(10);
	}

	function getUsedFields(type: InstructionType, rTypeInstruction: Instruction): FieldName[] {
		// all
		// rs (jr)
		// shift (rd, rt, shamt) (sll, srl, sra)
		// rs and rt (div/ divu mult multu)
		// rd only (mfhi, mflo)
		// rd and rs (mfc0)
		switch (type) {
			case 'R': {
				switch (rTypeInstruction.mnemonic) {
					case 'jr':
						return ['rs', 'fcode'];
					case 'sll':
					case 'srl':
					case 'sra':
						return ['rd', 'rt', 'shamt', 'fcode'];
					case 'div':
					case 'divu':
					case 'mult':
					case 'multu':
						return ['rs', 'rt', 'fcode'];
					case 'mfhi':
					case 'mflo':
						return ['rd', 'fcode'];
					// case 'mfc0':
						// The opcode is 10 in hex
						// return ['rd', 'rs', 'fcode'];
					default:
						return ['rd', 'rs', 'rt', 'fcode'];
				}
			}
			case 'I': {
				return ['rs', 'rt', 'immed'];
			}
		}
	}
 
	
	function parseInstructionFields(binary: string, showRegisterName: boolean): Field[] {
		const fields: Field[] = [];

		// Get opcode

		let rest: string = binary;
		
		function extractField(name: FieldName, length: number, getValue: (binary: string) => string) {
			let fieldValue = 'unknown';
			// if (rest.length < length)
			// 	rest = '';
			 {
				try {
					fieldValue = getValue(rest.substring(0, length).padEnd(length, '0'));
				} catch (e) {
					fieldValue = 'error';
				}
			}
			fields.push({
				name: name,
				value: fieldValue,
				binary: rest.substring(0, length),
				length: length,
			})
			rest = rest.substring(length);
		}

		function getUnknownField(binary: string) {
			return 'unknown';
		}

		extractField('opcode', 6, getOpcode);
			
		const type = getType(binary);
		if (!type) {
			extractField('unknown', 26, getUnknownField);
		}

		const getRegisterValue = showRegisterName ? getRegisterName : getRegisterNumber;

		switch(type) {
			case 'R':
				extractField('rs', 5, getRegisterValue);
				extractField('rt', 5, getRegisterValue);
				extractField('rd', 5, getRegisterValue);
				extractField('shamt', 5, getShiftAmount);
				extractField('fcode', 6, getFunctionCode);

				break;
			case 'I':
				extractField('rs', 5, getRegisterValue);
				extractField('rt', 5, getRegisterValue);
				extractField('immed', 16, getImmediate);
				break;
			case 'J':
				extractField('jaddr', 26, getAddressHex);
				break;
		}
		return fields;
	}

	function formatBinary(binary: string) {
		return binary.match(/.{1,4}/g)?.join(' ') ?? '';
	}

	function formatBinaryEnd(binary: string) {
		const chunkCount = Math.floor(binary.length / 4);
		const partialChunkSize = binary.length % 4;
		const partialChunk = '0'.repeat(partialChunkSize);
		return partialChunk + ' 0000'.repeat(chunkCount)
	}

	function formatIInstruction(instruction: Instruction, fields: Field[]) {
		// Fields = [rs, rt, immed]
		const fieldValues = fields.map(f => f.value);
		switch(instruction.mnemonic) {
			case 'addi':
			case 'addiu':
			case 'andi':
			case 'ori':
			case 'slti':
			case 'sltiu':
				// format: addi r1, r2, immed
				return `${fieldValues[1]}, ${fieldValues[0]}, ${fieldValues[2]}`;
			case 'beq':
			case 'bne':
				return `${fieldValues[1]}, ${fieldValues[0]}, PC+4 + ${fieldValues[2]}`;
			case 'lbu':
			case 'lhu':
			case 'll':
			case 'lui':
			case 'lw':
			case 'lb':
			case 'sb':
			case 'sc':
			case 'sh':
			case 'sw':
				return `${fieldValues[1]}, ${fieldValues[2]}(${fieldValues[0]})`;
		}
	}

	function getMipsInstruction(type: InstructionType, fields: Field[]): string {
		switch (type) {
			case 'R': {
				const functionCodeField = fields.find(f => f.name === 'fcode');
				if (!functionCodeField) return;
				const instruction = rInstructions.find(i => parseInt(i.functionCode) === parseInt(functionCodeField.binary, 2));
				
				if (!instruction) return;
				const usedFieldNames = getUsedFields('R', instruction);

				const fieldsInInstruction: FieldName[] = ['rd', 'rs', 'rt', 'shamt'];
				
				const commaDelimitedRegisters = fields
						.filter(f => fieldsInInstruction.includes(f.name) && usedFieldNames.includes(f.name))
						.sort((f1, f2) => fieldsInInstruction.indexOf(f1.name) - fieldsInInstruction.indexOf(f2.name))
						.map(f => f.value).join(', ');
				
				const mipsInstruction = instruction!.mnemonic + ' ' + commaDelimitedRegisters;
				return mipsInstruction;
			}
			case 'I': {
				const opcodeField = fields.find(f => f.name === 'opcode');
				const instruction = instructions.find(i => i.opcode === parseInt(opcodeField.binary, 2));
				
				const usedFieldNames = getUsedFields('I', instruction);

				const fieldsInInstruction: FieldName[] = ['rs', 'rt', 'immed'];
				
				const filteredFields = fields
						.filter(f => fieldsInInstruction.includes(f.name) && usedFieldNames.includes(f.name))
						.sort((f1, f2) => fieldsInInstruction.indexOf(f1.name) - fieldsInInstruction.indexOf(f2.name));
				
						
				const formatString = formatIInstruction(instruction, filteredFields);

				const mipsInstruction = instruction!.mnemonic + ' ' + formatString;
				return mipsInstruction;
			}
			case 'J': {
				const jumpAddr = fields.find(f => f.name === 'jaddr');
				const opcodeField = fields.find(f => f.name === 'opcode');
				// const instruction = instructions.find(i => i.opcode === parseInt(opcodeField.binary, 2));
				
				const mipsInstruction = opcodeField.value + ' ' + jumpAddr.value;
				return mipsInstruction;
			}
		}
	}

	// [opcode][rs][rt][rd][sa][function code]
	// [opcode][rs][rt][instruction]
	// [opcode][address]

	function toggleInput() {
		isInputHex = !isInputHex;
	}


	let binary;
	let isInputValid;

	$: if (isInputHex) {
		const matches = (hexInput ?? '').match(/^(?:0x)?([0-9a-fA-F]{0,8})/);
		const extractedHex = matches ? matches[1] : '';
		binary = hexToBin(extractedHex);
		binInput = binary;
		isInputValid = matches;
	} else {
		const matches = (binInput ?? '').match(/^(?:0x)?([0-1]{0,32})/);
		const extractedBin = matches ? matches[1] : '';
		binary = extractedBin;
		hexInput = binToHex(binary);
		isInputValid = matches;
	}

	$: padding = getPadding(binary);
	$: inputType = isInputHex ? 'hexadecimal' : 'binary';


	$: opcode = getOpcode(binary.substring(0, 6));
	$: fields = parseInstructionFields(binary, showRegisterName);
	$: mipsInstruction = getMipsInstruction(getType(binary), fields);
</script>

<main>
	<h1>mips converter</h1>
	<h4>Input {inputType}</h4>
	<button on:click={toggleInput}>Toggle input</button>

	<div>
		<span>Show register name</span>
		<input bind:checked={showRegisterName} type="checkbox"/>
	</div>
	{#if !isInputValid}
		<p>Error in input</p>
	{/if}
	{#if isInputHex}
		<input bind:value={hexInput} placeholder="0x12345678"/>
	{/if}
	{#if !isInputHex}
		<input bind:value={binInput} placeholder="0..."/>
	{/if}

	<section>
		<h4>Instruction binary</h4>
		<p class="code">0x{binToHex(binary) || '0'}</p>
		<p class="code">
			<span>{formatBinary(binary)}</span><!--
			--><span class="gray">{formatBinaryEnd(padding)}</span>
		</p>
	</section>
	<h4>Decoded instruction</h4>
	<h3 class="code">
		{mipsInstruction}
	</h3>
	<section style="position: relative">
		<table class="fields code">
			<tr>
				{#each fields as field}
					<th>{field.name}</th>
				{/each}
			</tr>
			<tr>
				{#each fields as field}
					<td>{field.value}</td>
				{/each}
			</tr>
			<tr>
				{#each fields as field}
					<td style="width: {field.length / 32}%">
						<span>{field.binary}</span><!--
					--><span class="gray">{'0'.repeat(field.length - field.binary.length)}</span>
					</td>
				{/each}
			</tr>
		</table>
	</section>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 500px;
		margin: 0 auto;
	}

	.code {
		font-family: 'Courier New', Courier, monospace;
	}

	.gray {
		opacity: 50%;
	}

	table.fields,
	table.fields th, td {
		border: 1px solid #333333;
		border-collapse: collapse;
	}

	@media (max-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>