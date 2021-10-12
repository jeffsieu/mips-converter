<script lang="ts">
	import type { Instruction } from './instructions';
	import { BinFormat, DecFormat, HexFormat, ImmediateFormat } from './instructions/format/format';
	import { MipsDecoder, MipsEncoder } from './instructions/parser/mips-parser';
	import { BinInputParser, HexInputParser } from './instructions/parser/input-parser';
	import type { ParseInfo } from './instructions/parser/parse-info';
	import { binToHex, hexToBin } from './utils';
	import type { Settings } from './instructions/settings';

	const immediateFormats = [new HexFormat(), new DecFormat(), new BinFormat()];	

	let hexInput: string;
	let binInput: string;
	let instructionInput: string;
	// let isInputHex = true;
	// let inputType: InputType = 'encoded';
	let encodedParseInfo: ParseInfo | null = null;
	let mipsParseInfo: ParseInfo | null = null;

	// Settings
	let settings: Settings = {
		encodedInputMode: 'hex',
		inputMode: 'encoded',
		registerMode: 'names',
		immediateFormat: immediateFormats[0],
	};
	// let registerMode: RegisterMode = 'names';
	// let showImmediateAs: ImmediateFormat = immediateFormats[0];

	function toggleInput(): void {
		settings.encodedInputMode = settings.encodedInputMode === 'hex' ? 'binary' : 'hex';
	}

	function toggleInputType(): void {
		settings.inputMode = settings.inputMode === 'encoded' ? 'mips' : 'encoded';
	}

	let binary: string;

	$: {
		if (settings.inputMode === 'encoded') {
			if (settings.encodedInputMode === 'hex') {
				const parser = new HexInputParser(hexInput ?? '');

				// Update binary
				binary = hexToBin(parser.get());

				// Update other input
				binInput = binary;
				encodedParseInfo = parser.getParseInfo();
			} else {
				const parser = new BinInputParser(binInput ?? '');

				// Update binary
				binary = parser.get();

				// Update other input
				hexInput = binToHex(binary);
				encodedParseInfo = parser.getParseInfo();
			}
		} else {
			// Input type is mips
			const encoder = new MipsEncoder(instructionInput?.trim() ?? '');
			mipsParseInfo = encoder.getParseInfo();
			binary = encoder.get() ?? '';
		}
	}

	$: fullBinary = binary.padEnd(32, '0');
	$: fullHexadecimal = parseInt(fullBinary, 2).toString(16).padStart(8, '0');
	$: hexDisplay = binToHex(binary);


	let instruction: Instruction;
	$: instruction = new MipsDecoder(binary, settings).get();
	$: fields = instruction?.fields ?? [];
	$: mipsInstruction = instruction?.toMips() ?? null;
</script>

