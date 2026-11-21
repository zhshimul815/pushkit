=== PushKit Web Push ===
Contributors: pushkit
Tags: web push, push notifications, onesignal alternative, self-hosted, free
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Free web push notifications for WordPress — self-hosted on Cloudflare's free tier with PushKit. No per-subscriber pricing, no subscriber caps.

== Description ==

PushKit is a free, open-source web push platform you host yourself on your own Cloudflare account (free tier). This plugin connects your WordPress site to your PushKit install:

* Injects the PushKit SDK automatically — no theme edits.
* Serves the service worker at your site root (`/pushkit-sw.js`), as web push requires.
* Optionally auto-pushes every new post (title, excerpt, link, featured image) through the PushKit publish webhook.

Why self-host your push notifications?

* **$0 per subscriber, forever.** SaaS tools charge per subscriber — OneSignal's published pricing reaches $419/month at 100,000 subscribers. PushKit on Cloudflare's free tier sends ≈130,000 pushes/day at $0.
* **Unlimited subscribers and sites.** One PushKit install serves every site you own.
* **Your data stays yours.** Subscriber endpoints and keys live in your own database — export them any time.
* **Full feature set.** Campaign composer with segmentation (country, device, browser, OS, tags), scheduling, RSS auto-push, analytics with CTR, welcome notifications, prompt styles and A/B testing.

You need a (free) PushKit install first — deployment takes about 10 minutes on Cloudflare's free tier. See the PushKit repository for the deploy guide.

== Installation ==

1. Deploy PushKit (see the project repository) and add your WordPress site in the PushKit dashboard.
2. Install and activate this plugin.
3. Go to Settings → PushKit and paste your PushKit URL, Site ID, and (for auto-push) the site's webhook secret.
4. Done — the opt-in prompt appears on your site per your PushKit prompt settings.

== Frequently Asked Questions ==

= Is PushKit really free? =
Yes. PushKit is MIT-licensed open source and runs on Cloudflare's free tier. There is no PushKit bill and no paid tier. If you outgrow the free tier, Cloudflare Workers Paid is $5/month for ≈13,000,000 pushes/month.

= Can I migrate from OneSignal? =
Yes — with one honest caveat that applies to every provider switch: subscriptions are bound to the old provider's keys, so migration works by re-subscription. PushKit's SDK silently re-subscribes returning visitors who already granted permission, and the dashboard tracks how much of your imported list has converted.

= Which browsers are supported? =
Chrome, Edge, Firefox and Opera on desktop and Android, Safari on macOS. On iPhone, web push requires the site to be added to the Home Screen (an Apple platform rule for every provider).

== Changelog ==

= 1.0.0 =
* Initial release: SDK injection, root service worker, settings page, auto-push on publish via webhook.
