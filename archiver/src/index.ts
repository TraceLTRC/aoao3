import { S3Client } from '@aws-sdk/client-s3';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import MeiliSearch, { MeiliSearchApiError } from 'meilisearch';
import { getWork, uploadToObject } from './helper';
import { WorkDocument } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 8080;

const jsonParser = bodyParser.json();

const MAX_ARCHIVE_REFRESH = process.env.MAX_ARCHIVE_REFRESH ?? 30 * 60 * 1000;

const objectClient = new S3Client({
	credentials: {
		accessKeyId: process.env.OBJECT_ACCESS_KEY ?? '',
		secretAccessKey: process.env.OBJECT_SECRET_KEY ?? '',
	},
	endpoint: `${process.env.OBJECT_ENDPOINT}`,
	region: process.env.OBJECT_REGION,
});

const searchClient = new MeiliSearch({
	host: `${process.env.SEARCH_ENDPOINT}`,
	apiKey: process.env.SEARCH_API_KEY,
});

app.post('/', jsonParser, async (req, res) => {
	if (req.body == null || req.body.workId == null) {
		res.status(400).end();
		console.log(req.body);
		console.log(req.body.workId);
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
				`Work ${workId} has been updated recently, ignoring... (${Math.floor(checkDur / 1000)}s)`,
			);
			res
				.status(304)
				.send(
					`Archive has been refreshed recently! Wait ${Math.floor(checkDur / 1000)} seconds...`,
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
			console.error(`ERROR: Unexpected error on work ${workId}`);
			console.error(e);
		}
	}
});

app.listen(port, () => {
	console.log(`Listening at port ${port}`);
});
