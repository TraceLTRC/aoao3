<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PageSelector from '$lib/PageSelector.svelte';
	import {
		isWorkOrder,
		orderLabels,
		toInteger,
		type SearchBody,
		type SearchResponse,
		type workOrder
	} from '$lib/types/search';
	import {
		isCategory,
		isRating,
		isWarning,
		type Category,
		type Rating,
		type Warning
	} from '$lib/types/work';
	import WorkCard from '$lib/WorkCard.svelte';
	import { Pulse } from 'svelte-loading-spinners';
	import { slide } from 'svelte/transition';
	import AuthorFilter from './AuthorFilter.svelte';
	import CategoryFilter from './CategoryFilter.svelte';
	import CharacterFilter from './CharacterFilter.svelte';
	import FandomFilter from './FandomFilter.svelte';
	import RatingFilter from './RatingFilter.svelte';
	import RelationshipFilter from './RelationshipFilter.svelte';
	import SearchQuery from './SearchQuery.svelte';
	import TagFilter from './TagFilter.svelte';
	import WarningFilter from './WarningFilter.svelte';

	let innerWidth = 0;

	let currPage = 1;

	let query: string = '';
	let order: workOrder = 'lastChecked';

	let includedRatings: Set<Rating>;
	let excludedRatings: Set<Rating>;

	let includedWarnings: Set<Warning>;
	let excludedWarnings: Set<Warning>;

	let includedCategories: Set<Category>;
	let excludedCategories: Set<Category>;

	let authors: string[];
	let relationships: string[];
	let fandoms: string[];
	let characters: string[];
	let tags: string[];

	let isOpen = false;

	let workPromise: Promise<SearchResponse>;
	let isFetching: boolean = true;

	function empty<T extends string>(val: T[] | undefined) {
		if (val == undefined || val.length == 0 || val.every((i) => i.length == 0)) return undefined;
		else return val;
	}

	function setQueries() {
		const searchParams = new URLSearchParams();

		searchParams.set('query', query);
		searchParams.set('order', order);
		searchParams.set('rating', Array.from(includedRatings).join(','));
		searchParams.set('exclude_rating', Array.from(excludedRatings).join(','));
		searchParams.set('warning', Array.from(includedWarnings).join(','));
		searchParams.set('exclude_warinng', Array.from(excludedWarnings).join(','));
		searchParams.set('category', Array.from(includedCategories).join(','));
		searchParams.set('exclude_category', Array.from(excludedCategories).join(','));
		searchParams.set('author', authors.join(','));
		searchParams.set('relationship', relationships.join(','));
		searchParams.set('fandom', fandoms.join(','));
		searchParams.set('character', characters.join(','));
		searchParams.set('tag', tags.join(','));

		goto(`?${searchParams.toString()}`);
	}

	afterNavigate(() => {
		isFetching = true;

		const orderBy = $page.url.searchParams.get('order');
		currPage = toInteger($page.url.searchParams.get('page'), 1);
		const body: SearchBody = {
			query: $page.url.searchParams.get('query') ?? query,
			order: isWorkOrder(orderBy) ? orderBy : order,
			page: currPage,
			includedRatings: empty($page.url.searchParams.get('rating')?.split(',').filter(isRating)),
			excludedRatings: empty(
				$page.url.searchParams.get('exclude_rating')?.split(',').filter(isRating)
			),
			includedWarnings: empty($page.url.searchParams.get('warning')?.split(',').filter(isWarning)),
			excludedWarnings: empty(
				$page.url.searchParams.get('exclude_warning')?.split(',').filter(isWarning)
			),
			includedCategories: empty(
				$page.url.searchParams.get('category')?.split(',').filter(isCategory)
			),
			excludedCategories: empty(
				$page.url.searchParams.get('exlucde_category')?.split(',').filter(isCategory)
			),
			authors: empty($page.url.searchParams.get('author')?.split(',')),
			characters: empty($page.url.searchParams.get('character')?.split(',')),
			fandoms: empty($page.url.searchParams.get('fandom')?.split(',')),
			relationships: empty($page.url.searchParams.get('relationship')?.split(',')),
			tags: empty($page.url.searchParams.get('tag')?.split(','))
		};

		workPromise = new Promise((resolve, reject) => {
			fetch('api/search', {
				body: JSON.stringify(body),
				method: 'POST'
			})
				.then((response) => {
					response
						.json()
						.then((hits) => {
							resolve(hits);
						})
						.catch((e) => reject(e));
				})
				.catch((e) => reject(e));
		})
			.catch((e) => {
				console.error(`An error occured when searching for works! ${e}`);
			})
			.finally(() => (isFetching = false)) as Promise<SearchResponse>;
	});
