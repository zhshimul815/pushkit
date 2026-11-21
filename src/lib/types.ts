export type Role = "owner" | "staff";

export interface User {
  id: string;
  email: string;
  role: Role;
  created_at: number;
  last_login_at: number | null;
}

export interface Site {
  id: string;
  name: string;
  domain: string;
  url: string;
  icon_url: string | null;
  vapid_public_key: string;
  vapid_private_key: string;
  webhook_secret: string;
  prompt_title: string;
  prompt_body: string;
  prompt_allow_label: string;
  prompt_deny_label: string;
  prompt_delay_seconds: number;
  prompt_scroll_percent: number | null;
  rss_feed_url: string | null;
  rss_auto_push: number;
  last_pushed_guid: string | null;
  created_by: string | null;
  created_at: number;
  /* Plan features (migration 0003) */
  migration_from: string | null;
  welcome_enabled: number;
  welcome_title: string | null;
  welcome_body: string | null;
  welcome_url: string | null;
  prompt_style: string; // 'banner' | 'bell' | 'bar'
  prompt_texts: string | null; // JSON {lang:{title,body,allow,deny}}
  prompt_ab_enabled: number;
  prompt_b_title: string | null;
  prompt_b_body: string | null;
  max_per_day: number;
  min_hours_between_sends: number;
  rss_etag: string | null;
  rss_last_modified: string | null;
}

/** Public site config served to sdk.js — never includes private keys or secrets. */
export interface PublicSiteConfig {
  id: string;
  name: string;
  vapidPublicKey: string;
  prompt: {
    title: string;
    body: string;
    allowLabel: string;
    denyLabel: string;
    delaySeconds: number;
    scrollPercent: number | null;
    iconUrl: string | null;
    style: string;
    texts: Record<string, { title: string; body: string; allow: string; deny: string }> | null;
    abEnabled: boolean;
    bTitle: string | null;
    bBody: string | null;
  };
  migrationFrom: string | null;
}

export interface Subscriber {
  id: string;
  site_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  country: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  page_url: string | null;
  language: string | null;
  created_at: number;
  last_seen_at: number;
  tags?: Record<string, string>;
  /* Plan features (migration 0003) */
  deliverable: number;
  source: string; // 'sdk' | 'import'
  import_source: string | null;
  last_clicked_at: number | null;
  last_sent_at: number | null;
  sent_day: string | null;
  sends_today: number;
  received_total: number;
  clicks_total: number;
  prompt_variant: string | null;
}

export interface CampaignAction {
  label: string;
  url: string;
}

export interface AudienceFilter {
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  tagKey?: string;
  tagValue?: string;
  /** Only subscribers who clicked in the last 90 days, or subscribed in the last 30. */
  engagedOnly?: boolean;
  /** Win-back: only subscribers not seen for at least this many days. */
  inactiveDays?: number;
}

export type CampaignStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "scheduled"
  | "failed";

export interface Campaign {
  id: string;
  site_id: string;
  title: string;
  body: string;
  url: string;
  icon_url: string | null;
  image_url: string | null;
  actions: CampaignAction[];
  audience: AudienceFilter;
  status: CampaignStatus;
  source: "manual" | "rss" | "webhook" | "template";
  scheduled_at: number | null;
  sent_count: number;
  failed_count: number;
  failed_gone: number;
  failed_error: number;
  click_count: number;
  target_count: number;
  created_by: string | null;
  created_at: number;
  sent_at: number | null;
}

export interface Template {
  id: string;
  site_id: string | null;
  name: string;
  title: string;
  body: string;
  url: string;
  icon_url: string | null;
  image_url: string | null;
  actions: CampaignAction[];
  created_by: string | null;
  created_at: number;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  icon?: string;
  badge?: string;
  image?: string;
  campaignId?: string;
  subscriberId?: string;
  actions?: CampaignAction[];
}

/** One Queue message: a batch of subscriber ids for one campaign. */
export interface PushBatchMessage {
  campaignId: string;
  siteId: string;
  subscriberIds: string[];
}

export interface OverviewStats {
  totalSubscribers: number;
  newToday: number;
  notificationsSent: number;
  averageCtr: number;
  series: { day: string; subscribers: number; sent: number; clicks: number }[];
  countries: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  os: { name: string; count: number }[];
  services: { name: string; count: number }[];
  promptAb: { a: number; b: number };
  ctr30: { sent: number; clicks: number };
}
