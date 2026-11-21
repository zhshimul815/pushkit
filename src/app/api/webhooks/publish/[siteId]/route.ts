import { randomId } from "@/lib/crypto-utils";
import { enqueueCampaign } from "@/lib/push/fanout";
import { jsonError, verifyWebhook } from "@/lib/security";
import { getStore } from "@/lib/store";
import type { Campaign } from "@/lib/types";

type Params = { params: Promise<{ siteId: string }> };

interface GenericPayload {
  title?: string;
  body?: string;
  url?: string;
  image?: string;
  icon?: string;
}

/** Ghost `post.published` payload shape (subset). */
interface GhostPayload {
  post?: { current?: { title?: string; excerpt?: string; url?: string; feature_image?: string } };
}

/**
 * POST /api/webhooks/publish/:siteId
 * Auth: Authorization: Bearer whsec_...  OR  X-PushKit-Signature: sha256=<hmac>
 * Accepts Ghost post.published JSON or generic { title, body, url, image }.
 */
export async function POST(request: Request, { params }: Params) {
  const { siteId } = await params;
  const store = await getStore();
  const site = await store.getSite(siteId);
  if (!site) return jsonError("Site not found", 404);

  const rawBody = await request.text();
  if (!(await verifyWebhook(request, site.webhook_secret, rawBody))) {
    return jsonError("Invalid webhook signature", 401);
  }
  let parsed: GenericPayload & GhostPayload;
  try {
    parsed = JSON.parse(rawBody) as GenericPayload & GhostPayload;
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const ghost = parsed.post?.current;
  const title = ghost?.title ?? parsed.title;
  const url = ghost?.url ?? parsed.url;
  if (!title || !url) return jsonError("title and url required", 400);

  const campaign: Campaign = {
    id: randomId(),
    site_id: site.id,
    title,
    body: ghost?.excerpt ?? parsed.body ?? "New post published.",
    url,
    icon_url: parsed.icon ?? site.icon_url,
    image_url: ghost?.feature_image ?? parsed.image ?? null,
    actions: [],
    audience: {},
    status: "draft",
    source: "webhook",
    scheduled_at: null,
    sent_count: 0,
    failed_count: 0,
    failed_gone: 0,
    failed_error: 0,
    click_count: 0,
    target_count: 0,
    created_by: null,
    created_at: Date.now(),
    sent_at: null,
  };
  await store.createCampaign(campaign);
  const targets = await enqueueCampaign(store, campaign);
  return Response.json({ ok: true, campaignId: campaign.id, targets }, { status: 201 });
}
