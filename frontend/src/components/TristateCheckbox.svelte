<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import type { States } from '../types/search';

	let dispatcher = createEventDispatcher();

	export let className = '';
	export { className as class };

	export let id: string;
	export let freindlyId: string;

	export let value: States = null;

	function stateToString(val: States): string {
		switch (val) {
			case true:
				return '✓';
			case false:
				return '✕';
			case null:
				return '〜';
		}
	}

	function stateToColor(val: States): string {
		switch (val) {
			case null:
				return 'bg-stone-300 text-gray-500';
			case true:
				return 'bg-green-200 text-[green]';
			case false:
				return 'bg-red-200 text-[red]';
		}
	}

	onMount(() => {
		dispatcher('change', {
			value
		});
	});
</script>

<div class="w-full h-fit flex flex-row gap-x-2">
	<button
		{id}
		on:click|preventDefault={() => {
			if (value == null) {
				value = true;
			} else if (value == true) {
				value = false;
			} else {
				value = null;
			}
			dispatcher('change', {
				value
			});
		}}
		class="w-6 h-6 rounded-md {stateToColor(
			value
		)} border-white border font-extrabold text-lg flex items-center justify-center {className}"
		>{stateToString(value)}
	</button>
	<label for={id}>{freindlyId}</label>
</div>
