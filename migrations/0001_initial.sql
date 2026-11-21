-- PushKit — initial D1 schema
-- Design rule: no per-delivery rows. Campaign delivery is tracked with
-- atomic batched counters on `campaigns` (sent_count / failed_count / click_count).

PRAGMA foreign_keys = ON;

-- Staff users. role: 'owner' | 'staff'. No public sign-up exists.
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  created_at  INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Sessions. token_hash = SHA-256(raw cookie token). Sliding expiration.
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  user_agent  TEXT,
  ip          TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- One-time auth tokens. type: 'otp' | 'magic' | 'invite'
-- code_hash stores SHA-256 of the OTP code or magic/invite token.
CREATE TABLE auth_tokens (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('otp', 'magic', 'invite')),
  code_hash   TEXT NOT NULL,
  role        TEXT CHECK (role IN ('owner', 'staff')),
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  used_at     INTEGER
);
CREATE INDEX idx_auth_tokens_email_type ON auth_tokens(email, type);
CREATE INDEX idx_auth_tokens_hash ON auth_tokens(code_hash);

-- Sites (domains). One VAPID key pair per site.
CREATE TABLE sites (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  domain          TEXT NOT NULL,              -- e.g. example.com (no scheme)
  url             TEXT NOT NULL,              -- e.g. https://example.com
  icon_url        TEXT,
  vapid_public_key  TEXT NOT NULL,
  vapid_private_key TEXT NOT NULL,            -- JWK `d` value, server-only
  webhook_secret  TEXT NOT NULL,              -- whsec_...
  prompt_title    TEXT NOT NULL DEFAULT 'Get updates',
  prompt_body     TEXT NOT NULL DEFAULT 'Subscribe to push notifications.',
  prompt_allow_label TEXT NOT NULL DEFAULT 'Allow',
  prompt_deny_label  TEXT NOT NULL DEFAULT 'Not now',
  prompt_delay_seconds INTEGER NOT NULL DEFAULT 5,
  prompt_scroll_percent INTEGER,              -- null = time delay trigger
  rss_feed_url    TEXT,
  rss_auto_push   INTEGER NOT NULL DEFAULT 0, -- 0/1
  last_pushed_guid TEXT,
  created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_sites_domain ON sites(domain);

-- Subscribers. endpoint is unique per browser profile.
CREATE TABLE subscribers (
  id          TEXT PRIMARY KEY,
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  country     TEXT,                           -- request.cf.country at subscribe time
  browser     TEXT,
  os          TEXT,
  device      TEXT,                           -- 'mobile' | 'desktop' | 'tablet'
  page_url    TEXT,                           -- page where the subscription happened
  language    TEXT,
  created_at  INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX idx_subscribers_site ON subscribers(site_id);
CREATE INDEX idx_subscribers_site_country ON subscribers(site_id, country);
CREATE INDEX idx_subscribers_created ON subscribers(created_at);

-- Custom segmentation tags: window.PushKit.tag(key, value)
CREATE TABLE subscriber_tags (
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  PRIMARY KEY (subscriber_id, key)
);
CREATE INDEX idx_tags_key_value ON subscriber_tags(key, value);

-- Campaigns. status: 'draft' | 'queued' | 'sending' | 'sent' | 'scheduled' | 'failed'
-- source: 'manual' | 'rss' | 'webhook' | 'template'
CREATE TABLE campaigns (
  id          TEXT PRIMARY KEY,
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon_url    TEXT,
  image_url   TEXT,
  actions     TEXT,                           -- JSON: [{label, url}] max 2
  audience    TEXT NOT NULL DEFAULT '{}',     -- JSON filter: {country, device, browser, tagKey, tagValue}
  status      TEXT NOT NULL DEFAULT 'draft',
  source      TEXT NOT NULL DEFAULT 'manual',
  scheduled_at INTEGER,
  sent_count  INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  target_count INTEGER NOT NULL DEFAULT 0,
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL,
  sent_at     INTEGER
);
CREATE INDEX idx_campaigns_site ON campaigns(site_id);
CREATE INDEX idx_campaigns_status_scheduled ON campaigns(status, scheduled_at);

-- Reusable templates.
CREATE TABLE templates (
  id          TEXT PRIMARY KEY,
  site_id     TEXT REFERENCES sites(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon_url    TEXT,
  image_url   TEXT,
  actions     TEXT,
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL
);

-- Daily aggregate counters for the overview chart (one row per site per day).
CREATE TABLE daily_stats (
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,                  -- YYYY-MM-DD (UTC)
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  sent        INTEGER NOT NULL DEFAULT 0,
  clicks      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, day)
);

-- Click telemetry target: notificationclick in sw.js posts campaign id only.
-- Clicks increment campaigns.click_count + daily_stats.clicks. No per-click rows.
