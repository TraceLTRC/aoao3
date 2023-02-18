<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="w-full h-full text-white flex flex-col gap-2 items-center justify-start">
	<span class="text-4xl">{$page.status}</span>
	<span>{$page.error?.message}</span>
</div>
