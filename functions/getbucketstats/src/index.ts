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

// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

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
    let data: { keys: number, size: string};
    const doc = await firestore.collection("cache").doc('bucketStats').get()

    if (doc.exists) {
        data = doc.get('value')
        
        const ttl = doc.get('ttl')
        const isUpdating = doc.get('isUpdating')
        if (ttl < Date.now() && !isUpdating) {
            console.log("Cache is stale, updating!")
            await firestore.collection('cache').doc('bucketStats').set({
                isUpdating: true
            }, {
                merge: true,
            })
            getBucketStats({
                Bucket: process.env.OBJECT_NAME
            }).then((val) => {
                revalidateCache(val)
            })
        }
    } else {
        const { keys, size } = await getBucketStats({
            Bucket: process.env.OBJECT_NAME
        })

        revalidateCache({ keys, size })

        const formattedSize = formatBytes(size)

        data = {
            keys: keys,
            size: formattedSize
        }
    }

    res.send(data).end()
})