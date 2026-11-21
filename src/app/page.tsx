import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Database,
  FileCode2,
  Globe,
  Layers,
  Lock,
  Megaphone,
  MousePointerClick,
  Rss,
  Send,
  Sparkles,
  Tags,
  Trash2,
  Users,
  Webhook,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import StatsBlock from "@/components/blocks/stats-3";
import { CloudflareIcon, CodeGlassIcon, GitHubIcon, OneSignalIcon, WordPressIcon, XIcon } from "@/components/icons";
import { MacNotificationShowcase } from "@/components/mac-notification-showcase";
import { SoftwareApplicationSchema, FAQSchema } from "@/components/seo-schema";
import {
  SITE_URL,
  GITHUB_REPO_URL,
  GITHUB_DISCUSSIONS_URL,
  GITHUB_FEATURE_REQUEST_URL,
  X_URL,
  X_HANDLE,
} from "@/lib/site-config";

// Lazy-load the dashboard demo below the fold for Core Web Vitals optimization
const LandingDemo = dynamic(
  () => import("@/components/landing-demo").then((mod) => mod.LandingDemo),
  {
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-xl border bg-card text-xs text-muted-foreground">
        Loading live interactive dashboard preview...
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Free Web Push Notifications | Self-Hosted PushKit",
  description:
    "Free web push notifications on Cloudflare free tier. Unlimited subscribers, multi-site isolation, RSS auto-push, and zero per-subscriber pricing. Open source.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Free Web Push Notifications | Self-Hosted PushKit",
    description:
      "Free web push notifications on Cloudflare free tier. Unlimited subscribers, multi-site isolation, RSS auto-push, and zero per-subscriber pricing.",
    url: SITE_URL,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Web Push Notifications | Self-Hosted PushKit",
    description:
      "Free web push notifications on Cloudflare free tier. Unlimited subscribers, multi-site isolation, RSS auto-push, and zero per-subscriber pricing.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const COMPACT_COST_ROWS = [
  { subs: "10,000 subscribers", onesignal: "$59 / mo", pushkit: "$0 / mo", savings: "Save $708 / year" },
  { subs: "100,000 subscribers", onesignal: "$419 / mo", pushkit: "$0 / mo", savings: "Save $5,028 / year" },
  { subs: "1,000,000 subscribers", onesignal: "$4,019 / mo", pushkit: "$0 / mo ($5 on Paid)", savings: "Save $48,168 / year" },
];

const FEATURES = [
  {
    icon: Send,
    title: "Campaign Composer",
    body: "Draft rich web pushes with automatic OpenGraph metadata fetch, UTM tagging, and action buttons. Live desktop and mobile previews update in real time as you edit.",
  },
  {
    icon: Tags,
    title: "Audience Segmentation",
    body: "Target subscribers by country, browser, operating system, device type, or custom tags. Live recipient counts update dynamically before sending.",
  },
  {
    icon: BarChart3,
    title: "Delivery & CTR Analytics",
    body: "Track delivered counts, clicks, and CTR percentage on every campaign. Monitor gone-vs-error delivery drops and inspect 7-, 30-, and 90-day audience growth trends.",
  },
  {
    icon: Rss,
    title: "RSS & Atom Auto-Push",
    body: "Polls your publication feed every 5 minutes and dispatches new articles to subscribers automatically. Includes GUID deduplication so stories never send twice.",
  },
  {
    icon: Webhook,
    title: "Publish Webhook",
    body: "Trigger automated campaigns from WordPress, Ghost, or custom CI scripts via HTTP POST. Authenticated with per-site Bearer tokens or HMAC-SHA256 signatures.",
  },
  {
    icon: Globe,
    title: "Multi-Site Management",
    body: "Run unlimited distinct websites and domains under a single deployment. Each site gets isolated VAPID key pairs, prompt styles, and subscriber databases.",
  },
  {
    icon: MousePointerClick,
    title: "Custom Opt-In Prompts",
    body: "Configure native banners, top bars, or bell widgets with custom delay and scroll triggers. Includes A/B variant testing and 4 built-in translations.",
  },
  {
    icon: Trash2,
    title: "Automated List Self-Cleaning",
    body: "Unsubscribes dead browser endpoints automatically when push services return HTTP 404 or 410. Inactive profiles older than 180 days are pruned by daily cron.",
  },
  {
    icon: Lock,
    title: "Data Sovereignty & Team Roles",
    body: "Passwordless OTP and magic-link authentication for owners. Invite staff with restricted roles that hide private VAPID keys, webhook secrets, and database exports.",
  },
];

const ROADMAP_TEASER = [
  { title: "Time-zone localized deliveries", status: "Planned", desc: "Deliver notifications at 9:00 AM in each subscriber's local time." },
  { title: "Ghost CMS native webhook handler", status: "Planned", desc: "1-click integration with Ghost publication events." },
  { title: "Shopify abandoned cart alerts", status: "Planned", desc: "Automated browser push triggers on cart checkout drop-off." },
  { title: "Geo-heatmap subscriber analytics", status: "Planned", desc: "Visual regional density maps for global audience distribution." },
];

const FAQS = [
  {
    question: "Is PushKit really free? What is the catch?",
    answer:
      "PushKit is MIT-licensed open source and runs entirely on your own Cloudflare account's free tier, delivering ≈130,000 pushes/day and storing 1,000,000+ subscribers for $0/month. There is no trial, no credit card required, and no per-subscriber fees. If you reach Cloudflare's daily queue limit, pushes pause safely and resume at midnight UTC without dropping records.",
  },
  {
    question: "What happens if I outgrow the free tier?",
    answer:
      "Cloudflare Workers Paid is $5/month and raises allowances to ≈13,000,000 pushes/month and 10,000,000 worker requests. You simply flip the plan in your Cloudflare dashboard — no server migration, no code changes, and no data moves.",
  },
  {
    question: "Can I import my OneSignal or PushEngage subscribers?",
    answer:
      "Yes. Web push subscriptions are cryptographically bound to the private VAPID key they were created with. PushKit imports your OneSignal CSV as pending audience records. When returning readers visit your website, the PushKit SDK silently generates a fresh token under your keys without showing a prompt banner again.",
  },
  {
    question: "Which browsers and platforms are supported?",
    answer:
      "PushKit supports Chrome, Edge, Firefox, and Opera on desktop and Android, as well as Safari on macOS. On iPhones, web push requires the user to add your website to their Home Screen per Apple's standard Web Push security policy.",
  },
  {
    question: "Where does my subscriber data live?",
    answer:
      "In the Cloudflare D1 database and R2 media bucket of your personal Cloudflare account. PushKit has no central tracking server, no telemetry phone-home, and no third-party access. You can export your subscribers as a CSV anytime.",
  },
  {
    question: "How is this different from LaraPush?",
    answer:
      "LaraPush requires a $499 upfront license plus continuous monthly VPS server hosting ($6+/month) and manual Linux/PHP maintenance. PushKit is 100% free open-source software running serverlessly on Cloudflare's free infrastructure.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SoftwareApplicationSchema />
      <FAQSchema items={FAQS} />
      <MarketingHeader />

      <main className="flex-1">
        {/* Section 1: Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:pt-24 sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3.5 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            <span>Free web push notifications · Open source · MIT Licensed</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Web push notifications without the per-subscriber bill
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            PushKit is a free, open-source web push platform that runs on your own Cloudflare account. Unlimited subscribers, unlimited sites, your data in your database — $0 per month on Cloudflare&apos;s free tier.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/deploy" />}>
              <CloudflareIcon className="size-5 shrink-0" />
              <span>Deploy on Cloudflare — Free</span>
            </Button>
            <Button size="lg" variant="outline" render={<a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" />}>
              <GitHubIcon className="size-5 shrink-0" />
              <span>Star on GitHub</span>
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/compare" />}>
              <OneSignalIcon className="size-5 shrink-0" />
              <span>Compare with OneSignal</span>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card. No vendor lock-in. Self-hosted on your own Cloudflare free tier.
          </p>
        </section>

        {/* Section 2: Capacity Strip */}
        <StatsBlock />

        {/* Section 3: Live Dashboard Demo & Mac Showcase */}
        <section id="demo" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Live Interactive Interface
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              This is the actual dashboard
            </h2>
            <p className="mt-3 text-muted-foreground">
              Explore the interface below. Click any tab in the menu to preview that screen with realistic publisher data, or toggle between desktop and mobile modes.
            </p>
          </div>

          <div className="mt-8">
            <LandingDemo />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-xs text-muted-foreground">
              <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
              <span><strong>Composer:</strong> URL metadata auto-fetch, UTM builder, action buttons, and device previews.</span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-xs text-muted-foreground">
              <Users className="mt-0.5 size-4 shrink-0 text-primary" />
              <span><strong>Subscribers:</strong> Filter by country, browser, OS, device, and tags with 1-click CSV export.</span>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-xs text-muted-foreground">
              <Layers className="mt-0.5 size-4 shrink-0 text-primary" />
              <span><strong>Campaigns:</strong> Complete history with delivered counts, clicks, and CTR percentage on every send.</span>
            </div>
          </div>
        </section>

        {/* Mac Showcase */}
        <MacNotificationShowcase />

        {/* Section 4: Compact Problem Section */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-500">
              The Cost Trap
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              SaaS push pricing penalizes audience growth
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Proprietary SaaS platforms bill per subscriber. As your newsletter or blog audience expands, your monthly software bill compounds into thousands of dollars per year.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-semibold text-foreground">Audience Size</th>
                  <th className="px-4 py-3 font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <OneSignalIcon className="size-4 shrink-0" /> OneSignal Growth
                    </span>
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary">PushKit Free Tier</th>
                  <th className="px-4 py-3 font-semibold text-emerald-600">Annual Savings</th>
                </tr>
              </thead>
              <tbody>
                {COMPACT_COST_ROWS.map((row) => (
                  <tr key={row.subs} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{row.subs}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.onesignal}</td>
                    <td className="px-4 py-3 font-bold text-primary">{row.pushkit}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{row.savings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Prices verified November 2026. For complete comparison across OneSignal, PushEngage, and LaraPush, see the{" "}
            <Link href="/compare" className="text-primary underline hover:text-primary/80">
              Full Comparison Page &rarr;
            </Link>
          </p>
        </section>

        {/* Section 5: Features Grid */}
        <section id="features" className="border-t bg-muted/10 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Built-in Capabilities
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Publisher-grade features without SaaS restrictions
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                PushKit handles collection, segmentation, delivery, scheduling, and cleanup across single or multi-site installations.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="flex flex-col justify-between">
                  <CardHeader>
                    <feature.icon className="mb-2 size-5 text-primary" />
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: WordPress Section */}
        <section className="border-t py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl border bg-card p-8 sm:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <WordPressIcon className="size-6 text-[#21759b]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#21759b]">
                      WordPress Integration
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Automate push broadcasts directly from WordPress
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Install the official PushKit WordPress plugin to automatically broadcast new posts upon publication. Scopes the root service worker (<code className="font-mono text-xs">/sw.js</code>) cleanly without manual Nginx server rewrites.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Auto-push on publish</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Root sw.js rewrite</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Custom post types</span>
                  </div>
                </div>
                <Link
                  href="/docs/wordpress"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <span>Read WordPress Guide</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Migration Section */}
        <section className="border-t bg-secondary/20 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Switching Providers
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Migrate from OneSignal without losing active readers
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Browser push endpoints are cryptographically locked to the provider&apos;s private VAPID key. PushKit imports your OneSignal CSV export and executes silent re-subscription as visitors return.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-5">
                <span className="font-mono text-xs font-bold text-primary">01. Export CSV</span>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Download your subscriber list CSV from OneSignal Audience settings and upload it into PushKit.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <span className="font-mono text-xs font-bold text-primary">02. Replace Script</span>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Embed the 1-line PushKit client script tag or install the WordPress plugin on your domain.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <span className="font-mono text-xs font-bold text-primary">03. Silent Re-Subscribe</span>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Returning visitors generate new tokens under your VAPID keys without seeing an opt-in banner again.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/docs/migrate-from-onesignal"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Read the complete step-by-step migration guide</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 8: Who It's For */}
        <section className="border-t py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Audience Fit
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Built for publishers, networks, and engineers
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <FileCode2 className="mb-2 size-5 text-primary" />
                  <CardTitle className="text-base">Bloggers &amp; News Publishers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automate instant alerts whenever a new post goes live. Keep 100% of your ad and subscription revenue instead of sending hundreds of dollars monthly to third-party push networks.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Globe className="mb-2 size-5 text-primary" />
                  <CardTitle className="text-base">Multi-Site Network Owners</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Manage 10, 20, or 50 websites under one unified login. Each site receives dedicated VAPID credentials, custom prompt styles, and separate campaign metrics at zero added charge.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Database className="mb-2 size-5 text-primary" />
                  <CardTitle className="text-base">Full Data Sovereignty</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All subscriber endpoints, encryption keys, and tags reside in your Cloudflare D1 database. No corporate vendor can revoke your access, hike pricing, or inspect your audience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 9: Free vs $5 */}
        <section className="border-t bg-muted/10 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Scalability
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Start free. Upgrade for $5 if you outgrow it.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                PushKit has no artificial tier limits. Its capacity reflects Cloudflare&apos;s infrastructure limits directly.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Cloudflare Free Tier</span>
                <div className="mt-2 text-3xl font-bold">$0 <span className="text-xs font-normal text-muted-foreground">/ month</span></div>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> ≈130,000 push deliveries / day</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> ≈4,000,000 push deliveries / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> 1,000,000+ subscribers stored in D1</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Unlimited registered websites</li>
                </ul>
              </div>

              <div className="rounded-xl border border-primary/50 bg-card p-6 shadow-sm">
                <span className="text-xs font-semibold text-primary uppercase">Workers Paid Tier</span>
                <div className="mt-2 text-3xl font-bold">$5 <span className="text-xs font-normal text-muted-foreground">/ month</span></div>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary" /> ≈13,000,000 push deliveries / month included</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary" /> 10,000,000 Worker requests / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary" /> 50,000,000 D1 rows written / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary" /> Zero per-subscriber tax forever</li>
                </ul>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Start free. If you outgrow it, the upgrade is $5 — not a compounding per-subscriber bill.{" "}
              <Link href="/compare#limits" className="text-primary underline">
                View detailed capacity limits &rarr;
              </Link>
            </p>
          </div>
        </section>

        {/* Section 10: Roadmap Teaser */}
        <section className="border-t py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Active Development
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  What&apos;s coming next
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Button size="sm" variant="outline" render={<Link href="/roadmap" />}>
                  View Full Roadmap &rarr;
                </Button>
                <Button size="sm" variant="ghost" render={<a href={GITHUB_FEATURE_REQUEST_URL} target="_blank" rel="noreferrer" />}>
                  Request a Feature
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ROADMAP_TEASER.map((item) => (
                <div key={item.title} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 11: Maker Section */}
        <section className="border-t bg-secondary/30 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              The Maker Behind PushKit
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              PushKit is built and maintained by Yang Kai
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              I rebuild popular paid services as free, open-source projects that run on Cloudflare&apos;s free tier — PushKit is the first. More are coming. Follow me on X for release announcements, and reply there or open a GitHub Discussion to suggest the next service — the most-requested ones get built.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" render={<a href={X_URL} target="_blank" rel="noreferrer" />}>
                <XIcon className="size-4 shrink-0" />
                <span>Follow @{X_HANDLE} on X</span>
              </Button>
              <Button size="lg" variant="outline" render={<a href={GITHUB_DISCUSSIONS_URL} target="_blank" rel="noreferrer" />}>
                <MessageSquare className="size-4 shrink-0" />
                <span>Suggest Next Project</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 12: FAQ */}
        <section id="faq" className="border-t py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-center">
              Frequently Asked Questions
            </h2>
            <div className="mt-10 space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.question} className="rounded-xl border bg-card p-6">
                  <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 13: Final CTA */}
        <section className="border-t bg-primary/5 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <Bell className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Deploy PushKit on Cloudflare&apos;s free tier
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              One command to create the database, one to deploy. Ten steps, about 10 minutes, $0/month.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" render={<Link href="/deploy" />}>
                <CodeGlassIcon className="size-5 shrink-0" />
                <span>Open the Deploy Guide</span>
              </Button>
              <Button size="lg" variant="outline" render={<a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" />}>
                <GitHubIcon className="size-5 shrink-0" />
                <span>Star on GitHub</span>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
