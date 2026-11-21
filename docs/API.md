# PushKit API Reference

Every HTTP endpoint in PushKit, grouped by audience. Base URL is your
deployment's origin (examples use `https://push.example.com`).

## Conventions

- **Formats.** Request and response bodies are JSON unless noted
  (upload is `multipart/form-data`; exports are file downloads).
- **Errors.** All errors are `{ "error": "<message>" }` with a matching
  HTTP status: `400` invalid input, `401` not authenticated / bad webhook
  secret, `403` authenticated but not allowed (including Origin mismatch
  on public endpoints), `404` not found, `422` upstream fetch failed,
  `429` rate limited, `501` a required Cloudflare binding is missing.
- **IDs.** Sites, campaigns, subscribers, templates and users have opaque
  string IDs. Times are Unix epoch **milliseconds**.
- **Authentication.**
  - *Dashboard API* — the `pushkit_session` cookie set at login
    (`HttpOnly; Secure; SameSite=Strict`). Two roles: `owner` (full
    access) and `staff` (invited; cannot see or rotate secrets, delete
    sites, manage the team, purge data, or export backups).
  - *Public API* — no account. Endpoints are scoped by `siteId` and,
    where noted, require the request `Origin` to match the site's
    registered domain (subdomains included).
  - *Webhook* — per-site secret, `Authorization: Bearer <redacted>` or an
    HMAC-SHA256 signature (see Webhooks).
- **CORS.** Public endpoints answer `OPTIONS` preflights and reflect the
  request origin (no credentials are used on them). Dashboard endpoints
  are same-origin only.
- **Rate limits (per isolate, first line of defense — add Cloudflare WAF
  rate rules for production abuse traffic).**
  - `POST /api/auth/request`: 5/min per IP, 3/10 min per email.
  - `POST /api/auth/verify`: 10/min per IP.
  - Public subscribe / tag / visit / click: 30–60/min per IP
    (endpoint-specific, see below).

---

## Auth

### POST /api/auth/request
Request a login code. Sends a 6-digit OTP **and** a magic link by email
(Resend). Always returns `{ "ok": true }` — including for unknown emails
(no account enumeration). The first request whose email equals
`OWNER_EMAIL` bootstraps the owner account. There is no public sign-up;
other accounts exist only via owner invite.

```jsonc
// Request
{ "email": "owner@example.com" }
// Response 200
{ "ok": true }
```

### POST /api/auth/verify
Verify an OTP code and start a session (sets the session cookie).

```jsonc
// Request
{ "email": "owner@example.com", "code": "123456" }
// Response 200
{ "user": { "id": "…", "email": "owner@example.com", "role": "owner" } }
```
Codes expire in 10 minutes, are single-use, hashed at rest, and lock
after 5 failed attempts (`"Too many attempts. Request a new code."`).

### GET /api/auth/magic?token=…
Magic-link sign-in. The token is single-use and expires in 10 minutes.
On success: session cookie set, `302` to `/dashboard`. On failure: `302`
to `/login?error=…`.

### POST /api/auth/logout
Clears the session (deletes the server-side session row and the cookie).

---

## Public API (browser / SDK facing)

### GET /api/public/config?siteId={id}
Everything the SDK needs to render the opt-in prompt. Public by design —
contains only the site's **public** VAPID key and prompt settings.
Cached: `Cache-Control: public, max-age=300, stale-while-revalidate=600`.

```jsonc
{
  "id": "site-id",
  "name": "Example Blog",
  "vapidPublicKey": "B…",
  "prompt": {
    "title": "Get updates", "body": "Subscribe to push notifications.",
    "allowLabel": "Allow", "denyLabel": "Not now",
    "delaySeconds": 5, "scrollPercent": null, "iconUrl": null,
    "style": "banner",            // banner | bar | bell
    "texts": null,                // optional per-locale overrides object
    "abEnabled": false, "bTitle": null, "bBody": null
  },
  "migrationFrom": null           // onesignal | pushengage | webpushr | null
}
```

### POST /api/public/subscribe
Create or refresh a subscription. **Requires** the `Origin` header to
match the site's domain. The push endpoint must belong to a known push
service (FCM, Mozilla, Apple, Windows) — anything else is rejected
(`400`), which blocks SSRF-style abuse of the sender. Rate limit
30/min/IP.

```jsonc
// Request
{
  "siteId": "site-id",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/…",
    "keys": { "p256dh": "…", "auth": "…" }
  },
  "pageUrl": "https://blog.example.com/post",
  "tags": ["news"],
  "variant": "a"                  // optional: prompt A/B variant
}
// Response 201 — { "ok": true, "subscriberId": "…" }
```
Side effects: re-subscribing an endpoint previously stored as an
*imported* record converts it to a live subscription; a brand-new
subscriber triggers the site's welcome notification if configured.

