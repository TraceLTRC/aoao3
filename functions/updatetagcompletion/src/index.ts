import * as ff from '@google-cloud/functions-framework';
import { MeiliSearch } from 'meilisearch';
import { Hit } from 'meilisearch/dist/types/types';
import crypto from 'node:crypto';

const search = new MeiliSearch({
	host: `https://${process.env.SEARCH_ENDPOINT}`,
	apiKey: process.env.SEARCH_API_KEY ?? '',
});

class TagSets {
	set: { [key: string]: number } = {};

	add(item: string) {
		this.set[item] = this.set[item] ? ++this.set[item] : 1;
	}

	export() {
		return Object.keys(this.set).map((key) => {
			return {
				key: crypto.createHash('md5').update(key).digest('hex'),
				value: key,
				frequency: this.set[key],
			};
		});
	}
}

ff.http('UpdateTagCompletion', async (_, res) => {
	const archive = search.index('archives');

	const authors = new TagSets();
	const relationships = new TagSets();
	const characters = new TagSets();
	const tags = new TagSets();
	const fandoms = new TagSets();

	function appendTags(doc: Hit<Record<string, any>>) {
		doc.authors.forEach((i: string) => authors.add(i));
		doc.characters.forEach((i: string) => characters.add(i));
		doc.relationships.forEach((i: string) => relationships.add(i));
		doc.tags.forEach((i: string) => tags.add(i));
		doc.fandoms.forEach((i: string) => fandoms.add(i));
	}

	const maxDocs = (await archive.getStats()).numberOfDocuments;

	for (let i = 0; i < maxDocs; i += 10000) {
		const docs = await archive.getDocuments({
			fields: ['relationships', 'characters', 'tags', 'fandoms', 'authors'],
			offset: i,
			limit: 10000,
		});

		docs.results.forEach((doc) => appendTags(doc));
		console.log(i);
	}

	const relationshipArray = relationships.export();
	for (let i = 0; i < relationshipArray.length; i += 10000) {
		await search.index('relationships').updateDocuments(relationshipArray.slice(i, i + 10000));
	}

	const characterArray = characters.export();
	for (let i = 0; i < characterArray.length; i += 10000) {
		await search.index('characters').updateDocuments(characterArray.slice(i, i + 10000));
	}

	const fandomArray = fandoms.export();
	for (let i = 0; i < fandomArray.length; i += 10000) {
		await search.index('fandoms').updateDocuments(fandomArray.slice(i, i + 10000));
	}

	const tagArray = tags.export();
	console.log(tagArray);
	for (let i = 0; i < tagArray.length; i += 10000) {
		await search.index('tags').updateDocuments(tagArray.slice(i, i + 10000));
	}

	const authorArray = authors.export();
	for (let i = 0; i < authorArray.length; i += 10000) {
		await search.index('authors').updateDocuments(authorArray.slice(i, i + 10000));
	}

	res.sendStatus(200).end();
});
