<script>
	import '../app.css';
	import Footer from '../components/Footer.svelte';
	import Header from '../components/Header.svelte';

	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';
	import PreloadingIndicator from '../components/PreloadingIndicator.svelte';
</script>

<svelte:head>
	<title>AOAO3</title>
	<meta
		name="description"
		content="Because the &quot;archive&quot; in archiveofourown is a false statement."
	/>
	<meta name="robots" content="nosnippet" />
</svelte:head>

<div class="w-screen min-h-screen bg-zinc-900 text-white overflow-hidden">
	{#if $navigating}
		<PreloadingIndicator />
	{/if}
	<Header />
	<slot />
	<Footer />
</div>
