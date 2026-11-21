/**
 * Data layer. Two implementations behind one interface:
 * - D1Store: Cloudflare D1 (production). Batched counters only — no per-delivery rows.
 * - MemoryStore: in-memory demo data (local dev without Wrangler). Data resets on restart.
 */
import type { D1DatabaseLike } from "./bindings";
import { getEnv } from "./bindings";
import { randomId } from "./crypto-utils";
import type {
  AudienceFilter,
  Campaign,
  CampaignAction,
  OverviewStats,
  Site,
  Subscriber,
  Template,
  User,
} from "./types";

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: number;
  expires_at: number;
  last_seen_at: number;
}

export interface AuthTokenRow {
  id: string;
  email: string;
  type: "otp" | "magic" | "invite";
  code_hash: string;
  role: "owner" | "staff" | null;
  created_by: string | null;
  attempts: number;
  created_at: number;
  expires_at: number;
  used_at: number | null;
}

export interface Store {
  // users
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(email: string, role: User["role"]): Promise<User>;
  listUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;
  touchUserLogin(id: string): Promise<void>;
  // sessions
  createSession(s: Omit<SessionRow, "id">): Promise<SessionRow>;
  getSession(tokenHash: string): Promise<(SessionRow & { user: User }) | null>;
  touchSession(id: string, expiresAt: number): Promise<void>;
  deleteSession(id: string): Promise<void>;
  listSessions(): Promise<(SessionRow & { email: string })[]>;
  // auth tokens
  createAuthToken(t: Omit<AuthTokenRow, "id" | "attempts" | "used_at">): Promise<void>;
  getAuthToken(email: string, type: AuthTokenRow["type"], codeHash: string): Promise<AuthTokenRow | null>;
  getAuthTokenByHash(codeHash: string): Promise<AuthTokenRow | null>;
  getLatestAuthToken(email: string, type: AuthTokenRow["type"]): Promise<AuthTokenRow | null>;
  incrementTokenAttempts(id: string): Promise<void>;
  markTokenUsed(id: string): Promise<void>;
  invalidateTokens(email: string, type: AuthTokenRow["type"]): Promise<void>;
  // sites
  createSite(s: Site): Promise<Site>;
  getSite(id: string): Promise<Site | null>;
  listSites(): Promise<Site[]>;
  updateSite(id: string, patch: Partial<Site>): Promise<void>;
  deleteSite(id: string): Promise<void>;
  // subscribers
  upsertSubscriber(s: Subscriber, tags: Record<string, string>): Promise<void>;
  getSubscriber(id: string): Promise<Subscriber | null>;
  getSubscriberByEndpoint(endpoint: string): Promise<Subscriber | null>;
  getSubscribersByIds(ids: string[]): Promise<Subscriber[]>;
  listSubscribers(opts: {
    siteId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rows: Subscriber[]; total: number }>;
  findSubscribersForAudience(siteId: string, audience: AudienceFilter): Promise<string[]>;
  deleteSubscriber(id: string): Promise<void>;
  setSubscriberTag(subscriberId: string, key: string, value: string): Promise<void>;
  countSubscribers(siteId?: string): Promise<number>;
  // campaigns
  createCampaign(c: Campaign): Promise<Campaign>;
  getCampaign(id: string): Promise<Campaign | null>;
  listCampaigns(opts?: { siteId?: string; limit?: number }): Promise<Campaign[]>;
  updateCampaign(id: string, patch: Partial<Campaign>): Promise<void>;
  addCampaignCounters(id: string, sent: number, failed: number, gone?: number, error?: number): Promise<void>;
  incrementCampaignClick(id: string, subscriberId?: string): Promise<Campaign | null>;
  recordDeliveryEngagement(ids: string[]): Promise<void>;
  importSubscribers(siteId: string, rows: { endpoint: string; p256dh: string; auth: string }[], importSource: string): Promise<{ inserted: number; skipped: number }>;
  touchSubscriberVisit(siteId: string, endpoint: string): Promise<void>;
  campaignDailyClicks(campaignId: string): Promise<{ day: string; clicks: number }[]>;
  siteHealth(): Promise<{ siteId: string; sent30: number; clicks30: number }[]>;
  exportAll(): Promise<{ sites: Site[]; subscribers: Subscriber[]; campaigns: Campaign[]; templates: Template[] }>;
  listDueScheduled(now: number): Promise<Campaign[]>;
  // templates
  createTemplate(t: Template): Promise<Template>;
  listTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | null>;
  deleteTemplate(id: string): Promise<void>;
  // stats
  bumpDaily(siteId: string, patch: { newSubscribers?: number; sent?: number; clicks?: number; subsA?: number; subsB?: number }): Promise<void>;
  purgeExpiredSubscribers(olderThanMs: number): Promise<number>;
  // settings (key-value; secrets stored encrypted by the caller)
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  deleteSetting(key: string): Promise<void>;
  overview(): Promise<OverviewStats>;
  exportSubscribersCsv(siteId?: string): Promise<string>;
}

/* ---------------- row mapping ---------------- */

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? null : String(v));
const num = (v: unknown) => (v == null ? 0 : Number(v));

function mapCampaign(r: Row): Campaign {
  return {
    id: String(r.id),
    site_id: String(r.site_id),
    title: String(r.title),
    body: String(r.body),
    url: String(r.url),
    icon_url: str(r.icon_url),
    image_url: str(r.image_url),
    actions: r.actions ? (JSON.parse(String(r.actions)) as CampaignAction[]) : [],
    audience: r.audience ? (JSON.parse(String(r.audience)) as AudienceFilter) : {},
    status: String(r.status) as Campaign["status"],
    source: (String(r.source ?? "manual") as Campaign["source"]) || "manual",
    scheduled_at: r.scheduled_at == null ? null : num(r.scheduled_at),
    sent_count: num(r.sent_count),
    failed_count: num(r.failed_count),
    failed_gone: num(r.failed_gone),
    failed_error: num(r.failed_error),
    click_count: num(r.click_count),
    target_count: num(r.target_count),
    created_by: str(r.created_by),
    created_at: num(r.created_at),
    sent_at: r.sent_at == null ? null : num(r.sent_at),
  };
}

function mapTemplate(r: Row): Template {
  return {
    id: String(r.id),
    site_id: str(r.site_id),
    name: String(r.name),
    title: String(r.title),
    body: String(r.body),
    url: String(r.url),
    icon_url: str(r.icon_url),
    image_url: str(r.image_url),
    actions: r.actions ? (JSON.parse(String(r.actions)) as CampaignAction[]) : [],
    created_by: str(r.created_by),
    created_at: num(r.created_at),
  };
}

