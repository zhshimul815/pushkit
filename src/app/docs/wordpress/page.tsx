import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";
import { DocsSidebar } from "@/components/docs-nav";
import { BreadcrumbsSchema, FAQSchema } from "@/components/seo-schema";
import { SITE_URL } from "@/lib/site-config";
import { AlertTriangle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "WordPress Push Notifications Plugin Guide | PushKit",
  description:
    "Complete setup guide for the PushKit WordPress push notifications plugin. Connect to self-hosted Cloudflare Workers, root sw.js, and auto-push on publish.",
  alternates: {
    canonical: `${SITE_URL}/docs/wordpress`,
  },
  openGraph: {
    title: "WordPress Push Notifications Plugin Guide | PushKit",
    description:
      "Complete setup guide for the PushKit WordPress push notifications plugin on Cloudflare Workers.",
    url: `${SITE_URL}/docs/wordpress`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WordPress Push Notifications Plugin Guide | PushKit",
    description:
      "Complete setup guide for the PushKit WordPress push notifications plugin on Cloudflare Workers.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const WP_FAQS = [
  {
    question: "How does the WordPress root service worker work?",
    answer:
      "PushKit serves sw.js from your WordPress root domain or redirects it via rewrites. Browser security requires the service worker to be located at or above the notification scope to control pages site-wide.",
  },
  {
    question: "Does the WordPress plugin slow down post publishing?",
    answer:
      "No. Post publication triggers an asynchronous webhook to your Cloudflare Worker. The worker pushes tasks into a Cloudflare Queue in batches of 40, so publishing latency is unaffected.",
  },
  {
    question: "Can I send push notifications for custom post types in WordPress?",
    answer:
      "Yes. The PushKit WordPress plugin supports standard posts, pages, and custom post types (e.g. WooCommerce products, news articles, or podcast episodes).",
  },
  {
    question: "Is there any subscriber limit when using PushKit on WordPress?",
    answer:
      "No per-subscriber limits. PushKit stores over 1,000,000 subscribers in your Cloudflare D1 database on the free tier with zero ongoing subscription costs.",
  },
];

export default function WordPressGuidePage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
    { name: "WordPress Guide", path: "/docs/wordpress" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <BreadcrumbsSchema items={breadcrumbs} />
      <FAQSchema items={WP_FAQS} />
      <MarketingHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row">
          <DocsSidebar activePath="/docs/wordpress" />

          <article className="min-w-0 flex-1 space-y-10">
            <header className="border-b pb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Integration Guide
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                WordPress Push Notifications Plugin Setup
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                Connect your WordPress blog or news site to your self-hosted PushKit instance for automated web push broadcasts on publication.
              </p>
            </header>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Step 1: Download & Install Plugin</h2>
              <p className="text-sm text-muted-foreground">
                In your WordPress admin dashboard, navigate to <strong>Plugins &rarr; Add New</strong>, or clone the PushKit WordPress integration directly into your plugins directory:
              </p>
              <pre className="rounded-lg border bg-muted/60 p-4 font-mono text-xs overflow-x-auto">
                <code>wp-content/plugins/pushkit/</code>
              </pre>
              <p className="text-sm text-muted-foreground">
                Activate the plugin through the WordPress Plugins menu.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Step 2: Connect to Your PushKit Instance</h2>
              <p className="text-sm text-muted-foreground">
                Navigate to <strong>Settings &rarr; PushKit</strong> in WordPress. Enter your PushKit details from your Cloudflare worker deployment:
              </p>
              <div className="rounded-lg border bg-card p-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-foreground">PushKit Host URL:</span>{" "}
                  <code className="text-muted-foreground">https://pushkit.your-domain.workers.dev</code>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Site ID:</span>{" "}
                  <code className="text-muted-foreground">Generated in PushKit dashboard under Sites &rarr; New Site</code>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Publish Webhook Secret:</span>{" "}
                  <code className="text-muted-foreground">Site Webhook Secret (HMAC-SHA256 or Bearer)</code>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Step 3: Root Service Worker Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Web Push standards require the service worker (<code className="font-mono text-xs">sw.js</code>) to be scoped to the root of your domain. The PushKit WordPress plugin automatically handles this via WordPress rewrite rules.
              </p>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-4" />
                  <span>Nginx or Static Cache Notice</span>
                </div>
                <p className="mt-1">
                  If you run Nginx directly, ensure <code className="font-mono">/sw.js</code> is forwarded to WordPress index.php or served directly from the root path with header <code className="font-mono">Service-Worker-Allowed: /</code>.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Step 4: Automated Push on Publish</h2>
              <p className="text-sm text-muted-foreground">
                In the WordPress post editor, PushKit adds a sidebar panel: <strong>&quot;Send Web Push Notification&quot;</strong>.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-md border bg-muted/30 p-3">
                  <span className="font-semibold text-foreground">Automatic Mode:</span> Sends immediately when a post changes from draft/scheduled to published.
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <span className="font-semibold text-foreground">Featured Image:</span> Fetches your post featured thumbnail and embeds it as the notification media preview.
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t pt-8">
              <h2 className="text-xl font-bold tracking-tight">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {WP_FAQS.map((faq) => (
                  <div key={faq.question} className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-lg border bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Ready to deploy PushKit?</h3>
                <p className="text-xs text-muted-foreground">Set up your free Cloudflare worker backend in under 10 minutes.</p>
              </div>
              <Link
                href="/deploy"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <span>Follow Deploy Guide</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
