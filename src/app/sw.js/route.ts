import { appUrl, getEnv } from "@/lib/bindings";
import { buildServiceWorker } from "@/lib/push/service-worker";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

/**
 * GET /sw.js?siteId=... — downloadable service worker for a site.
 * Site owners save this file as /sw.js at their own domain root.
 * Add ?download=1 to force a file download.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const siteId = params.get("siteId");
  if (!siteId) return jsonError("siteId required", 400);
  const store = await getStore();
  const site = await store.getSite(siteId);
  if (!site) return jsonError("Site not found", 404);
  const env = await getEnv();
  const source = buildServiceWorker(appUrl(env));
  const headers: Record<string, string> = {
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
    "Service-Worker-Allowed": "/",
  };
  if (params.get("download")) {
    headers["Content-Disposition"] = 'attachment; filename="sw.js"';
  }
  return new Response(source, { headers });
}
