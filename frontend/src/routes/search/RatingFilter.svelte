<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import DownArrowIcon from '$lib/DownArrowIcon.svelte';
	import TristateCheckbox from '$lib/TristateCheckbox.svelte';
	import { isRating, ratingTuple, type Rating } from '$lib/types/work';

	export let included: Set<Rating> = new Set();
	export let excluded: Set<Rating> = new Set();

	let isOpen = false;

	const initRatings = $page.url.searchParams.get('rating')?.split(',').filter(isRating) ?? [];

	const ratings = ratingTuple.map((rating) => {
		return {
			str: rating,
			value: initRatings.includes(rating)
		};
	});
</script>

<div class="w-full h-fit flex flex-col px-2 py-1">
	<button
		type="button"
		class="w-full pb-1 px-2 mb-2 border-b border-white rounded-b-md font-semibold flex justify-between items-center"
		on:click|preventDefault={() => (isOpen = !isOpen)}
	>
		<span>Ratings:</span>
		<span>
			<DownArrowIcon
				class="w-4 h-4 transform transition-transform duration-200 {isOpen
					? 'rotate-180'
					: 'rotate-0'}"
			/>
		</span>
	</button>
	<div
		class="flex flex-col items-center gap-y-2 mx-3 text-sm {isOpen ? '' : 'hidden'}"
		transition:slide={{ duration: 200 }}
	>
		{#each ratings as rating}
			<TristateCheckbox
				id={`rating-${rating.str.replaceAll(' ', '_')}`}
				freindlyId={rating.str}
				on:change={(e) => {
					if (e.detail.value === true) {
						included.add(rating.str);
						excluded.delete(rating.str);
					} else if (e.detail.value === false) {
						included.delete(rating.str);
						excluded.add(rating.str);
					} else {
						included.delete(rating.str);
						excluded.delete(rating.str);
					}

					included = included;
					excluded = excluded;
				}}
				value={initRatings.includes(rating.str) ? true : undefined}
			/>
		{/each}
	</div>
</div>
