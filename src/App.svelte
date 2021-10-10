<script lang="ts">
	import { parseInstruction } from './instructions';
import { getMipsInstructionBinary } from './instructions/parser';
	import { binToHex, getZeroPadding, hexToBin } from './utils';

	type InputType = 'encoded' | 'mips';

	let hexInput: string;
	let binInput: string;
	let instructionInput: string;
	let isInputHex = true;
	let inputType: InputType = 'encoded';

	// Settings
	let showRegisterName = true;

	function toggleInput() {
		console.log('toggling input');
		isInputHex = !isInputHex;
	}

	function toggleInputType() {
		inputType = inputType === 'encoded' ? 'mips' : 'encoded';
	}

	let binary: string;
	let isInputValid: boolean;

	$: {
		if (inputType === 'encoded') {
			if (isInputHex) {
				const matches = (hexInput ?? '').match(/^(?:0x)?([0-9a-fA-F]{0,8})/);
				const extractedHex = matches ? matches[1] : '';
				binary = hexToBin(extractedHex);
				binInput = binary;
				isInputValid = matches !== null;
			} else {
				const matches = (binInput ?? '').match(/^(?:0x)?([0-1]{0,32})/);
				const extractedBin = matches ? matches[1] : '';
				binary = extractedBin;
				hexInput = binToHex(binary);
				isInputValid = matches !== null;
			}
		} else {
			// Input type is mips
			binary = getMipsInstructionBinary(instructionInput?.trim() ?? '') ?? '';
		}
	}

	$: fullBinary = binary.padEnd(32, '0');
	$: fullHexadecimal = parseInt(fullBinary, 2).toString(16).padStart(8, '0');
	$: hexDisplay = binToHex(binary);
	$: binDisplay = binary.padEnd(32, '0');

	$: instruction = parseInstruction(binary, showRegisterName);
	$: fields = instruction?.fields ?? [];
	$: mipsInstruction = instruction.toMips();	
</script>

