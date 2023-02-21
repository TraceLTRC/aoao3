import type { PageLoad } from "./$types";
import type { WorkContent, WorkDocument } from "../../../types";

export const load: PageLoad = async ({fetch, params}) => {
    const workDoc = await (await fetch('/api/get-doc?work=' + encodeURIComponent(params.id))).json() as WorkDocument

    const workContentRes = await fetch('https://pub-a3842e551d9f42ccb31e6b6f3606ecae.r2.dev/' + params.id + '/' + workDoc.contentHash.at(-1)?.[1] + '.br')

    return {
        ...workDoc,
        content: await workContentRes.json() as WorkContent
    }
}