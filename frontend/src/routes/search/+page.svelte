<script lang="ts">
	import { page } from '$app/stores';
	import BaselineMenuIcon from '../../components/icons/BaselineMenuIcon.svelte';
	import type { Category, Rating, Warning } from '../../types/work';
	import CategoryFilter from './CategoryFilter.svelte';
	import RatingFilter from './RatingFilter.svelte';
	import SearchQuery from './SearchQuery.svelte';
	import WarningFilter from './WarningFilter.svelte';

	let innerWidth: number;

	let includedRatings: Set<Rating>;
	let excludedRatings: Set<Rating>;

	let includedWarnings: Set<Warning>;
	let excludedWarnings: Set<Warning>;

	let includedCategories: Set<Category>;
	let excludedCategories: Set<Category>;

	let isOpen = false;
</script>

<svelte:window bind:innerWidth />

<div class="w-full min-h-fit md:flex md:flex-row md:gap-x-4 p-4">
	<div class="md:basis-3/4">
		<!-- Search Results -->
	</div>
	{#if innerWidth < 768}
		<div
			class={'w-64 h-full fixed right-0 transform transition-all ' +
				(isOpen ? '-translate-x-2' : 'translate-x-full')}
		>
			<button
				class="h-12 w-12 flex items-center justify-center -translate-x-full bg-zinc-700 rounded-l-lg"
				on:click={() => (isOpen = !isOpen)}
			>
				<BaselineMenuIcon class="w-full h-full p-1" />
			</button>
			<form class="w-full h-full fixed -translate-y-12 bg-zinc-700 flex justify-center">
				<fieldset class="flex flex-col items-center gap-y-2 mx-2 mt-4">
					<button
						class="w-3/4 h-fit py-1 px-8 m-2 bg-sky-500 rounded-lg shadow-lg flex items-center justify-center"
					>
						Sort and Filter
					</button>
					<SearchQuery />
					<RatingFilter bind:included={includedRatings} bind:excluded={excludedRatings} />
					<WarningFilter bind:included={includedWarnings} bind:excluded={excludedWarnings} />
					<CategoryFilter bind:included={includedCategories} bind:excluded={excludedCategories} />
				</fieldset>
			</form>
		</div>
	{:else}
		<div class="md:basis-1/4 md:h-full ">
			<form class="h-fit w-full bg-zinc-700 rounded-xl py-2 px-2">
				<fieldset class="flex flex-col items-center gap-y-1">
					<button class="w-full h-fit py-1 px-8 m-2 bg-sky-500 rounded-lg shadow-lg">
						Sort and Filter
					</button>
					<SearchQuery />
					<RatingFilter bind:included={includedRatings} bind:excluded={excludedRatings} />
					<WarningFilter bind:included={includedWarnings} bind:excluded={excludedWarnings} />
					<CategoryFilter bind:included={includedCategories} bind:excluded={excludedCategories} />
				</fieldset>
			</form>
		</div>
	{/if}
</div>
