<script lang="ts">
	import { browser } from '$app/environment';
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_BUCKET_ENDPOINT } from '$env/static/public';
	import PageSelector from '$lib/PageSelector.svelte';
	import type { WorkContent } from '$lib/types/work';
	import { error } from '@sveltejs/kit';
	import DOMPurify from 'isomorphic-dompurify';
	import { Pulse } from 'svelte-loading-spinners';
	import type { PageData } from './$types';

	export let data: PageData;

	const publishedDate = new Date(data.publishedTime);
	const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : undefined;
	const lastChecked = new Date(data.lastChecked);
	const latestHash = data.contentHash.at(-1)?.[1];

	if (latestHash == undefined) {
		throw error(500, 'Content Hash not found!');
	}

	let currPage = 1;
	let currHash = latestHash;
	let isFetching = true;

	let contentPromise: Promise<WorkContent>;

	const intl = Intl.NumberFormat();

	function fetchWork(hash: string): Promise<WorkContent> {
		return new Promise((res, rej) => {
			isFetching = true;
			fetch(`${PUBLIC_BUCKET_ENDPOINT}/${data.id}/${hash}.br`)
				.then((resp) => {
					resp.json().then(res).catch(rej);
				})
				.catch(rej)
				.finally(() => (isFetching = false));
		});
	}

	function dateToString(date: Date) {
		return `${date.getFullYear()}-${
			date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
		}-${date.getDate()}`;
	}

	afterNavigate(() => {
		const targetPageStr = $page.url.searchParams.get('chapter');
		if (targetPageStr != null) {
			const targetPage = parseInt(targetPageStr, 10);
			if (isNaN(targetPage) || targetPage > data.currChapter || targetPage < 1) {
				currPage = 1;
			} else {
				currPage = targetPage;
			}
		}

		const targetHash = $page.url.searchParams.get('hash');
		if (
			targetHash != undefined &&
			data.contentHash.some((arr) => arr[1] == targetHash) &&
			currHash != targetHash
		) {
			currHash = targetHash;
		}
	});

	$: {
		if (browser) contentPromise = fetchWork(currHash);
	}
</script>

