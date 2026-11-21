# Competitive & UI Research — PushKit

Date: 2026-11-21. Sources checked live before coding.

## LaraPush (self-hosted, one-time $499 / $799)
- Positioning: self-hosted, unlimited domains, unlimited subscribers, unlimited sends, no recurring slab pricing.
- Composer: title, body, image, icon, target URL, segmentation before send.
- Segmentation: 6 parameters including URL-based, geo, device.
- Analytics: campaign reports, location / device / OS breakdown, subscriber growth.
- Automation: auto-push on new WordPress post, AMP compatibility.
- Takeaway for PushKit: match unlimited + multi-domain as the headline, keep composer on one screen, never meter subscribers.

## OneSignal (SaaS)
- Composer: title, subtitle, message, image, icon, launch URL, action buttons, delivery schedule, audience segments.
- Opt-in: customizable permission prompt, slide-down prompt, timing controls.
- Segmentation: language, session count, last visited, custom data tags.
- Analytics: delivery, clicks, CTR, influenced opens, real-time status per campaign.
- Pricing pain point: free capped at 10,000 subscribers, then per-subscriber billing.
- Takeaway: data tags (`window.PushKit.tag()`), UTM builder, live device preview, CTR as primary KPI.

## PushEngage (SaaS)
- Composer: multi-action notifications, large image, expiry, UTM parameters pre-built.
- Segmentation: geo, browser, device, interests, custom attributes.
- Automation: RSS auto-push, drip, triggered campaigns, opt-in reminders.
- Analytics: campaign CTR, subscriber stats, goal / revenue tracking, browser & device split.
- Takeaway: RSS auto-push and publish webhook are first-class per-site settings, not add-ons.

## Common pattern adopted
1. Composer = Fetch URL Metadata → Title / Body / URL / Image / Icon / ≤2 Actions → Audience filter → Preview → Send Now / Schedule / Save as Template.
2. Analytics = KPI cards (Subscribers, Sent, CTR) + time-series (7d/30d/90d) + breakdowns (Country, Device, Browser, OS) using batched counters, never per-delivery rows.
3. Segmentation = Country, Device, Browser, OS, Custom Tag, Subscribed Page URL.

## 7Ovr registry (`@7ovr`)
- Registry endpoint verified live 2026-11-21: `https://7ovr.com/r/{name}.json` returns 200 for `dashboard-1`, `auth-8`, `header-2`.
- `dashboard-1`: "Overview With Range Select" — date-range select drives 4 stat cards above a monthly sessions bar chart. Dependencies: `recharts`, `@base-ui/react`; registry deps: badge, card, chart, select.
- Registry: 248 items, built on Base UI + Tailwind, blocks land in `src/components/blocks/`.
- PushKit configures `components.json` with `"@7ovr": "https://7ovr.com/r/{name}.json"` and installs: dashboard, app-shell-3, dashboard-1, charts-3, table-1, auth-8, error-1, error-2, header-2, features-1, features-3, faqs-2, footer-1. Where a block needs adaptation (auth-8 signup links removed), the adapted copy lives in `src/components/blocks/` with provenance noted.

## Modern developer-tool UI principles applied
- Light-mode first, dark mode via class, generous whitespace, 1px borders over shadows.
- One accent color, neutral zinc surfaces, crisp 14px base type, tabular numbers for metrics.
- No gradients, no decorative blobs, no marketing filler. Labels are exact: "Active Subscribers", "CTR", "VAPID Public Key", "Send Now".
- Sidebar app shell, sticky table headers, skeleton-free server-rendered first paint.
