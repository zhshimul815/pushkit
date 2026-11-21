import { getEnv } from "../bindings";
import type { Store } from "../store";
import type { Campaign, PushBatchMessage, PushPayload } from "../types";
import { sendPush } from "./webpush";

/**
 * Fan-out sizing (see docs/PLAN.md, optimization O1): a free Worker
 * invocation allows 50 subrequests, and the queue consumer runs with
 * max_batch_size = 1, so one message = one invocation. 40 subscribers
 * per message keeps an invocation at 40 push fetches + 1 D1 read +
 * 1 counter write ≈ 43–46 subrequests — safely below the limit.
 * 10,000 daily queue operations ÷ 3 ops per message = 3,333 messages
 * × 40 subscribers ≈ 133,000 deliveries per day on the free tier.
 */
export const BATCH_SIZE = 40;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function payloadForCampaign(campaign: Campaign, siteIcon: string | null, subscriberId?: string): PushPayload {
  return {
    title: campaign.title,
    body: campaign.body,
    url: campaign.url,
    icon: campaign.icon_url ?? siteIcon ?? undefined,
    image: campaign.image_url ?? undefined,
    campaignId: campaign.id,
    subscriberId,
    actions: campaign.actions.length ? campaign.actions : undefined,
  };
}

/**
 * Enqueue a campaign for delivery. With a Queue binding, batches go to
 * Cloudflare Queues. Without one (local dev), delivery runs inline for
 * the first batch only and the rest stay counted as queued targets.
 */
export async function enqueueCampaign(store: Store, campaign: Campaign): Promise<number> {
  const subscriberIds = await store.findSubscribersForAudience(campaign.site_id, campaign.audience);
  await store.updateCampaign(campaign.id, {
    status: "queued",
    target_count: subscriberIds.length,
  });
  const batches = chunk(subscriberIds, BATCH_SIZE);
  const env = await getEnv();
  if (env.PUSH_QUEUE) {
    const queueMessages = batches.map((ids) => ({
      body: { campaignId: campaign.id, siteId: campaign.site_id, subscriberIds: ids } satisfies PushBatchMessage,
    }));
    for (const group of chunk(queueMessages, 100)) {
      await env.PUSH_QUEUE.sendBatch(group);
    }
  } else if (batches.length) {
    await deliverBatch(store, {
      campaignId: campaign.id,
      siteId: campaign.site_id,
      subscriberIds: batches[0],
    });
  }
  return subscriberIds.length;
}

/**
 * Queue consumer logic — also used by the standalone worker in /worker.
 * Sends one batch, updates batched counters atomically, deletes 404/410 endpoints.
 */
export async function deliverBatch(store: Store, message: PushBatchMessage): Promise<void> {
  const campaign = await store.getCampaign(message.campaignId);
  const site = await store.getSite(message.siteId);
  if (!campaign || !site) return;
  if (campaign.status === "queued") {
    await store.updateCampaign(campaign.id, { status: "sending" });
  }
  const subscribers = await store.getSubscribersByIds(message.subscriberIds);
  const env = await getEnv();
  const subject = env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  const basePayload = payloadForCampaign(campaign, site.icon_url);

  let sent = 0;
  let failed = 0;
  let gone = 0;
  let error = 0;
  const deliveredIds: string[] = [];
  for (const sub of subscribers) {
    const result = await sendPush(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { ...basePayload, subscriberId: sub.id },
      { publicKey: site.vapid_public_key, privateKey: site.vapid_private_key },
      subject,
    );
    if (result.outcome === "sent") {
      sent += 1;
      deliveredIds.push(sub.id);
    } else if (result.outcome === "gone") {
      failed += 1;
      gone += 1;
      await store.deleteSubscriber(sub.id); // 404 / 410 — endpoint is gone for good
    } else {
      failed += 1;
      error += 1;
    }
  }
  // One batched counter update per Queue message — never one row per delivery.
  await store.addCampaignCounters(campaign.id, sent, failed, gone, error);
  // Engagement bookkeeping (received counters + send pacing) in one statement.
  await store.recordDeliveryEngagement(deliveredIds);

  const fresh = await store.getCampaign(campaign.id);
  if (fresh && (fresh.sent_count + fresh.failed_count) >= fresh.target_count && fresh.target_count > 0) {
    await store.updateCampaign(campaign.id, { status: "sent", sent_at: Date.now() });
  }
}
