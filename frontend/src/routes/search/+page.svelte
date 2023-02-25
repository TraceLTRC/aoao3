<script lang="ts">
	import { page } from '$app/stores';
	import BaselineMenuIcon from '../../components/icons/BaselineMenuIcon.svelte';
	import TristateCheckbox from '../../components/TristateCheckbox.svelte';
	import {
		isCategory,
		isRating,
		isWarning,
		type Category,
		type Rating,
		type Warning
	} from '../../types/work';
	import RatingFilter from './RatingFilter.svelte';

	let innerWidth: number;

	const authorQuery = $page.url.searchParams.get('author')?.split(',');
	let authorsToFilter: string[] = authorQuery ? [...authorQuery] : [];

	const fandomQuery = $page.url.searchParams.get('fandom')?.split(',');
	let fandomsToFilter: string[] = fandomQuery ? [...fandomQuery] : [];

	const languageQuery = $page.url.searchParams.get('language')?.split(',');
	let languageToFilter: string[] = languageQuery ? [...languageQuery] : [];

	const relationshipQuery = $page.url.searchParams.get('relationship')?.split(',');
	let relationshipToFilter: string[] = relationshipQuery ? [...relationshipQuery] : [];

	const tagQuery = $page.url.searchParams.get('tag')?.split(',');
	let tagToFilter: string[] = tagQuery ? [...tagQuery] : [];

	let ratingToFilter: Rating[] = [];
	$page.url.searchParams
		.get('rating')
		?.split(',')
		.forEach((val) => isRating(val) && ratingToFilter.push(val));

	let categoryToFilter: Category[] = [];
	$page.url.searchParams
		.get('category')
		?.split(',')
		.forEach((val) => isCategory(val) && categoryToFilter.push(val));

	let warningToFilter: Warning[] = [];
	$page.url.searchParams
		.get('warning')
		?.split(',')
		.forEach((val) => isWarning(val) && warningToFilter.push(val));

	let isOpen = false;
</script>

<svelte:window bind:innerWidth />

<div class="w-full min-h-fit md:flex md:flex-row">
	{#if innerWidth < 768}
		<div
			class={'w-64 h-full fixed right-0 transform transition-all ' +
				(isOpen ? 'translate-x-0' : 'translate-x-full')}
		>
			<button
				class="h-12 w-12 flex items-center justify-center -translate-x-full bg-zinc-700 rounded-l-lg"
				on:click={() => (isOpen = !isOpen)}
			>
				<BaselineMenuIcon class="w-full h-full p-1" />
			</button>
			<form class="w-full h-full fixed -translate-y-12 bg-zinc-700 py-2 px-2">
				<fieldset class="flex flex-col items-center gap-y-1">
					<button class="w-full h-fit py-1 px-8 m-2 bg-sky-500 rounded-lg shadow-lg">
						Sort and Filter
					</button>
					<RatingFilter />
				</fieldset>
			</form>
		</div>
	{/if}
	<div>
		<!-- Search menu -->
	</div>
</div>
