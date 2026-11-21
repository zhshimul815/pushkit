import { corsHeaders, corsPreflight } from "@/lib/api";
import { jsonError, originMatchesDomain } from "@/lib/security";
import { getStore } from "@/lib/store";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/** POST /api/public/tag — window.PushKit.tag(key, value) segmentation updates. */
export async function POST(request: Request) {
  let body: { siteId?: string; endpoint?: string; tags?: Record<string, string> };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (!body.siteId || !body.endpoint || !body.tags) {
    return jsonError("siteId, endpoint and tags required", 400);
  }
  const store = await getStore();
  const site = await store.getSite(body.siteId);
  if (!site) return jsonError("Site not found", 404);
  if (!originMatchesDomain(request, site.domain)) {
    return jsonError("Origin does not match site domain", 403);
  }
  const sub = await store.getSubscriberByEndpoint(body.endpoint);
  if (sub && sub.site_id !== site.id) return jsonError("Subscription not found", 404);
  if (!sub) return jsonError("Subscription not found", 404);
  for (const [key, value] of Object.entries(body.tags).slice(0, 20)) {
    await store.setSubscriberTag(sub.id, key.slice(0, 64), String(value).slice(0, 128));
  }
  return Response.json(
    { ok: true },
    { headers: corsHeaders(request.headers.get("origin")) },
  );
}
