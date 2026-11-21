import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/components/marketing";
import { BreadcrumbsSchema } from "@/components/seo-schema";
import { Button } from "@/components/ui/button";
import { SITE_URL, GITHUB_FEATURE_REQUEST_URL, X_URL, X_HANDLE } from "@/lib/site-config";
import { CheckCircle2, Clock, Sparkles, MessageSquare, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "PushKit Roadmap | Planned Features & Community Voting",
  description:
    "See what is shipped, in progress, and planned for PushKit. Vote on new features and suggest projects to be built as free, open-source Cloudflare tools.",
  alternates: {
    canonical: `${SITE_URL}/roadmap`,
  },
  openGraph: {
    title: "PushKit Roadmap | Planned Features & Community Voting",
    description: "Public roadmap for PushKit: see shipped, in-progress, and planned features.",
    url: `${SITE_URL}/roadmap`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PushKit Roadmap | Planned Features & Community Voting",
    description: "Public roadmap for PushKit: see shipped, in-progress, and planned features.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const SHIPPED = [
  "Multi-site support with independent VAPID keys",
  "Cloudflare free-tier backend (D1, Queues, R2, Workers)",
  "Campaign composer with URL metadata fetch & UTM tags",
  "Audience segmentation (browser, OS, device, country, tags)",
  "RSS/Atom auto-push polling every 5 minutes",
  "Silent re-subscription migration from OneSignal & PushEngage CSVs",
  "Publish webhook (Bearer or HMAC-SHA256 signature)",
  "A/B prompt variants and 4 built-in translations (Bangla, Hindi, Spanish, Portuguese)",
  "WordPress plugin integration",
];

const IN_PROGRESS = [
  "Advanced time-zone localized scheduled delivery",
  "Custom multi-step onboarding prompts (bell widget trigger)",
  "Full-text search across past campaigns and templates",
  "Expanded webhook events for subscriber lifecycle (subscribe, unsubscribe, click)",
];

const PLANNED = [
  "Native Ghost CMS integration and Ghost webhook handler",
  "Shopify abandoned cart & back-in-stock push triggers",
  "Automated recurring weekly digest campaigns",
  "Self-hosted analytics dashboard with geo-heatmaps",
  "Hosted PushKit managed tier (optional convenience hosting)",
];

export default function RoadmapPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Roadmap", path: "/roadmap" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <BreadcrumbsSchema items={breadcrumbs} />
      <MarketingHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <header className="border-b pb-8 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Public Roadmap
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            PushKit Development Roadmap
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            PushKit is developed transparently. Features are prioritized based on developer and publisher feedback. Follow on X or open a GitHub issue to propose new functionality.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <Button size="sm" render={<a href={GITHUB_FEATURE_REQUEST_URL} target="_blank" rel="noreferrer" />}>
              <MessageSquare className="mr-1.5 size-4" />
              Request a Feature
            </Button>
            <Button size="sm" variant="outline" render={<a href={X_URL} target="_blank" rel="noreferrer" />}>
              Vote & Follow @{X_HANDLE}
            </Button>
            <Button size="sm" variant="ghost" render={<Link href="/changelog" />}>
              View Changelog &rarr;
            </Button>
          </div>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Shipped */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-4">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <h2 className="text-lg font-bold">Shipped (v1.0)</h2>
            </div>
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {SHIPPED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-emerald-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* In Progress */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-4">
              <Clock className="size-5 text-amber-500" />
              <h2 className="text-lg font-bold">In Progress</h2>
            </div>
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {IN_PROGRESS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Planned */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-4">
              <Sparkles className="size-5 text-blue-500" />
              <h2 className="text-lg font-bold">Planned</h2>
            </div>
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              {PLANNED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Voting & Community Note */}
        <section className="mt-12 rounded-xl border bg-primary/5 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold">How Features Get Prioritized</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                Yang Kai builds open-source tools to replace expensive proprietary SaaS platforms. Reply on X (@{X_HANDLE}) or create a feature issue on GitHub to suggest what gets built next.
              </p>
            </div>
            <a
              href={X_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <span>Join Discussion on X</span>
              <ArrowRight className="size-4" />
            </a>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
