import type { Load } from "@sveltejs/kit";
import type { WorkDocument } from "../types";

export const load: Load = async ({ fetch }) => {
    let works;

    try {
        works = (await (await fetch('/api/search', {
            body: JSON.stringify({
                sort: ["lastChecked:desc"],
                limit: 20,
            }),
            method: "POST"
        })).json()).hits
    } catch (e) {
        console.log(e)
        works = []
    }

    const bucketStats = await (await fetch('/api/bucket-stats')).json()

    return {
        hits: works,
        bucketStats: bucketStats
    } as { hits: WorkDocument[], bucketStats: { keys:number, size: number, words: number} }
}