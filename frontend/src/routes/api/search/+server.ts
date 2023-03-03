import { PUBLIC_SEARCH_BEARER, PUBLIC_SEARCH_ENDPOINT } from '$env/static/public';
import { json } from '@sveltejs/kit';
import { MeiliSearch } from 'meilisearch';
import type { SearchBody } from '$lib/types/search';
import type { RequestHandler } from './$types';

const search = new MeiliSearch({
	host: PUBLIC_SEARCH_ENDPOINT,
	apiKey: PUBLIC_SEARCH_BEARER
}).index('archives');

function knownToFilter(
	discrete: string,
	included: string[] | undefined,
	excluded: string[] | undefined
) {
	const includedStr = included
		?.map((val) => {
			return `${discrete} = "${val}"`;
		})
		.join(discrete == 'rating' ? ' OR ' : ' AND ');

	const excludedStr = excluded
		?.map((val) => {
			return `${discrete} != "${val}"`;
		})
		.join(' AND ');

	if (includedStr == undefined && excludedStr != undefined) {
		return excludedStr;
	} else if (includedStr != undefined && excludedStr == undefined) {
		return includedStr;
	} else if (includedStr != undefined && excludedStr != undefined) {
		return `${includedStr} AND ${excludedStr}`;
	}
}

function unknownToFilter(discrete: string, val: string[] | undefined) {
	const included: string[] = [];
	const excluded: string[] = [];

	val?.forEach((el) => {
		if (el[0] == '-') {
			excluded.push(el.substring(1));
		} else {
			included.push(el);
		}
	});

	return knownToFilter(
		discrete,
		included.length == 0 ? undefined : included,
		excluded.length == 0 ? undefined : excluded
	);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as SearchBody;

	const ratingFilter = knownToFilter('rating', body.includedRatings, body.excludedRatings);
	const categoryFilter = knownToFilter(
		'categories',
		body.includedCategories,
		body.excludedCategories
	);
	const warningFilter = knownToFilter('warnings', body.includedWarnings, body.excludedWarnings);
	const authorFilter = unknownToFilter('authors', body.authors);
	const fandomFilter = unknownToFilter('fandoms', body.fandoms);
	const relationshipFilter = unknownToFilter('relationships', body.relationships);
	const characterFilter = unknownToFilter('characters', body.characters);
	const tagFilter = unknownToFilter('tags', body.tags);

	const filter = [
		ratingFilter,
		categoryFilter,
		warningFilter,
		authorFilter,
		fandomFilter,
		relationshipFilter,
		characterFilter,
		tagFilter
	];

	const filterStr = filter
		.filter((i) => i != undefined)
		.map((i) => `(${i})`)
		.join(' AND ');

	// console.log(filterStr);

	const res = await search.search(body.query, {
		filter: filterStr,
		sort: [`${body.order}:desc`],
		hitsPerPage: 20,
		page: body.page
	});

	return json(res);
};
