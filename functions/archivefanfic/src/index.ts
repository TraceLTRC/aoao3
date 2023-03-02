import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as ff from '@google-cloud/functions-framework';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { MeiliSearch, MeiliSearchApiError } from 'meilisearch';
import * as zlib from 'node:zlib';

type contentHashArray = [number, string];

type ArchiveMeta = {
	lastChecked: number;
	contentHash: contentHashArray[];
};

type WorkStats = {
	publishedTime: number;
	lastUpdated?: number;
	words: number;
	currChapter: number;
	maxChapter: number;
	kudos: number;
	bookmarks: number;
	hits: number;
};

type WorkMeta = {
	title: string;
	authors: string[];
	warnings: string[];
	rating: string;
	categories: string[];
	fandoms: string[];
	relationships: string[];
	characters: string[];
	tags: string[];
	language: string;
} & WorkStats;

type WorkChapter = {
	title: string;
	summary: string;
	beginningNotes: string;
	endingNotes: string;
	content: string;
};

type WorkContent = {
	beginningNotes: string;
	endingNotes: string;
	skin: string;
	chapters: WorkChapter[];
};

type Work = {
	id: string;
	summary: string;
} & WorkMeta;

type WorkDocument = Work & ArchiveMeta;

const MAX_ARCHIVE_REFRESH = 30 * 60 * 1000;

function workFactory(id: string): WorkDocument {
	return {
		authors: [],
		bookmarks: 0,
		categories: [],
		currChapter: 0,
		maxChapter: 0,
		characters: [],
		fandoms: [],
		hits: -1,
		id: id,
		kudos: 0,
		language: '',
		publishedTime: 0,
		rating: '',
		relationships: [],
		tags: [],
		title: '',
		warnings: [''],
		words: -1,
		contentHash: [],
		lastChecked: Date.now(),
		summary: '',
	};
}

