# PushKit — Gap Analysis, Implementation Plan & Cloudflare Optimization Plan

Date: 2026-11-21 · Scope: **web push only** (no mobile app push). Business model: **free**; a paid version may come later but nothing in this plan depends on it.
Basis: market research of 2026-11-21 (full report: research notes `pushkit-market-demand-20261121-0718`), plus a code audit of this repository.

> **Status (2026-11-21): IMPLEMENTED.** G1–G10 and optimizations O1–O7 are shipped
> (migration 0003, SDK 7.1 KB). Exceptions that are external by nature: the
> wordpress.org review itself, the awesome-selfhosted PR, and the Product Hunt
> launch — the plugin, listing copy, submission checklists and launch kit are
> in the repo (`wordpress/`, `docs/distribution/`), ready to submit.
> O4's overview-result cache was deferred deliberately: single-owner overview
> queries are a handful of indexed aggregates, and the config-response cache
> (the part that faces real traffic) is shipped.

---

## 1. What the research established

- Web-push software is a ~$1.9–2.5B market; web push is the fastest-growing channel segment (17.29% CAGR, Mordor) and SMEs the fastest-growing buyers.
- Demand for escaping per-subscriber pricing is **proven by money**: LaraPush sells a $499/$799 one-time self-hosted licence since 2021; one user runs 741,112 subscribers on a $6 VPS. OneSignal costs **$419/mo at 100,000 web subscribers** ($19 + $0.004/sub) and has shrunk its free tier twice (now capped at 10,000 subscribers per send). PushEngage free caps at 200 subscribers.
- Beachhead segment: **publishers/bloggers with 10,000–250,000 subscribers**, WordPress-heavy, concentrated in India / SE Asia / Latin America — audiences where SaaS per-subscriber pricing exceeds content revenue.
- **No open-source publisher campaign panel exists.** OSS push projects (Novu, ntfy, Gotify) are developer infrastructure/alerts. PushKit's gap is real.
- Switch barriers, in order: (1) hitting the 10k cap, (2) multi-domain bills, (3) distrust after free-tier cuts, (4) data control — **but the practical blocker is migration**: without a way to bring subscribers across, pricing pain alone doesn't move people.
- Platform risk is rising: Chrome (Oct 2025) **auto-revokes notification permission for high-volume, very-low-engagement sites**; Jan 2026 Push API rate limits for "disruptive" sites; iOS web push only for Home-Screen-installed web apps. Compliant defaults are now a feature, not a nicety.
- Do **not** market on "rivals sell your data" (historic allegation, no current evidence). Market **data location and control**.

## 2. What PushKit already has (audit summary)

Composer with Fetch URL Metadata, UTM builder, R2 image upload, 2 action buttons, device previews, Send/Schedule/Template · audience filters (country/device/browser/tag) · overview analytics + per-campaign Sent/Clicks/CTR · RSS auto-push (GUID-deduped) · publish webhook (Ghost + generic, Bearer/HMAC) · multi-site with per-site VAPID · prompt customizer (delay/scroll) · subscriber table + CSV export · templates · owner/staff RBAC · OTP/magic-link auth · Resend key in Settings (encrypted) · RFC 8291/8292 engine on Web Crypto · queue fan-out with batched counters · 404/410 auto-cleanup · 180-day purge.

## 3. Gaps — what is missing, and the implementation plan for each

