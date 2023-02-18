import { S3Client, GetObjectCommand, ChecksumMode } from '@aws-sdk/client-s3'
import * as ff from '@google-cloud/functions-framework'
import { MeiliSearch } from 'meilisearch'
import * as zlib from 'node:zlib'

type WorkChapter = {
    title: string
    summary: string
    beginningNotes: string
    endingNotes: string
    content: string
}

type WorkContent = {
    summary: string,
    beginningNotes: string,
    endingNotes: string,
    skin: string,
    chapters: WorkChapter[]
}

type Cache = {
    [key:string]: WorkContent
}

const cache: Cache = {}

const objectClient = new S3Client({
    credentials: {
        accessKeyId: process.env.OBJECT_ACCESS_KEY ?? "",
        secretAccessKey: process.env.OBJECT_SECRET_KEY ?? ""
    },
    endpoint: `https://${process.env.OBJECT_ENDPOINT}`,
    region: process.env.OBJECT_REGION,
})

const searchClient = new MeiliSearch({
    host: `https://${process.env.SEARCH_DOMAIN}`,
    apiKey: process.env.SEARCH_API_KEY,
})

async function GetAo3Archive(client: S3Client, workId: string, contentHash: string): Promise<WorkContent> {
    console.log(`Got ${workId}/${contentHash}.br`)

    const command = new GetObjectCommand({
        Bucket: "archive-bucket",
        Key: `${workId}/${contentHash}.br`,
        ChecksumMode: ChecksumMode.ENABLED,
    })

    const compressedRes = await (await (await client.send(command)).Body?.transformToByteArray())
    if (compressedRes == undefined) {
        throw new Error(`Unable to find the body of workId ${workId} with contentHash ${contentHash}`)
    }
    
    const res = JSON.parse(zlib.brotliDecompressSync(compressedRes, {
        params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        }
    }).toString())

    return res
}

ff.http('GetArchive', async (req, res) => {
    if (req.body == null || req.body.workId == null) {
        res.sendStatus(400).end()
        return
    }

    if (req.method != "GET") {
        res.sendStatus(405).end()
        return
    }

    const workId = req.body.workId as string
    let contentHash = req.body.contentHash as string | undefined

    if (workId in cache) {
        let content = cache[workId]
        
        res.send(content).end()
        return
    }

    if (contentHash === undefined) {
        try {
            const searchIndex = searchClient.index("archives")
            const doc = await searchIndex.getDocument(workId, {
                fields: ["contentHash"]
            })
    
            contentHash = doc.contentHash.at(-1) as string
        } catch (e) {
            res.sendStatus(500).end()
            console.error(e)
            return
        }
    }

    let content: WorkContent
    try {
        content = await GetAo3Archive(objectClient, workId, contentHash)
    } catch (e) {
        res.sendStatus(500).end()
        console.error(e)
        return
    }

    cache[workId] = content;
    res.send(content).end()
    return
})