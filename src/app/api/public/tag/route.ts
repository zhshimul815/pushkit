import { corsHeaders, corsPreflight } from "@/lib/api";
import { jsonError, originMatchesDomain } from "@/lib/security";
import { getStore } from "@/lib/store";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/** POST /api/public/tag — window.PushKit.tag(key, value) segmentation updates. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    let body: { siteId?: string; endpoint?: string; tags?: Record<string, string> };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return jsonError("Invalid JSON", 400, headers);
    }
    if (!body.siteId || !body.endpoint || !body.tags) {
      return jsonError("siteId, endpoint and tags required", 400, headers);
    }
    const store = await getStore();
    const site = await store.getSite(body.siteId);
    if (!site) return jsonError("Site not found", 404, headers);
    if (!originMatchesDomain(request, site.domain)) {
      return jsonError("Origin does not match site domain", 403, headers);
    }
    const sub = await store.getSubscriberByEndpoint(body.endpoint);
    if (!sub || sub.site_id !== site.id) return jsonError("Subscription not found", 404, headers);
    for (const [key, value] of Object.entries(body.tags).slice(0, 20)) {
      await store.setSubscriberTag(sub.id, key.slice(0, 64), String(value).slice(0, 128));
    }
    return Response.json(
      { ok: true },
      { headers },
    );
  } catch (err: unknown) {
    const e = err as Error;
    return Response.json({ error: e.message || "Failed to update tags" }, { status: 500, headers });
  }
}
