import { PUBLIC_SEARCH_BEARER, PUBLIC_SEARCH_ENDPOINT } from '$env/static/public';
import type { WorkDocument } from '$lib/types/work';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, url }) => {
	const workId = url.searchParams.get('work');
	if (workId == undefined) throw error(404, 'No work ID was given!');

	const workDoc = (await (
		await fetch(PUBLIC_SEARCH_ENDPOINT + '/indexes/archives/documents/' + workId, {
			credentials: 'include',
			headers: {
				Authorization: 'Bearer ' + PUBLIC_SEARCH_BEARER,
				'content-type': 'application/json'
			}
		})
	).json()) as WorkDocument;

	return json(workDoc);
};
