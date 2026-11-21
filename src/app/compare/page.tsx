import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GITHUB_URL, MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CloudflareIcon, GitHubIcon, OneSignalIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Compare — PushKit vs OneSignal, PushEngage, LaraPush, Webpushr",
  description:
    "PushKit (free, self-hosted on Cloudflare) compared with OneSignal, PushEngage, LaraPush and Webpushr: prices at real subscriber counts, free-tier limits, data ownership, and what the $5 Cloudflare plan unlocks.",
};

/* Y = included, N = not available, T = text value */
type Cell = { t: "y" } | { t: "n" } | { t: "v"; v: string };
const Y: Cell = { t: "y" };
const N: Cell = { t: "n" };
const V = (v: string): Cell => ({ t: "v", v });

const COLUMNS = ["PushKit", "OneSignal", "PushEngage", "LaraPush", "Webpushr"] as const;

const ROWS: { label: string; cells: [Cell, Cell, Cell, Cell, Cell] }[] = [
  { label: "Type", cells: [V("Open source, self-hosted"), V("SaaS"), V("SaaS"), V("Licensed, self-hosted"), V("SaaS")] },
  { label: "Runs on", cells: [V("Your Cloudflare account"), V("Vendor cloud"), V("Vendor cloud"), V("Your VPS"), V("Vendor cloud")] },
  { label: "Starting price", cells: [V("$0"), V("Free with caps"), V("Free with caps"), V("$499 one-time"), V("Free tier")] },
  { label: "Cost at 10,000 subscribers", cells: [V("$0 / month"), V("$59 / month"), V("Paid tier"), V("$499 + VPS"), V("Free / entry tier")] },
  { label: "Cost at 100,000 subscribers", cells: [V("$0 / month"), V("$419 / month"), V("Scales with list size"), V("$499 + VPS ~$6/mo"), V("$49 / month")] },
  { label: "Cost at 1,000,000 subscribers", cells: [V("$0, or $5 on Workers Paid"), V("$4,019 / month"), V("Top tiers"), V("$499 + a larger VPS"), V("Top tiers")] },
  { label: "Free-plan subscriber cap", cells: [V("None — 1,000,000+ stored"), V("10,000 per send"), V("200 total"), V("No free plan"), V("Plan-based")] },
  { label: "Websites / domains", cells: [V("Unlimited"), V("Plan-based"), V("Plan-based"), V("Per licence"), V("Plan-based")] },
  { label: "Subscriber data lives in", cells: [V("Your database"), V("Vendor servers"), V("Vendor servers"), V("Your server"), V("Vendor servers")] },
  { label: "You maintain a server", cells: [N, N, N, V("Yes — your VPS"), N] },
  { label: "Campaign composer + previews", cells: [Y, Y, Y, Y, Y] },
  { label: "Segmentation (country / device / tags)", cells: [Y, Y, Y, Y, Y] },
  { label: "RSS auto-push", cells: [Y, Y, Y, Y, Y] },
  { label: "Publish API / webhook", cells: [Y, Y, Y, Y, Y] },
  { label: "Scheduled campaigns", cells: [Y, Y, Y, Y, Y] },
  { label: "Source code you can inspect & modify", cells: [Y, N, N, N, N] },
];

