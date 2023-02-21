import { PUBLIC_BUCKET_STATS_ENDPOINT } from "$env/static/public";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const stats = await (await fetch(PUBLIC_BUCKET_STATS_ENDPOINT ?? "")).json() as {
        [keys: string]: string
    }

    const response = new Response(JSON.stringify(stats))
    response.headers.set("Cache-Control", "public, max-age=3600")

    return response
}