import { S3, ListObjectsV2CommandInput } from '@aws-sdk/client-s3'
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

async function revalidateCache(data: {size: number, keys: number}) {
    await firestore.collection('cache').doc('bucketStats').set({
        value: data,
        ttl: Date.now() + (24 * 60 * 60 * 1000),
        isUpdating: false
    })
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

ff.http('GetBucketStats', async (_, res) => {
    let data: { keys: number, size: number};
    const doc = await firestore.collection("cache").doc('bucketStats').get()

    if (doc.exists) {
        const ttl = doc.get('ttl')
        if (ttl < Date.now()) {
            console.log("Cache is stale, updating!")
            
            data = await getBucketStats({
                Bucket: process.env.OBJECT_NAME
            })
            await revalidateCache(data)
        } else {
            data = doc.get('value')
        }
    } else {
        data = await getBucketStats({
            Bucket: process.env.OBJECT_NAME
        })

        revalidateCache(Object.assign({}, data))
    }

    res.send(data).end()
})