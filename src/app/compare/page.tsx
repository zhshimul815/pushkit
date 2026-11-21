import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CloudflareIcon, GitHubIcon } from "@/components/icons";
import { BreadcrumbsSchema, FAQSchema } from "@/components/seo-schema";
import { SITE_URL, GITHUB_REPO_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "OneSignal Alternative: Free Web Push | PushKit Compare",
  description:
    "Looking for a OneSignal alternative? Compare PushKit vs OneSignal, PushEngage, and LaraPush. Zero per-subscriber pricing on Cloudflare free tier. Verified 2026.",
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  openGraph: {
    title: "OneSignal Alternative: Free Web Push | PushKit Compare",
    description:
      "Looking for a OneSignal alternative? Compare PushKit vs OneSignal, PushEngage, and LaraPush.",
    url: `${SITE_URL}/compare`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneSignal Alternative: Free Web Push | PushKit Compare",
    description:
      "Looking for a OneSignal alternative? Compare PushKit vs OneSignal, PushEngage, and LaraPush.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

type Cell = { t: "y" } | { t: "n" } | { t: "v"; v: string };
const Y: Cell = { t: "y" };
const N: Cell = { t: "n" };
const V = (v: string): Cell => ({ t: "v", v });

const COLUMNS = ["PushKit", "OneSignal", "PushEngage", "LaraPush", "Webpushr"] as const;

const ROWS: { label: string; cells: [Cell, Cell, Cell, Cell, Cell] }[] = [
  { label: "Architecture", cells: [V("Open source, self-hosted"), V("Proprietary SaaS"), V("Proprietary SaaS"), V("Licensed PHP script"), V("Proprietary SaaS")] },
  { label: "Infrastructure", cells: [V("Your Cloudflare account"), V("Vendor servers"), V("Vendor servers"), V("Your VPS server"), V("Vendor servers")] },
  { label: "Starting price", cells: [V("$0 / month"), V("Free with caps"), V("Free with caps"), V("$499 one-time"), V("Free tier")] },
  { label: "Cost at 10,000 subscribers", cells: [V("$0 / month"), V("$59 / month"), V("Paid tier"), V("$499 + VPS"), V("Free / entry tier")] },
  { label: "Cost at 100,000 subscribers", cells: [V("$0 / month"), V("$419 / month"), V("Scales with list size"), V("$499 + VPS ~$6/mo"), V("$49 / month")] },
  { label: "Cost at 1,000,000 subscribers", cells: [V("$0 (or $5/mo on Paid)"), V("$4,019 / month"), V("Enterprise tier"), V("$499 + dedicated VPS"), V("Enterprise tier")] },
  { label: "Free plan subscriber cap", cells: [V("None (1,000,000+ stored)"), V("10,000 per send"), V("200 total"), V("No free plan"), V("Plan-based")] },
  { label: "Websites / domains", cells: [V("Unlimited sites"), V("Plan-based"), V("Plan-based"), V("Per-license"), V("Plan-based")] },
  { label: "Subscriber data ownership", cells: [V("Your Cloudflare D1"), V("OneSignal cloud"), V("PushEngage cloud"), V("Your VPS database"), V("Webpushr cloud")] },
  { label: "Server maintenance required", cells: [N, N, N, V("Yes — VPS OS & PHP"), N] },
  { label: "Campaign composer + UTM tags", cells: [Y, Y, Y, Y, Y] },
  { label: "Audience segmentation", cells: [Y, Y, Y, Y, Y] },
  { label: "RSS / Atom auto-push", cells: [Y, Y, Y, Y, Y] },
  { label: "Publish API / webhooks", cells: [Y, Y, Y, Y, Y] },
  { label: "Scheduled campaigns", cells: [Y, Y, Y, Y, Y] },
  { label: "Inspectable source code (MIT)", cells: [Y, N, N, N, N] },
];

const LIMITATIONS: { name: string; points: string[] }[] = [
  {
    name: "OneSignal",
    points: [
      "Free plan caps web push sends at 10,000 subscribers per send.",
      "Growth pricing escalates per-subscriber: $59/mo at 10k, $419/mo at 100k, $4,019/mo at 1M. Your recurring software cost increases with your readership.",
      "Subscriber data resides on vendor servers under their terms; account suspension terminates your audience reach.",
    ],
  },
  {
    name: "PushEngage",
    points: [
      "Free plan allows only 200 subscribers total — functioning as a short trial rather than a sustained tier.",
      "Pricing scales with list size; subscriber overages force mandatory plan upgrades.",
      "Subscriber data is hosted on PushEngage infrastructure.",
    ],
  },
  {
    name: "LaraPush",
    points: [
      "$499 (Pro) or $799 (Agency) upfront license, plus ongoing VPS costs ($6+/month).",
      "Requires active server maintenance: Linux security patches, PHP/Laravel updates, Redis management, and database backups.",
      "Proprietary licensed code; updates and multi-domain configurations depend on vendor license keys.",
    ],
  },
  {
    name: "Webpushr",
    points: [
      "Entry SaaS alternative, but still charges $49/month at 100,000 subscribers ($588/year).",
      "Tier-based subscriber caps, and data resides on vendor infrastructure.",
    ],
  },
  {
    name: "PushKit — Honest Limitations",
    points: [
      "Free-tier sending is paced by Cloudflare queues at ≈130,000 deliveries/day. Campaigns larger than that span across multiple days or run on Cloudflare Workers Paid ($5/month).",
      "Self-hosted setup: requires 10 minutes to run Wrangler CLI commands. No telephone support desk; support operates through GitHub Issues and open-source documentation.",
      "Web push only: does not send native mobile app push, transactional email, or SMS. iPhone delivery requires Home Screen install per Apple specifications for all providers.",
      "Migration from third-party SaaS occurs via silent re-subscription because browser endpoints are cryptographically bound to the original provider's private VAPID key.",
    ],
  },
];

const LIMIT_ROWS = [
  { resource: "Push deliveries", free: "≈130,000 / day (≈4M / month)", paid: "≈13,000,000 / month included", beyond: "Then $0.40 per million queue operations" },
  { resource: "Queue operations", free: "10,000 / day", paid: "1,000,000 / month included", beyond: "Pay-as-you-go overage" },
  { resource: "Worker requests", free: "100,000 / day", paid: "10,000,000 / month included", beyond: "Then $0.30 per million" },
  { resource: "D1 rows read", free: "5,000,000 / day", paid: "25 billion / month included", beyond: "Then $0.001 per million rows" },
  { resource: "D1 rows written", free: "100,000 / day", paid: "50,000,000 / month included", beyond: "Then $1.00 per million rows" },
  { resource: "D1 storage", free: "500 MB per database (1,000,000+ subscribers)", paid: "Up to 10 GB per database", beyond: "5 GB total included, then $0.75 / GB-month" },
  { resource: "Price", free: "$0", paid: "$5 / month", beyond: "Same account, same install — flip the plan" },
];

const COMPARE_FAQS = [
  {
    question: "Is PushKit really completely free compared to OneSignal?",
    answer:
      "Yes. PushKit is open-source software that you deploy to your own Cloudflare account. Cloudflare's free tier provides 100,000 worker requests, 10,000 queue operations (≈130,000 pushes/day), and 500 MB of D1 database storage ($0/month with zero per-subscriber fees).",
  },
  {
    question: "What are PushKit's actual limitations compared to OneSignal?",
    answer:
      "PushKit focuses strictly on web push notifications (Chrome, Safari, Firefox, Edge). It does not send native mobile app SDK pushes, marketing emails, or SMS. For web push, sending on the Cloudflare free tier is capped at ≈130,000 pushes/day unless upgraded to Cloudflare Workers Paid ($5/month).",
  },
  {
    question: "Can I migrate my existing OneSignal subscribers to PushKit?",
    answer:
      "Yes. PushKit imports your OneSignal CSV export and activates silent re-subscription. When returning readers visit your site, the PushKit SDK requests a new token tied to your VAPID keys in the background without prompting them again.",
  },
  {
    question: "What happens if I exceed Cloudflare's free daily limits?",
    answer:
      "Nothing is lost. When daily queue limits are reached, push dispatch pauses safely. Your subscriber records and dashboard remain accessible, and queue processing resumes automatically at the midnight UTC daily reset.",
  },
];

function CellView({ cell, highlight }: { cell: Cell; highlight?: boolean }) {
  if (cell.t === "y") {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className="size-4 text-emerald-600" aria-label="Included" />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (cell.t === "n") {
    return (
      <span className="inline-flex items-center justify-center">
        <X className="size-4 text-muted-foreground/60" aria-label="Not available" />
        <span className="sr-only">Not available</span>
      </span>
    );
  }
  return <span className={highlight ? "font-semibold text-foreground" : undefined}>{cell.v}</span>;
}

export default function ComparePage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <BreadcrumbsSchema items={breadcrumbs} />
      <FAQSchema items={COMPARE_FAQS} />
      <MarketingHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            OneSignal Alternative
          </span>
          <h1 className="mt-2 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            OneSignal Alternative: PushKit vs OneSignal, PushEngage &amp; LaraPush
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            PushKit is the free, self-hosted web push platform: MIT-licensed open source running on your own Cloudflare account with zero per-subscriber fees. Here is a direct feature-by-feature comparison and verified pricing.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Prices verified November 2026 across vendor pricing pages</span>
          </div>
        </section>

        {/* Main comparison table */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="sr-only">Feature and Pricing Comparison Table</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 font-medium text-foreground">Feature</th>
                  {COLUMNS.map((col, i) => (
                    <th key={col} className={`px-4 py-3 text-center font-semibold ${i === 0 ? "bg-primary/5 text-primary" : ""}`}>
                      {col}
                      {i === 0 && <span className="block text-xs font-normal text-muted-foreground">This project</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                    {row.cells.map((cell, i) => (
                      <td key={i} className={`px-4 py-3 text-center ${i === 0 ? "bg-primary/5" : "text-muted-foreground"}`}>
                        <CellView cell={cell} highlight={i === 0} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Prices verified November 2026. OneSignal Growth = $19/mo base + $0.004/subscriber. PushEngage free plan caps at 200 subscribers. LaraPush charges $499/$799 one-time plus monthly VPS hosting.
          </p>
        </section>

        {/* Honest Limitations */}
        <section className="border-y bg-secondary/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">The Limitations: Service by Service</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Every architecture has trade-offs. PushKit&apos;s limits are documented with the exact same rigor as proprietary SaaS alternatives.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {LIMITATIONS.map((item) => (
                <Card key={item.name} className={item.name.startsWith("PushKit") ? "border-primary/50 bg-card shadow-sm" : undefined}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-2 pl-5 text-xs text-muted-foreground leading-relaxed">
                      {item.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Free vs $5 Limits */}
        <section id="limits" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">PushKit Capacity: Cloudflare Free vs Workers Paid</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            PushKit imposes no artificial software paywalls. Its capacity is defined directly by your Cloudflare account. Cloudflare free tier handles ≈130,000 pushes/day ($0/month). Workers Paid ($5/month) expands capacity to ≈13,000,000 pushes/month.
          </p>
          <div className="mt-8 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 font-medium text-foreground">Resource</th>
                  <th className="px-4 py-3 font-medium text-foreground">Cloudflare Free ($0/mo)</th>
                  <th className="px-4 py-3 font-medium text-foreground">Workers Paid ($5/mo)</th>
                  <th className="px-4 py-3 font-medium text-foreground">Beyond Included</th>
                </tr>
              </thead>
              <tbody>
                {LIMIT_ROWS.map((row) => (
                  <tr key={row.resource} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{row.resource}</td>
                    <td className="px-4 py-3">{row.free}</td>
                    <td className="px-4 py-3 font-medium text-primary">{row.paid}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.beyond}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Milestones */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">At 100,000 Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  OneSignal Growth: <strong>$419/month</strong>. PushKit on Free: <strong>$0/month</strong> (a full list send delivers across ~18 hours of the daily allowance). PushKit on Workers Paid: <strong>$5/month</strong>, delivered in one pass.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">At 1,000,000 Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  OneSignal Growth: <strong>$4,019/month ($48,228/year)</strong>. PushKit stores 1M subscribers free in D1 (under 500 MB) and delivers on Workers Paid for <strong>$5/month</strong>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zero Vendor Lock-In</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Upgrading from Free to Paid requires no data migration or server migration. You simply enable Workers Paid in your existing Cloudflare dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comparison FAQ */}
        <section className="border-t bg-muted/10 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {COMPARE_FAQS.map((faq) => (
                <div key={faq.question} className="rounded-lg border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" render={<Link href="/deploy" />}>
                <CloudflareIcon className="size-5 shrink-0" />
                <span>Deploy PushKit Free</span>
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