function mapSite(r: Row): Site {
  return {
    id: String(r.id),
    name: String(r.name),
    domain: String(r.domain),
    url: String(r.url),
    icon_url: str(r.icon_url),
    vapid_public_key: String(r.vapid_public_key),
    vapid_private_key: String(r.vapid_private_key),
    webhook_secret: String(r.webhook_secret),
    prompt_title: String(r.prompt_title),
    prompt_body: String(r.prompt_body),
    prompt_allow_label: String(r.prompt_allow_label),
    prompt_deny_label: String(r.prompt_deny_label),
    prompt_delay_seconds: num(r.prompt_delay_seconds),
    prompt_scroll_percent: r.prompt_scroll_percent == null ? null : num(r.prompt_scroll_percent),
    rss_feed_url: str(r.rss_feed_url),
    rss_auto_push: num(r.rss_auto_push),
    last_pushed_guid: str(r.last_pushed_guid),
    created_by: str(r.created_by),
    created_at: num(r.created_at),
    migration_from: str(r.migration_from),
    welcome_enabled: num(r.welcome_enabled),
    welcome_title: str(r.welcome_title),
    welcome_body: str(r.welcome_body),
    welcome_url: str(r.welcome_url),
    prompt_style: String(r.prompt_style ?? "banner"),
    prompt_texts: str(r.prompt_texts),
    prompt_ab_enabled: num(r.prompt_ab_enabled),
    prompt_b_title: str(r.prompt_b_title),
    prompt_b_body: str(r.prompt_b_body),
    max_per_day: r.max_per_day == null ? 3 : num(r.max_per_day),
    min_hours_between_sends: num(r.min_hours_between_sends),
    rss_etag: str(r.rss_etag),
    rss_last_modified: str(r.rss_last_modified),
  };
}

function mapSubscriber(r: Row): Subscriber {
  return {
    id: String(r.id),
    site_id: String(r.site_id),
    endpoint: String(r.endpoint),
    p256dh: String(r.p256dh),
    auth: String(r.auth),
    country: str(r.country),
    browser: str(r.browser),
    os: str(r.os),
    device: str(r.device),
    page_url: str(r.page_url),
    language: str(r.language),
    created_at: num(r.created_at),
    last_seen_at: num(r.last_seen_at),
    deliverable: r.deliverable == null ? 1 : num(r.deliverable),
    source: String(r.source ?? "sdk"),
    import_source: str(r.import_source),
    last_clicked_at: r.last_clicked_at == null ? null : num(r.last_clicked_at),
    last_sent_at: r.last_sent_at == null ? null : num(r.last_sent_at),
    sent_day: str(r.sent_day),
    sends_today: num(r.sends_today),
    received_total: num(r.received_total),
    clicks_total: num(r.clicks_total),
    prompt_variant: str(r.prompt_variant),
  };
}

function mapUser(r: Row): User {
  return {
    id: String(r.id),
    email: String(r.email),
    role: String(r.role) as User["role"],
    created_at: num(r.created_at),
    last_login_at: r.last_login_at == null ? null : num(r.last_login_at),
  };
}

const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);

/* ---------------- D1 implementation ---------------- */

export class D1Store implements Store {
  constructor(private db: D1DatabaseLike) {}

  async getUserByEmail(email: string) {
    const r = await this.db.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first<Row>();
    return r ? mapUser(r) : null;
  }
  async getUserById(id: string) {
    const r = await this.db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<Row>();
    return r ? mapUser(r) : null;
  }
  async createUser(email: string, role: User["role"]) {
    const user: User = { id: randomId(), email: email.toLowerCase(), role, created_at: Date.now(), last_login_at: null };
    await this.db.prepare("INSERT INTO users (id, email, role, created_at) VALUES (?, ?, ?, ?)")
      .bind(user.id, user.email, user.role, user.created_at).run();
    return user;
  }
  async listUsers() {
    const { results } = await this.db.prepare("SELECT * FROM users ORDER BY created_at ASC").all<Row>();
    return results.map(mapUser);
  }
  async deleteUser(id: string) {
    await this.db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  }
  async touchUserLogin(id: string) {
    await this.db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(Date.now(), id).run();
  }

