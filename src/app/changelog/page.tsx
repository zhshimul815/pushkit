import type { Metadata } from "next";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";
import { BreadcrumbsSchema } from "@/components/seo-schema";
import { SITE_URL, GITHUB_REPO_URL } from "@/lib/site-config";
import { GitCommit, Tag, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "PushKit Changelog | Release History & Updates",
  description:
    "Follow PushKit releases and updates. Open-source self-hosted web push platform updates, performance improvements, and bug fixes.",
  alternates: {
    canonical: `${SITE_URL}/changelog`,
  },
  openGraph: {
    title: "PushKit Changelog | Release History & Updates",
    description: "Release history and changelog for PushKit web push platform.",
    url: `${SITE_URL}/changelog`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PushKit Changelog | Release History & Updates",
    description: "Release history and changelog for PushKit web push platform.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const RELEASES = [
  {
    version: "v1.0.0",
    date: "November 21, 2026",
    tag: "Initial Public Release",
    highlights: [
      "Full self-hosted platform deployment on Cloudflare Free Tier (D1, Queues, R2, Workers).",
      "Multi-site management with isolated per-site VAPID key generation.",
      "Campaign composer with automatic OpenGraph metadata extraction and UTM tagging.",
      "Batch worker queue engine delivering ≈130,000 pushes/day on free tier.",
      "Segmentation by browser, OS, country, device type, tags, and engagement recency.",
      "RSS and Atom feed automated polling with 5-minute interval cron triggers.",
      "Silent re-subscription migration tool supporting OneSignal and PushEngage CSV exports.",
      "Secure publish webhook supporting Bearer tokens and HMAC-SHA256 signatures.",
      "Customizable opt-in prompts (banner, top bar, bell widget) with A/B variant testing.",
      "Localized prompt strings with built-in translations (Bangla, Hindi, Spanish, Portuguese).",
      "WordPress plugin integration for instant push alerts on post publication.",
    ],
  },
];

export default function ChangelogPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Changelog", path: "/changelog" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <BreadcrumbsSchema items={breadcrumbs} />
      <MarketingHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <header className="border-b pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Release History
              </span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                PushKit Changelog
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                All notable changes and releases to the PushKit platform.
              </p>
            </div>
            <a
              href={`${GITHUB_REPO_URL}/releases`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 self-start rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <span>GitHub Releases</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
          </div>
        </header>

        <div className="mt-10 space-y-12">
          {RELEASES.map((release) => (
            <section key={release.version} className="relative pl-6 sm:pl-8 border-l border-muted-foreground/20">
              <div className="absolute -left-2 top-0 flex size-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                  <Tag className="size-3" />
                  {release.version}
                </span>
                <span className="text-xs text-muted-foreground">{release.date}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {release.tag}
                </span>
              </div>

              <div className="mt-4 rounded-xl border bg-card p-6 shadow-sm">
                <h2 className="text-sm font-bold text-foreground">What&apos;s Included in {release.version}:</h2>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {release.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <GitCommit className="size-3.5 shrink-0 text-primary mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
