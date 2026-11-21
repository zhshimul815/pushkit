import { withOwner, withUser } from "@/lib/api";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";
import type { Site } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async (user) => {
    const store = await getStore();
    const site = await store.getSite(id);
    if (!site) return jsonError("Site not found", 404);
    const isOwner = user.role === "owner";
    const shaped: Record<string, unknown> = {
      ...site,
      subscriberCount: await store.countSubscribers(site.id),
    };
    // Secrets are owner-only, in every response shape.
    if (!isOwner) {
      delete shaped.vapid_private_key;
      delete shaped.webhook_secret;
    }
    return Response.json({ site: shaped });
  });
}

const EDITABLE: (keyof Site)[] = [
  "name", "domain", "url", "icon_url",
  "prompt_title", "prompt_body", "prompt_allow_label", "prompt_deny_label",
  "prompt_delay_seconds", "prompt_scroll_percent",
  "rss_feed_url", "rss_auto_push",
  "migration_from", "welcome_enabled", "welcome_title", "welcome_body", "welcome_url",
  "prompt_style", "prompt_texts", "prompt_ab_enabled", "prompt_b_title", "prompt_b_body",
  "max_per_day", "min_hours_between_sends",
];
const INT_FIELDS = new Set(["rss_auto_push", "welcome_enabled", "prompt_ab_enabled"]);

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async () => {
    let body: Partial<Site>;
    try {
      body = (await request.json()) as Partial<Site>;
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    const patch: Partial<Site> = {};
    for (const key of EDITABLE) {
      if (key in body) {
        const value = body[key];
        (patch as Record<string, unknown>)[key] =
          INT_FIELDS.has(key) ? (value ? 1 : 0) : value;
      }
    }
    const store = await getStore();
    if (!(await store.getSite(id))) return jsonError("Site not found", 404);
    await store.updateSite(id, patch);
    return Response.json({ site: await store.getSite(id) });
  });
}

/** Delete a site — owner only. Cascades to subscribers and campaigns. */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withOwner(async () => {
    const store = await getStore();
    if (!(await store.getSite(id))) return jsonError("Site not found", 404);
    await store.deleteSite(id);
    return Response.json({ ok: true });
  });
}