async function getWork(workId: string) {
	const work = workFactory(workId);
	const content: WorkContent = {
		beginningNotes: '',
		chapters: [],
		endingNotes: '',
		skin: '',
	};

	const url = `https://archiveofourown.org/works/${workId}?view_full_work=true&view_adult=true`;

	let $: cheerio.CheerioAPI;
	let resultingURL;

	try {
		const res = await axios.get(url, {
			responseType: 'document',
			validateStatus: (status) => status < 500,
		});
		if (res.status == 429) {
			throw new Error('Too Many Requests!');
		} else if (res.status == 404) {
			throw new Error('Work Not Found!');
		} else if (res.status != 200) {
			throw new Error('Unexpected error! ' + res.status);
		}

		$ = cheerio.load(res.data);
		resultingURL = res.request.res.responseUrl as string;
	} catch (e) {
		throw e;
	}

	// Collect preface
	const prefaceEl = $('div#inner div#workskin > div.preface.group');

	work.title = prefaceEl.find('.title').text().trim();
	work.authors = prefaceEl
		.find('.byline > a[rel="author"]')
		.map((i, el) => {
			return $(el).text().trim();
		})
		.toArray();
	if (work.authors.length == 0) work.authors.push('Anonymous');
	work.summary = prefaceEl.find('div.summary').children().not('h3').html()?.trim() ?? '';
	content.beginningNotes = prefaceEl.find('div.notes').children().not('h3').html()?.trim() ?? '';
	content.endingNotes = $('div#work_endnotes').children().not('h3').html()?.trim() ?? '';
	content.skin = $('div#inner style').text().trim() ?? '';

	// collect stats
	$('div#inner dl.work.meta')
		.find('dd')
		.each((i, el) => {
			if ($(el).hasClass('rating')) {
				work.rating = $('a', el).first().text().trim();
			} else if ($(el).hasClass('warning')) {
				work.warnings = $('a', el)
					.map((i, el) => {
						return $(el).text().trim();
					})
					.toArray();
			} else if ($(el).hasClass('category')) {
				work.categories = $('a', el)
					.map((i, el) => {
						return $(el).text().trim();
					})
					.toArray();
			} else if ($(el).hasClass('fandom')) {
				work.fandoms = $('a', el)
					.map((i, el) => {
						return $(el).text().trim();
					})
					.toArray();
			} else if ($(el).hasClass('relationship')) {
				work.relationships = $('a', el)
					.map((i, el) => {
						return $(el).text().trim();
					})
					.toArray();
			} else if ($(el).hasClass('character')) {
				work.characters = $('a', el)
					.map((i, el) => {
						return $(el).text().trim();
					})
					.toArray();
			} else if ($(el).hasClass('freeform')) {
				work.tags = $('a', el)
					.map((i, el) => {
						return $(el).text().trim();
					})
					.toArray();
			} else if ($(el).hasClass('language')) {
				work.language = $(el).text().trim();
			} else if ($(el).hasClass('published')) {
				const splitDate = $(el).text().trim().split('-');
				work.publishedTime = Date.UTC(+splitDate[0], +splitDate[1] - 1, +splitDate[2]);
			} else if ($(el).hasClass('status')) {
				const splitDate = $(el).text().trim().split('-');
				work.lastUpdated = Date.UTC(+splitDate[0], +splitDate[1] - 1, +splitDate[2]);
			} else if ($(el).hasClass('words')) {
				work.words = +$(el).text().trim();
			} else if ($(el).hasClass('chapters')) {
				const chapterSplit = $(el).text().trim().split('/');
				work.currChapter = Number.parseInt(chapterSplit[0]);
				work.maxChapter = chapterSplit[1] == '?' ? -1 : Number.parseInt(chapterSplit[0]);
			} else if ($(el).hasClass('kudos')) {
				work.kudos = +$(el).text().trim();
			} else if ($(el).hasClass('bookmarks')) {
				work.bookmarks = +$(el).text().trim();
			} else if ($(el).hasClass('hits')) {
				work.hits = +$(el).text().trim();
			}
		});

	// Collect chapters
	if (work.maxChapter == 1) {
		content.chapters = [
			{
				beginningNotes: '',
				endingNotes: '',
				summary: '',
				title: '',
				content: $('div#chapters div.userstuff').html()?.trim() ?? '',
			},
		];
	} else {
		content.chapters = $('div[id^="chapter-"]')
			.map((i, el) => {
				const chapter: WorkChapter = {
					beginningNotes: '',
					content: '',
					endingNotes: '',
					summary: '',
					title: '',
				};

				$(el)
					.children()
					.each((i, el) => {
						if ($(el).is('.chapter.preface.group[role="complementary"]')) {
							// Beginning notes, summary, and title
							const preTitle = $(el)
								.children('.title')
								.first()
								.clone()
								.children()
								.remove()
								.end()
								.text()
								.trim();
							if (preTitle.startsWith(': ')) {
								chapter.title = preTitle.substring(2);
							} else if (preTitle.length > 0) {
								console.error('Unexpected chapter prefix!');
							} else {
								chapter.title = '';
							}

							chapter.summary =
								$(el).find('div.summary > blockquote.userstuff').html()?.trim() ??
								'';
							chapter.beginningNotes =
								$(el).find('div.notes > blockquote.userstuff').html()?.trim() ?? '';
						} else if ($(el).is('.userstuff.module')) {
							chapter.content =
								$(el).children('.landmark').remove().end().html()?.trim() ?? '';
						} else if ($(el).is('.chapter.preface.group:not([role])')) {
							chapter.endingNotes = $(el).find('blockquote').html()?.trim() ?? '';
						}
					});

				return chapter;
			})
			.toArray();
	}

	const hash = createHash('md5').update(JSON.stringify(content)).digest('hex');

	work.contentHash.push([Date.now(), hash]);

	if (work.hits == -1 || work.title == '') {
		if (resultingURL.includes('restricted')) throw new Error('Restricted Content');
		throw new Error('Title and hits were not touched. Is AO3 Down?');
	}

	return { work, content };
}

