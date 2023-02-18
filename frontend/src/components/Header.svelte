<script lang="ts">
	import { page } from '$app/stores';
</script>

<header
	class="flex flex-col justify-around w-full h-32 bg-slate-800 px-2 pt-2 gap-1 md:px-8 md:gap-2"
>
	<div class="flex flex-row justify-center items-center">
		<a class="text-4xl mb-1 tracking-tighter" href="/">Archive of AO3</a>
	</div>
	<input
		type="search"
		placeholder="Search any work..."
		class="rounded-lg px-2 pb-1 mx-4 md:mx-24"
	/>
	<div class="flex flex-row justify-center items-end basis-2/3 text-center">
		<a
			class="flex items-center justify-center border-transparent border-b-2 hover:border-white font-bold w-full h-full transition-all duration-100 ease-in-out aria-[current]:border-sky-500"
			aria-current={$page.url.pathname === '/' ? 'page' : undefined}
			href="/">Home</a
		>
		<a
			class="flex items-center justify-center border-transparent border-b-2 hover:border-white font-bold w-full h-full transition-all duration-100 ease-in-out aria-[current]:border-sky-500"
			aria-current={$page.url.pathname === '/search' ? 'page' : undefined}
			href="/search">Search</a
		>
		<a
			class="flex items-center justify-center border-transparent border-b-2 hover:border-white font-bold w-full h-full transition-all duration-100 ease-in-out aria-[current]:border-sky-500"
			aria-current={$page.url.pathname === '/about' ? 'page' : undefined}
			href="/about">About</a
		>
	</div>
</header>
