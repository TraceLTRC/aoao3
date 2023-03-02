<script lang="ts">
	export let value: string = '';
</script>

<div class="flex flex-col w-full px-2 pb-1">
	<div
		class="mb-2 font-semibold bg-gradient-to-r from-white via-transparent to-transparent pb-[1px] flex"
	>
		<label for="search-query" class="bg-zinc-700 h-full w-full pl-2">Search:</label>
	</div>
	<input
		bind:value
		on:keypress
		type="search"
		id="search-query"
		class="px-2 pb-0.5 rounded-md text-black mx-2"
	/>
</div>
