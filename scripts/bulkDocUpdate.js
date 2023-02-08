import { MeiliSearch } from 'meilisearch'
import inquirer from 'inquirer';
import { readFile } from 'fs/promises'
import { ListObjectsV2Command, S3 } from '@aws-sdk/client-s3';

const searchEndpoint = process.env.SEARCH_ENDPOINT
const searchBearer = process.env.SEARCH_BEARER

const objectEndpoint = process.env.OBJECT_ENDPOINT
const objectAccessKey = process.env.OBJECT_ACC_KEY
const objectSecretKey = process.env.OBJECT_SRT_KEY
const objectName = process.env.OBJECT_NAME
const objectRegion = process.env.OBJECT_REGION

let works;

await inquirer.prompt([
    {
        name: "file",
        message: "File location for work Ids to update",
        type: "input",
        default: "./workIds.json"
    }
]).then(async (answers) => {
    works = JSON.parse(
        await readFile(
            answers.file
        )
    )
})

const search = await new MeiliSearch({
    host: searchEndpoint,
    apiKey: searchBearer
}).getIndex('archives')

const object = new S3({
    endpoint: `https://${objectEndpoint}`,
    credentials: {
        accessKeyId: objectAccessKey,
        secretAccessKey: objectSecretKey,
    },
    region: objectRegion
})

const doc = [];

for (let work of works.hits) {
    try {
        const command = new ListObjectsV2Command({
            Bucket: objectName,
            Prefix: `${work.id}/`
        })

        const res = await object.send(command)
        const newDoc = {
            id: work.id,
            contentHash: []
        }
        for (let content of res.Contents) {
            let contentHash = content.ETag.substring(1, content.ETag.length - 1)
            newDoc.contentHash.push(contentHash)
        }

        doc.push(newDoc)
    } catch (e) {
        console.error(e)
        break;
    }
}

console.log(doc)