<script lang="ts">
	import type { WorkDocument } from '$lib/types/work';
	import PictureTags from './PictureTags.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { DateTime } from 'luxon';

	export let work: WorkDocument;
	export let className = '';
	export { className as class };

	const intl = Intl.NumberFormat();
</script>

<div class="text-[#d4d4d8] p-2 mb-3 border border-zinc-200 bg-zinc-800 flex flex-col {className}">
	<div class="flex flex-row mb-2 max-w-full">
		<PictureTags
			chapter={[work.currChapter, work.maxChapter]}
			rating={work.rating}
			warning={work.warnings}
			category={work.categories}
			class="mr-2"
		/>
		<div class="flex flex-col gap-1 break-words">
			<h4 class="leading-tight flex flex-row gap-x-1 flex-wrap">
				<a class="text-blue-400 hover:underline" href={'/work/' + work.id}>{work.title}</a>
				{#if work.authors.length}
					<span>by</span>
					{#each work.authors as author}
						<a
							href="/search?author={encodeURIComponent(author)}"
							class="after:content-[',_'] after:last:content-[''] hover:bg-zinc-500 decoration-dotted underline"
							>{author}</a
						>
					{/each}
				{:else}
					<span>by</span>
					<a href="/search?author=anonymous" class="hover:bg-zinc-500 decoration-dotted underline">
						Anonymous
					</a>
				{/if}
			</h4>
			<div class="text-sm flex flex-wrap gap-x-1">
				{#each work.fandoms as fandom, i}
					<a
						class="decoration-dotted underline hover:bg-zinc-600"
						href={'/search?fandom=' + encodeURIComponent(fandom)}>{fandom}</a
					>
				{/each}
			</div>
		</div>
	</div>
	<div class="text-sm flex flex-wrap gap-x-1">
		{#each work.warnings as warning}
			<a
				class="font-bold decoration-dotted underline pr-0.5 word-break hover:bg-zinc-600"
				href={'/search?warning=' + encodeURIComponent(warning)}>{warning}</a
			>
		{/each}
		{#each work.relationships as relationship}
			<a
				class="decoration-dotted underline pr-0.5 word-break hover:bg-zinc-600"
				href={'/search?relationship=' + encodeURIComponent(relationship)}>{relationship}</a
			>
		{/each}
		{#each work.characters as character}
			<a
				class="decoration-dotted underline pr-0.5 word-break hover:bg-zinc-600"
				href={'/search?character=' + encodeURIComponent(character)}>{character}</a
			>
		{/each}
		{#each work.tags as tag}
			<a
				class="decoration-dotted underline pr-0.5 word-break hover:bg-zinc-600"
				href={'/search?tag=' + encodeURIComponent(tag)}>{tag}</a
			>
		{/each}
	</div>
	<div
		class="w-full h-full mt-4 my-2 pr-1 prose prose-sm xl:prose-base prose-zinc !prose-invert max-w-none prose-a:text-white word-break"
	>
		{@html DOMPurify.sanitize(work.summary)}
	</div>
	<div
		class="flex flex-row flex-wrap gap-x-2 gap-y-1 text-sm justify-end items-stretch mt-3 mr-2 mb-2"
	>
		<span>Last archived: {DateTime.fromMillis(work.lastChecked).toRelative()}</span>
		<span>Language: {work.language}</span>
		<span>Words: {intl.format(work.words)}</span>
		<span>Chapters: {work.currChapter}/{work.maxChapter}</span>
		<span>Kudos: {intl.format(work.kudos)}</span>
		<span>Bookmarks: {intl.format(work.bookmarks)}</span>
		<span>Hits: {intl.format(work.hits)}</span>
	</div>
</div>
