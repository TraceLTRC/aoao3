<script>
	import { navigating, page } from '$app/stores';
	import Footer from '$lib/Footer.svelte';
	import Header from '$lib/Header.svelte';
	import PreloadingIndicator from '$lib/PreloadingIndicator.svelte';
	import { hasTitle } from '$lib/types/work';
	import '../app.css';

	$: work = $page.data;
</script>

<svelte:head>
	{#if hasTitle(work)}
		<title>{work.title} | AOAO3</title>
	{:else}
		<title>AOAO3</title>
	{/if}
	{#if hasTitle(work)}
		<meta name="og:title" content="{work.title} | AOAO3" />
	{:else}
		<meta name="og:title" content="Archive of Archive Of Our Own" />
	{/if}
	{#if hasTitle(work)}
		<meta name="og:description" content="View the archive of &quot;{work.title}&quot; here!" />
	{:else}
		<meta
			name="og:description"
			content="Because the &quot;archive&quot; in AO3 is a false statement."
		/>
	{/if}
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
