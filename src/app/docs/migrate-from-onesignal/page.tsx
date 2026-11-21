import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";
import { DocsSidebar } from "@/components/docs-nav";
import { BreadcrumbsSchema, FAQSchema } from "@/components/seo-schema";
import { SITE_URL } from "@/lib/site-config";
import { ShieldAlert, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Migrate from OneSignal to Self-Hosted PushKit | Guide",
  description:
    "How to migrate from OneSignal to PushKit. Understand VAPID cryptographic limits, silent re-subscription, and step-by-step CSV subscriber transition.",
  alternates: {
    canonical: `${SITE_URL}/docs/migrate-from-onesignal`,
  },
  openGraph: {
    title: "Migrate from OneSignal to Self-Hosted PushKit | Guide",
    description:
      "Step-by-step guide to migrate from OneSignal to self-hosted PushKit on Cloudflare free tier.",
    url: `${SITE_URL}/docs/migrate-from-onesignal`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Migrate from OneSignal to Self-Hosted PushKit | Guide",
    description:
      "Step-by-step guide to migrate from OneSignal to self-hosted PushKit on Cloudflare free tier.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const MIGRATION_FAQS = [
  {
    question: "Can I directly send pushes to exported OneSignal endpoints?",
    answer:
      "No vendor can send to another vendor's existing endpoints. Web Push specifications (RFC 8292) mandate that browser endpoints are cryptographically signed by the original VAPID private key. Because OneSignal does not export your private key, direct sending fails authentication.",
  },
  {
    question: "Will returning subscribers see a prompt banner again?",
    answer:
      "No. If a user already gave notification permission in their browser settings, the PushKit SDK requests a new token silently in the background without showing an annoying prompt popup.",
  },
  {
    question: "How long does a full audience migration take?",
    answer:
      "Most publishers see 60% to 80% of active monthly visitors transition to PushKit within 30 to 45 days as readers revisit your site.",
  },
  {
    question: "Can I run OneSignal and PushKit at the same time during migration?",
    answer:
      "Yes. You can keep OneSignal active while installing the PushKit SDK to transition subscribers gradually before cancelling your paid plan.",
  },
];

export default function MigrateFromOneSignalPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
    { name: "Migrate from OneSignal", path: "/docs/migrate-from-onesignal" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <BreadcrumbsSchema items={breadcrumbs} />
      <FAQSchema items={MIGRATION_FAQS} />
      <MarketingHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row">
          <DocsSidebar activePath="/docs/migrate-from-onesignal" />

          <article className="min-w-0 flex-1 space-y-10">
            <header className="border-b pb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Migration Guide
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Migrate from OneSignal to Self-Hosted PushKit
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                Move your web push audience from expensive monthly SaaS tiers to your own Cloudflare infrastructure with zero downtime.
              </p>
            </header>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-amber-500" />
                <h2 className="text-xl font-bold tracking-tight">The Technical Reality: VAPID Key Binding</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every web push subscription generated in a visitor&apos;s browser is cryptographically locked to a specific VAPID key pair (Voluntary Application Server Identification). The browser push service (Google FCM, Apple Push Notification service, or Mozilla autopush) verifies this signature every time a push is delivered.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Proprietary SaaS platforms like OneSignal hold the private VAPID key on their servers and do not export it. Consequently, you cannot simply copy-paste endpoint tokens to another provider and send instantly.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                PushKit solves this via <strong>Silent Re-subscription</strong>. Since users have already granted browser-level notification permissions on your domain, the PushKit SDK generates fresh VAPID tokens immediately upon their next visit without prompting.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-tight">The 5-Step Migration Flow</h2>
              
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground">Step 1: Export CSV from OneSignal</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Log in to your OneSignal dashboard. Go to <strong>Audience &rarr; Subscriptions</strong>, filter for Web Push subscriptions, and click <strong>Export CSV</strong>. You will receive an email download link with your subscriber records.
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground">Step 2: Import CSV into PushKit</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    In your PushKit dashboard, select your site and navigate to <strong>Subscribers &rarr; Import CSV</strong>. Select provider format: <em>OneSignal</em>. PushKit registers the records in your Cloudflare D1 database with status <code className="rounded bg-muted px-1 font-mono text-[11px]">pending_migration</code>.
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground">Step 3: Replace the Client Script</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Remove the OneSignal SDK script tag and replace it with your 1-line PushKit embed or activate the PushKit WordPress plugin.
                  </p>
                  <pre className="mt-2 rounded bg-muted/60 p-3 font-mono text-xs overflow-x-auto">
                    <code>&lt;script src=&quot;https://pushkit.your-domain.workers.dev/sw.js&quot; data-site=&quot;YOUR_SITE_ID&quot; defer&gt;&lt;/script&gt;</code>
                  </pre>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground">Step 4: Silent Re-Subscription Activates</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    As visitors browse your articles or home page, the PushKit client SDK checks existing browser permissions. Finding permission already granted, it calls <code className="font-mono text-[11px]">registration.pushManager.subscribe()</code> with your PushKit VAPID public key.
                  </p>
                </div>

                <div className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-bold text-foreground">Step 5: Watch Records Flip to Active</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    In the PushKit dashboard, imported records automatically match against IP, user agent, or cookie IDs, immediately flipping their status from <code className="rounded bg-muted px-1 font-mono text-[11px]">pending</code> to <code className="rounded bg-emerald-500/10 text-emerald-600 px-1 font-mono text-[11px]">active</code>.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-lg border bg-muted/20 p-6">
              <h2 className="text-lg font-bold tracking-tight">Realistic Expectations for Publishers</h2>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>• <strong>Day 1–7:</strong> Your most engaged daily visitors (usually 25–40% of active readership) transition.</li>
                <li>• <strong>Day 30:</strong> 60–75% of your regular monthly audience is successfully converted onto PushKit.</li>
                <li>• <strong>Dormant subscribers:</strong> Readers who have not visited in 90+ days remain pending until their next visit. This naturally purges dead browser profiles that SaaS companies charge you for.</li>
              </ul>
            </section>

            <section className="space-y-4 border-t pt-8">
              <h2 className="text-xl font-bold tracking-tight">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {MIGRATION_FAQS.map((faq) => (
                  <div key={faq.question} className="rounded-lg border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-lg border bg-primary/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Compare features and savings</h3>
                <p className="text-xs text-muted-foreground">See how PushKit free tier compares with OneSignal Growth pricing.</p>
              </div>
              <Link
                href="/compare"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <span>View Full Comparison</span>
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
