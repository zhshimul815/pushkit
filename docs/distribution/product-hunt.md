# Product Hunt launch kit (G10)

**Name:** PushKit

**Tagline (pick one, ≤ 60 chars):**
1. Web push notifications without the per-subscriber bill
2. OneSignal power, $0 forever — self-hosted on Cloudflare
3. Free, open-source web push you host yourself

**Description:**
PushKit is a free, open-source web push platform that runs entirely on your own
Cloudflare account (free tier). OneSignal charges $419/month at 100,000
subscribers; PushKit sends ≈130,000 pushes a day for $0, stores 1,000,000+
subscribers in your own database, and supports unlimited sites from one install.
Campaign composer with segmentation and scheduling, RSS auto-push, publish
webhook, welcome notifications, prompt styles with A/B testing, and analytics —
MIT licensed, no account, no per-subscriber pricing.

**Maker's first comment (draft):**
I built PushKit after watching push SaaS bills scale with audience size — the
bill grows exactly when your blog does. PushKit runs on Cloudflare's free tier
(Workers + D1 + Queues), so the marginal cost of a subscriber is zero and the
price can be too. The honest limits are on the compare page of the site —
including the one nobody talks about: you can't file-import subscribers from
another provider, because subscriptions are bound to their VAPID keys, so
PushKit migrates by silent re-subscription instead. Happy to answer anything
about the architecture (RFC 8291 encryption on Web Crypto, queue fan-out
batching, free-tier math).

**Assets checklist:**
- [ ] Logo (bell mark, 240×240)
- [ ] Gallery: landing hero, live dashboard demo capture, composer, compare table
- [ ] Link: GitHub repo + live landing page
- [ ] Topics: Open Source, Developer Tools, Marketing, SaaS
- [ ] Launch on a Tue–Thu, post maker comment within 5 minutes, reply all day
- [ ] Cross-post the launch thread to Hacker News (Show HN) the same morning
