import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import * as zlib from 'zlib';
import { WorkChapter, WorkContent, workFactory } from './types';

export async function getWork(workId: string) {
	const work = workFactory(workId);
	const content: WorkContent = {
		beginningNotes: '',
		chapters: [],
		endingNotes: '',
		skin: '',
	};

	const url = `https://archiveofourown.org/works/${workId}?view_full_work=true&view_adult=true`;

	let $: cheerio.CheerioAPI;

	try {
		const res = await axios.get(url, {
			responseType: 'document',
			validateStatus: (status) => status < 500,
		});
		if (res.status == 429) {
			throw new Error('Too Many Requests!');
		} else if (res.status != 200) {
			throw new Error('Unexpected error! ' + res.status);
		}

		$ = cheerio.load(res.data);
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
								$(el).find('div.summary > blockquote.userstuff').html()?.trim() ?? '';
							chapter.beginningNotes =
								$(el).find('div.notes > blockquote.userstuff').html()?.trim() ?? '';
						} else if ($(el).is('.userstuff.module')) {
							chapter.content = $(el).children('.landmark').remove().end().html()?.trim() ?? '';
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
		throw new Error('Title and hits were not touched, is AO3 Down?');
	}

	return { work, content };
}

export async function uploadToObject(
	client: S3Client,
	path: string,
	hash: string,
	work: WorkContent,
) {
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
