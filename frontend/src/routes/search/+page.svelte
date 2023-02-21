<script lang="ts">
	import { PUBLIC_SEARCH_BEARER, PUBLIC_SEARCH_ENDPOINT } from '$env/static/public';
	import { onMount } from 'svelte';

	onMount(() => {
		console.log(PUBLIC_SEARCH_BEARER);
		console.log(PUBLIC_SEARCH_ENDPOINT);
	});
</script>

<div>Hello, world!</div>
