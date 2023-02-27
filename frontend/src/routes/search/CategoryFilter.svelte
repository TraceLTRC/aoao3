<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import DownArrowIcon from '$lib/DownArrowIcon.svelte';
	import TristateCheckbox from '$lib/TristateCheckbox.svelte';
	import { isCategory, categoryTuple, type Category } from '../../types/work';

	export let included: Set<Category> = new Set();
	export let excluded: Set<Category> = new Set();

	let isOpen = false;

	const initCategories =
		$page.url.searchParams.get('category')?.split(',').filter(isCategory) ?? [];

	const categories = categoryTuple.map((category) => {
		return {
			str: category,
			value: initCategories.includes(category)
		};
	});
</script>

<div class="w-full h-fit flex flex-col px-2 py-1">
	<button
		type="button"
		class="w-full pb-1 px-2 mb-2 border-b border-white rounded-b-md font-semibold flex justify-between items-center"
		on:click={() => (isOpen = !isOpen)}
	>
		<span>Categories:</span>
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
			{#each categories as category}
				<TristateCheckbox
					id={`category-${category.str.replaceAll(' ', '_')}`}
					freindlyId={category.str}
					on:change={(e) => {
						if (e.detail.value === true) {
							included.add(category.str);
							excluded.delete(category.str);
						} else if (e.detail.value === false) {
							included.delete(category.str);
							excluded.add(category.str);
						} else {
							included.delete(category.str);
							excluded.delete(category.str);
						}

						included = included;
						excluded = excluded;
					}}
					value={initCategories.includes(category.str) ? true : undefined}
				/>
			{/each}
		</div>
	{/if}
</div>
