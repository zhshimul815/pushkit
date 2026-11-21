import { randomId } from "./crypto-utils";
import { enqueueCampaign } from "./push/fanout";
import { fetchFeed } from "./rss";
import type { Store } from "./store";
import type { Campaign } from "./types";

/**
 * Cron jobs (wrangler.toml triggers):
 * - every 5 minutes: due scheduled campaigns + RSS auto-push polling
 * - daily 03:00 UTC: purge stale subscribers (endpoint 404/410 cleanup
 *   also happens inline at send time in deliverBatch)
 */

export async function runScheduledCampaigns(store: Store): Promise<number> {
  const due = await store.listDueScheduled(Date.now());
  for (const campaign of due) {
    await enqueueCampaign(store, campaign);
  }
  return due.length;
}

export async function pollRssFeeds(store: Store): Promise<number> {
  const sites = await store.listSites();
  let created = 0;
  for (const site of sites) {
    if (!site.rss_auto_push || !site.rss_feed_url) continue;
    try {
      const feed = await fetchFeed(site.rss_feed_url, { etag: site.rss_etag, lastModified: site.rss_last_modified });
      if (feed.etag !== site.rss_etag || feed.lastModified !== site.rss_last_modified) {
        await store.updateSite(site.id, { rss_etag: feed.etag, rss_last_modified: feed.lastModified });
      }
      if (feed.notModified) continue;
      const items = feed.items;
      if (!items.length) continue;
      const latest = items[0];
      if (site.last_pushed_guid === latest.guid) continue;
      // First poll only records the cursor — never blast the backlog.
      if (!site.last_pushed_guid) {
        await store.updateSite(site.id, { last_pushed_guid: latest.guid });
        continue;
      }
      const campaign: Campaign = {
        id: randomId(),
        site_id: site.id,
        title: latest.title || site.name,
        body: latest.description || "New post published.",
        url: latest.link || site.url,
        icon_url: site.icon_url,
        image_url: null,
        actions: [],
        audience: {},
        status: "draft",
        source: "rss",
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
      await enqueueCampaign(store, campaign);
      await store.updateSite(site.id, { last_pushed_guid: latest.guid });
      created += 1;
    } catch {
      // A failing feed must not block other sites or the scheduled-campaign job.
      continue;
    }
  }
  return created;
}

export async function runCron(store: Store, cronExpression: string): Promise<{ scheduled: number; rss: number; purged: number }> {
  if (cronExpression === "0 3 * * *") {
    const [purged, scheduled, rss] = await Promise.all([
      store.purgeExpiredSubscribers(180 * 24 * 60 * 60 * 1000),
      runScheduledCampaigns(store),
      pollRssFeeds(store),
    ]);
    return { scheduled, rss, purged };
  }
  const [scheduled, rss] = await Promise.all([
    runScheduledCampaigns(store),
    pollRssFeeds(store),
  ]);
  return { scheduled, rss, purged: 0 };
}
