import { withUser } from "@/lib/api";
import { fetchUrlMetadata } from "@/lib/metadata";
import { jsonError } from "@/lib/security";

/** POST /api/campaigns/fetch-metadata { url } — og:title / og:description / og:image. */
export async function POST(request: Request) {
  return withUser(async () => {
    let body: { url?: string };
    try {
      body = (await request.json()) as { url?: string };
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    if (!body.url) return jsonError("url required", 400);
    try {
      const metadata = await fetchUrlMetadata(body.url);
      return Response.json({ metadata });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Fetch failed", 422);
    }
  });
}
