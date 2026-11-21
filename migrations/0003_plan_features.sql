-- PushKit — plan features (docs/PLAN.md): migration/import, engagement
-- protection, welcome push, prompt styles + i18n + A/B, frequency caps,
-- campaign daily rollup, failure split, RSS conditional GET.

-- Sites: migration source, welcome notification, prompt style / per-language
-- texts / A-B variant, send pacing, RSS validators.
ALTER TABLE sites ADD COLUMN migration_from TEXT;               -- 'onesignal' | 'pushengage' | 'larapush' | null
ALTER TABLE sites ADD COLUMN welcome_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sites ADD COLUMN welcome_title TEXT;
ALTER TABLE sites ADD COLUMN welcome_body TEXT;
ALTER TABLE sites ADD COLUMN welcome_url TEXT;
ALTER TABLE sites ADD COLUMN prompt_style TEXT NOT NULL DEFAULT 'banner';  -- 'banner' | 'bell' | 'bar'
ALTER TABLE sites ADD COLUMN prompt_texts TEXT;                 -- JSON: {bn:{title,body,allow,deny},hi:{...},es:{...},pt:{...}}
ALTER TABLE sites ADD COLUMN prompt_ab_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sites ADD COLUMN prompt_b_title TEXT;
ALTER TABLE sites ADD COLUMN prompt_b_body TEXT;
ALTER TABLE sites ADD COLUMN max_per_day INTEGER NOT NULL DEFAULT 3;       -- per-subscriber daily send cap (0 = off)
ALTER TABLE sites ADD COLUMN min_hours_between_sends INTEGER NOT NULL DEFAULT 0; -- 0 = off
ALTER TABLE sites ADD COLUMN rss_etag TEXT;
ALTER TABLE sites ADD COLUMN rss_last_modified TEXT;

-- Subscribers: deliverability (imported rows are not sendable until the
-- browser re-subscribes under this site's VAPID key), origin, engagement.
ALTER TABLE subscribers ADD COLUMN deliverable INTEGER NOT NULL DEFAULT 1;
ALTER TABLE subscribers ADD COLUMN source TEXT NOT NULL DEFAULT 'sdk';     -- 'sdk' | 'import'
ALTER TABLE subscribers ADD COLUMN import_source TEXT;                      -- 'onesignal' | 'pushengage' | 'generic'
ALTER TABLE subscribers ADD COLUMN last_clicked_at INTEGER;
ALTER TABLE subscribers ADD COLUMN last_sent_at INTEGER;
ALTER TABLE subscribers ADD COLUMN sent_day TEXT;                           -- YYYY-MM-DD of last send
ALTER TABLE subscribers ADD COLUMN sends_today INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN received_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN clicks_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN prompt_variant TEXT;                     -- 'a' | 'b' | null
CREATE INDEX idx_subscribers_site_deliverable ON subscribers(site_id, deliverable);
CREATE INDEX idx_subscribers_site_seen ON subscribers(site_id, last_seen_at);

-- Campaigns: failure split (gone endpoints vs other errors).
ALTER TABLE campaigns ADD COLUMN failed_gone INTEGER NOT NULL DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN failed_error INTEGER NOT NULL DEFAULT 0;

-- Per-campaign daily click rollup for the campaign statistics page.
CREATE TABLE campaign_daily (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,                  -- YYYY-MM-DD (UTC)
  clicks      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (campaign_id, day)
);

-- Daily stats: prompt A/B opt-in counts.
ALTER TABLE daily_stats ADD COLUMN subs_a INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_stats ADD COLUMN subs_b INTEGER NOT NULL DEFAULT 0;
