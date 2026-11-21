import Link from "next/link";
import {
  BarChart3,
  Bell,
  Code2,
  Database,
  FileCode2,
  Globe,
  KeyRound,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CAPACITY_STATS, GITHUB_URL, MarketingFooter, MarketingHeader } from "@/components/marketing";
import { LandingDemo } from "@/components/landing-demo";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const COST_ROWS = [
  { subs: "10,000 subscribers", onesignal: "$59 / month", note: "Free plan stops at 10,000 per send" },
  { subs: "50,000 subscribers", onesignal: "$219 / month", note: "$2,628 / year" },
  { subs: "100,000 subscribers", onesignal: "$419 / month", note: "$5,028 / year" },
  { subs: "1,000,000 subscribers", onesignal: "$4,019 / month", note: "$48,228 / year" },
];

const FEATURES = [
  {
    icon: Send,
    title: "Campaign Composer",
    body: "Title, message, target URL, icon and hero image, up to 2 action buttons. Fetch URL Metadata fills title, text and image from the page link. UTM builder appends campaign parameters. Live phone and desktop previews update as you type. Send now, schedule for later, or save as a template.",
  },
  {
    icon: Tags,
    title: "Audience Targeting",
    body: "Send to everyone, or filter by country, device, browser, OS, or tags your site assigns (topic, section, plan — any key/value). Campaigns can exclude audiences too, e.g. tag is-not premium. The composer shows the matching subscriber count before you send.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "Total Subscribers, New Today, Notifications Sent, Average CTR. Growth and clicks chart for 7, 30 or 90 days. Breakdowns for Top Countries, Devices, Browsers and OS. Every campaign reports Sent, Clicks and CTR %.",
  },
  {
    icon: Rss,
    title: "RSS Auto-Push",
    body: "One RSS or Atom feed URL per site. PushKit polls every 5 minutes and pushes each new post automatically — title, link and image from the feed, GUID deduplication so a post never sends twice. Per-site switch, editable feed URL.",
  },
  {
    icon: Webhook,
    title: "Publish Webhook",
    body: "POST JSON to a per-site webhook URL and PushKit sends it as a notification. Bearer token or HMAC-SHA256 signature. Built for Ghost's Post Published hook and any CMS, cron job or script that can make an HTTP request.",
  },
  {
    icon: Globe,
    title: "Unlimited Sites, One Install",
    body: "Every site gets its own VAPID keys, prompt settings, RSS feed, webhook and statistics. SaaS tools bill per domain or per subscriber pool; PushKit has no per-site and no per-subscriber price, because there is no price.",
  },
  {
    icon: MousePointerClick,
    title: "Prompt You Control",
    body: "Set the opt-in delay (seconds) and scroll trigger (%) per site in the dashboard. The prompt asks on your domain, under your name — no third-party branding, no rented permission prompt, and timing controls that keep prompts compliant with browser engagement rules.",
  },
  {
    icon: Trash2,
    title: "Self-Cleaning Lists",
    body: "Endpoints a push service reports as 404 or 410 Gone are deleted at send time. Subscribers not seen in 180 days are purged by the daily cron. Dead weight never accumulates, and your list size is always your real audience.",
  },
  {
    icon: Lock,
    title: "Private by Design",
    body: "Single-owner login by email code or magic link — no public sign-up exists anywhere. Optional staff accounts (invite-only, expiring links) cannot see VAPID private keys, rotate secrets, delete sites or manage users. Subscriber data sits in your D1 database and nowhere else.",
  },
];

const CAPACITY_ROWS = [
  { resource: "Queue operations", free: "10,000 / day", pushkit: "3 operations move one message of 40 subscribers → 3,333 messages/day" },
  { resource: "Push deliveries", free: "—", pushkit: "≈130,000 / day · ≈4,000,000 / month" },
  { resource: "Worker requests", free: "100,000 / day", pushkit: "Dashboard, API, SDK config and subscribe calls share this pool" },
  { resource: "D1 rows read", free: "5,000,000 / day", pushkit: "One batched read per 40 deliveries; counters instead of per-delivery rows" },
  { resource: "D1 rows written", free: "100,000 / day", pushkit: "Under 10% used at maximum free-tier sending volume" },
  { resource: "D1 storage", free: "500 MB per database", pushkit: "1,000,000+ subscribers with keys, tags and metadata" },
  { resource: "Image storage (R2)", free: "10 GB", pushkit: "Notification icons and hero images, served cached" },
];