<!-- My sanitizer is AO3 and whoever made this mortal flesh of mine -->
{#if data.content.skin}
	{@html `<` + `style>${data.content.skin}</style>`}
{/if}

<div class="w-full min-h-min text-sm lg:text-base flex flex-col items-center justify-center">
	<dl
		class="mx-3 my-4 px-3 py-2 md:mx-8 lg:mx-16 xl:mx-24 border border-sky-400 bg-zinc-800 shadow-md shadow-zinc-500 flex flex-col items-start md:flex-row md:flex-wrap"
	>
		<dt class="mt-1 md:w-1/2">Rating:</dt>
		<dd class="ml-4 md:w-1/2 md:ml-0">
			<a
				class="underline decoration-dotted hover:bg-zinc-500"
				href="/search?rating={encodeURIComponent(data.rating)}">{data.rating}</a
			>
		</dd>
		<dt class="mt-3 md:w-1/2">Archive Warnings:</dt>
		<dd class="ml-4 flex flex-row flex-wrap gap-x-2 md:w-1/2 md:ml-0 md:mt-3">
			{#each data.warnings as warning}
				<a
					class="underline decoration-dotted hover:bg-zinc-500"
					href="/search?warning={encodeURIComponent(warning)}">{warning}</a
				>
			{/each}
		</dd>
		{#if data.categories.length}
			<dt class="mt-3 md:w-1/2">Categories:</dt>
			<dd class="ml-4 flex flex-row flex-wrap gap-x-2 md:w-1/2 md:ml-0 md:mt-3">
				{#each data.categories as category}
					<a
						class="underline decoration-dotted hover:bg-zinc-500"
						href="/search?category={encodeURIComponent(category)}">{category}</a
					>
				{/each}
			</dd>
		{/if}
		{#if data.fandoms.length}
			<dt class="mt-3 md:w-1/2">Fandoms:</dt>
			<dd class="ml-4 flex flex-row flex-wrap gap-x-2 md:w-1/2 md:ml-0 md:mt-3">
				{#each data.fandoms as fandom}
					<a
						class="underline decoration-dotted hover:bg-zinc-500"
						href="/search?fandom={encodeURIComponent(fandom)}">{fandom}</a
					>
				{/each}
			</dd>
		{/if}
		{#if data.relationships.length}
			<dt class="mt-3 md:w-1/2">Relationships:</dt>
			<dd class="ml-4 flex flex-row flex-wrap gap-x-2 md:w-1/2 md:ml-0 md:mt-3">
				{#each data.relationships as relationship}
					<a
						class="underline decoration-dotted hover:bg-zinc-500"
						href="/search?relationship={encodeURIComponent(relationship)}">{relationship}</a
					>
				{/each}
			</dd>
		{/if}
		{#if data.characters.length}
			<dt class="mt-3 md:w-1/2">Characters:</dt>
			<dd class="ml-4 flex flex-row flex-wrap gap-x-2 md:w-1/2 md:ml-0 md:mt-3">
				{#each data.characters as character}
					<a
						class="underline decoration-dotted hover:bg-zinc-500"
						href="/search?character={encodeURIComponent(character)}">{character}</a
					>
				{/each}
			</dd>
		{/if}
		{#if data.tags.length}
			<dt class="mt-3 md:w-1/2">Additional Tags:</dt>
			<dd class="ml-4 flex flex-row flex-wrap gap-x-2 md:w-1/2 md:ml-0 md:mt-3">
				{#each data.tags as tag}
					<a
						class="underline decoration-dotted hover:bg-zinc-500"
						href="/search?tag={encodeURIComponent(tag)}">{tag}</a
					>
				{/each}
			</dd>
		{/if}
		<dt class="mt-3 md:w-1/2">Language:</dt>
		<dd class="ml-4 md:w-1/2 md:ml-0 md:mt-3">
			<a
				class="underline decoration-dotted hover:bg-zinc-500"
				href="/search?language={encodeURIComponent(data.language)}">{data.language}</a
			>
		</dd>
		<dt class="mt-3 md:w-1/2">Stats:</dt>
		<dd class="ml-4 md:w-1/2 md:ml-0 md:mt-3">
			<dl class="flex flex-row flex-wrap gap-x-2">
				<div class="flex flex-row gap-x-1">
					<dt>Published:</dt>
					<dd>
						{dateToString(publishedDate)}
					</dd>
				</div>
				<div class="flex flex-row gap-x-1">
					{#if lastUpdated}
						{#if data.currChapter == data.maxChapter}
							<dt>Completed:</dt>
						{:else}
							<dt>Last Updated:</dt>
						{/if}
						<dd>{dateToString(lastUpdated)}</dd>
					{/if}
				</div>
				<div class="flex flex-row gap-x-1">
					<dt>Last Archived:</dt>
					<dd class="underline decoration-dotted" title={lastChecked.toLocaleString()}>
						{dateToString(lastChecked)}
					</dd>
				</div>
				<div class="flex flex-row gap-x-1">
					<dt>Words:</dt>
					<dd>{intl.format(data.words)}</dd>
				</div>
				<div class="flex flex-row gap-x-1">
					<dt>Chapters:</dt>
					<dd>{data.currChapter}/{data.maxChapter}</dd>
				</div>
				<div class="flex flex-row gap-x-1">
					<dt>Kudos:</dt>
					<dd>{intl.format(data.kudos)}</dd>
				</div>
				{#if data.bookmarks}
					<div class="flex flex-row gap-x-1">
						<dt>Bookmarks:</dt>
						<dd>{intl.format(data.bookmarks)}</dd>
					</div>
				{/if}
				<div class="flex flex-row gap-x-1 mb-2">
					<dt>Hits:</dt>
					<dd>{intl.format(data.hits)}</dd>
				</div>
			</dl>
		</dd>
	</dl>
	<!-- Use client side fetching for content -->
	<div
		id="workskin"
		class="md:w-4/5 lg:w-3/5 xl:w-1/2 flex flex-col gap-y-4 pt-4 text-[#d4d4d8] items-center"
	>
		<div class="flex flex-col items-center">
			<h1 class="text-2xl text-center mx-2">{data.title}</h1>
			{#if data.authors.length}
				<h3 class="flex flex-row justify-center items-center gap-x-1">
					{#each data.authors as author}
						<a
							class="text-base md:text-lg decoration-dotted underline hover:bg-zinc-500 after:content-[','] after:last:content-['']"
							href="/search?author={encodeURIComponent(author)}">{author}</a
						>
					{/each}
				</h3>
			{:else}
				<span>by</span>
				<a href="/search?author=Anonymous" class="hover:bg-zinc-500 decoration-dotted underline">
					Anonymous
				</a>
			{/if}
			{#if data.summary}
				<div class="flex flex-col mt-4 gap-y-1 mx-8 mb-2">
					<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Summary:</h5>
					<div class="prose prose-zinc !prose-invert prose-sm md:prose-base pl-2">
						{@html DOMPurify.sanitize(data.summary)}
					</div>
				</div>
			{/if}
			<select
				class="text-[#d4d4d8] bg-zinc-700 shadow-xl rounded-lg h-fit py-1 px-2 mb-2 mt-4"
				bind:value={currHash}
				on:change={(e) => {
					const queries = new URLSearchParams($page.url.searchParams);
					queries.set('hash', e.currentTarget.value);
					queries.set('chapter', `1`);
					goto(`?${queries.toString()}`, {
						noScroll: true
					});
				}}
			>
				{#each data.contentHash as contentHash}
					<option value={contentHash[1]}>{new Date(contentHash[0]).toLocaleString()}</option>
				{/each}
			</select>
			{#if contentPromise != undefined}
				{#await contentPromise then content}
					<div class="flex flex-col mt-4 gap-y-1 mx-8 mb-2">
						<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Notes:</h5>
						<div class="prose prose-zinc !prose-invert prose-sm md:prose-base pl-2">
							{@html DOMPurify.sanitize(content.beginningNotes)}
						</div>
					</div>
				{:catch}
					<p>Failed to load work!</p>
				{/await}
			{/if}
		</div>
		{#if contentPromise != undefined}
			{#await contentPromise}
				<Pulse color="#38bdf8" />
			{:then content}
				<PageSelector
					maxPage={content.chapters.length}
					bind:page={currPage}
					on:pagechange={(e) => {
						const queries = new URLSearchParams($page.url.searchParams);
						queries.set('chapter', e.detail.page);
						goto(`?${queries.toString()}`, {
							noScroll: true
						});
					}}
				>
					<div class="flex flex-col items-stretch px-4 mb-2 gap-y-4">
						{#if content.chapters[currPage - 1].title && !(`Chapter ${currPage}` == content.chapters[currPage - 1].title)}
							<h1 class="text-lg text-center mb-4">
								Chapter {currPage}: {content.chapters[currPage - 1].title}
							</h1>
						{/if}
						{#if content.chapters[currPage - 1].summary}
							<div class="flex flex-col gap-y-1 mx-8 mb-2">
								<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Summary:</h5>
								<div class="prose prose-zinc !prose-invert prose-sm pl-2">
									{@html DOMPurify.sanitize(content.chapters[currPage - 1].summary)}
								</div>
							</div>
						{/if}
						{#if content.chapters[currPage - 1].beginningNotes}
							<div class="flex flex-col gap-y-1 mx-8 mb-2">
								<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Notes:</h5>
								<div class="prose prose-zinc !prose-invert prose-sm md:prose-base pl-2">
									{@html DOMPurify.sanitize(content.chapters[currPage - 1].beginningNotes)}
								</div>
							</div>
						{/if}
						<div class="prose prose-zinc !prose-invert prose-sm md:prose-base">
							{@html DOMPurify.sanitize(content.chapters[currPage - 1].content)}
						</div>
						{#if content.chapters[currPage - 1].endingNotes}
							<div class="flex flex-col gap-y-1 mx-8">
								<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Notes:</h5>
								<div class="prose prose-zinc !prose-invert prose-sm md:prose-base pl-2">
									{@html DOMPurify.sanitize(content.chapters[currPage - 1].endingNotes)}
								</div>
							</div>
						{/if}
					</div>
					{#if content.endingNotes}
						<div class="flex flex-col mt-4 gap-y-1 mx-8 mb-2">
							<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Notes:</h5>
							<div class="prose prose-zinc !prose-invert prose-sm md:prose-base pl-2">
								{@html DOMPurify.sanitize(content.endingNotes)}
							</div>
						</div>
					{/if}
				</PageSelector>
			{:catch}
				<p>Failed to load work!</p>
			{/await}
		{/if}
	</div>
</div>
