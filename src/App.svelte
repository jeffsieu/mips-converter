<script lang="ts">
	import { parseInstruction } from './instructions';
import { BinFormat, DecFormat, HexFormat, ImmediateFormat } from './instructions/format/format';
	import { getMipsInstructionBinary } from './instructions/parser';
	import { binToHex, getZeroPadding, hexToBin } from './utils';

	type InputType = 'encoded' | 'mips';
	const immediateFormats = [new HexFormat(), new DecFormat(), new BinFormat()];	

	let hexInput: string;
	let binInput: string;
	let instructionInput: string;
	let isInputHex = true;
	let inputType: InputType = 'encoded';

	// Settings
	let showRegisterName = true;
	let showImmediateAs: ImmediateFormat = immediateFormats[0];

	function toggleInput(): void {
		isInputHex = !isInputHex;
	}

	function toggleInputType(): void {
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

	$: instruction = parseInstruction(binary, showRegisterName, showImmediateAs);
	$: fields = instruction?.fields ?? [];
	$: mipsInstruction = instruction?.toMips() ?? null;	
</script>

<main>
	<h1>mips converter</h1>
	<section>
		<form autocomplete="off" on:submit={(e) => e.preventDefault()}>
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
				<fieldset disabled={inputType === 'mips'}>
					<h3>encoded instruction</h3>
					{#if isInputHex}
					<div class="input full-width">
						<input
							id="hexInput"
							class="code"
							bind:value={hexInput}
							placeholder="0x12345678"
						/>
					</div>
					{/if}
					{#if !isInputHex}
					<div class="input full-width">
						<input id="binInput" class="code" bind:value={binInput} placeholder="01011001..."/>
					</div>
					{/if}
					<button id="change-input-button" class="icon-button outlined" on:click={toggleInput}>
						<label for="change-input-button">as {isInputHex ? 'hexadecimal' : 'binary'}</label>
						<span class="material-icons">
							sync
						</span>
					</button>
				</fieldset>
				<fieldset disabled={inputType === 'encoded'}>
					<h3>mips instruction</h3>
					<div class="input full-width">
						<input id="mipsInput" class="code" bind:value={instructionInput} placeholder="add ..."/>
					</div>
				</fieldset>
			</div>
		</form>
	</section>
	<section>
		<h2>Bit information</h2>
		<table class="code-table raw-table transparent">
			<tr>
				<!-- <th class="vertical-th"></th> -->
				
				{#each ['', 32, 28, 24, 16, 12 ,8 ,4, 0] as index}
					<td style="text-align: right">{index}</td>
				{/each}
			</tr>
		</table>
		<table class="code-table raw-table">
			<tbody>
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
			</tbody>
		</table>
	</section>
	<section id="decoded-instruction-section" class="bg-primary panel" style="position: relative">
		<h2 style="margin-block-start: 0;">MIPS instruction</h2>
		<p id="mips-instruction" class="code">
			{mipsInstruction ?? 'unknown'}
		</p>
		<div id="settings">
			<label for="immediateFormat">Display immediate as:</label>
			<select id="immediateFormat" bind:value={showImmediateAs}>
				{#each immediateFormats as format}
					<option value={format}>
						{format.name}
					</option>
				{/each}
			</select>
		</div>
		<h3>Info</h3>
		<p class='instruction-encoding'>
			Hex: <span class="code">0x{fullHexadecimal}</span>
		</p>
		<p class='instruction-encoding'>
			Binary: <span class="code">0b{fullBinary}</span>
		</p>
		<table id="fields" class="code-table">
			<thead>
				<tr>
					{#each fields as field}
						<th>{field.name}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
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
			</tbody>
		</table>
	</section>
</main>

<style>
	main {
		text-align: left;
		padding: 1em;
		max-width: 50rem;
		margin: 0 auto;
		--table-border-width: 0.1rem;
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

	table:not(#fields) {
		border-collapse: collapse;
	}

	table:not(#fields):not(.transparent) td {
		border-collapse: collapse;
		border: var(--table-border-width) solid var(--clr-on);
	}

	table#fields th,
	table#fields td {
		border-top: var(--table-border-width) solid var(--clr-on);
		border-right: var(--table-border-width) solid var(--clr-on);
	}

	table#fields {
		border-spacing: 0;
		border-left: var(--table-border-width) solid var(--clr-on);
		border-bottom: var(--table-border-width) solid var(--clr-on);
		/* border-collapse: collapse; */
	}

	table { 
		width: 100%;
		text-align: center;
	}

	.code-table td {
		font-family: 'Inconsolata', monospace;
		font-weight: bold;
	}

	table .vertical-th {
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

	.icon-button:disabled {
		border-color: var(--clr-disabled);
		color: var(--clr-disabled);
	}

	.icon-button label {
		margin-inline: 0.3rem;
	}

	.icon-button:not(:disabled):hover,
	.icon-button:not(:disabled):active {
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