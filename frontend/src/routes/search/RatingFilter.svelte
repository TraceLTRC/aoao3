<script lang="ts">
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import TristateCheckbox from '../../components/TristateCheckbox.svelte';
	import { isRating, ratingTuple, type Rating } from '../../types/work';

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

	$: {
		console.log(`Included: ${Array.from(included.values())}`);
		console.log(`Excluded: ${Array.from(excluded.values())}`);
	}
</script>

<div class="w-full h-fit flex flex-col px-2 py-1">
	<button
		class="w-full pb-0.5 pl-1 mb-2 border-b border-white rounded-b-md font-semibold"
		on:click={() => (isOpen = !isOpen)}
	>
		Ratings:
	</button>
	{#if isOpen}
		<div
			class="flex flex-col items-center gap-y-2 mx-3 text-sm"
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
					value={initRatings.includes(rating.str)}
				/>
			{/each}
		</div>
	{/if}
</div>
