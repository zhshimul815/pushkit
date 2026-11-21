import type { Metadata } from "next";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";
import { DocsSidebar } from "@/components/docs-nav";
import { BreadcrumbsSchema } from "@/components/seo-schema";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Web Push API Reference | PushKit Developer Docs",
  description:
    "Complete Web Push API reference for PushKit. Authentication, public browser endpoints, publish webhooks with HMAC signatures, campaigns, and rate limits.",
  alternates: {
    canonical: `${SITE_URL}/docs/api`,
  },
  openGraph: {
    title: "Web Push API Reference | PushKit Developer Docs",
    description:
      "Complete Web Push API reference for PushKit on Cloudflare Workers.",
    url: `${SITE_URL}/docs/api`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Push API Reference | PushKit Developer Docs",
    description:
      "Complete Web Push API reference for PushKit on Cloudflare Workers.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function ApiDocsPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
    { name: "API Reference", path: "/docs/api" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <BreadcrumbsSchema items={breadcrumbs} />
      <MarketingHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row">
          <DocsSidebar activePath="/docs/api" />

          <article className="min-w-0 flex-1 space-y-10">
            <header className="border-b pb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Developer Reference
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                PushKit Web Push API Reference
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                All HTTP endpoints supported by your PushKit deployment. Base URL is your Cloudflare Worker domain (<code className="font-mono text-xs">https://pushkit.your-domain.workers.dev</code>).
              </p>
            </header>

            {/* Conventions */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">API Conventions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border bg-card p-4">
                  <span className="font-semibold text-foreground">Data Formats:</span>
                  <p className="mt-1 text-muted-foreground">JSON request/response bodies. Media uploads use <code className="font-mono text-[11px]">multipart/form-data</code>.</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <span className="font-semibold text-foreground">Errors:</span>
                  <p className="mt-1 text-muted-foreground">Standardized JSON: <code className="font-mono text-[11px]">&apos;{`{"error": "<message>"}`}&apos;</code> with HTTP 400, 401, 403, 404, 429, or 501.</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <span className="font-semibold text-foreground">Authentication:</span>
                  <p className="mt-1 text-muted-foreground">Secure <code className="font-mono text-[11px]">pushkit_session</code> cookie for Dashboard; Bearer token or HMAC-SHA256 for Webhooks.</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <span className="font-semibold text-foreground">Rate Limits:</span>
                  <p className="mt-1 text-muted-foreground">Auth requests: 5/min per IP. Public subscribe/clicks: 30–60/min per IP at the isolate layer.</p>
                </div>
              </div>
            </section>

            {/* Public API */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight">Public API (Client SDK)</h2>
              
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">GET</span>
                    <code className="text-sm font-semibold">/api/public/config?siteId=:siteId</code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fetches prompt configuration and public VAPID key. Cached at edge for 300 seconds.
                  </p>
                  <pre className="rounded bg-muted/60 p-3 font-mono text-xs overflow-x-auto">
{`{
  "id": "site_abc123",
  "name": "Daily Tech Blog",
  "vapidPublicKey": "BN4...",
  "prompt": {
    "title": "Stay updated",
    "style": "banner",
    "delaySeconds": 5
  }
}`}
                  </pre>
                </div>

                <div className="rounded-lg border bg-card p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">POST</span>
                    <code className="text-sm font-semibold">/api/public/subscribe</code>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registers a new web push subscription or updates an existing token.
                  </p>
                  <pre className="rounded bg-muted/60 p-3 font-mono text-xs overflow-x-auto">
{`// Request body
{
  "siteId": "site_abc123",
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BLm...",
      "auth": "xYz..."
    }
  },
  "tags": ["tech", "newsletter"]
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Webhook API */}
            <section id="webhook" className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Publish Webhook (CMS / CI Automation)</h2>
              <div className="rounded-lg border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">POST</span>
                  <code className="text-sm font-semibold">/api/webhook/publish</code>
                </div>
                <p className="text-xs text-muted-foreground">
                  Trigger an automated push campaign from your CMS, Ghost blog, or custom backend.
                </p>
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-foreground">Headers:</span>
                  <div className="rounded bg-muted/60 p-2 font-mono">
                    Authorization: Bearer YOUR_SITE_WEBHOOK_SECRET
                  </div>
                  <div className="text-muted-foreground mt-1">Or via HMAC header: <code className="font-mono">X-PushKit-Signature: sha256=...</code></div>
                </div>
                <pre className="rounded bg-muted/60 p-3 font-mono text-xs overflow-x-auto">
{`// Request payload
{
  "siteId": "site_abc123",
  "title": "New Breaking Story",
  "body": "Read the full analysis directly on the site.",
  "url": "https://dailytech.blog/news/123",
  "icon": "https://dailytech.blog/icon.png",
  "image": "https://dailytech.blog/banner.jpg"
}`}
                </pre>
              </div>
            </section>

            {/* Campaign API */}
            <section id="campaigns" className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Dashboard & Campaigns API</h2>
              <p className="text-sm text-muted-foreground">
                Dashboard actions are authenticated via the secure HTTP-only session cookie.
              </p>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-blue-600">GET</span>
                    <span className="font-mono">/api/campaigns?siteId=:siteId</span>
                  </div>
                  <span className="text-muted-foreground">List campaigns with metrics</span>
                </div>
                <div className="flex items-center justify-between rounded border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-emerald-600">POST</span>
                    <span className="font-mono">/api/campaigns</span>
                  </div>
                  <span className="text-muted-foreground">Create & queue campaign</span>
                </div>
                <div className="flex items-center justify-between rounded border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-blue-600">GET</span>
                    <span className="font-mono">/api/subscribers/export?siteId=:siteId</span>
                  </div>
                  <span className="text-muted-foreground">Download full CSV export</span>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
