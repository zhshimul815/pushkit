import { corsHeaders, corsPreflight } from "@/lib/api";
import { randomId } from "@/lib/crypto-utils";
import { isAllowedPushEndpoint } from "@/lib/push/webpush";
import { clientIp, jsonError, originMatchesDomain, rateLimit } from "@/lib/security";
import { getStore } from "@/lib/store";
import { parseUserAgent } from "@/lib/ua";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

interface SubscribeBody {
  siteId?: string;
  subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  pageUrl?: string;
  language?: string;
  tags?: Record<string, string>;
  variant?: string;
}

/**
 * POST /api/public/subscribe
 * Hardening: Origin must match the site's registered domain, endpoint must
 * be a known push service host, per-IP rate limit applies.
 */
export async function POST(request: Request) {
  if (!rateLimit(`subscribe:${clientIp(request)}`, 30, 60_000)) {
    return jsonError("Rate limit exceeded", 429);
  }
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const { siteId, subscription } = body;
  if (!siteId || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return jsonError("siteId and subscription {endpoint, keys.p256dh, keys.auth} required", 400);
  }
  if (!isAllowedPushEndpoint(subscription.endpoint)) {
    return jsonError("Endpoint host not allowed", 400);
  }
  const store = await getStore();
  const site = await store.getSite(siteId);
  if (!site) return jsonError("Site not found", 404);
  if (!originMatchesDomain(request, site.domain)) {
    return jsonError("Origin does not match site domain", 403);
  }

  const ua = parseUserAgent(request.headers.get("user-agent") ?? "");
  const cf = (request as unknown as { cf?: { country?: string } }).cf;
  const now = Date.now();
  const isNew = !(await store.getSubscriberByEndpoint(subscription.endpoint));
  const subscriberId = randomId();
  await store.upsertSubscriber(
    {
      id: subscriberId,
      site_id: site.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      country: cf?.country ?? request.headers.get("cf-ipcountry") ?? null,
      browser: ua.browser,
      os: ua.os,
      device: ua.device,
      page_url: body.pageUrl ?? null,
      language: body.language ?? null,
      created_at: now,
      last_seen_at: now,
      deliverable: 1,
      source: "sdk",
      import_source: null,
      last_clicked_at: null,
      last_sent_at: null,
      sent_day: null,
      sends_today: 0,
      received_total: 0,
      clicks_total: 0,
      prompt_variant: body.variant === "a" || body.variant === "b" ? body.variant : null,
    },
    body.tags ?? {},
  );

  // Welcome notification (G5): one direct send for brand-new subscribers only.
  if (isNew && site.welcome_enabled === 1 && site.welcome_title) {
    try {
      const { sendPush } = await import("@/lib/push/webpush");
      const { getEnv } = await import("@/lib/bindings");
      const env = await getEnv();
      await sendPush(
        { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
        {
          title: site.welcome_title,
          body: site.welcome_body ?? "",
          url: site.welcome_url ?? site.url,
          icon: site.icon_url ?? undefined,
        },
        { publicKey: site.vapid_public_key, privateKey: site.vapid_private_key },
        env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      );
    } catch {
      // Welcome delivery is best-effort; the subscription itself succeeded.
    }
  }
  return Response.json(
    { ok: true },
    { headers: corsHeaders(request.headers.get("origin")) },
  );
}
