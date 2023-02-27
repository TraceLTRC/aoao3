<script>
	import '../app.css';
	import Footer from '$lib/Footer.svelte';
	import Header from '$lib/Header.svelte';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import PreloadingIndicator from '$lib/PreloadingIndicator.svelte';
</script>

<svelte:head>
	<title>AOAO3</title>
	<meta name="description" content="Because the &quot;archive&quot; in AO3 is a false statement." />
	<meta name="og:title" content="Archive of Archive Of Our Own" />
	<meta
		name="og:description"
		content="Because the &quot;archive&quot; in AO3 is a false statement."
	/>
	<meta name="og:type" content="website" />
	<meta name="og:image" content={$page.url.origin + '/favicon.png'} />
	<meta name="og:url" content={$page.url.href} />
	<meta name="robots" content="nosnippet" />
	<link rel="icon" type="image/png" href="/favicon.png" />
</svelte:head>

<div class="w-screen min-h-screen bg-zinc-900 text-white flex flex-col">
	{#if $navigating}
		<PreloadingIndicator />
	{/if}
	<Header />
	<slot />
	<Footer />
</div>