### G1. Subscriber migration / import (Priority P0 — the #1 switch barrier)
**Missing:** any way to move from OneSignal/PushEngage/LaraPush to PushKit.
**Technical truth to design around:** a Web Push subscription is bound to the VAPID key used when the user subscribed. Endpoints exported from OneSignal **cannot** be sent to with PushKit's new VAPID keys (push services reject them). So migration = structured re-subscription, not file import alone.
**Plan:**
1. `POST /api/subscribers/import` (owner/staff): CSV import (OneSignal export format, PushEngage format, generic endpoint CSV) into a `migrated` audience list per site — used for counting and targeting the migration campaign, stored with source + original subscribe date.
2. SDK migration mode: site setting `migration_from = onesignal|pushengage`. When enabled, `sdk.js` detects a returning visitor, checks for an existing PushManager subscription, and if the stored subscription's applicationServerKey differs from PushKit's, re-subscribes silently where the browser allows (permission already granted → `pushManager.subscribe` with the new key usually succeeds without a prompt) and posts the new subscription. This converts a large share of the old base with zero user friction.
3. Migration guide page in the dashboard: steps, expected re-capture rates (permission-granted users re-subscribe silently; the rest need one prompt visit), and a "dual-run" checklist.
**Effort:** import endpoint + UI 1 day; SDK detection/re-subscribe 1 day; guide 0.5 day.

