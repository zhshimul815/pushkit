import { corsHeaders, corsPreflight } from "@/lib/api";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";
import type { PublicSiteConfig } from "@/lib/types";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/** Public per-site config for sdk.js. Contains the VAPID public key only. */
export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const siteId = new URL(request.url).searchParams.get("siteId");
    if (!siteId) return jsonError("siteId required", 400, headers);
    const store = await getStore();
    const site = await store.getSite(siteId);
    if (!site) return jsonError("Site not found", 404, headers);
    let texts: PublicSiteConfig["prompt"]["texts"] = null;
    if (site.prompt_texts) {
      try { texts = JSON.parse(site.prompt_texts) as PublicSiteConfig["prompt"]["texts"]; } catch { texts = null; }
    }
    const config: PublicSiteConfig = {
      id: site.id,
      name: site.name,
      vapidPublicKey: site.vapid_public_key,
      prompt: {
        title: site.prompt_title,
        body: site.prompt_body,
        allowLabel: site.prompt_allow_label,
        denyLabel: site.prompt_deny_label,
        delaySeconds: site.prompt_delay_seconds,
        scrollPercent: site.prompt_scroll_percent,
        iconUrl: site.icon_url,
        style: site.prompt_style || "banner",
        texts,
        abEnabled: site.prompt_ab_enabled === 1,
        bTitle: site.prompt_b_title,
        bBody: site.prompt_b_body,
      },
      migrationFrom: site.migration_from,
    };
    return Response.json(config, {
      headers: {
        ...headers,
        // Optimization O4: repeat page views are served from the CDN cache.
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (err: unknown) {
    const e = err as Error;
    return Response.json({ error: e.message || "Failed to load config" }, { status: 500, headers });
  }
}
