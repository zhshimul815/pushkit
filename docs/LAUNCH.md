# PushKit Launch Checklist

Go from a fresh clone to a live, verified deployment. Everything here
assumes the Cloudflare **free** tier. Estimated time: 20–30 minutes.

## 1. Prerequisites

- [ ] Cloudflare account (free)
- [ ] Resend account (free) — needed **before first login**, because the
      login code itself is delivered by email
- [ ] Node.js 20+ and this repo cloned
- [ ] `npm install` completed

## 2. Create the Cloudflare resources

```bash
npx wrangler login
npx wrangler d1 create pushkit-db          # copy the database_id it prints
npx wrangler r2 bucket create pushkit-media
npx wrangler queues create pushkit-send
npx wrangler queues create pushkit-dlq     # dead-letter queue for failed batches
```

## 3. Configure `wrangler.toml`

These shipped values are placeholders — **launch will misbehave until
all of them are replaced**:

- [ ] `database_id` → the ID from step 2
- [ ] `[vars] NEXT_PUBLIC_APP_URL` → your real URL, e.g.
      `https://push.example.com` (magic links, webhook examples and the
      SDK snippet are built from it; `localhost` breaks all three)
- [ ] `[vars] OWNER_EMAIL` → your email (the only account that can
      bootstrap; there is no sign-up page)
- [ ] `[vars] EMAIL_FROM` → a sender on a **domain you verified in
      Resend** (SPF/DKIM), e.g. `PushKit <auth@yourdomain.com>`
- [ ] `[vars] VAPID_SUBJECT` → `mailto:you@yourdomain.com`

## 4. Secrets

```bash
npx wrangler secret put RESEND_API_KEY   # required for the first login
npx wrangler secret put SESSION_SECRET   # recommended: any long random string;
                                         # salts token hashes and encrypts the
                                         # Resend key if you later save one in
                                         # Dashboard → Settings → Email
```
Never commit secret values. `.gitignore` already excludes `.env*` and
`.dev.vars*`.

## 5. Database migrations

```bash
npm run db:migrate:remote
```
Applies `migrations/0001–0003` to the production D1. (Verified: a fresh
database migrates cleanly from zero.)

## 6. Deploy

```bash
npm run deploy        # opennextjs-cloudflare build + deploy
```
One Worker ships everything: the Next.js app, the queue consumer
(`pushkit-send`, batches of 40 subscribers, DLQ after 3 retries) and
both cron triggers (`*/5` campaigns + RSS, daily 03:00 UTC purge).

## 7. Custom domain (recommended)

- [ ] Workers & Pages → `pushkit` → Settings → Domains & Routes → add
      your domain/subdomain. Set `NEXT_PUBLIC_APP_URL` to match and
      redeploy if you change it afterwards.

## 8. Post-deploy smoke test (do all of these)

- [ ] Open the site: landing page loads, no console errors
- [ ] `/login` → request a code with `OWNER_EMAIL` → the email arrives
      (check Resend dashboard if not; verify the From domain)
- [ ] Log in → Dashboard → Sites → create your first site
- [ ] Copy the install snippet onto the site (or install the WordPress
      plugin from `wordpress/pushkit-web-push/`)
- [ ] Visit the site in a real browser → opt-in prompt appears →
      subscribe → the subscriber shows in Dashboard → Subscribers
- [ ] Send a test campaign to that subscriber → notification arrives;
      click it → the campaign stats page records the click
- [ ] Dashboard → Sites → open your site's Integration section → send a
      test webhook call (see `docs/API.md`) → campaign is created
- [ ] `npx wrangler queues list` and `npx wrangler tail` show no errors

## 9. Production hardening (10 minutes, worth it)

- [ ] **WAF rate rules** (Cloudflare dashboard → Security → WAF):
      rate-limit `/api/auth/*` and `/api/public/*` per IP. The app has
      built-in per-isolate limits; WAF rules are the durable layer.
- [ ] **Backups:** schedule a recurring `wrangler d1 export pushkit-db`
      or use Dashboard → Settings → Export All Data (JSON). Store the
      JSON file like a secret — it contains keys.
- [ ] **Uptime check** on `/` and `/login` (any free monitor).
- [ ] Run `npm audit` locally and review anything critical.
- [ ] Keep the deployment on the free tier until the dashboard's
      capacity numbers approach ~130K pushes/day; the step after that
      is Workers Paid ($5/mo, ≈13M pushes/mo) — no code change needed.

## 10. Launch distribution (assets ready in `docs/distribution/`)

- [ ] Submit the WordPress plugin (`wordpress-org.md`)
- [ ] Open the awesome-selfhosted PR (`awesome-selfhosted.md`)
- [ ] Product Hunt launch (`product-hunt.md`)
- [ ] Publish the "alternative" articles (`alternatives-content.md`)

## Troubleshooting quick hits

| Symptom | Likely cause |
|---|---|
| Login email never arrives | `RESEND_API_KEY` missing/invalid, or `EMAIL_FROM` domain not verified in Resend. Save a key in Settings → Email after first login if you prefer dashboard-managed keys — but the *first* login needs the secret. |
| Magic link lands on localhost | `NEXT_PUBLIC_APP_URL` still the placeholder — fix and redeploy. |
| Prompt never appears on your site | Service worker not at the site root, or the site domain in PushKit doesn't match the page's origin (subdomains are allowed). |
| Campaigns stuck "queued" | Queue consumer not running — check `wrangler queues list` shows a consumer for `pushkit-send` on the `pushkit` worker. |
| Subscribers imported but sends skip them | Expected: imported records become sendable only after those browsers re-subscribe via the SDK (VAPID key binding). See `docs/PLAN.md` G1. |
