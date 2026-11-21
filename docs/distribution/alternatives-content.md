# "Alternative" SEO content outlines (G10)

Channel #2 from the market research: search content for people actively
comparing push providers. Publish on the PushKit site (blog/docs) and Dev.to /
Hashnode. All figures from the research notes (Nov 2026) — re-verify prices
before publishing.

## Article 1 — "OneSignal Alternative: The Free, Self-Hosted Option"
- The 10,000-subscriber free cap, and the two free-tier cuts that preceded it
- The real Growth bill at 10k / 50k / 100k / 1M ($59 / $219 / $419 / $4,019)
- What "self-hosted on Cloudflare free tier" means in practice (deploy in ~10 min, $0/mo)
- Migration honesty: re-subscription, not file import — and how PushKit automates it
- When OneSignal is still the right choice (native mobile push, enterprise support, huge same-day blasts)

## Article 2 — "LaraPush Alternative: Same Idea, $0 and Open Source"
- LaraPush's model ($499/$799 + VPS) vs PushKit ($0, Cloudflare free tier, MIT)
- Server maintenance vs serverless: who patches what
- Feature matrix (composer, segmentation, RSS, webhook, analytics, multi-site)
- The trust angle: open source you can audit vs a licence — and LaraPush's review-profile gap
- When LaraPush is still the right choice (you want a traditional PHP/Laravel stack you fully control at the OS level)

## Article 3 — "How Many Push Notifications Can Cloudflare's Free Tier Actually Send?"
- The free-tier resource table and the batching math (40/queue message, 3 ops/message → ≈130k/day)
- The 50-subrequest trap and how the fan-out avoids it
- What happens at the limit (pause + resume, nothing lost)
- The $5 Workers Paid step (≈13M/month) vs $419/mo SaaS at the same audience size