</script>

<svelte:window bind:innerWidth />

<div class="w-screen min-h-fit flex flex-col sm:flex-row flex-auto">
	<div class="px-4 sm:w-[35vw] lg:w-[25vw] h-fit flex flex-col items-center order-1 sm:order-2">
		{#if innerWidth <= 640}
			<button
				on:click={() => (isOpen = !isOpen)}
				class="transition-colors duration-200 w-full bg-zinc-700 rounded-md mt-3 h-fit flex flex-row items-center justify-center gap-x-2 {isOpen
					? 'bg-zinc-500'
					: ''}"
			>
				<span>Filter Menu</span>
			</button>
		{/if}
		<form
			autocomplete="off"
			transition:slide
			class="flex flex-col items-center gap-y-1 w-full bg-zinc-700 px-2 py-4 rounded-md mt-3 {isOpen ||
			innerWidth > 640
				? ''
				: 'hidden'}"
			on:keypress={(e) => {
				if (e.key == 'Enter') e.preventDefault();
			}}
		>
			<button
				on:click|preventDefault={() => {
					setQueries();
				}}
				class="w-3/4 bg-sky-500 h-fit pb-0.5 rounded-md active:bg-sky-700">Sort & Filter</button
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
			<SearchQuery
				bind:value={query}
				on:keypress={(e) => {
					if (e.key == 'Enter') setQueries();
				}}
			/>
			<RatingFilter bind:included={includedRatings} bind:excluded={excludedRatings} />
			<WarningFilter bind:included={includedWarnings} bind:excluded={excludedWarnings} />
			<CategoryFilter bind:included={includedCategories} bind:excluded={excludedCategories} />
			<AuthorFilter bind:value={authors} />
			<FandomFilter bind:value={fandoms} />
			<RelationshipFilter bind:value={relationships} />
			<CharacterFilter bind:value={characters} />
			<TagFilter bind:value={tags} />
		</form>
	</div>
	<div class="sm:w-[65vw] lg:w-[75vw] order-2 sm:order-1 flex flex-col px-4 py-2">
		<h1 class="text-2xl font-semibold text-center sm:text-left mb-2">Search results:</h1>
		<div class="flex flex-col {isFetching ? 'justify-center items-center' : ''}">
			{#if workPromise != undefined}
				{#await workPromise}
					<Pulse color="#38bdf8" />
				{:then works}
					{#if works.hits.length == 0}
						<p>Nothing but us chickens!</p>
					{:else}
						<PageSelector
							maxPage={works.totalPages}
							page={currPage}
							on:pagechange={(e) => {
								const searchParams = new URLSearchParams($page.url.searchParams);
								searchParams.set('page', `${e.detail.page}`);

								goto(`?${searchParams.toString()}`);
							}}
							class="mb-3"
						>
							{#each works.hits as work}
								<WorkCard {work} />
							{/each}
						</PageSelector>
					{/if}
				{:catch}
					<p class="font-semibold text-red-400">Something horrible happened!</p>
				{/await}
			{/if}
		</div>
	</div>
</div>
