<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify';
	import type { PageData } from './$types';

	export let data: PageData;

	// let sanitizedSummary = DOMPurify.sanitize(data.summary);
</script>

<p>{@html data.summary}</p>
