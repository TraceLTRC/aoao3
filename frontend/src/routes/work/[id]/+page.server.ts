import { BUCKET_ACCESS_KEY, BUCKET_ENDPOINT, BUCKET_NAME, BUCKET_REGION, BUCKET_SECRET_KEY } from "$env/static/private";
import { PUBLIC_SEARCH_BEARER, PUBLIC_SEARCH_ENDPOINT } from "$env/static/public";
import { S3 } from '@aws-sdk/client-s3'
import { error } from "@sveltejs/kit";
import * as zlib from 'node:zlib'
import type { PageServerLoad } from "../$types";
import type { WorkContent, WorkDocument } from "../../../types";

const objectClient = new S3({
    endpoint: BUCKET_ENDPOINT,
    region: BUCKET_REGION,
    credentials: {
        accessKeyId: BUCKET_ACCESS_KEY,
        secretAccessKey: BUCKET_SECRET_KEY
    }
})

export const load: PageServerLoad = async ({ params }: { params: any}) => {
    const workDoc = await (await fetch(
        PUBLIC_SEARCH_ENDPOINT + "/indexes/archives/documents/" + params.id,
        {
            credentials: "include",
            headers: {
                'Authorization': 'Bearer ' + PUBLIC_SEARCH_BEARER,
                'content-type': 'application/json'
            },
        }
    )).json() as WorkDocument

    const uncompressedContent = await (await objectClient.getObject({
        Bucket: BUCKET_NAME,
        Key: `${workDoc.id}/${workDoc.contentHash.at(-1)?.[1]}.br`
    })).Body?.transformToByteArray()

    if (uncompressedContent === undefined) throw error(500, "Content not found in server! Please contact administrator as this should not happen!");
    
    const workContent = JSON.parse(zlib.brotliDecompressSync(uncompressedContent).toString()) as WorkContent

    return {
        ...workDoc,
        content: workContent
    }
}