<script lang="ts">
	import { PUBLIC_SEARCH_BEARER, PUBLIC_SEARCH_ENDPOINT } from '$env/static/public';
	import { offset, size } from '@floating-ui/dom';
	import { MeiliSearch } from 'meilisearch';
	import { createFloatingActions } from 'svelte-floating-ui';
	import { Pulse } from 'svelte-loading-spinners';
	import { fly } from 'svelte/transition';
	import { clickOutside, debounce, removeFromArray, timeout } from '../../utils';

	export let value: string[] = [];

	const [floatingRef, floatingContent] = createFloatingActions({
		autoUpdate: true,
		middleware: [
			size({
				apply({ rects, elements }) {
					Object.assign(elements.floating.style, {
						width: `${rects.reference.width}px`
					});
				}
			}),
			offset({ mainAxis: 3 })
		],
		placement: 'bottom',
		strategy: 'absolute'
	});

	const search = new MeiliSearch({
		host: PUBLIC_SEARCH_ENDPOINT,
		apiKey: PUBLIC_SEARCH_BEARER
	});

	const getTag = debounce(async (query: string) => {
		await timeout(1000);
		return await search.index('authors').search(query, {
			sort: ['frequency:desc']
		});
	}, 1250);

	let tagFetch: Promise<any> | undefined;

	let inputNode: HTMLInputElement;
</script>

<div class="flex flex-col w-full px-2 pb-1">
	<div
		class="mb-2 font-semibold bg-gradient-to-r from-white via-transparent to-transparent pb-[1px] flex"
	>
		<label for="author-filer" class="bg-zinc-700 h-full w-full pl-2">Authors:</label>
	</div>
	{#if value.length}
		<div class="flex flex-col w-full gap-y-2 mb-2">
			{#each value as el}
				<div class="flex flex-row gap-x-1 ml-2" transition:fly={{ duration: 100, x: 50 }}>
					<button
						type="button"
						class="aspect-square bg-stone-300 rounded-full text-[red] flex items-center justify-center pb-0.5"
						on:click={() => {
							removeFromArray(value, el);
							value = value;
						}}
					>
						✕
					</button>
					<span>{el}</span>
				</div>
			{/each}
		</div>
	{/if}
	<input
		type="search"
		id="author-filter"
		class="px-2 pb-0.5 rounded-md text-black mx-2 focus:outline-none"
		on:input={(e) => {
			let q;
			if (e.currentTarget.value[0] == '-') {
				q = e.currentTarget.value.substring(1);
			} else {
				q = e.currentTarget.value;
			}

			if (q !== '') {
				tagFetch = getTag(q);
			} else {
				tagFetch = undefined;
			}
		}}
		on:keypress={(e) => {
			if (e.key == 'Enter') {
				const q =
					e.currentTarget.value[0] == '-'
						? e.currentTarget.value.substring(1)
						: e.currentTarget.value;
				if (q.length == 0) return;

				value = [...value, e.currentTarget.value];
				e.currentTarget.value = '';
			}
		}}
		use:floatingRef
		bind:this={inputNode}
	/>
	{#if tagFetch != undefined}
		{#await tagFetch}
			<div
				use:floatingContent
				class="h-fit bg-white flex items-center justify-center py-2.5 rounded-md"
			>
				<Pulse color="#0284C7" size="3" unit="rem" />
			</div>
		{:then tag}
			{#if tag.hits.length}
				<div
					use:floatingContent
					use:clickOutside
					on:outclick={() => {
						tagFetch = undefined;
					}}
					class="h-48 bg-white flex flex-col rounded-md py-1 overflow-scroll"
				>
					{#each tag.hits as hit}
						<button
							type="button"
							on:click={() => {
								value = [...value, inputNode.value[0] == '-' ? `-${hit.value}` : hit.value];
								inputNode.value = '';
								tagFetch = undefined;
							}}
							class="text-black hover:bg-zinc-400 w-full text-left px-1.5">{hit.value}</button
						>
					{/each}
				</div>
			{/if}
		{/await}
	{/if}
</div>
