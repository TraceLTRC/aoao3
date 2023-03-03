<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import BackArrowIcon from './icons/BackArrowIcon.svelte';
	import FrontArrowIcon from './icons/FrontArrowIcon.svelte';

	const dispatch = createEventDispatcher();

	export let maxPage: number;
	export let page: number = 1;

	let candidatePage: string = `${page}`;
	$: candidatePage = `${page}`;

	let isModalOpen = false;

	function goNextPage() {
		if (page >= maxPage) {
			return;
		}

		page++;
		dispatch('pagechange', { page });
	}

	function goPrevPage() {
		if (page <= 1) {
			return;
		}

		page--;
		dispatch('pagechange', { page });
	}

	function pageHop() {
		let candidatePageNumber = parseInt(candidatePage, 10);

		if (isNaN(candidatePageNumber) || candidatePageNumber < 1 || candidatePageNumber > maxPage) {
			alert('Invalid page number!');
		} else {
			page = candidatePageNumber;
			candidatePage = `${page}`;
			isModalOpen = false;
			dispatch('pagechange', { page });
		}
	}
</script>

<div id="top-page-select" class="flex flex-row justify-center items-center gap-x-1">
	<button on:click={goPrevPage} class="h-7 w-7 flex justify-center items-center">
		<BackArrowIcon class="text-sky-400 h-6 w-6" />
	</button>
	<button
		on:click={() => (isModalOpen = true)}
		class="border border-zinc-400 py-1 px-2 hover:bg-zinc-600 cursor-pointer"
	>
		<span>{page}/{maxPage}</span>
	</button>
	<button on:click={goNextPage} class="h-7 w-7 flex justify-center items-center">
		<FrontArrowIcon class="text-sky-400 h-6 w-6" />
	</button>
</div>
<slot />
<div id="bottom-page-select" class="flex flex-row justify-center items-center gap-x-1">
	<button on:click={goPrevPage} class="h-7 w-7 flex justify-center items-center">
		<BackArrowIcon class="text-sky-400 h-6 w-6" />
	</button>
	<button
		on:click={() => (isModalOpen = true)}
		class="border border-zinc-400 py-1 px-2 hover:bg-zinc-600 cursor-pointer"
	>
		<span>{page}/{maxPage}</span>
	</button>
	<button on:click={goNextPage} class="h-7 w-7 flex justify-center items-center">
		<FrontArrowIcon class="text-sky-400 h-6 w-6" />
	</button>
</div>

{#if isModalOpen}
	<!-- svelte-ignore a11y-autofocus -->
	<div
		transition:fade={{ duration: 100 }}
		on:click|self={() => {
			isModalOpen = false;
		}}
		on:keydown={(e) => {
			if (e.key == 'Escape') isModalOpen = false;
		}}
		class="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 z-[100] flex items-center justify-center cursor-default"
	>
		<div
			class="w-1/2 h-min bg-zinc-900 rounded-xl flex flex-col justify-center items-center py-4 px-4"
		>
			<label for="page-hopper" class="text-xl mb-4">Jump to page</label>
			<input
				type="text"
				id="page-hopper"
				bind:value={candidatePage}
				class="w-full h-fit bg-zinc-800 rounded-md px-2 text-lg text-center focus:outline-none"
				min="1"
				max={maxPage}
				on:keypress={(e) => {
					if (e.key == 'Enter') pageHop();
				}}
			/>
			<div class="flex flex-row gap-x-2 h-fit mt-6 mb-2 text-white">
				<button
					on:click={pageHop}
					class="flex items-center justify-center h-fit w-fit p-2 bg-sky-600 rounded-md"
				>
					Ok
				</button>
				<button
					on:click={() => {
						isModalOpen = false;
					}}
					class="flex items-center justify-center h-fit w-fit p-2 bg-zinc-600 rounded-md"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
