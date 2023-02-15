import { S3, ListObjectsV2CommandInput } from '@aws-sdk/client-s3'
import { MeiliSearch } from 'meilisearch'
import * as ff from '@google-cloud/functions-framework'
import * as admin from 'firebase-admin'

admin.initializeApp()
const firestore = admin.firestore()

const objectClient = new S3({
    endpoint: `https://${process.env.OBJECT_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.OBJECT_ACCESS_KEY ?? "",
        secretAccessKey: process.env.OBJECT_SECRET_KEY ?? ""
    },
    region: process.env.OBJECT_REGION,
})

const searchClient = new MeiliSearch({
    host: `https://${process.env.SEARCH_ENDPOINT}`,
    apiKey: process.env.SEARCH_API_KEY
})

async function revalidateCache(data: {size: number, keys: number, words: number}) {
    await firestore.collection('cache').doc('bucketStats').set(data)
}

const getBucketStats = async (params: ListObjectsV2CommandInput, out = { size: 0, keys: 0 }): Promise<{ size: number, keys: number }> => {
    const res = await objectClient.listObjectsV2(params)

    if (res.Contents == undefined) {
        return out
    }
    
    out.keys += res.Contents.length
    out.size += res.Contents.reduce((prev, curr) => {
        return prev + (curr.Size ?? 0)
    }, 0)

    if (res.IsTruncated) {
        await getBucketStats(Object.assign(params, { ContinuationToken: res.NextContinuationToken }), out)
    }

    return out
}

const getSearchStats = async () => {
    const index = await searchClient.getIndex('archives')

    const totalFics = (await index.getStats()).numberOfDocuments

    let words = 0;

    for (let i = 0; i < totalFics; i += 1000) {
        const docs = await index.getDocuments({
            fields: ['words'],
            limit: 1000,
            offset: i
        })

        words += docs.results.reduce((prev, curr) => {
            return prev + curr.words
        }, 0)
    }

    return {
        words
    }
}

ff.http('UpdateBucketStats', async (_, res) => {
    try {
        const stats = await Promise.all([getBucketStats({
            Bucket: process.env.OBJECT_NAME,
        }), getSearchStats()])

        await revalidateCache({
            keys: stats[0].keys,
            size: stats[0].size,
            words: stats[1].words,
        })

        console.log("Updated cache!")
        res.sendStatus(200).end()
    } catch (e) {
        console.error("Failed to update cache!")
        res.sendStatus(500).end()
        return
    }
})