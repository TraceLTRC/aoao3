import type { PageLoad } from "./$types";
import type { WorkContent, WorkDocument } from "../../../types";

export const load: PageLoad = async ({fetch, params}) => {
    const workDoc = await (await fetch('/api/get-doc?work=' + encodeURIComponent(params.id))).json() as WorkDocument

    const workContentRes = await fetch(process.env['PUBLIC_BUCKET_ENDPOINT'] + params.id + '/' + workDoc.contentHash.at(-1)?.[1] + '.br')

    return {
        ...workDoc,
        content: await workContentRes.json() as WorkContent
    }
}