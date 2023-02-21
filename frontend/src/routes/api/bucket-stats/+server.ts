import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const stats = await (await fetch(process.env['PUBLIC_BUCKET_STATS_ENDPOINT'] ?? "")).json() as {
        [keys: string]: string
    }

    const response = new Response(JSON.stringify(stats))
    response.headers.set("Cache-Control", "public, max-age=3600")

    return response
}