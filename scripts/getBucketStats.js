import { performance } from 'perf_hooks'

let startTime = performance.now()

import { S3 } from "@aws-sdk/client-s3";
import { MeiliSearch } from 'meilisearch'

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const objectClient = new S3({
    credentials: {
        accessKeyId: process.env.OBJECT_ACCESS_KEY,
        secretAccessKey: process.env.OBJECT_SECRET_KEY,
    },
    endpoint: `https://${process.env.OBJECT_ENDPOINT}`,
    region: process.env.OBJECT_REGION
})

const getBucketStats = async (params, out = { size: 0, keys: 0 }) => {
    const res = await objectClient.listObjectsV2(params)
    
    out.keys += res.Contents.length
    out.size += res.Contents.reduce((prev, curr) => {
        return prev + curr.Size
    }, 0)

    console.log(out)

    if (res.IsTruncated) {
        await getBucketStats(Object.assign(params, { ContinuationToken: res.NextContinuationToken }), out)
    }

    return out
}

const { size, keys } = await getBucketStats({
    Bucket: process.env.OBJECT_NAME
})

console.log({ size: formatBytes(size), keys: keys })

let stopTime = performance.now()
console.log(stopTime - startTime)
