import { MeiliSearch } from 'meilisearch';

const searchEndpoint = process.env.SEARCH_ENDPOINT
const searchBearer = process.env.SEARCH_BEARER

const search = await new MeiliSearch({
    host: searchEndpoint,
    apiKey: searchBearer
}).index('archives')

const maxDocs = (await search.getStats()).numberOfDocuments

for (let i; i < maxDocs; i += 10000) {
    const updateDoc = []

    const docsToUpdate = await search.getDocuments({
        fields: ['id', 'authors'],
        limit: 10000,
        offset: i,
    })

    for (const doc of docsToUpdate.results) {
        if (doc.authors.length != 0) continue;

        updateDoc.push({
            id: doc.id,
            authors: ['Anonymous']
        })
    }

    await search.updateDocuments(updateDoc)
}