### POST /api/public/tag
Add tags to an existing subscription. Origin-checked. Rate limit
30/min/IP.
```jsonc
{ "siteId": "…", "endpoint": "https://…", "tags": ["sports", "vip"] }
```

### POST /api/public/visit
"Subscriber is active" ping sent by the SDK at most once per day per
browser. Powers win-back audiences. Origin-checked; writes only when
the stored `last_seen_at` is older than 12 hours. Rate limit 60/min/IP.
```jsonc
{ "siteId": "…", "endpoint": "https://…" }   // → { "ok": true }
```

### POST /api/public/click
Click telemetry from the service worker. Not Origin-checked (service
workers send no `Origin` on this fetch); the body is only counters.
```jsonc
{ "campaignId": "…", "subscriberId": "…" }  // subscriberId optional
```

### GET /sw.js?siteId={id}
The service worker script (generated per site; sets
`Service-Worker-Allowed: /`). Host this at the **root** of the site
being subscribed — the WordPress plugin serves it automatically at
`/pushkit-sw.js`.

### GET /sdk.js
The browser SDK (7.1 KB minified). Embed:
```html
<script src="https://push.example.com/sdk.js" data-site="SITE_ID" async></script>
```
Optional attribute: `data-sw-path="/pushkit-sw.js"` when the service
worker is served under a different path (WordPress plugin).

---

## Sites (dashboard session)

### GET /api/sites
List sites with `subscriberCount`. **Owner only fields:** for staff,
`vapid_private_key` and `webhook_secret` are omitted from the response.

### POST /api/sites
Create a site. A VAPID key pair and a webhook secret are generated
server-side.
```jsonc
{ "name": "Example Blog", "domain": "blog.example.com",
  "url": "https://blog.example.com", "icon_url": "https://…/icon.png" }
// 201 → { "site": { … } }
```

### GET /api/sites/{id}
One site + `subscriberCount`. Same owner-only secret rule as the list.

### PATCH /api/sites/{id}
Update settings. Editable fields:
`name, domain, url, icon_url, prompt_title, prompt_body, prompt_allow,
prompt_deny, prompt_delay_seconds, prompt_scroll_percent,
prompt_icon_url, rss_feed_url, rss_auto_push, welcome_enabled,
welcome_title, welcome_body, welcome_url, prompt_style, prompt_texts`
(JSON string), `prompt_ab_enabled, prompt_b_title, prompt_b_body,
max_per_day, min_hours_between_sends, migration_from`.
Domain changes are **owner-only** (staff gets `403`).

### DELETE /api/sites/{id}
**Owner only.** Deletes the site and cascades to its subscribers,
campaigns, tags and daily stats.

### POST /api/sites/{id}/rotate
**Owner only.** Regenerates the site's webhook secret. Returns
`{ "webhook_secret": "…" }`. (VAPID keys are never rotated by this
endpoint — rotating them invalidates every existing subscription.)

---

## Campaigns (dashboard session)

### GET /api/campaigns?siteId={id}
List campaigns for a site, newest first. Without `siteId`, returns
recent campaigns across all sites.

### POST /api/campaigns
Create and send / schedule / save a campaign.

```jsonc
{
  "siteId": "site-id",
  "title": "New post: Edge caching, explained",   // max 120 chars (validated)
  "body": "How cache rules cut load time.",       // max 300 chars
  "url": "https://blog.example.com/edge-caching",
  "icon_url": null, "image_url": null,
  "actions": [{ "action": "read", "title": "Read now" }],   // max 2
  "audience": {
    "tag": "news",                 // single-tag filter
    "tags": ["news", "vip"],       // multi-tag (all must match)
    "country": "BD", "browser": "Chrome", "os": "Android",
    "engagedOnly": true,           // clicked in 90d or subscribed in 30d
    "inactiveDays": 14             // win-back: not seen for 14+ days
  },
  "action": "send",                // send | schedule | draft
  "scheduled_at": 1795250400000    // required for schedule (epoch ms)
}
// 201 → { "campaign": { …, "target_count": 88 }, "targets": 88 }
```
`target_count` is computed by the audience query at send time and
already excludes: imported (not yet re-subscribed) records, subscribers
who hit the site's daily send cap, and subscribers inside the site's
minimum-hours-between-sends window.

### POST /api/campaigns/fetch-metadata
Fetch Open Graph data to pre-fill the composer. Authenticated only;
private/reserved IP targets and non-public redirect hops are rejected.
```jsonc
{ "url": "https://blog.example.com/post" }
// → { "metadata": { "title": "…", "description": "…", "image": "…", "url": "…" } }
```

Campaign statistics are served by the dashboard page
`GET /dashboard/campaigns/{id}` (HTML): target, delivered, clicks, CTR,
gone-vs-error failure split, clicks by day, payload and audience recap.

---

## Subscribers (dashboard session)