<main>
	<h1>mips converter</h1>
	<section class="raised">
		<form autocomplete="off" on:submit={(e) => e.preventDefault()}>
			<h2 class="remove-margin-top">Input</h2>
			<div>
				<button id="change-input-type-button" class="icon-button" on:click={toggleInputType}>
					<label for="change-input-type-button">using {settings.inputMode}</label>
					<span class="material-icons">
						sync
					</span>
				</button>
			</div>
			<div class="split">
				<fieldset disabled={settings.inputMode === 'mips'}>
					<h3>encoded instruction</h3>
					{#if settings.encodedInputMode === 'hex'}
					<div class="input full-width">
						<input
							id="hexInput"
							class="code"
							bind:value={hexInput}
							placeholder="0x12345678"
							autofocus
						/>
					</div>
					{/if}
					{#if settings.encodedInputMode === 'binary'}
					<div class="input full-width">
						<input
							id="binInput"
							class="code"
							bind:value={binInput}
							placeholder="01011001..."
							autofocus
						/>
					</div>
					{/if}
					
					{#if encodedParseInfo !== null}
						<p class="error">{encodedParseInfo.value}</p>
					{/if}
					<button id="change-input-button" class="icon-button" on:click={toggleInput}>
						<label for="change-input-button">as {settings.encodedInputMode}</label>
						<span class="material-icons">
							sync
						</span>
					</button>
				</fieldset>
				<fieldset disabled={settings.inputMode === 'encoded'}>
					<h3>mips instruction</h3>
					<div class="input full-width">
						<input
							id="mipsInput"
							class="code"
							bind:value={instructionInput}
							placeholder="add ..."
							autofocus
						/>
					</div>
					{#if mipsParseInfo !== null}
						<p class="error">{mipsParseInfo.value}</p>
					{/if}
				</fieldset>
			</div>
		</form>
	</section>
	<section class="raised">
		<h2 class="remove-margin-top">Bit information</h2>
		<table class="code-table raw-table transparent">
			<tr>
				<!-- <th class="vertical-th"></th> -->
				
				{#each ['', 28, 24, 20, 16, 12, 8, 4, 0] as index}
					<td style="text-align: right">{index}</td>
				{/each}
			</tr>
		</table>
		<table class="code-table raw-table">
			<tbody>
				<tr>
					<th class="vertical-th">Binary</th>
					{#each (fullBinary.match(/.{1,4}/g) ?? []) as chunk, i}
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
					{#each fullHexadecimal.split('') as chunk, i}
						<td class={i >= hexDisplay.length ? 'gray' : ''}>{chunk}</td>
					{/each}
				</tr>
			</tbody>
		</table>
	</section>
	<section id="decoded-instruction-section" class="raised">
		<h2 style="margin-block-start: 0;">MIPS instruction</h2>
		<div>
			<span id="mips-instruction" class="code inset">
				{mipsInstruction ?? 'unknown'}
			</span>
		</div>
		<div><span class="code inset">0x{fullHexadecimal}</span></div>
		<div><span class="code inset">0b{fullBinary}</span></div>
		<div id="settings">
			<div class="setting">
				<label for="immediateFormat">Display immediate as:</label>
				<select id="immediateFormat" bind:value={settings.immediateFormat}>
					{#each immediateFormats as format}
						<option value={format}>
							{format.name}
						</option>
					{/each}
				</select>
			</div>
			<div class="setting">
				<label for="registerMode">Show registers as:</label>
				<select id="registerMode" bind:value={settings.registerMode}>
					{#each ['names', 'numbers'] as mode}
						<option value={mode}>
							{mode}
						</option>
					{/each}
				</select>
			</div>
		</div>
		<h3>Info</h3>
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

	.remove-margin-top {
		margin-block-start: 0;
	}

	.raised {
		box-shadow:  8px 8px 36px #232c3b,
             -8px -8px 36px #37445d;
		border-radius: 1rem;
		margin-inline: -1rem;
		margin-block-end: 2rem;
		padding-inline: 1rem;
		padding-block: 1.5rem;
	}

	table.transparent,
	table.transparent td {
		border-color: transparent;
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
		align-items: end;
		padding-inline: 0.5rem;
		padding-block: 0.5rem;
		vertical-align: middle;
		text-align: center;
	}

	.icon-button:disabled {
		border-color: var(--clr-disabled);
		color: var(--clr-disabled);
	}

	.icon-button label {
		margin-inline: 0.3rem;
	}

	.input.full-width input {
		width: 100%;
	}

	.input label {
		margin-block-end: 0.2em;
	}

	.setting label {
		font-size: 1rem;
		font-weight: bold;
		margin-block-end: 0.5rem;
	}

	#change-input-button {
		margin: 0;
	}

	#settings {
		margin-block-start: 2em;
		display: flex;
	}

	#settings > .setting {
		margin-inline-end: 2rem;
	}

	#mips-instruction {
		font-size: 1.5rem;
		color: var(--clr-on-background);
		display: inline-block;
		padding-inline: 1rem;
		padding-block: 0.5rem;
		margin-block-start: 0;
	}

	.inset {
		box-shadow: inset 5px 5px 7px #273142,
            inset -5px -5px 7px #333f56;
		border-radius: 0.5rem;
		display: inline-block;
		padding-inline: 1em;
		padding-block: 0.5em;
		margin-block-end: 0.5em;
	}

	@media (max-width: 640px) {
		main {
			max-width: none;
		}

		.split {
			display: block;
		}

		.split > *:not(:first-child) {
			margin-inline-start: 0rem;
		}

		
		#settings {
			display: block;
		}

		#settings > .setting {
			margin-inline-end: 0;
		}
	}
</style>