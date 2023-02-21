<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify';
	import { fade } from 'svelte/transition';
	import PageSelector from '../../../components/PageSelector.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let currPage = 1;

	const publishedDate = new Date(data.publishedTime);
	const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : undefined;
	const lastChecked = new Date(data.lastChecked);

	const intl = Intl.NumberFormat();

	function dateToString(date: Date) {
		return `${date.getFullYear()}-${
			date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
		}-${date.getDate()}`;
	}
</script>

<div class="w-full min-h-min text-sm lg:text-base">
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
	<div id="workskin" class="flex flex-col gap-y-4 pt-4 text-[#d4d4d8] items-center">
		<div class="flex flex-col items-stretch">
			<h1 class="text-2xl text-center">{data.title}</h1>
			{#if data.authors.length}
				<h3 class="flex flex-row justify-center items-center gap-x-1">
					{#each data.authors as author}
						<a
							class="text-base md:text-lg decoration-dotted underline hover:bg-zinc-500 after:content-[','] after:last:content-['']"
							href="/search?author={author}">{author}</a
						>
					{/each}
				</h3>
			{:else}
				<span>by</span>
				<a href="/search?author=anonymous" class="hover:bg-zinc-500 decoration-dotted underline">
					Anonymous
				</a>
			{/if}
			{#if data.summary}
				<div class="flex flex-col mt-4 gap-y-1 mx-8">
					<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Summary:</h5>
					<div class="prose prose-zinc !prose-invert prose-sm pl-2">
						{@html DOMPurify.sanitize(data.summary)}
					</div>
				</div>
			{/if}
			{#if data.content.beginningNotes}
				<div class="flex flex-col mt-4 gap-y-1 mx-8 border-b border-white pb-6">
					<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Notes:</h5>
					<div class="prose prose-zinc !prose-invert prose-sm pl-2">
						{@html DOMPurify.sanitize(data.content.beginningNotes)}
					</div>
				</div>
			{/if}
		</div>
		<PageSelector bind:page={currPage} maxPage={data.currChapter} />
		<div transition:fade class="flex flex-col items-stretch px-4 my-2 gap-y-4">
			{#if data.content.chapters[currPage - 1].title}
				<h1 class="text-lg text-center mx-4">
					Chapter {currPage}: {data.content.chapters[currPage - 1].title}
				</h1>
			{/if}
			{#if data.content.chapters[currPage - 1].summary}
				<div class="flex flex-col gap-y-1 mx-8">
					<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Summary:</h5>
					<div class="prose prose-zinc !prose-invert prose-sm pl-2">
						{@html DOMPurify.sanitize(data.content.chapters[currPage - 1].summary)}
					</div>
				</div>
			{/if}
			{#if data.content.chapters[currPage - 1].beginningNotes}
				<div class="flex flex-col gap-y-1 mx-8">
					<h5 class="text-base md:text-lg border-b-2 border-white pb-0.5">Notes:</h5>
					<div class="prose prose-zinc !prose-invert prose-sm pl-2">
						{@html DOMPurify.sanitize(data.content.chapters[currPage - 1].beginningNotes)}
					</div>
				</div>
			{/if}
			<div
				class="pt-4 mt-2 border-t-2 border-white prose prose-zinc !prose-invert prose-sm md:prose-base"
			>
				{@html DOMPurify.sanitize(data.content.chapters[currPage - 1].content)}
			</div>
		</div>
	</div>
</div>
