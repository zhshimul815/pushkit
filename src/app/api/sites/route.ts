import { withUser } from "@/lib/api";
import { randomHex, randomId } from "@/lib/crypto-utils";
import { generateVapidKeys } from "@/lib/push/webpush";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";
import type { Site } from "@/lib/types";

export async function GET() {
  return withUser(async (user) => {
    const store = await getStore();
    const sites = await store.listSites();
    const isOwner = user.role === "owner";
    const rows = await Promise.all(
      sites.map(async (site) => {
        const row: Record<string, unknown> = {
          ...site,
          subscriberCount: await store.countSubscribers(site.id),
        };
        // Secrets are owner-only, in every response shape.
        if (!isOwner) {
          delete row.vapid_private_key;
          delete row.webhook_secret;
        }
        return row;
      }),
    );
    return Response.json({ sites: rows });
  });
}

interface CreateSiteBody {
  name?: string;
  domain?: string;
  url?: string;
  icon_url?: string;
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    let body: CreateSiteBody;
    try {
      body = (await request.json()) as CreateSiteBody;
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    if (!body.name || !body.domain) return jsonError("name and domain required", 400);
    const domain = body.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
    const vapid = await generateVapidKeys();
    const site: Site = {
      id: randomId(),
      name: body.name,
      domain,
      url: body.url ?? `https://${domain}`,
      icon_url: body.icon_url ?? null,
      vapid_public_key: vapid.publicKey,
      vapid_private_key: vapid.privateKey,
      webhook_secret: `whsec_${randomHex(24)}`,
      prompt_title: "Get updates",
      prompt_body: "Subscribe to push notifications.",
      prompt_allow_label: "Allow",
      prompt_deny_label: "Not now",
      prompt_delay_seconds: 5,
      prompt_scroll_percent: null,
      rss_feed_url: null,
      rss_auto_push: 0,
      last_pushed_guid: null,
      created_by: user.id,
      created_at: Date.now(),
      migration_from: null,
      welcome_enabled: 0,
      welcome_title: null,
      welcome_body: null,
      welcome_url: null,
      prompt_style: "banner",
      prompt_texts: null,
      prompt_ab_enabled: 0,
      prompt_b_title: null,
      prompt_b_body: null,
      max_per_day: 3,
      min_hours_between_sends: 0,
      rss_etag: null,
      rss_last_modified: null,
    };
    const store = await getStore();
    await store.createSite(site);
    return Response.json({ site }, { status: 201 });
  });
}
