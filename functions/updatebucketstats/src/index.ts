import { ListObjectsV2CommandInput, S3 } from '@aws-sdk/client-s3';
import * as ff from '@google-cloud/functions-framework';
import * as admin from 'firebase-admin';
import { MeiliSearch } from 'meilisearch';

admin.initializeApp();
const firestore = admin.firestore();

const objectClient = new S3({
	endpoint: `https://${process.env.OBJECT_ENDPOINT}`,
	credentials: {
		accessKeyId: process.env.OBJECT_ACCESS_KEY ?? '',
		secretAccessKey: process.env.OBJECT_SECRET_KEY ?? '',
	},
	region: process.env.OBJECT_REGION,
});

const searchClient = new MeiliSearch({
	host: `https://${process.env.SEARCH_ENDPOINT}`,
	apiKey: process.env.SEARCH_API_KEY,
});

async function revalidateCache(data: { size: number; keys: number; words: number }) {
	await firestore.collection('cache').doc('bucketStats').set(data, {
		merge: true,
	});
}

const getBucketStats = async (
	params: ListObjectsV2CommandInput,
	out = { size: 0 },
): Promise<{ size: number }> => {
	const res = await objectClient.listObjectsV2(params);

	if (res.Contents == undefined) {
		return out;
	}

	out.size += res.Contents.reduce((prev, curr) => {
		return prev + (curr.Size ?? 0);
	}, 0);

	if (res.IsTruncated) {
		await getBucketStats(
			Object.assign(params, { ContinuationToken: res.NextContinuationToken }),
			out,
		);
	}

	return out;
};

const getSearchStats = async () => {
	const index = searchClient.index('archives');

	const totalFics = (await index.getStats()).numberOfDocuments;

	let words = 0;

	for (let i = 0; i < totalFics; i += 25000) {
		const docs = await index.getDocuments({
			fields: ['words'],
			limit: 25000,
			offset: i,
		});

		words += docs.results.reduce((prev, curr) => {
			return prev + curr.words;
		}, 0);
	}

	return {
		words,
		totalFics,
	};
};

ff.http('UpdateBucketStats', async (_, res) => {
	try {
		const stats = await Promise.all([
			getBucketStats({
				Bucket: process.env.OBJECT_NAME,
			}),
			getSearchStats(),
		]);

		const objStats = {
			size: stats[0].size,
			keys: stats[1].totalFics,
			words: stats[1].words,
		};

		console.log(objStats);

		await revalidateCache(objStats);

		console.log('Updated cache!');
		res.sendStatus(200).end();
	} catch (e) {
		console.error(e);
		res.sendStatus(500).end();
		return;
	}
});
