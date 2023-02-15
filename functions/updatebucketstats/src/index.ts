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

ff.http('updateBucketStats', async (req, res) => {
    try {
        await revalidateCache(await getBucketStats({
            Bucket: process.env.OBJECT_NAME
        }))
        console.log("Updated cache!")
        res.sendStatus(200).end()
    } catch (e) {
        console.error("Failed to update cache!")
        res.sendStatus(500).end()
        return
    }
})