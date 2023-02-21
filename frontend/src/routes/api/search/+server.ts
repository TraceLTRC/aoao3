import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    let reqBody;
    try {
    reqBody = await request.json()
    } catch (e) {
        throw error(400, "Invalid JSON request!")
    }

    const searchRes = await fetch(process.env['PUBLIC_SEARCH_ENDPOINT'] + "/indexes/archives/search", {
        method: "POST",
        body: JSON.stringify({
            q: reqBody.q,
            sort: reqBody.sort,
            filter: reqBody.filer,
            hitsPerPage: reqBody.hitsPerPage,
            page: reqBody.page,
            limit: reqBody.limit,
            offset: reqBody.offset,
        }),
        credentials: "include",
        headers: {
            'Authorization': 'Bearer ' + process.env['PUBLIC_SEARCH_BEARER'],
            'content-type': 'application/json'
        },
    })

    return json(await searchRes.json())
}