<main>
	<h1>mips converter</h1>
	<section>
		<h2>Input</h2>
		{#if !isInputValid}
			<p>Error in input</p>
		{/if}
		<div>
			<button id="change-input-type-button" class="icon-button outlined" on:click={toggleInputType}>
				<label for="change-input-type-button">using {inputType}</label>
				<span class="material-icons">
					sync
				</span>
			</button>
		</div>
		<div class="split">
			<div>
				<h3>encoded instruction</h3>
				<button id="change-input-button" class="icon-button outlined" on:click={toggleInput}>
					<label for="change-input-button">as {isInputHex ? 'hexadecimal' : 'binary'}</label>
					<span class="material-icons">
						sync
					</span>
				</button>
				
				{#if isInputHex}
					<div class="input full-width">
						<input id="hexInput" class="code" bind:value={hexInput} placeholder="0x12345678"/>
					</div>
				{/if}
				{#if !isInputHex}
					<div class="input full-width">
						<input id="binInput" class="code" bind:value={binInput} placeholder="0..."/>
					</div>
				{/if}
			</div>
			<div>
				<h3>mips instruction</h3>
				<div class="input full-width">
					<input id="mipsInput" class="code" bind:value={instructionInput} placeholder="add ..."/>
				</div>
			</div>
		</div>
	</section>
	<section>
		<h2>Bit information</h2>
		<table class="fields code-table raw-table transparent">
			<tr>
				<!-- <th class="vertical-th"></th> -->
				
				{#each ['', 32, 28, 24, 16, 12 ,8 ,4, 0] as index}
					<td style="text-align: right">{index}</td>
				{/each}
			</tr>
		</table>
		<table class="fields code-table raw-table">
			<tr>
				<th class="vertical-th">Binary</th>
				{#each (binDisplay.match(/.{1,4}/g) ?? []) as chunk, i}
					<td>
						{#if i * 4 >= binary.length}
							<span class="gray">{chunk}</span>
						{/if}
						{#if i * 4 + 4 <= binary.length}
							<span>{chunk}</span>
						{/if}
						{#if i * 4 < binary.length && i * 4 + 4 > binary.length}
							<span>{chunk.substring(0, binary.length - i * 4)}</span><!--
							--><span class="gray">{'0'.repeat(4 - (binary.length - i * 4))}</span>
						{/if}
					</td>
				{/each}
			</tr>
			<tr>
				<th class="vertical-th">Hex</th>
				{#each hexDisplay.padEnd(8, '0').split('') as chunk, i}
					<td class={i >= hexDisplay.length ? 'gray' : ''}>{chunk}</td>
				{/each}
			</tr>
		</table>
	</section>
	<section id="decoded-instruction-section" class="bg-primary panel" style="position: relative">
		<h2 style="margin-block-start: 0;">Decoded instruction</h2>
		<p id="mips-instruction" class="code">
			{mipsInstruction ?? 'unknown'}
		</p>
		<h3>Info</h3>
		<p class='instruction-encoding'>
			Hex: 0x{fullHexadecimal}
		</p>
		<p class='instruction-encoding'>
			Binary: 0b{fullBinary}
		</p>
		<table class="fields code-table">
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
/* :root {
	--clr-primary-200: #E93835;
	--clr-primary-400: #EF6F6C;
	--clr-background: #2E394D;

	--clr-on-primary: #FFFFFF;
} */
	main {
		text-align: left;
		padding: 1em;
		max-width: 50rem;
		margin: 0 auto;
	}

	.icon-button.outlined {
		border: 1px solid var(--clr-on);
	}

	.split {
		display: flex;
	}

	.split > * {
		flex: 1;
	}

	.split > *:not(:first-child) {
		margin-inline-start: 1rem;
	}

	.code {
		font-family: 'Inconsolata', monospace;
		font-weight: bold;
	}

	.gray {
		opacity: 50%;
	}

	.panel {
		margin-inline: -1rem;
		padding-inline: 1rem;
		padding-block: 1rem;
		border-radius: 0.5rem;
	}

	table.transparent,
	table.transparent td {
		border-color: transparent;
	}

	.bg-primary {
		background-color: var(--clr-primary-400);
		color: var(--clr-on-primary);
		--clr-on: var(--clr-on-primary);
	}

	.raw-table {
		table-layout: fixed;
	}

	table.fields,
	table.fields th, td {
		border: 2px solid var(--clr-on);
		border-collapse: collapse;
	}

	table { 
		width: 100%;
		text-align: center;
	}

	.code-table td {
		font-family: 'Inconsolata', monospace;
		font-weight: bold;
	}

	table.fields .vertical-th {
		text-align: end;
		margin-right: 2rem;
		border-inline-start-color: transparent;
		border-block-color: transparent;
	}

	table .vertical-th:after {
		content: '   ';
		white-space: pre;
	}

	.icon-button {
		display: flex;
		align-items: center;
		border: none;
		background-color: transparent;
		color: var(--clr-on);
		border-radius: 0.5rem;
		/* margin: auto; */
		padding-inline: 0.5rem;
		padding-block: 0.5rem;
		/* width: 48px; */
		/* height: 48px; */
		vertical-align: middle;
		transition: background 0.2s;
		text-align: center;
	}

	.icon-button label {
		margin-inline: 0.3rem;
	}

	.icon-button:hover,
	.icon-button:active {
		background-color: var(--clr-background-dark);
	}

	.input.full-width input {
		width: 100%;
	}

	.input label {
		margin-block-end: 0.2em;
	}

	.instruction-encoding {
		margin-block: 0.5rem;
	}

	#decoded-instruction-section {
		margin-block-start: 5rem;
	}

	#change-input-button {
		margin: 0;
	}

	#mips-instruction {
		font-size: 1.5rem;
	}

	@media (max-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>