### GET /api/subscribers?siteId={id}&limit=100
List subscribers (endpoints masked to the first 42 characters; keys are
never returned). Pass `?export=csv` to download the CSV export instead
(columns: id, site, country, browser, OS, device, page URL, created).

### POST /api/subscribers/import
Import an audience exported from another provider. Rows are stored as
**non-deliverable** records (`source: "import"`) and only become
sendable when the same browser re-subscribes through the PushKit SDK
(subscriptions are bound to the old provider's VAPID key — see
`docs/PLAN.md` G1). Max body 5 MB / 20,000 rows.

```jsonc
{
  "siteId": "site-id",
  "source": "onesignal",           // onesignal | pushengage | generic
  "csv": "player_id,identifier,web_auth,web_p256dh\n…"
}
// → { "ok": true, "inserted": 1820, "skipped": 40, "invalid": 12, "total": 1872 }
```
Column names are matched flexibly (`endpoint`/`identifier`/`subscription`,
`p256dh`/`web_p256dh`, `auth`/`web_auth`). Endpoints outside the known
push services count as `invalid`.

### DELETE /api/subscribers/{id}
Delete one subscriber record.

---

## Templates (dashboard session)

### GET /api/templates · POST /api/templates
List / create reusable campaign templates.
```jsonc
// POST
{ "name": "New post", "title": "…", "body": "…", "url": "https://…",
  "icon_url": null, "image_url": null, "actions": [] }
```

---

## Team (owner only)

### GET /api/team
Users + pending invites.

### POST /api/team
Invite a staff member. Creates a single-use invite link (7 days).
```jsonc
{ "email": "editor@example.com" }
// → { "inviteUrl": "https://push.example.com/invite/…" }
```
Staff can use the dashboard and send campaigns, but cannot: view or
rotate site secrets, change a site's domain, delete sites, manage the
team, edit email settings, export backups, or purge data.

### DELETE /api/team?id={userId} · DELETE /api/team?inviteId={id}
Remove a user / revoke a pending invite.

---

## Settings

### GET /api/settings/email · POST /api/settings/email · DELETE /api/settings/email  (owner only)
Read (masked: `configured`, `last4`, `from`), save, or remove the Resend
API key stored encrypted in D1. A key saved here takes precedence over
the `RESEND_API_KEY` secret.
```jsonc
// POST
{ "apiKey": "re_…", "from": "PushKit <auth@example.com>" }
```

### POST /api/settings/email/test  (owner only)
Send a test email to the owner: `{ "to": "owner@example.com" }`.

### GET /api/settings/export  (owner only)
Download the **full backup** as a JSON attachment
(`pushkit-export.json`): export timestamp, counts, and complete sites
(including VAPID keys and webhook secrets — it is a backup), subscribers
(with subscription keys), campaigns and templates. Treat the file as a
secret.

### POST /api/settings/purge  (owner only)
Delete subscribers whose push endpoint is gone (404/410 history) — body
`{ "siteId": "…" }` for one site or `{}` for all sites.

---

## Media

### POST /api/upload  (dashboard session)
Multipart upload, field `file`. Images only (PNG, JPEG, WebP, GIF,
SVG), max 2 MB. Stored in R2 under a random key.
```jsonc
// 201
{ "key": "uploads/1795…-ab12cd34.png", "url": "/api/media/uploads/…" }
```
Without the `MEDIA` R2 binding: `501`.

### GET /api/media/{key}
Public proxy for stored objects (notification images must be publicly
fetchable). Responses are cached for a day and served with
`Content-Security-Policy: sandbox` so uploaded SVGs can never execute
script in the app origin.

---

## Webhooks

### POST /api/webhooks/publish/{siteId}
Publish a campaign from an external system (CMS, WordPress plugin,
Zapier-style tools). Authenticate with **either**:

- `Authorization: Bearer <redacted>` — the site's webhook secret
  (Dashboard → Sites → site → Integration), or
- `X-PushKit-Signature: sha256=<hex>` — HMAC-SHA256 of the **raw**
  request body, keyed with the same secret.

Both comparisons are timing-safe. Bad or missing auth → `401`.

```jsonc
// Request
{
  "title": "New post published",            // required
  "body": "Edge caching, explained",        // required
  "url": "https://blog.example.com/edge-caching",
  "image": "https://blog.example.com/cover.jpg",
  "icon": "https://blog.example.com/icon.png",
  "tag": "news",                            // optional single-tag audience
  "scheduled_at": 1795250400000             // optional; omit to send now
}
// 201 → { "ok": true, "campaign": { …, "target_count": 88 }, "targets": 88 }
```

### RSS auto-push (no endpoint)
If a site has `rss_feed_url` set and `rss_auto_push` on, the 5-minute
cron polls the feed (conditional GET with stored ETag / Last-Modified)
and publishes new items as campaigns automatically. No API call needed.
