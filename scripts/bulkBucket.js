import dotenv from 'dotenv'
dotenv.config()

import { S3 } from "@aws-sdk/client-s3";

const objectEndpoint = process.env.OBJECT_ENDPOINT
const objectAccessKey = process.env.OBJECT_ACC_KEY
const objectSecretKey = process.env.OBJECT_SRT_KEY
const objectName = process.env.OBJECT_NAME
const objectRegion = process.env.OBJECT_REGION

const objectClient = new S3({
    credentials: {
        accessKeyId: objectAccessKey,
        secretAccessKey: objectSecretKey
    },
    endpoint: objectEndpoint,
    region: objectRegion
})

let i = 0
const recursive = async (params) => {
    const objects = await objectClient.listObjectsV2(params)

    for (let object of objects.Contents) {
        const actObject = await objectClient.getObject({
            Bucket: objectName,
            Key: object.Key,
        })

        if (actObject.ContentEncoding != 'br') {
            await objectClient.putObject({
                Bucket: objectName,
                Key: object.Key,
                ContentEncoding: 'br',
                ContentType: 'application/json',
                Body: await actObject.Body.transformToByteArray(),
            })
        }
        console.log(`${object.Key} | ${++i}/164584`)
    }

    if (objects.IsTruncated) {
        recursive(Object.assign(params, { ContinuationToken: objects.ContinuationToken }))
    }

    return
}

recursive({
    Bucket: objectName
})