const LIMITATIONS: { name: string; points: string[] }[] = [
  {
    name: "OneSignal",
    points: [
      "Free plan caps web push at 10,000 subscribers per send — and the free tier has been shrunk twice, so today's cap is not a promise.",
      "Growth pricing is per-subscriber: $59/mo at 10k, $419/mo at 100k, $4,019/mo at 1M. Your bill grows with your audience, forever.",
      "Subscriber data lives on OneSignal's servers under their terms; an account action ends your ability to reach your own audience.",
    ],
  },
  {
    name: "PushEngage",
    points: [
      "Free plan allows 200 subscribers total — a test drive, not a free tier.",
      "Pricing and feature gates scale with list size and plan tier; the top-rated complaint category on review sites is cost.",
      "SaaS data residency: your audience list is stored on PushEngage infrastructure.",
    ],
  },
  {
    name: "LaraPush",
    points: [
      "$499 (Pro) / $799 (Agency) upfront, plus a VPS at $6+/month — the closest model to PushKit, but not free and not open source.",
      "You maintain the server: OS patches, PHP/Laravel updates, backups, uptime.",
      "Reputation is mixed: Trustpilot shows 2.5/5 across 26 reviews versus the 4.4/5 the vendor advertises; upgrade-fee complaints recur.",
    ],
  },
  {
    name: "Webpushr",
    points: [
      "The cheapest credible SaaS in this comparison — still $49/month at 100,000 subscribers, and $588 every year after.",
      "Plan-based caps on subscribers and sites; your data stays on Webpushr's servers.",
    ],
  },
  {
    name: "PushKit — the honest limitations",
    points: [
      "Free-tier sending is capped by Cloudflare at ≈130,000 deliveries/day. A single blast to more than that is paced across days, or needs the $5 plan — SaaS tools have no such ceiling.",
      "You run it yourself: deploying takes ~10 minutes and updates are one command, but there is no support desk — there is a GitHub repo and documentation.",
      "Web push only. No native iOS/Android app push, no email, no SMS. On iPhone, web push requires Home Screen install — that is Apple's rule for every provider, including all four above.",
      "Subscriber migration from another provider works by re-subscription (subscriptions are bound to the old provider's keys) — PushKit automates it for returning visitors and imports the old list as tracking records, but visitors who never return can't be recovered. Any tool claiming a pure file-import migration is not telling you the whole story.",
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

function CellView({ cell, highlight }: { cell: Cell; highlight?: boolean }) {
  if (cell.t === "y") return <Check className="mx-auto size-4 text-green-600" aria-label="Yes" />;
  if (cell.t === "n") return <X className="mx-auto size-4 text-muted-foreground" aria-label="No" />;
  return <span className={highlight ? "font-medium" : undefined}>{cell.v}</span>;
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <section className="mx-auto max-w-6xl px-4 pt-16 pb-10">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance">
          PushKit vs OneSignal, PushEngage, LaraPush &amp; Webpushr
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          PushKit is the free, self-hosted option: open source, hosted on your own Cloudflare
          account, no per-subscriber pricing. The others are solid products with a different
          trade — you pay per subscriber, per licence, or per server. Here is the full picture,
          including PushKit&apos;s own limitations.
        </p>
      </section>

      {/* Main comparison table */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 font-medium" />
                {COLUMNS.map((col, i) => (
                  <th key={col} className={`px-4 py-3 text-center font-semibold ${i === 0 ? "bg-primary/5" : ""}`}>
                    {col === "OneSignal" ? (
                      <span className="inline-flex items-center gap-1.5 justify-center">
                        <OneSignalIcon className="size-4 shrink-0" />
                        {col}
                      </span>
                    ) : (
                      col
                    )}
                    {i === 0 && <span className="block text-xs font-normal text-muted-foreground">This project</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.label}</td>
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
          Competitor prices from published pricing pages, checked November 2026: OneSignal
          Growth = $19/mo + $0.004/subscriber; Webpushr = $49/mo at 100,000 subscribers;
          LaraPush = $499/$799 one-time licence. SaaS convenience is real — the vendor runs
          the servers — and the subscription is what pays for it.
        </p>
      </section>

      {/* Limitations */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight">The limitations, service by service</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every option gives something up. PushKit&apos;s are listed with the same honesty as
            everyone else&apos;s.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {LIMITATIONS.map((item) => (
              <Card key={item.name} className={item.name.startsWith("PushKit") ? "border-primary/40" : undefined}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {item.name === "OneSignal" && <OneSignalIcon className="size-4 shrink-0" />}
                    {item.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
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

      {/* Free vs $5 limits */}
      <section id="limits" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight">PushKit&apos;s limits: Cloudflare Free vs the $5 plan</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          PushKit has no limits of its own — its ceiling is your Cloudflare plan. On the free
          plan, when a daily allowance runs out, sending pauses and automatically resumes at the
          next reset; subscribers keep collecting, the dashboard stays up, and nothing is
          deleted. Workers Paid removes the daily rhythm entirely:
        </p>
        <div className="mt-8 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Cloudflare Free — $0</th>
                <th className="px-4 py-3 font-medium">Workers Paid — $5/mo</th>
                <th className="px-4 py-3 font-medium">Beyond included</th>
              </tr>
            </thead>
            <tbody>
              {LIMIT_ROWS.map((row) => (
                <tr key={row.resource} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.resource}</td>
                  <td className="px-4 py-3">{row.free}</td>
                  <td className="px-4 py-3">{row.paid}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.beyond}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "At 100,000 subscribers", body: "OneSignal Growth: $419/month. PushKit on free: $0 — a full-list send takes about a day of the free delivery allowance, or split it by segment. PushKit on Workers Paid: $5/month, sent in one go." },
            { title: "At 1,000,000 subscribers", body: "OneSignal Growth: $4,019/month ($48,228/year). PushKit stores the list free (500 MB per D1 database) and sends ≈13M pushes/month on the $5 plan — a full-list send fits in a single month's allowance with room to spare." },
            { title: "What $5 does not change", body: "No migration, no new vendor, no data move. You flip the plan on the same Cloudflare account and the same PushKit install wakes up with the higher limits." },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button size="lg" render={<Link href="/deploy" />}>
            <CloudflareIcon className="size-5 shrink-0" /> Deploy PushKit — Free
          </Button>
          <Button size="lg" variant="outline" render={<a href={GITHUB_URL} target="_blank" rel="noreferrer" />}>
            <GitHubIcon className="size-5 shrink-0" /> View on GitHub
          </Button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
