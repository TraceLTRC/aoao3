import { PUBLIC_SEARCH_BEARER, PUBLIC_SEARCH_ENDPOINT } from '$env/static/public';
import type { Load } from '@sveltejs/kit';
import { MeiliSearch } from 'meilisearch';
import type { WorkDocument } from '../types/work';

const search = new MeiliSearch({
	host: PUBLIC_SEARCH_ENDPOINT,
	apiKey: PUBLIC_SEARCH_BEARER
}).index('archives');

export const load: Load = async ({ fetch }) => {
	const works = (
		await search.search(null, {
			sort: ['lastChecked:desc']
		})
	).hits;

	const bucketStats = await (await fetch('/api/bucket-stats')).json();

	return {
		hits: works,
		bucketStats: bucketStats
	} as { hits: WorkDocument[]; bucketStats: { keys: number; size: number; words: number } };
};