const FAQS = [
  {
    q: "Is it really free? What is the catch?",
    a: "PushKit is MIT-licensed open source and runs on your own Cloudflare account's free tier, which is where the ≈130,000 pushes/day capacity comes from. There is no PushKit bill, no trial, and no paid tier today. The limits are Cloudflare's published free allowances — when a daily allowance runs out, sending pauses and resumes at the reset; nothing is deleted and no card is charged.",
  },
  {
    q: "What happens if I outgrow the free tier?",
    a: "Cloudflare Workers Paid is $5/month and raises the same resources: 1,000,000 queue operations included (≈13,000,000 pushes/month at PushKit's batching), 10,000,000 Worker requests/month, and larger D1 allowances. No migration — you change the plan on the same account. The full comparison is on the Compare page.",
  },
  {
    q: "Can I import my OneSignal or PushEngage subscribers?",
    a: "Yes — the honest way. A push subscription is cryptographically tied to the VAPID key it was created with, so exported endpoints cannot receive sends from a different key (be wary of any tool that promises a pure file-import migration). PushKit instead imports your OneSignal/PushEngage CSV as audience records, and its SDK silently re-subscribes returning visitors under your keys — permission is already granted, so there is no prompt. The dashboard shows each record flip from 'Awaiting re-subscribe' to 'Active' as your audience converts, with a step-by-step guide built in.",
  },
  {
    q: "Which sites and browsers are supported?",
    a: "Any website that can add two lines of code and host one service-worker file — WordPress, Ghost, static sites, custom stacks. Notifications work in Chrome, Edge, Firefox and Opera on desktop and Android, and Safari on macOS; on iPhone, web push requires the site to be installed to the Home Screen (an Apple platform rule that applies to every provider).",
  },
  {
    q: "Where does my subscriber data live?",
    a: "In the Cloudflare D1 database and R2 bucket of the account you deploy to. PushKit has no central server, no analytics phone-home, and no third-party access. Export subscribers as CSV any time; the database is yours to back up, inspect or delete.",
  },
  {
    q: "How is this different from LaraPush?",
    a: "LaraPush is a $499 one-time licence that needs a VPS ($6+/month) and server maintenance. PushKit is free and open source, and runs on Cloudflare's free tier — no VPS, no server to patch, no licence. Feature comparison is on the Compare page.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:pt-24">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5" /> Open source · MIT · Self-hosted
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Web push notifications without the per-subscriber bill
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          PushKit is a free, open-source web push platform that runs entirely on your own
          Cloudflare account. Unlimited subscribers, unlimited sites, your data in your
          database — $0 per month, on Cloudflare&apos;s free tier.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href="/deploy" />}>
            Deploy on Cloudflare — Free
          </Button>
          <Button size="lg" variant="outline" render={<a href={GITHUB_URL} />}>
            <Code2 /> View on GitHub
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/compare" />}>
            Compare with OneSignal
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          No account to create. No card. No per-subscriber pricing — ever.
        </p>
      </section>

      {/* Capacity stats */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-3 lg:grid-cols-5">
          {CAPACITY_STATS.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="px-4 pb-6 text-center text-xs text-muted-foreground">
          Capacity computed from Cloudflare&apos;s published free-tier limits and PushKit&apos;s
          batching design — full math on the <Link href="/deploy" className="underline">Deploy page</Link>.
        </p>
      </section>

      {/* The cost problem — actual published pricing */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">The problem: success is what gets expensive</h2>
          <p className="mt-3 text-muted-foreground">
            SaaS push pricing scales with your subscriber count, so the bill grows exactly when
            your audience does. OneSignal&apos;s published Growth pricing is $19/month plus
            $0.004 per subscriber — and its free plan stops at 10,000 subscribers per send.
            PushEngage&apos;s free plan stops at 200. Here is what that math does:
          </p>
        </div>
        <div className="mt-8 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 font-medium">Audience size</th>
                <th className="px-4 py-3 font-medium">OneSignal Growth</th>
                <th className="px-4 py-3 font-medium">PushKit (self-hosted)</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {COST_ROWS.map((row) => (
                <tr key={row.subs} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.subs}</td>
                  <td className="px-4 py-3">{row.onesignal}</td>
                  <td className="px-4 py-3 font-semibold">$0 / month</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          OneSignal figures from its published pricing page, checked November 2026. PushKit at
          1,000,000 subscribers assumes sends paced within the free daily delivery capacity
          (≈130,000/day) or the $5 Workers Paid plan.{" "}
          <Link href="/compare" className="underline">Full comparison →</Link>
        </p>
      </section>

      {/* Live product demo — real dashboard code, sample data */}
      <section id="product" className="border-y bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">This is the actual dashboard</h2>
            <p className="mt-3 text-muted-foreground">
              Not a screenshot and not a mockup — the panel below is rendered live from the same
              dashboard components PushKit ships, filled with sample data from a fictional
              publisher (48,214 subscribers). It is view-only; deploy PushKit to run it on your
              own sites.
            </p>
          </div>
          <div className="mt-8">
            <LandingDemo />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Megaphone, text: "Composer with URL metadata fetch, UTM builder, action buttons and device previews" },
              { icon: Users, text: "Subscriber list with country, browser, OS, device, tags — searchable, filterable, CSV export" },
              { icon: Layers, text: "Campaign history with Sent, Clicks and CTR % on every send, plus reusable templates" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 rounded-lg border bg-background p-4">
                <item.icon className="mt-0.5 size-5 shrink-0" />
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight">Every feature, in full</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          PushKit covers the complete web push workflow — collect, segment, send, automate,
          measure — for one site or one hundred.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-2 size-6" />
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Who it is for */}
      <section className="border-y bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight">Built for publishers who outgrew free tiers</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: FileCode2,
                title: "Blogs & news sites",
                body: "RSS auto-push sends every new post to subscribers 5 minutes after you publish. The audience that costs $219–$419/month on OneSignal at 50–100k subscribers costs $0 here.",
              },
              {
                icon: Globe,
                title: "Multi-site owners",
                body: "Ten blogs, one install, one login. SaaS tools bill per domain or pool subscribers per plan; PushKit treats sites as rows in your database — add the eleventh for free.",
              },
              {
                icon: Database,
                title: "Anyone who wants their data back",
                body: "Subscriber endpoints, keys and tags live in your D1 database. Inspect them, export them, back them up. No vendor can hold your audience hostage, raise its price, or shut your account.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <item.icon className="mb-2 size-6" />
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capacity */}
      <section id="capacity" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight">What Cloudflare&apos;s free tier actually gives you</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          PushKit is engineered around the free allowances: 40 subscribers per queue message,
          batched counters instead of per-delivery rows, one database read per batch. That is
          how $0 turns into ≈130,000 deliveries a day.
        </p>
        <div className="mt-8 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-4 py-3 font-medium">Resource</th>
                <th className="px-4 py-3 font-medium">Cloudflare Free</th>
                <th className="px-4 py-3 font-medium">How PushKit uses it</th>
              </tr>
            </thead>
            <tbody>
              {CAPACITY_ROWS.map((row) => (
                <tr key={row.resource} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{row.resource}</td>
                  <td className="px-4 py-3">{row.free}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.pushkit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-lg border p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">Outgrow free? The next step is $5/month — not $419.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Workers Paid raises the same limits to ≈13,000,000 pushes/month. Same account,
              same install, no migration.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/compare#limits" />}>
            See free vs $5 limits
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight">Straight answers</h2>
          <div className="mt-8 space-y-4">
            {FAQS.map((faq) => (
              <Card key={faq.q}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 rounded-lg border bg-background p-6 text-center">
            <Bell className="mx-auto size-8" />
            <h3 className="mt-3 text-xl font-bold">Deploy PushKit on Cloudflare&apos;s free tier</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              One command to create the database, one to deploy. Nine steps, about 10 minutes,
              $0/month.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button size="lg" render={<Link href="/deploy" />}>
                <KeyRound /> Open the Deploy Guide
              </Button>
              <Button size="lg" variant="outline" render={<a href={GITHUB_URL} />}>
                <Code2 /> GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