  async createSession(s: Omit<SessionRow, "id">) {
    const row: SessionRow = { ...s, id: randomId() };
    await this.db.prepare(
      "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(row.id, row.user_id, row.token_hash, row.created_at, row.expires_at, row.last_seen_at).run();
    return row;
  }
  async getSession(tokenHash: string) {
    const r = await this.db.prepare(
      `SELECT s.*, u.email, u.role, u.created_at AS u_created, u.last_login_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    ).bind(tokenHash).first<Row>();
    if (!r) return null;
    return {
      id: String(r.id), user_id: String(r.user_id), token_hash: String(r.token_hash),
      created_at: num(r.created_at), expires_at: num(r.expires_at), last_seen_at: num(r.last_seen_at),
      user: mapUser({ id: r.user_id, email: r.email, role: r.role, created_at: r.u_created, last_login_at: r.last_login_at }),
    };
  }
  async touchSession(id: string, expiresAt: number) {
    await this.db.prepare("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?")
      .bind(Date.now(), expiresAt, id).run();
  }
  async deleteSession(id: string) {
    await this.db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  }
  async listSessions() {
    const { results } = await this.db.prepare(
      "SELECT s.*, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.expires_at > ? ORDER BY s.last_seen_at DESC",
    ).bind(Date.now()).all<Row>();
    return results.map((r) => ({
      id: String(r.id), user_id: String(r.user_id), token_hash: String(r.token_hash),
      created_at: num(r.created_at), expires_at: num(r.expires_at), last_seen_at: num(r.last_seen_at),
      email: String(r.email),
    }));
  }

  async createAuthToken(t: Omit<AuthTokenRow, "id" | "attempts" | "used_at">) {
    await this.db.prepare(
      "INSERT INTO auth_tokens (id, email, type, code_hash, role, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(randomId(), t.email.toLowerCase(), t.type, t.code_hash, t.role, t.created_by, t.created_at, t.expires_at).run();
  }
  async getAuthToken(email: string, type: AuthTokenRow["type"], codeHash: string) {
    const r = await this.db.prepare(
      "SELECT * FROM auth_tokens WHERE email = ? AND type = ? AND code_hash = ? AND used_at IS NULL ORDER BY created_at DESC",
    ).bind(email.toLowerCase(), type, codeHash).first<Row>();
    return r ? (r as unknown as AuthTokenRow) : null;
  }
  async getAuthTokenByHash(codeHash: string) {
    const r = await this.db.prepare(
      "SELECT * FROM auth_tokens WHERE code_hash = ? AND used_at IS NULL ORDER BY created_at DESC",
    ).bind(codeHash).first<Row>();
    return r ? (r as unknown as AuthTokenRow) : null;
  }
  async incrementTokenAttempts(id: string) {
    await this.db.prepare("UPDATE auth_tokens SET attempts = attempts + 1 WHERE id = ?").bind(id).run();
  }
  async getLatestAuthToken(email: string, type: AuthTokenRow["type"]) {
    const r = await this.db.prepare(
      "SELECT * FROM auth_tokens WHERE email = ? AND type = ? AND used_at IS NULL ORDER BY created_at DESC",
    ).bind(email.toLowerCase(), type).first<Row>();
    return r ? (r as unknown as AuthTokenRow) : null;
  }
  async markTokenUsed(id: string) {
    await this.db.prepare("UPDATE auth_tokens SET used_at = ? WHERE id = ?").bind(Date.now(), id).run();
  }
  async invalidateTokens(email: string, type: AuthTokenRow["type"]) {
    await this.db.prepare("UPDATE auth_tokens SET used_at = ? WHERE email = ? AND type = ? AND used_at IS NULL")
      .bind(Date.now(), email.toLowerCase(), type).run();
  }

  async createSite(s: Site) {
    await this.db.prepare(
      `INSERT INTO sites (id, name, domain, url, icon_url, vapid_public_key, vapid_private_key, webhook_secret,
        prompt_title, prompt_body, prompt_allow_label, prompt_deny_label, prompt_delay_seconds, prompt_scroll_percent,
        rss_feed_url, rss_auto_push, last_pushed_guid, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(s.id, s.name, s.domain, s.url, s.icon_url, s.vapid_public_key, s.vapid_private_key, s.webhook_secret,
      s.prompt_title, s.prompt_body, s.prompt_allow_label, s.prompt_deny_label, s.prompt_delay_seconds,
      s.prompt_scroll_percent, s.rss_feed_url, s.rss_auto_push, s.last_pushed_guid, s.created_by, s.created_at).run();
    return s;
  }
  async getSite(id: string) {
    const r = await this.db.prepare("SELECT * FROM sites WHERE id = ?").bind(id).first<Row>();
    return r ? mapSite(r) : null;
  }
  async listSites() {
    const { results } = await this.db.prepare("SELECT * FROM sites ORDER BY created_at DESC").all<Row>();
    return results.map(mapSite);
  }
  async updateSite(id: string, patch: Partial<Site>) {
    const allowed = ["name","domain","url","icon_url","prompt_title","prompt_body","prompt_allow_label","prompt_deny_label","prompt_delay_seconds","prompt_scroll_percent","rss_feed_url","rss_auto_push","last_pushed_guid","webhook_secret","vapid_public_key","vapid_private_key","migration_from","welcome_enabled","welcome_title","welcome_body","welcome_url","prompt_style","prompt_texts","prompt_ab_enabled","prompt_b_title","prompt_b_body","max_per_day","min_hours_between_sends","rss_etag","rss_last_modified"] as const;
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in patch) { sets.push(`${key} = ?`); values.push((patch as Row)[key] ?? null); }
    }
    if (!sets.length) return;
    values.push(id);
    await this.db.prepare(`UPDATE sites SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();
  }
  async deleteSite(id: string) {
    await this.db.prepare("DELETE FROM sites WHERE id = ?").bind(id).run();
  }

  async upsertSubscriber(s: Subscriber, tags: Record<string, string>) {
    const existing = await this.db.prepare("SELECT id FROM subscribers WHERE endpoint = ?").bind(s.endpoint).first<Row>();
    await this.db.prepare(
      `INSERT INTO subscribers (id, site_id, endpoint, p256dh, auth, country, browser, os, device, page_url, language, created_at, last_seen_at, deliverable, source, prompt_variant)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'sdk', ?)
       ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, last_seen_at = excluded.last_seen_at, page_url = excluded.page_url,
         deliverable = 1, prompt_variant = COALESCE(excluded.prompt_variant, subscribers.prompt_variant)`,
    ).bind(s.id, s.site_id, s.endpoint, s.p256dh, s.auth, s.country, s.browser, s.os, s.device, s.page_url, s.language, s.created_at, s.last_seen_at, s.prompt_variant).run();
    const id = existing ? String(existing.id) : s.id;
    for (const [key, value] of Object.entries(tags)) {
      await this.db.prepare(
        "INSERT INTO subscriber_tags (subscriber_id, key, value) VALUES (?, ?, ?) ON CONFLICT(subscriber_id, key) DO UPDATE SET value = excluded.value",
      ).bind(id, key, value).run();
    }
    if (!existing) {
      await this.bumpDaily(s.site_id, {
        newSubscribers: 1,
        subsA: s.prompt_variant === "a" ? 1 : 0,
        subsB: s.prompt_variant === "b" ? 1 : 0,
      });
    }
  }
  async importSubscribers(siteId: string, rows: { endpoint: string; p256dh: string; auth: string }[], importSource: string) {
    let inserted = 0;
    let skipped = 0;
    const now = Date.now();
    for (const row of rows) {
      const existing = await this.db.prepare("SELECT id FROM subscribers WHERE endpoint = ?").bind(row.endpoint).first<Row>();
      if (existing) { skipped++; continue; }
      await this.db.prepare(
        `INSERT INTO subscribers (id, site_id, endpoint, p256dh, auth, created_at, last_seen_at, deliverable, source, import_source)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'import', ?)`,
      ).bind(randomId(), siteId, row.endpoint, row.p256dh, row.auth, now, now, importSource).run();
      inserted++;
    }
    return { inserted, skipped };
  }
  async touchSubscriberVisit(siteId: string, endpoint: string) {
    // Conditional write (optimization O3): only touch when last seen > 12h ago.
    const cutoff = Date.now() - 12 * 3600e3;
    await this.db.prepare(
      "UPDATE subscribers SET last_seen_at = ? WHERE site_id = ? AND endpoint = ? AND last_seen_at < ?",
    ).bind(Date.now(), siteId, endpoint, cutoff).run();
  }
  async getSubscriber(id: string) {
    const r = await this.db.prepare("SELECT * FROM subscribers WHERE id = ?").bind(id).first<Row>();
    return r ? mapSubscriber(r) : null;
  }
  async getSubscriberByEndpoint(endpoint: string) {
    const r = await this.db.prepare("SELECT * FROM subscribers WHERE endpoint = ?").bind(endpoint).first<Row>();
    return r ? mapSubscriber(r) : null;
  }
  async getSubscribersByIds(ids: string[]) {
    if (!ids.length) return [];
    const placeholders = ids.map(() => "?").join(",");
    const { results } = await this.db.prepare(`SELECT * FROM subscribers WHERE id IN (${placeholders})`).bind(...ids).all<Row>();
    return results.map(mapSubscriber);
  }
  async listSubscribers(opts: { siteId?: string; search?: string; limit?: number; offset?: number }) {
    const where: string[] = [];
    const values: unknown[] = [];
    if (opts.siteId) { where.push("site_id = ?"); values.push(opts.siteId); }
    if (opts.search) { where.push("(endpoint LIKE ? OR country LIKE ? OR browser LIKE ?)"); const q = `%${opts.search}%`; values.push(q, q, q); }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = await this.db.prepare(`SELECT COUNT(*) AS c FROM subscribers ${clause}`).bind(...values).first<Row>();
    const { results } = await this.db.prepare(
      `SELECT * FROM subscribers ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ).bind(...values, opts.limit ?? 50, opts.offset ?? 0).all<Row>();
    const rows = results.map(mapSubscriber);
    for (const row of rows) {
      const { results: tagRows } = await this.db.prepare("SELECT key, value FROM subscriber_tags WHERE subscriber_id = ?").bind(row.id).all<Row>();
      row.tags = Object.fromEntries(tagRows.map((t) => [String(t.key), String(t.value)]));
    }
    return { rows, total: num(totalRow?.c) };
  }
  async findSubscribersForAudience(siteId: string, audience: AudienceFilter) {
    const site = await this.getSite(siteId);
    const now = Date.now();
    const where = ["s.site_id = ?", "s.deliverable = 1"];
    const values: unknown[] = [siteId];
    if (audience.country) { where.push("s.country = ?"); values.push(audience.country); }
    if (audience.device) { where.push("s.device = ?"); values.push(audience.device); }
    if (audience.browser) { where.push("s.browser = ?"); values.push(audience.browser); }
    if (audience.os) { where.push("s.os = ?"); values.push(audience.os); }
    // Send pacing (G3): per-subscriber daily cap + minimum gap between sends.
    if (site && site.max_per_day > 0) {
      where.push("NOT (s.sent_day = ? AND s.sends_today >= ?)");
      values.push(dayKey(now), site.max_per_day);
    }
    if (site && site.min_hours_between_sends > 0) {
      where.push("(s.last_sent_at IS NULL OR s.last_sent_at <= ?)");
      values.push(now - site.min_hours_between_sends * 3600e3);
    }
    if (audience.engagedOnly) {
      where.push("(s.last_clicked_at >= ? OR s.created_at >= ?)");
      values.push(now - 90 * 864e5, now - 30 * 864e5);
    }
    if (audience.inactiveDays && audience.inactiveDays > 0) {
      where.push("s.last_seen_at <= ? AND s.created_at <= ?");
      values.push(now - audience.inactiveDays * 864e5, now - audience.inactiveDays * 864e5);
    }
    let join = "";
    if (audience.tagKey) {
      join = "JOIN subscriber_tags t ON t.subscriber_id = s.id AND t.key = ?";
      values.push(audience.tagKey);
      if (audience.tagValue) { join += " AND t.value = ?"; values.push(audience.tagValue); }
    }
    const { results } = await this.db.prepare(
      `SELECT s.id FROM subscribers s ${join} WHERE ${where.join(" AND ")}`,
    ).bind(...values).all<Row>();
    return results.map((r) => String(r.id));
  }
  async deleteSubscriber(id: string) {
    await this.db.prepare("DELETE FROM subscribers WHERE id = ?").bind(id).run();
  }
  async setSubscriberTag(subscriberId: string, key: string, value: string) {
    await this.db.prepare(
      "INSERT INTO subscriber_tags (subscriber_id, key, value) VALUES (?, ?, ?) ON CONFLICT(subscriber_id, key) DO UPDATE SET value = excluded.value",
    ).bind(subscriberId, key, value).run();
  }
  async countSubscribers(siteId?: string) {
    const r = siteId
      ? await this.db.prepare("SELECT COUNT(*) AS c FROM subscribers WHERE site_id = ?").bind(siteId).first<Row>()
      : await this.db.prepare("SELECT COUNT(*) AS c FROM subscribers").first<Row>();
    return num(r?.c);
  }

  async createCampaign(c: Campaign) {
    await this.db.prepare(
      `INSERT INTO campaigns (id, site_id, title, body, url, icon_url, image_url, actions, audience, status, source, scheduled_at, target_count, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(c.id, c.site_id, c.title, c.body, c.url, c.icon_url, c.image_url, JSON.stringify(c.actions),
      JSON.stringify(c.audience), c.status, c.source, c.scheduled_at, c.target_count, c.created_by, c.created_at).run();
    return c;
  }
  async getCampaign(id: string) {
    const r = await this.db.prepare("SELECT * FROM campaigns WHERE id = ?").bind(id).first<Row>();
    return r ? mapCampaign(r) : null;
  }
  async listCampaigns(opts?: { siteId?: string; limit?: number }) {
    const { results } = opts?.siteId
      ? await this.db.prepare("SELECT * FROM campaigns WHERE site_id = ? ORDER BY created_at DESC LIMIT ?").bind(opts.siteId, opts.limit ?? 100).all<Row>()
      : await this.db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ?").bind(opts?.limit ?? 100).all<Row>();
    return results.map(mapCampaign);
  }
  async updateCampaign(id: string, patch: Partial<Campaign>) {
    const simple: Record<string, unknown> = {};
    for (const k of ["status", "scheduled_at", "sent_at", "target_count", "title", "body", "url"] as const) {
      if (k in patch) simple[k] = (patch as Row)[k] ?? null;
    }
    const sets = Object.keys(simple).map((k) => `${k} = ?`);
    if (!sets.length) return;
    await this.db.prepare(`UPDATE campaigns SET ${sets.join(", ")} WHERE id = ?`)
      .bind(...Object.values(simple), id).run();
  }
  async addCampaignCounters(id: string, sent: number, failed: number, gone = 0, error = 0) {
    await this.db.prepare(
      "UPDATE campaigns SET sent_count = sent_count + ?, failed_count = failed_count + ?, failed_gone = failed_gone + ?, failed_error = failed_error + ? WHERE id = ?",
    ).bind(sent, failed, gone, error, id).run();
    const c = await this.getCampaign(id);
    if (c && sent > 0) await this.bumpDaily(c.site_id, { sent });
  }
  async recordDeliveryEngagement(ids: string[]) {
    if (!ids.length) return;
    const now = Date.now();
    const today = dayKey(now);
    const placeholders = ids.map(() => "?").join(",");
    await this.db.prepare(
      `UPDATE subscribers SET received_total = received_total + 1, last_sent_at = ?,
         sends_today = CASE WHEN sent_day = ? THEN sends_today + 1 ELSE 1 END, sent_day = ?
       WHERE id IN (${placeholders})`,
    ).bind(now, today, today, ...ids).run();
  }
  async incrementCampaignClick(id: string, subscriberId?: string) {
    await this.db.prepare("UPDATE campaigns SET click_count = click_count + 1 WHERE id = ?").bind(id).run();
    await this.db.prepare(
      `INSERT INTO campaign_daily (campaign_id, day, clicks) VALUES (?, ?, 1)
       ON CONFLICT(campaign_id, day) DO UPDATE SET clicks = clicks + 1`,
    ).bind(id, dayKey(Date.now())).run();
    if (subscriberId) {
      await this.db.prepare(
        "UPDATE subscribers SET clicks_total = clicks_total + 1, last_clicked_at = ? WHERE id = ?",
      ).bind(Date.now(), subscriberId).run();
    }
    const c = await this.getCampaign(id);
    if (c) await this.bumpDaily(c.site_id, { clicks: 1 });
    return c;
  }
  async campaignDailyClicks(campaignId: string) {
    const { results } = await this.db.prepare(
      "SELECT day, clicks FROM campaign_daily WHERE campaign_id = ? ORDER BY day",
    ).bind(campaignId).all<Row>();
    return results.map((r) => ({ day: String(r.day), clicks: num(r.clicks) }));
  }
  async siteHealth() {
    const since = dayKey(Date.now() - 30 * 864e5);
    const { results } = await this.db.prepare(
      "SELECT site_id, COALESCE(SUM(sent),0) AS s, COALESCE(SUM(clicks),0) AS c FROM daily_stats WHERE day >= ? GROUP BY site_id",
    ).bind(since).all<Row>();
    return results.map((r) => ({ siteId: String(r.site_id), sent30: num(r.s), clicks30: num(r.c) }));
  }
  async exportAll() {
    const sites = await this.listSites();
    const { results: subRows } = await this.db.prepare("SELECT * FROM subscribers").all<Row>();
    const campaigns = await this.listCampaigns({ limit: 100000 });
    const templates = await this.listTemplates();
    return { sites, subscribers: subRows.map(mapSubscriber), campaigns, templates };
  }
  async listDueScheduled(now: number) {
    const { results } = await this.db.prepare(
      "SELECT * FROM campaigns WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?",
    ).bind(now).all<Row>();
    return results.map(mapCampaign);
  }

  async createTemplate(t: Template) {
    await this.db.prepare(
      "INSERT INTO templates (id, site_id, name, title, body, url, icon_url, image_url, actions, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(t.id, t.site_id, t.name, t.title, t.body, t.url, t.icon_url, t.image_url, JSON.stringify(t.actions), t.created_by, t.created_at).run();
    return t;
  }
  async listTemplates() {
    const { results } = await this.db.prepare("SELECT * FROM templates ORDER BY created_at DESC").all<Row>();
    return results.map(mapTemplate);
  }
  async getTemplate(id: string) {
    const r = await this.db.prepare("SELECT * FROM templates WHERE id = ?").bind(id).first<Row>();
    return r ? mapTemplate(r) : null;
  }
  async deleteTemplate(id: string) {
    await this.db.prepare("DELETE FROM templates WHERE id = ?").bind(id).run();
  }

  async bumpDaily(siteId: string, patch: { newSubscribers?: number; sent?: number; clicks?: number; subsA?: number; subsB?: number }) {
    const day = dayKey(Date.now());
    await this.db.prepare(
      `INSERT INTO daily_stats (site_id, day, new_subscribers, sent, clicks, subs_a, subs_b) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(site_id, day) DO UPDATE SET
         new_subscribers = new_subscribers + excluded.new_subscribers,
         sent = sent + excluded.sent,
         clicks = clicks + excluded.clicks,
         subs_a = subs_a + excluded.subs_a,
         subs_b = subs_b + excluded.subs_b`,
    ).bind(siteId, day, patch.newSubscribers ?? 0, patch.sent ?? 0, patch.clicks ?? 0, patch.subsA ?? 0, patch.subsB ?? 0).run();
  }
  async purgeExpiredSubscribers() {
    // Endpoint-level expiry is handled at send time (404/410). This purges
    // subscribers not seen in 180 days.
    const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const res = await this.db.prepare("DELETE FROM subscribers WHERE last_seen_at < ?").bind(cutoff).run();
    return res.meta.changes;
  }
  async getSetting(key: string) {
    const r = await this.db.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first<Row>();
    return r ? String(r.value) : null;
  }
  async setSetting(key: string, value: string) {
    await this.db.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    ).bind(key, value, Date.now()).run();
  }
  async deleteSetting(key: string) {
    await this.db.prepare("DELETE FROM settings WHERE key = ?").bind(key).run();
  }
  async overview(): Promise<OverviewStats> {
    const total = await this.countSubscribers().catch(() => 0);
    const todayRow = await this.db.prepare("SELECT COALESCE(SUM(new_subscribers),0) AS c FROM daily_stats WHERE day = ?").bind(dayKey(Date.now())).first<Row>().catch(() => null);
    const sentRow = await this.db.prepare("SELECT COALESCE(SUM(sent_count),0) AS s, COALESCE(SUM(click_count),0) AS c FROM campaigns").first<Row>().catch(() => null);
    const sent = num(sentRow?.s);
    const clicks = num(sentRow?.c);
    const seriesRes = await this.db.prepare(
      "SELECT day, SUM(new_subscribers) AS subs, SUM(sent) AS sent, SUM(clicks) AS clicks FROM daily_stats GROUP BY day ORDER BY day DESC LIMIT 90",
    ).all<Row>().catch(() => ({ results: [] as Row[] }));
    const seriesRows = seriesRes?.results ?? [];
    const breakdown = async (col: string) => {
      try {
        const res = await this.db.prepare(
          `SELECT COALESCE(${col}, 'Unknown') AS name, COUNT(*) AS c FROM subscribers GROUP BY ${col} ORDER BY c DESC LIMIT 10`,
        ).all<Row>();
        return (res?.results ?? []).map((r) => ({ name: String(r.name), count: num(r.c) }));
      } catch {
        return [];
      }
    };
    const svcRes = await this.db.prepare(
      `SELECT CASE
         WHEN endpoint LIKE 'https://fcm.googleapis.com/%' THEN 'Chrome / FCM'
         WHEN endpoint LIKE 'https://web.push.apple.com/%' THEN 'Apple'
         WHEN endpoint LIKE '%notify.windows.com%' THEN 'Windows (WNS)'
         WHEN endpoint LIKE 'https://updates.push.services.mozilla.com/%' THEN 'Firefox / Mozilla'
         ELSE 'Other' END AS name, COUNT(*) AS c
       FROM subscribers GROUP BY name ORDER BY c DESC`,
    ).all<Row>().catch(() => ({ results: [] as Row[] }));
    const svcRows = svcRes?.results ?? [];
    const abRow = await this.db.prepare("SELECT COALESCE(SUM(subs_a),0) AS a, COALESCE(SUM(subs_b),0) AS b FROM daily_stats").first<Row>().catch(() => null);
    const ctrRow = await this.db.prepare(
      "SELECT COALESCE(SUM(sent),0) AS s, COALESCE(SUM(clicks),0) AS c FROM daily_stats WHERE day >= ?",
    ).bind(dayKey(Date.now() - 30 * 864e5)).first<Row>().catch(() => null);
    return {
      totalSubscribers: total,
      newToday: num(todayRow?.c),
      notificationsSent: sent,
      averageCtr: sent > 0 ? Math.round((clicks / sent) * 1000) / 10 : 0,
      series: (seriesRows ?? []).slice().reverse().map((r) => ({ day: String(r.day), subscribers: num(r.subs), sent: num(r.sent), clicks: num(r.clicks) })),
      countries: await breakdown("country"),
      devices: await breakdown("device"),
      browsers: await breakdown("browser"),
      os: await breakdown("os"),
      services: (svcRows ?? []).map((r) => ({ name: String(r.name), count: num(r.c) })),
      promptAb: { a: num(abRow?.a), b: num(abRow?.b) },
      ctr30: { sent: num(ctrRow?.s), clicks: num(ctrRow?.c) },
    };
  }
  async exportSubscribersCsv(siteId?: string) {
    const { rows } = await this.listSubscribers({ siteId, limit: 100000 });
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = ["id,site_id,country,browser,os,device,page_url,created_at"];
    for (const r of rows) lines.push([r.id, r.site_id, r.country, r.browser, r.os, r.device, r.page_url, new Date(r.created_at).toISOString()].map(esc).join(","));
    return lines.join("\n");
  }
}

/* ---------------- In-memory implementation (local dev demo) ---------------- */

export class MemoryStore implements Store {
  users: User[] = [];
  sessions: (SessionRow & { email: string })[] = [];
  tokens: AuthTokenRow[] = [];
  sites: Site[] = [];
  subscribers: Subscriber[] = [];
  campaigns: Campaign[] = [];
  templates: Template[] = [];
  daily = new Map<string, { newSubscribers: number; sent: number; clicks: number }>();

  constructor() {
    this.seed();
  }

  private seed() {
    const now = Date.now();
    const owner: User = { id: "demo-owner", email: "owner@example.com", role: "owner", created_at: now - 90 * 864e5, last_login_at: now };
    this.users.push(owner);
    const mkSite = (id: string, name: string, domain: string, daysAgo: number): Site => ({
      id, name, domain, url: `https://${domain}`, icon_url: null,
      vapid_public_key: "DEMO_PUBLIC_KEY", vapid_private_key: "DEMO_PRIVATE_KEY",
      webhook_secret: "whsec_demo_secret",
      prompt_title: "Get updates", prompt_body: "Subscribe to push notifications.",
      prompt_allow_label: "Allow", prompt_deny_label: "Not now",
      prompt_delay_seconds: 5, prompt_scroll_percent: null,
      rss_feed_url: null, rss_auto_push: 0, last_pushed_guid: null,
      created_by: owner.id, created_at: now - daysAgo * 864e5,
      migration_from: null, welcome_enabled: 0, welcome_title: null, welcome_body: null, welcome_url: null,
      prompt_style: "banner", prompt_texts: null, prompt_ab_enabled: 0, prompt_b_title: null, prompt_b_body: null,
      max_per_day: 3, min_hours_between_sends: 0, rss_etag: null, rss_last_modified: null,
    });
    this.sites.push(mkSite("site-demo-1", "Example Blog", "blog.example.com", 80));
    this.sites.push(mkSite("site-demo-2", "Example News", "news.example.com", 45));

    const countries = ["BD", "IN", "US", "GB", "DE", "BR"];
    const browsers = ["Chrome", "Firefox", "Safari", "Edge"];
    const osList = ["Android", "Windows", "macOS", "iOS", "Linux"];
    // Deterministic pseudo-random for stable demo numbers.
    let seed = 42;
    const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (let i = 0; i < 128; i++) {
      const created = now - Math.floor(rand() * 30) * 864e5 - Math.floor(rand() * 3600e3);
      this.subscribers.push({
        id: `sub-${i + 1}`, site_id: i % 3 === 0 ? "site-demo-2" : "site-demo-1",
        endpoint: `https://fcm.googleapis.com/fcm/send/demo-${i + 1}`,
        p256dh: "DEMO", auth: "DEMO",
        country: countries[Math.floor(rand() * countries.length)],
        browser: browsers[Math.floor(rand() * browsers.length)],
        os: osList[Math.floor(rand() * osList.length)],
        device: rand() > 0.45 ? "mobile" : "desktop",
        page_url: "https://blog.example.com/latest",
        language: "en", created_at: created, last_seen_at: created,
        tags: i % 4 === 0 ? { plan: "reader" } : undefined,
        deliverable: 1, source: "sdk", import_source: null, last_clicked_at: null,
        last_sent_at: null, sent_day: null, sends_today: 0, received_total: 0, clicks_total: 0,
        prompt_variant: null,
      });
      const key = `site-demo-1|${dayKey(created)}`;
      const d = this.daily.get(key) ?? { newSubscribers: 0, sent: 0, clicks: 0 };
      d.newSubscribers += 1;
      this.daily.set(key, d);
    }
    const mkCampaign = (id: string, title: string, sent: number, clicks: number, daysAgo: number, status: Campaign["status"]): Campaign => {
      const d = this.daily.get(`site-demo-1|${dayKey(now - daysAgo * 864e5)}`) ?? { newSubscribers: 0, sent: 0, clicks: 0 };
      d.sent += sent; d.clicks += clicks;
      this.daily.set(`site-demo-1|${dayKey(now - daysAgo * 864e5)}`, d);
      return {
        id, site_id: "site-demo-1", title, body: "Open to read the full post.",
        url: "https://blog.example.com/latest", icon_url: null, image_url: null,
        actions: [], audience: {}, status, source: "manual", scheduled_at: null,
        sent_count: sent, failed_count: Math.floor(sent * 0.02), failed_gone: Math.floor(sent * 0.012), failed_error: Math.floor(sent * 0.008), click_count: clicks,
        target_count: sent + Math.floor(sent * 0.02), created_by: owner.id,
        created_at: now - daysAgo * 864e5, sent_at: status === "sent" ? now - daysAgo * 864e5 : null,
      };
    };
    this.campaigns.push(
      mkCampaign("camp-1", "New post: Edge caching, explained", 4120, 371, 2, "sent"),
      mkCampaign("camp-2", "Weekly roundup #42", 3980, 318, 6, "sent"),
      mkCampaign("camp-3", "Product update: faster builds", 3544, 402, 11, "sent"),
      { ...mkCampaign("camp-4", "Scheduled: November guide", 0, 0, 0, "scheduled"), scheduled_at: now + 864e5 },
    );
    this.templates.push({
      id: "tpl-1", site_id: "site-demo-1", name: "New post",
      title: "New post: {title}", body: "Read the latest post.", url: "https://blog.example.com/latest",
      icon_url: null, image_url: null, actions: [{ label: "Read", url: "https://blog.example.com/latest" }],
      created_by: owner.id, created_at: now - 20 * 864e5,
    });
  }

  async getUserByEmail(email: string) { return this.users.find((u) => u.email === email.toLowerCase()) ?? null; }
  async getUserById(id: string) { return this.users.find((u) => u.id === id) ?? null; }
  async createUser(email: string, role: User["role"]) {
    const user: User = { id: randomId(), email: email.toLowerCase(), role, created_at: Date.now(), last_login_at: null };
    this.users.push(user); return user;
  }
  async listUsers() { return [...this.users]; }
  async deleteUser(id: string) { this.users = this.users.filter((u) => u.id !== id); }
  async touchUserLogin(id: string) { const u = await this.getUserById(id); if (u) u.last_login_at = Date.now(); }

  async createSession(s: Omit<SessionRow, "id">) {
    const row = { ...s, id: randomId(), email: (await this.getUserById(s.user_id))?.email ?? "" };
    this.sessions.push(row); return row;
  }
  async getSession(tokenHash: string) {
    const s = this.sessions.find((x) => x.token_hash === tokenHash);
    if (!s) return null;
    const user = await this.getUserById(s.user_id);
    return user ? { ...s, user } : null;
  }
  async touchSession(id: string, expiresAt: number) {
    const s = this.sessions.find((x) => x.id === id);
    if (s) { s.last_seen_at = Date.now(); s.expires_at = expiresAt; }
  }
  async deleteSession(id: string) { this.sessions = this.sessions.filter((s) => s.id !== id); }
  async listSessions() { return this.sessions.filter((s) => s.expires_at > Date.now()); }

  async createAuthToken(t: Omit<AuthTokenRow, "id" | "attempts" | "used_at">) {
    this.tokens.push({ ...t, email: t.email.toLowerCase(), id: randomId(), attempts: 0, used_at: null });
  }
  async getAuthToken(email: string, type: AuthTokenRow["type"], codeHash: string) {
    return [...this.tokens].reverse().find((t) => t.email === email.toLowerCase() && t.type === type && t.code_hash === codeHash && !t.used_at) ?? null;
  }
  async getAuthTokenByHash(codeHash: string) {
    return [...this.tokens].reverse().find((t) => t.code_hash === codeHash && !t.used_at) ?? null;
  }
  async incrementTokenAttempts(id: string) { const t = this.tokens.find((x) => x.id === id); if (t) t.attempts += 1; }
  async getLatestAuthToken(email: string, type: AuthTokenRow["type"]) {
    return [...this.tokens].reverse().find((t) => t.email === email.toLowerCase() && t.type === type && !t.used_at) ?? null;
  }
  async markTokenUsed(id: string) { const t = this.tokens.find((x) => x.id === id); if (t) t.used_at = Date.now(); }
  async invalidateTokens(email: string, type: AuthTokenRow["type"]) {
    for (const t of this.tokens) if (t.email === email.toLowerCase() && t.type === type && !t.used_at) t.used_at = Date.now();
  }

  async createSite(s: Site) { this.sites.push(s); return s; }
  async getSite(id: string) { return this.sites.find((s) => s.id === id) ?? null; }
  async listSites() { return [...this.sites]; }
  async updateSite(id: string, patch: Partial<Site>) {
    const s = await this.getSite(id); if (s) Object.assign(s, patch);
  }
  async deleteSite(id: string) {
    this.sites = this.sites.filter((s) => s.id !== id);
    this.subscribers = this.subscribers.filter((s) => s.site_id !== id);
    this.campaigns = this.campaigns.filter((c) => c.site_id !== id);
  }

  async upsertSubscriber(s: Subscriber, tags: Record<string, string>) {
    const existing = this.subscribers.find((x) => x.endpoint === s.endpoint);
    if (existing) { existing.last_seen_at = Date.now(); existing.deliverable = 1; existing.tags = { ...existing.tags, ...tags }; return; }
    this.subscribers.push({ ...s, tags });
    await this.bumpDaily(s.site_id, { newSubscribers: 1, subsA: s.prompt_variant === "a" ? 1 : 0, subsB: s.prompt_variant === "b" ? 1 : 0 });
  }
  async getSubscriber(id: string) { return this.subscribers.find((s) => s.id === id) ?? null; }
  async getSubscriberByEndpoint(endpoint: string) { return this.subscribers.find((s) => s.endpoint === endpoint) ?? null; }
  async getSubscribersByIds(ids: string[]) { return this.subscribers.filter((s) => ids.includes(s.id)); }
  async listSubscribers(opts: { siteId?: string; search?: string; limit?: number; offset?: number }) {
    let rows = [...this.subscribers].sort((a, b) => b.created_at - a.created_at);
    if (opts.siteId) rows = rows.filter((r) => r.site_id === opts.siteId);
    if (opts.search) { const q = opts.search.toLowerCase(); rows = rows.filter((r) => [r.endpoint, r.country, r.browser].some((v) => v?.toLowerCase().includes(q))); }
    return { rows: rows.slice(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50)), total: rows.length };
  }
  async findSubscribersForAudience(siteId: string, audience: AudienceFilter) {
    const now = Date.now();
    const site = this.sites.find((x) => x.id === siteId);
    return this.subscribers.filter((s) =>
      s.site_id === siteId && s.deliverable === 1 &&
      (!audience.country || s.country === audience.country) &&
      (!audience.device || s.device === audience.device) &&
      (!audience.browser || s.browser === audience.browser) &&
      (!audience.os || s.os === audience.os) &&
      (!audience.tagKey || (s.tags?.[audience.tagKey] !== undefined && (!audience.tagValue || s.tags[audience.tagKey] === audience.tagValue))) &&
      (!site || site.max_per_day <= 0 || !(s.sent_day === dayKey(now) && s.sends_today >= site.max_per_day)) &&
      (!site || site.min_hours_between_sends <= 0 || s.last_sent_at === null || s.last_sent_at <= now - site.min_hours_between_sends * 3600e3) &&
      (!audience.engagedOnly || (s.last_clicked_at !== null && s.last_clicked_at >= now - 90 * 864e5) || s.created_at >= now - 30 * 864e5) &&
      (!audience.inactiveDays || (s.last_seen_at <= now - audience.inactiveDays * 864e5 && s.created_at <= now - audience.inactiveDays * 864e5)),
    ).map((s) => s.id);
  }
  async importSubscribers(siteId: string, rows: { endpoint: string; p256dh: string; auth: string }[], importSource: string) {
    let inserted = 0, skipped = 0;
    const now = Date.now();
    for (const row of rows) {
      if (this.subscribers.some((x) => x.endpoint === row.endpoint)) { skipped++; continue; }
      this.subscribers.push({
        id: randomId(), site_id: siteId, endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth,
        country: null, browser: null, os: null, device: null, page_url: null, language: null,
        created_at: now, last_seen_at: now, deliverable: 0, source: "import", import_source: importSource,
        last_clicked_at: null, last_sent_at: null, sent_day: null, sends_today: 0, received_total: 0,
        clicks_total: 0, prompt_variant: null,
      });
      inserted++;
    }
    return { inserted, skipped };
  }
  async touchSubscriberVisit(siteId: string, endpoint: string) {
    const sub = this.subscribers.find((x) => x.site_id === siteId && x.endpoint === endpoint);
    if (sub && sub.last_seen_at < Date.now() - 12 * 3600e3) sub.last_seen_at = Date.now();
  }
  async deleteSubscriber(id: string) { this.subscribers = this.subscribers.filter((s) => s.id !== id); }
  async setSubscriberTag(subscriberId: string, key: string, value: string) {
    const s = await this.getSubscriber(subscriberId); if (s) s.tags = { ...s.tags, [key]: value };
  }
  async countSubscribers(siteId?: string) {
    return siteId ? this.subscribers.filter((s) => s.site_id === siteId).length : this.subscribers.length;
  }

  async createCampaign(c: Campaign) { this.campaigns.unshift(c); return c; }
  async getCampaign(id: string) { return this.campaigns.find((c) => c.id === id) ?? null; }
  async listCampaigns(opts?: { siteId?: string; limit?: number }) {
    let rows = [...this.campaigns];
    if (opts?.siteId) rows = rows.filter((c) => c.site_id === opts.siteId);
    return rows.slice(0, opts?.limit ?? 100);
  }
  async updateCampaign(id: string, patch: Partial<Campaign>) {
    const c = await this.getCampaign(id); if (c) Object.assign(c, patch);
  }
  async addCampaignCounters(id: string, sent: number, failed: number, gone = 0, error = 0) {
    const c = await this.getCampaign(id);
    if (c) { c.sent_count += sent; c.failed_count += failed; c.failed_gone += gone; c.failed_error += error; await this.bumpDaily(c.site_id, { sent }); }
  }
  async recordDeliveryEngagement(ids: string[]) {
    const now = Date.now();
    const today = dayKey(now);
    for (const sub of this.subscribers) {
      if (!ids.includes(sub.id)) continue;
      sub.received_total += 1;
      sub.last_sent_at = now;
      sub.sends_today = sub.sent_day === today ? sub.sends_today + 1 : 1;
      sub.sent_day = today;
    }
  }
  private campaignDailyMap = new Map<string, { day: string; clicks: number }[]>();
  async incrementCampaignClick(id: string, subscriberId?: string) {
    const c = await this.getCampaign(id);
    if (c) { c.click_count += 1; await this.bumpDaily(c.site_id, { clicks: 1 }); }
    const day = dayKey(Date.now());
    const rows = this.campaignDailyMap.get(id) ?? [];
    const row = rows.find((r) => r.day === day);
    if (row) row.clicks += 1; else rows.push({ day, clicks: 1 });
    this.campaignDailyMap.set(id, rows);
    if (subscriberId) {
      const sub = await this.getSubscriber(subscriberId);
      if (sub) { sub.clicks_total += 1; sub.last_clicked_at = Date.now(); }
    }
    return c;
  }
  async campaignDailyClicks(campaignId: string) { return this.campaignDailyMap.get(campaignId) ?? []; }
  async siteHealth() {
    const cutoff = Date.now() - 30 * 864e5;
    return this.sites.map((site) => {
      let sent30 = 0, clicks30 = 0;
      for (const [key, d] of this.daily.entries()) {
        const [sid, day] = key.split("|");
        if (sid === site.id && new Date(day).getTime() >= cutoff) { sent30 += d.sent; clicks30 += d.clicks; }
      }
      return { siteId: site.id, sent30, clicks30 };
    });
  }
  async exportAll() {
    return { sites: [...this.sites], subscribers: [...this.subscribers], campaigns: [...this.campaigns], templates: [...this.templates] };
  }
  async listDueScheduled(now: number) {
    return this.campaigns.filter((c) => c.status === "scheduled" && c.scheduled_at !== null && c.scheduled_at <= now);
  }

  async createTemplate(t: Template) { this.templates.unshift(t); return t; }
  async listTemplates() { return [...this.templates]; }
  async getTemplate(id: string) { return this.templates.find((t) => t.id === id) ?? null; }
  async deleteTemplate(id: string) { this.templates = this.templates.filter((t) => t.id !== id); }

  abTotals = { a: 0, b: 0 };
  async bumpDaily(siteId: string, patch: { newSubscribers?: number; sent?: number; clicks?: number; subsA?: number; subsB?: number }) {
    const key = `${siteId}|${dayKey(Date.now())}`;
    const d = this.daily.get(key) ?? { newSubscribers: 0, sent: 0, clicks: 0 };
    d.newSubscribers += patch.newSubscribers ?? 0;
    d.sent += patch.sent ?? 0;
    d.clicks += patch.clicks ?? 0;
    this.daily.set(key, d);
    this.abTotals.a += patch.subsA ?? 0;
    this.abTotals.b += patch.subsB ?? 0;
  }
  async purgeExpiredSubscribers() {
    const cutoff = Date.now() - 180 * 864e5;
    const before = this.subscribers.length;
    this.subscribers = this.subscribers.filter((s) => s.last_seen_at >= cutoff);
    return before - this.subscribers.length;
  }
  private settingsMap = new Map<string, string>();
  async getSetting(key: string) { return this.settingsMap.get(key) ?? null; }
  async setSetting(key: string, value: string) { this.settingsMap.set(key, value); }
  async deleteSetting(key: string) { this.settingsMap.delete(key); }
  async overview(): Promise<OverviewStats> {
    const total = this.subscribers.length;
    const today = dayKey(Date.now());
    let newToday = 0, sentTotal = 0, clickTotal = 0;
    const byDay = new Map<string, { subscribers: number; sent: number; clicks: number }>();
    for (const [key, d] of this.daily.entries()) {
      const day = key.split("|")[1];
      const agg = byDay.get(day) ?? { subscribers: 0, sent: 0, clicks: 0 };
      agg.subscribers += d.newSubscribers; agg.sent += d.sent; agg.clicks += d.clicks;
      byDay.set(day, agg);
      if (day === today) newToday += d.newSubscribers;
    }
    for (const c of this.campaigns) { sentTotal += c.sent_count; clickTotal += c.click_count; }
    const breakdown = (fn: (s: Subscriber) => string | null) => {
      const counts = new Map<string, number>();
      for (const s of this.subscribers) { const k = fn(s) ?? "Unknown"; counts.set(k, (counts.get(k) ?? 0) + 1); }
      return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    };
    return {
      totalSubscribers: total,
      newToday,
      notificationsSent: sentTotal,
      averageCtr: sentTotal > 0 ? Math.round((clickTotal / sentTotal) * 1000) / 10 : 0,
      series: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-90).map(([day, v]) => ({ day, ...v })),
      countries: breakdown((s) => s.country),
      devices: breakdown((s) => s.device),
      browsers: breakdown((s) => s.browser),
      os: breakdown((s) => s.os),
      services: breakdown((s) => s.endpoint.includes("fcm.googleapis.com") ? "Chrome / FCM" : s.endpoint.includes("apple") ? "Apple" : "Other"),
      promptAb: { ...this.abTotals },
      ctr30: { sent: sentTotal, clicks: clickTotal },
    };
  }
  async exportSubscribersCsv(siteId?: string) {
    const { rows } = await this.listSubscribers({ siteId, limit: 100000 });
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = ["id,site_id,country,browser,os,device,page_url,created_at"];
    for (const r of rows) lines.push([r.id, r.site_id, r.country, r.browser, r.os, r.device, r.page_url, new Date(r.created_at).toISOString()].map(esc).join(","));
    return lines.join("\n");
  }
}

/* ---------------- selection ---------------- */

const globalStore = globalThis as unknown as { __pushkitStore?: Store };

export async function getStore(): Promise<Store> {
  if (globalStore.__pushkitStore) return globalStore.__pushkitStore;
  const env = await getEnv();
  globalStore.__pushkitStore = env.DB ? new D1Store(env.DB) : new MemoryStore();
  return globalStore.__pushkitStore;
}
