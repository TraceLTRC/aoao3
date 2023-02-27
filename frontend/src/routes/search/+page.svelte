<script lang="ts">
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import type { Category, Rating, Warning, WorkDocument } from '../../types/work';
	import AuthorFilter from './AuthorFilter.svelte';
	import CategoryFilter from './CategoryFilter.svelte';
	import CharacterFilter from './CharacterFilter.svelte';
	import FandomFilter from './FandomFilter.svelte';
	import RatingFilter from './RatingFilter.svelte';
	import RelationshipFilter from './RelationshipFilter.svelte';
	import SearchQuery from './SearchQuery.svelte';
	import TagFilter from './TagFilter.svelte';
	import WarningFilter from './WarningFilter.svelte';
	import WorkCard from '$lib/WorkCard.svelte';
	import { orderLabels, type workOrder } from '../../types/search';
	import { Pulse } from 'svelte-loading-spinners';

	let query: string = '';
	let order: workOrder = 'lastChecked';

	let includedRatings: Set<Rating> = new Set();
	let excludedRatings: Set<Rating> = new Set();

	let includedWarnings: Set<Warning> = new Set();
	let excludedWarnings: Set<Warning> = new Set();

	let includedCategories: Set<Category> = new Set();
	let excludedCategories: Set<Category> = new Set();

	let authors: string[] = [];
	let relationships: string[] = [];
	let fandoms: string[] = [];
	let characters: string[] = [];
	let tags: string[] = [];

	let isOpen = false;

	let workPromise: Promise<any>;
	let isFetching: boolean = true;

	function workFetch() {
		const arrIncludedRatings = Array.from(includedRatings);
		const arrIncludedCategories = Array.from(includedCategories);
		const arrIncludedWarnings = Array.from(includedWarnings);
		const arrExcludedRatings = Array.from(excludedRatings);
		const arrExcludedCategories = Array.from(excludedCategories);
		const arrExcludedWarnings = Array.from(excludedWarnings);

		isFetching = true;
		workPromise = new Promise((res, rej) => {
			fetch('/api/search', {
				method: 'POST',
				body: JSON.stringify({
					query,
					order,
					authors: authors.length == 0 ? undefined : authors,
					relationships: relationships.length == 0 ? undefined : relationships,
					fandoms: fandoms.length == 0 ? undefined : fandoms,
					characters: characters.length == 0 ? undefined : characters,
					tags: tags.length == 0 ? undefined : tags,
					includedRatings: arrIncludedRatings.length == 0 ? undefined : arrIncludedRatings,
					includedWarnings: arrIncludedWarnings.length == 0 ? undefined : arrIncludedWarnings,
					includedCategories: arrIncludedCategories.length == 0 ? undefined : arrIncludedCategories,
					excludedRatings: arrExcludedRatings.length == 0 ? undefined : arrExcludedRatings,
					excludedWarnings: arrExcludedWarnings.length == 0 ? undefined : arrExcludedWarnings,
					excludedCategories: arrExcludedCategories.length == 0 ? undefined : arrExcludedCategories
				})
			})
				.then((val) =>
					val
						.json()
						.then((hits) => {
							res(hits);
						})
						.catch(rej)
				)
				.catch(rej);
		}).finally(() => (isFetching = false));
	}

	onMount(() => {
		workFetch();
	});
</script>

<div class="w-screen min-h-fit flex flex-col sm:flex-row flex-auto">
	<div class="px-4 sm:w-[35vw] lg:w-[25vw] h-fit flex flex-col items-center order-1 sm:order-2">
		<button
			on:click={() => (isOpen = !isOpen)}
			class="transition-colors duration-200 w-full bg-zinc-700 rounded-md mt-3 mb-2 h-fit flex flex-row items-center justify-center gap-x-2 {isOpen
				? 'bg-zinc-500'
				: ''}"
		>
			<span>Filter Menu</span>
		</button>
		{#if isOpen}
			<form
				autocomplete="off"
				transition:slide
				class="flex flex-col items-center gap-y-1 w-full bg-zinc-700 px-2 py-4 rounded-md"
			>
				<button
					on:click={() => {
						workFetch();
					}}
					class="w-3/4 bg-sky-500 h-fit pb-0.5 rounded-md">Sort & Filter</button
				>
				<div class="flex flex-col w-full px-2 pb-1">
					<div
						class="mb-2 font-semibold bg-gradient-to-r from-white via-transparent to-transparent pb-[1px] flex flex-col"
					>
						<label for="order-by" class="bg-zinc-700 h-full w-full pl-2">Sort by:</label>
					</div>
					<select bind:value={order} id="order-by" class="text-black pl-2 pb-0.5 mx-2 rounded-md">
						{#each Object.entries(orderLabels) as order}
							<option value={order[0]}>{order[1]}</option>
						{/each}
					</select>
				</div>
				<SearchQuery bind:value={query} />
				<RatingFilter bind:included={includedRatings} bind:excluded={excludedRatings} />
				<WarningFilter bind:included={includedWarnings} bind:excluded={excludedWarnings} />
				<CategoryFilter bind:included={includedCategories} bind:excluded={excludedCategories} />
				<AuthorFilter bind:value={authors} />
				<FandomFilter bind:value={fandoms} />
				<RelationshipFilter bind:value={relationships} />
				<CharacterFilter bind:value={characters} />
				<TagFilter bind:value={tags} />
			</form>
		{/if}
	</div>
	<div class="sm:w-[65vw] lg:w-[75vw] order-2 sm:order-1 flex flex-col px-4 py-2">
		<h1 class="text-2xl font-semibold text-center sm:text-left mb-2">Search results:</h1>
		<div class="flex flex-col {isFetching ? 'justify-center items-center' : ''}">
			{#if workPromise != undefined}
				{#await workPromise}
					<Pulse color="#38bdf8" />
				{:then works}
					{#if works.length == 0}
						<p>Nothing but us chickens!</p>
					{:else}
						{#each works as work}
							<WorkCard {work} />
						{/each}
					{/if}
				{/await}
			{:else}
				<Pulse color="#38bdf8" />
			{/if}
		</div>
	</div>
</div>