async function uploadToObject(client: S3Client, path: string, hash: string, work: WorkContent) {
	const data = zlib.brotliCompressSync(JSON.stringify(work), {
		params: {
			[zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
		},
	});

	const compressedHash = createHash('md5').update(data).digest('base64');

	const command = new PutObjectCommand({
		Bucket: process.env.OBJECT_NAME,
		Key: `${path}/${hash}.br`,
		ContentType: 'application/json',
		ContentEncoding: 'br',
		Body: data,
		ContentMD5: compressedHash,
	});

	return await client.send(command);
}

const objectClient = new S3Client({
	credentials: {
		accessKeyId: process.env.OBJECT_ACCESS_KEY ?? '',
		secretAccessKey: process.env.OBJECT_SECRET_KEY ?? '',
	},
	endpoint: `https://${process.env.OBJECT_ENDPOINT}`,
	region: process.env.OBJECT_REGION,
});

const searchClient = new MeiliSearch({
	host: `https://${process.env.SEARCH_DOMAIN}`,
	apiKey: process.env.SEARCH_API_KEY,
});

ff.http('ArchiveFanfic', async (req: ff.Request, res: ff.Response) => {
	if (req.body == null || req.body.workId == null) {
		res.status(400).end();
		return;
	}

	if (req.method != 'POST') {
		res.sendStatus(405).end();
		return;
	}
	const workId = req.body.workId as string;

	const index = searchClient.index('archives');

	let fetchedDoc, fetchedContent, fetchedHash;

	try {
		({ work: fetchedDoc, content: fetchedContent } = await getWork(workId));
		fetchedHash = fetchedDoc.contentHash.at(-1)?.[1];
	} catch (e) {
		if (e instanceof Error && e.message.startsWith('Too Many')) {
			res.sendStatus(429).end();
		} else if (e instanceof Error && e.message.includes('Not Found')) {
			console.log('Archive not found! ID: ' + workId);
			res.sendStatus(404).end();
		} else if (e instanceof Error && e.message.includes('Restricted')) {
			console.log('Restricted archive! ID: ' + workId);
			res.sendStatus(403).end();
		} else {
			console.error('Error on WorkID: ' + workId);
			console.error(e);
			res.sendStatus(500).end();
		}
		return;
	}

	if (fetchedHash == undefined) throw new Error('Fetched doc contains no hash!');

	try {
		const doc = await index.getDocument<WorkDocument>(workId);
		const checkDur = Date.now() - doc.lastChecked;
		if (checkDur < MAX_ARCHIVE_REFRESH) {
			console.log(
				`Work ${workId} has been updated recently, ignoring... (${Math.floor(
					checkDur / 1000,
				)}s)`,
			);
			res.status(304).send(
				`Archive has been refreshed recently! Wait ${Math.floor(
					checkDur / 1000,
				)} seconds...`,
			);
			return;
		}

		const latestHash = doc.contentHash.at(-1)?.[1];
		if (latestHash == undefined) {
			throw new Error(`Work ${workId} has invalid contenthash form!`);
		}

		if (latestHash != fetchedHash) {
			console.log(`Work ${workId} has different hash! Updating...`);

			fetchedDoc.contentHash.unshift(...doc.contentHash);

			await uploadToObject(objectClient, workId, fetchedHash, fetchedContent),
				await index.updateDocuments([fetchedDoc]);

			console.log(`Work ${workId} has been fully updated!`);
			res.sendStatus(202).end();
			return;
		}

		// Update stats
		await index.updateDocuments([fetchedDoc]);
		console.log(`Work ${workId} has updated their stats!`);
		res.sendStatus(202).end();
		return;
	} catch (e) {
		if (e instanceof MeiliSearchApiError && e.code == 'document_not_found') {
			// First archive

			await uploadToObject(objectClient, workId, fetchedHash, fetchedContent),
				await index.addDocuments([fetchedDoc]);

			console.log(`Work ${workId} has been archived!`);
			res.sendStatus(202).end();
			return;
		} else {
			// do if the error is meili related, delete object, else delete document
			res.sendStatus(500).end();
			console.error(`Unexpected error on work ${workId}`);
			console.error(e);
		}
	}
});
