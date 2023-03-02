<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import DownArrowIcon from '$lib/DownArrowIcon.svelte';
	import TristateCheckbox from '$lib/TristateCheckbox.svelte';
	import { isWarning, warningTuple, type Warning } from '$lib/types/work';

	export let included: Set<Warning> = new Set();
	export let excluded: Set<Warning> = new Set();

	let isOpen = false;

	const initWarnings = $page.url.searchParams.get('warning')?.split(',').filter(isWarning) ?? [];

	const warnings = warningTuple.map((warning) => {
		return {
			str: warning,
			value: initWarnings.includes(warning)
		};
	});
</script>

<div class="w-full h-fit flex flex-col px-2 py-1">
	<button
		type="button"
		class="w-full pb-1 px-2 mb-2 border-b border-white rounded-b-md font-semibold flex justify-between items-center"
		on:click={() => (isOpen = !isOpen)}
	>
		<span>Warnings:</span>
		<span>
			<DownArrowIcon
				class="w-4 h-4 transform transition-transform duration-200 {isOpen
					? 'rotate-180'
					: 'rotate-0'}"
			/>
		</span>
	</button>
	{#if isOpen}
		<div
			class="flex flex-col items-center gap-y-2 mx-3 text-sm"
			transition:slide={{ duration: 200 }}
		>
			{#each warnings as warning}
				<TristateCheckbox
					id={`warning-${warning.str.replaceAll(' ', '_')}`}
					freindlyId={warning.str}
					on:change={(e) => {
						if (e.detail.value === true) {
							included.add(warning.str);
							excluded.delete(warning.str);
						} else if (e.detail.value === false) {
							included.delete(warning.str);
							excluded.add(warning.str);
						} else {
							included.delete(warning.str);
							excluded.delete(warning.str);
						}

						included = included;
						excluded = excluded;
					}}
					value={initWarnings.includes(warning.str) ? true : undefined}
				/>
			{/each}
		</div>
	{/if}
</div>