### G2. WordPress plugin (P0 — the #1 acquisition channel)
**Missing:** PushKit is snippet-only; the beachhead lives on WordPress and the OneSignal WP plugin has 100,000+ installs.
**Plan:** a plugin `pushkit-web-push` for wordpress.org:
1. Settings screen: PushKit URL + Site ID (validates against `/api/public/config`).
2. Injects the snippet automatically; serves `sw.js` at the site root via a rewrite rule + virtual file endpoint (the standard technique OneSignal's plugin uses).
3. Auto-push on post publish: calls the site's publish webhook with the post title/excerpt/URL/image (the webhook already exists — the plugin is a thin client).
4. Prompt controls mirrored from the PushKit site settings; WooCommerce hooks (order shipped etc.) deferred to a later version.
**Effort:** 2–3 days incl. wordpress.org submission assets. Submission review time is external.

### G3. Chrome-2026 engagement protection (P0 — platform risk)
**Missing:** nothing stops an owner from blasting low-engagement sends that get their domain's permission auto-revoked by Chrome.
**Plan:**
1. Per-subscriber engagement tracking: `last_clicked_at` + `campaigns_received`/`campaigns_clicked` counters on the subscriber row (updated in the existing batched paths — click handler already touches the campaign; extend to subscriber).
2. Audience option **"Engaged only"**: skip subscribers with no click in the last N campaigns/days (default preset 90 days) — one checkbox in the composer audience section.
3. Health warnings: site card shows 30-day CTR; below 1% CTR with high volume → warning banner in the dashboard ("Chrome may revoke permission for low-engagement sites") with a link to the engaged-only send.
4. Frequency cap per site: max notifications per subscriber per day (default 3), enforced in `findSubscribersForAudience` via a `last_sent_at` check.
**Effort:** 1.5 days.

### G4. Per-campaign statistics page (P1)
**Missing:** campaign detail view — the history table shows totals only.
**Plan:** `/dashboard/campaigns/[id]`: KPI cards (target, sent, failed, clicks, CTR), clicks-by-day chart (needs a `campaign_daily` rollup written by the click handler — one upsert per click-day, batched like other counters), delivery breakdown (failed reasons aggregated: gone vs error), audience used, payload recap with preview.
**Effort:** 1 day (+ rollup table migration).

### G5. Welcome push + triggered sends (P1 — triggered CTR is 3.00% vs 0.81% broadcast in PushEngage benchmarks)
**Missing:** any automation beyond RSS/webhook.
**Plan (web-only triggers):**
1. Welcome notification: per-site optional title/body/URL sent immediately on subscribe (delivered via a single-message queue job, not a campaign).
2. Return-visit trigger: SDK reports `last_visit_at`; a cron segment "subscribed ≥7 days, no visit in 7 days" usable as a composer audience preset (win-back).
3. Drip sequences are explicitly **out of scope for now** (complexity vs. value at this scale); welcome + win-back cover the proven-CTR cases.
**Effort:** welcome 0.5 day; win-back preset 0.5 day.

### G6. Prompt growth tools (P1)
**Missing:** one prompt style, no experimentation.
**Plan:** two additional prompt styles in the customizer (bell widget bottom-left; top bar), prompt text per language (browser language match, fallback default), and a simple 50/50 A/B on prompt variant with opt-in rate recorded in daily stats.
**Effort:** 1.5 days.

### G7. Full data portability (P1 — trust feature, cheap)
**Missing:** export contains endpoints but the trust story ("your data") is stronger with complete export.
**Plan:** owner-only **Export everything (JSON)**: sites, subscribers with keys/tags, campaigns, templates — one download from Settings. Plus per-subscriber delete API already effectively covered by purge; add GDPR-style single delete in the subscribers table.
**Effort:** 0.5 day.

### G8. Deliverability & health view (P2)
**Missing:** visibility into send failures by push service.
**Plan:** counters per campaign for `failed_gone` (404/410) vs `failed_error`, surfaced on the campaign page (G4); a system line on Overview: active endpoints by service (FCM/Mozilla/Apple/Windows) from endpoint hostnames.
**Effort:** 0.5 day (rides on G4).

### G9. Localization for the beachhead (P2)
**Missing:** English-only dashboard and prompts.
**Plan:** prompt/SDK strings first (they face the audience): SDK UI strings in EN/BN/HI/ES/PT via config; dashboard i18n deferred.
**Effort:** 1 day for SDK strings.

### G10. Distribution assets (P1, non-code)
awesome-selfhosted submission, Product Hunt / Hacker News launch, "OneSignal alternative" and "LaraPush alternative" landing content (the /compare page ships now), migration docs (G1.3), YouTube walkthrough script for publisher communities.
**Effort:** ongoing, ~0.5 day per asset.

### Explicitly out of scope (per product direction)
Mobile app push (Android/iOS native), email/SMS/WhatsApp channels, e-commerce/Shopify features, multi-tenant SaaS billing (a paid version is undecided; the single-owner architecture stays, but code keeps the store abstraction so a future hosted tier remains possible without a rewrite).

## 4. Cloudflare optimization plan — get the most out of the free tier

Free-tier budgets (Cloudflare published): Workers **100,000 requests/day** · Queues **10,000 operations/day** · D1 **5,000,000 rows read/day**, **100,000 rows written/day**, **500 MB per database (5 GB total)** · R2 **10 GB**, 1M Class-A + 10M Class-B ops/month · Cron triggers included.

### O1. Fix the queue consumer batch alignment (correctness + capacity)
**Now:** `BATCH_SIZE = 30` subscribers/message, consumer `max_batch_size = 10` → one invocation can attempt up to 300 push fetches, far over the free tier's **50 subrequests per invocation** — deliveries would fail mid-batch at scale.
**Optimized:** `BATCH_SIZE = 40`, `max_batch_size = 1`. Per invocation: 40 push fetches + 1 D1 batch read + 1 counter write + ≤ a few deletes ≈ **43–46 subrequests < 50**. ✔
**Gain:** deliveries/day = ⌊10,000 ops ÷ 3 ops per message⌋ × 40 = 3,333 × 40 = **133,320/day** (from ~100,000).

### O2. One D1 read per batch, zero per-subscriber reads
Consumer fetches all 40 subscriptions with a single `WHERE id IN (...)` query (already the design); keep it that way — never loop single-row reads. Rows read per campaign of 100,000: 100,000 rows ≈ 2% of the daily read budget.

### O3. Write discipline (D1 writes are the scarcest budget after Queue ops)
- Campaign counters: one batched `UPDATE` per queue message (already) → 1 write per 40 deliveries.
- Clicks: one counter write per click is acceptable (≈2–3% of sends ≈ ≤4,000/day at full tilt). The campaign-daily rollup (G4) adds ≤1 write per click — batch by flushing per cron tick instead if CTR volume grows.
- `last_seen_at`: update **only when older than 24h** (conditional `UPDATE ... WHERE last_seen_at < now-24h`) — removes a write from repeat subscribes/visits.
- Sessions: sliding-expiration touch already throttled to once/day; keep.
**Total write load at maximum free-tier sending:** ≈3,400 (counters) + ≈4,000 (clicks) + new subs — **under 10% of the 100,000/day write budget.**

### O4. Worker request discipline
- `sdk.js` is a static asset (Workers Assets) — no function invocation cost beyond the request itself.
- `/api/public/config`: add `Cache-Control: public, max-age=300, stale-while-revalidate=600` — repeat page views across a site hit the Cloudflare cache instead of the Worker for 5 minutes; config changes propagate within 5 minutes.
- Landing/marketing pages are static (SSG) — served from assets.
- Dashboard loads: Overview aggregates are the heaviest reads; cache the overview payload in a `settings` row refreshed by the 5-minute cron (`overview_cache`), dashboard reads 1 row. (Phase 2 — current queries are fine at single-owner scale; listed so the headroom is documented.)

### O5. RSS polling efficiency
Conditional GET (`If-None-Match` / `If-Modified-Since`, store ETag per site): unchanged feeds cost a 304 with no body download and no parse. Only sites with auto-push enabled are polled (already). One cron invocation polls all due feeds + due scheduled campaigns (already combined).

### O6. R2 discipline
Notification images are write-once, read-many: serve through `/api/media` with `Cache-Control: public, max-age=31536000, immutable` (already) → almost all reads are cache hits; Class-B ops stay negligible. Cap uploads at 2 MB (already).

### O7. Payload discipline
Push payload ≤ 3,993 bytes (enforced in the engine); icon/hero by URL, never inline — keeps encryption inside the 10 ms CPU budget and avoids oversized-payload failures.

### Resulting capacity — the official stats (used on the landing page, /compare, /deploy, README)

| Stat | Value | Derivation |
|---|---|---|
| Pushes / day (free) | **≈130,000** | 10,000 Queue ops ÷ 3 ops/message = 3,333 messages × 40 subscribers (O1) |
| Pushes / month (free) | **≈4,000,000** | 133,320 × 30 |
| Subscribers stored | **1,000,000+** | D1 500 MB per database on free; subscriber row with endpoint, keys, tags and indexes is under 500 bytes → 1,000,000+ subscribers in one database |
| New subscribers / day | **10,000s** | 1 request + 1 write each; bounded by shared daily budgets, far above beachhead needs |
| Sites | **Unlimited** | Sites are D1 rows; no per-site cost |
| Monthly cost | **$0** | All resources inside free allowances |
| Workers Paid ($5/mo) pushes | **≈13,000,000 / month** | 1,000,000 included Queue ops ÷ 3 × 40 = 13.3M; requests allowance 10M/month included, then $0.30/M; D1 paid allowances: 50M rows written/month included |

Honesty rules for all marketing copy: say **"unlimited subscribers"** (storage-bound, true at any realistic scale) and the computed push numbers with "≈"; never "unlimited sends". When free Queue ops are exhausted, sends queue up and resume at the daily reset — nothing is lost.

## 5. Sequencing

| Phase | Items | Why first |
|---|---|---|
| **Now (this change)** | O1 batch alignment + stats recompute; landing rebuilt on research (live dashboard demo, no screenshots); /compare page incl. free-limit + $5-plan tables | Makes the public claims true and aimed at the proven pain |
| **Phase 1** | G1 migration (import + SDK re-subscribe + guide), G2 WordPress plugin | Removes the #1 switch barrier; opens the #1 channel |
| **Phase 2** | G3 engagement protection, G4 campaign stats page (+G8), O4 overview cache | Retention + platform-risk safety for growing senders |
| **Phase 3** | G5 welcome/win-back, G6 prompt tools, G7 full export, G9 SDK i18n | Growth features once acquisition flows exist |
| **Ongoing** | G10 distribution assets | Compounding channel |

## 6. Success measures

GitHub stars/forks and self-host reports (issues), wordpress.org active installs once G2 ships, migration imports run (G1), and the ratio of installs that send a first campaign within 24h (activation). No vanity metrics; these four decide whether the demand hypothesis is converting.
