import { corsHeaders, corsPreflight } from "@/lib/api";
import { jsonError, originMatchesDomain, rateLimit, clientIp } from "@/lib/security";
import { getStore } from "@/lib/store";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/**
 * POST /api/public/visit — sdk.js visit ping (once/day per browser).
 * Refreshes last_seen_at, which powers the 180-day purge and the
 * win-back audience (subscribers not seen in N days).
 */
export async function POST(request: Request) {
  if (!rateLimit(`visit:${clientIp(request)}`, 60, 60_000)) {
    return jsonError("Rate limit exceeded", 429);
  }
  let body: { siteId?: string; endpoint?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (!body.siteId || !body.endpoint) return jsonError("siteId and endpoint required", 400);
  const store = await getStore();
  const site = await store.getSite(body.siteId);
  if (!site) return jsonError("Site not found", 404);
  if (!originMatchesDomain(request, site.domain)) {
    return jsonError("Origin does not match site domain", 403);
  }
  await store.touchSubscriberVisit(site.id, body.endpoint);
  return Response.json({ ok: true }, { headers: corsHeaders(request.headers.get("origin")) });
}
