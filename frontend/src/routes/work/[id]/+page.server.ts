import { PUBLIC_SEARCH_BEARER, PUBLIC_SEARCH_ENDPOINT } from "$env/static/public";
import type { PageServerLoad } from "../$types";
import type { WorkDocument } from "../../../types";

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

    return workDoc
}