import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";
import { DocsSidebar } from "@/components/docs-nav";
import { BreadcrumbsSchema } from "@/components/seo-schema";
import { SITE_URL } from "@/lib/site-config";
import {
  Rocket,
  Globe,
  Layers,
  Send,
  ArrowLeftRight,
  Code2,
  Wrench,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Web Push Notifications Documentation | PushKit Docs",
  description:
    "Task-based documentation for PushKit: self-hosted web push notifications on Cloudflare free tier. Deploy guides, WordPress setup, API, and migration.",
  alternates: {
    canonical: `${SITE_URL}/docs`,
  },
  openGraph: {
    title: "Web Push Notifications Documentation | PushKit Docs",
    description:
      "Task-based documentation for PushKit: self-hosted web push notifications on Cloudflare free tier.",
    url: `${SITE_URL}/docs`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Push Notifications Documentation | PushKit Docs",
    description:
      "Task-based documentation for PushKit: self-hosted web push notifications on Cloudflare free tier.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const DOC_TASKS = [
  {
    title: "1. Install & Deploy PushKit",
    description: "Deploy the worker, D1 database, R2 bucket, and queues to your Cloudflare account in 10 minutes.",
    href: "/deploy",
    icon: Rocket,
    badge: "Cloudflare Free Tier",
  },
  {
    title: "2. Add Your First Website",
    description: "Generate independent VAPID key pairs, configure opt-in prompts (banner, bar, bell), and embed the script.",
    href: "/deploy#step-9",
    icon: Globe,
    badge: "Multi-site",
  },
  {
    title: "3. WordPress Plugin Setup",
    description: "Install the official PushKit WordPress plugin to automate push broadcasts on post publish.",
    href: "/docs/wordpress",
    icon: Layers,
    badge: "WordPress",
  },
  {
    title: "4. Send Your First Campaign",
    description: "Draft rich pushes with UTM tags, image banners, audience segments, and delivery pacing.",
    href: "/docs/api#campaigns",
    icon: Send,
    badge: "Campaign Composer",
  },
  {
    title: "5. Migrate from OneSignal",
    description: "Import your subscriber lists and execute silent re-subscription without annoying active readers.",
    href: "/docs/migrate-from-onesignal",
    icon: ArrowLeftRight,
    badge: "OneSignal Migration",
  },
  {
    title: "6. Web Push API Reference",
    description: "HTTP endpoints for public subscribe flows, publish webhooks, campaigns, and subscriber exports.",
    href: "/docs/api",
    icon: Code2,
    badge: "REST API",
  },
];

export default function DocsPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <BreadcrumbsSchema items={breadcrumbs} />
      <MarketingHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row">
          <DocsSidebar activePath="/docs" />

          <article className="min-w-0 flex-1">
            <div className="border-b pb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Documentation Hub
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Web Push Notifications Documentation
              </h1>
              <p className="mt-3 text-base text-muted-foreground">
                PushKit is an open-source, self-hosted web push platform that runs on Cloudflare free tier.
                Everything you need to deploy, integrate, send campaigns, and automate alerts.
              </p>
            </div>

            <section className="mt-8">
              <h2 className="text-xl font-bold tracking-tight">Task-Based Guides</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {DOC_TASKS.map((task) => {
                  const Icon = task.icon;
                  return (
                    <Link
                      key={task.title}
                      href={task.href}
                      className="group flex flex-col justify-between rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                          <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {task.badge}
                          </span>
                        </div>
                        <h3 className="mt-4 text-base font-semibold group-hover:text-primary">
                          {task.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center text-xs font-medium text-primary">
                        <span>Read guide</span>
                        <ArrowRight className="ml-1 size-3 transition group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-12 rounded-lg border bg-muted/20 p-6">
              <div className="flex items-center gap-3">
                <Wrench className="size-5 text-primary" />
                <h2 className="text-lg font-bold tracking-tight">Troubleshooting Common Issues</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Missing R2 Bucket (501 on media upload):</strong> Ensure
                  you ran <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">npx wrangler r2 bucket create pushkit-media</code> before
                  deploying.
                </li>
                <li>
                  <strong className="text-foreground">iOS Safari Push Notifications:</strong> Apple requires web
                  apps to be added to the iPhone Home Screen (PWA mode) before Web Push permissions can be granted.
                </li>
                <li>
                  <strong className="text-foreground">Daily Queue Throttle:</strong> Cloudflare free tier processes
                  up to 10,000 queue operations/day (≈130,000 pushes/day). Pushes pause when hitting daily limits and resume automatically at midnight UTC without dropping subscribers.
                </li>
              </ul>
            </section>
          </article>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
