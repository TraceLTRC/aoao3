<script lang="ts">
	import WorkCard from '$lib/WorkCard.svelte';
	import { formatBytes } from '../utils';
	import type { PageData } from './$types';

	export let data: PageData;

	let fmt = new Intl.NumberFormat(undefined, {
		notation: 'compact',
		compactDisplay: 'long'
	});
</script>

<div class="m-2 flex flex-col items-center gap-y-6">
	<main class="flex flex-col items-center justify-center text-center">
		<h2 class="text-3xl py-2 px-6">
			Because the <em>archive</em> in AO3 is a false statement
		</h2>
		<p>
			Currently storing <b>{new Intl.NumberFormat().format(data.bucketStats.keys)}</b> works with
			<b>{fmt.format(data.bucketStats.words)}</b>
			words in total, which takes <b>{formatBytes(data.bucketStats.size)}</b> of space,
			<em>and counting...</em>
		</p>
	</main>
	<section class="flex flex-col justify-start items-start w-full md:px-8">
		<h3 class="text-2xl text-center font-bold my-3">Recent archives</h3>
		<div
			class="flex flex-col md:flex-row md:flex-wrap md:gap-x-4 justify-start items-start md:items-stretch w-full"
		>
			{#each data.hits as works}
				<WorkCard work={works} class="w-full md:w-[calc(50%-1rem)]" />
			{/each}
		</div>
	</section>
</div>
