import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CAPACITY_STATS,
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing";
import { BreadcrumbsSchema } from "@/components/seo-schema";
import { SITE_URL, GITHUB_BUG_REPORT_URL, GITHUB_REPO_URL } from "@/lib/site-config";
import { ArrowRight, CheckCircle2, HelpCircle, Layers, Code2, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Self Hosted Push Notifications on Cloudflare Free | PushKit",
  description:
    "Deploy self-hosted push notifications on Cloudflare free tier. 10-minute step-by-step guide with D1 database, R2 storage, queues, and zero monthly fees.",
  alternates: {
    canonical: `${SITE_URL}/deploy`,
  },
  openGraph: {
    title: "Self Hosted Push Notifications on Cloudflare Free | PushKit",
    description:
      "Deploy self-hosted push notifications on Cloudflare free tier in 10 minutes with zero monthly fees.",
    url: `${SITE_URL}/deploy`,
    type: "website",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self Hosted Push Notifications on Cloudflare Free | PushKit",
    description:
      "Deploy self-hosted push notifications on Cloudflare free tier in 10 minutes with zero monthly fees.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

const steps = [
  {
    title: "Clone repository & install dependencies",
    body: "Node.js 20+ is required on your local machine.",
    code: "git clone https://github.com/zhshimul815/pushkit.git && cd pushkit && npm install",
    success: "Success: Node modules installed without errors.",
  },
  {
    title: "Log in to Cloudflare CLI",
    body: "A standard free Cloudflare account is all that is required. No credit card or paid plan is needed.",
    code: "npx wrangler login",
    success: "Success: Browser window opens and displays 'Successfully logged in to Wrangler'.",
  },
  {
    title: "Create the Cloudflare D1 database",
    body: "Copy the database_id from the terminal output and paste it into wrangler.toml, replacing REPLACE_WITH_D1_DATABASE_ID.",
    code: "npx wrangler d1 create pushkit-db",
    success: "Success: Terminal outputs database_name and a unique database_id UUID.",
  },
  {
    title: "Run database migrations",
    body: "Initializes all tables: users, sessions, sites, subscribers, campaigns, templates, daily stats, and settings.",
    code: "npm run db:migrate:remote",
    success: "Success: Terminal logs confirmation that all schema migrations applied to remote D1.",
  },
  {
    title: "Create the R2 media storage bucket",
    body: "Creates the S3-compatible R2 bucket for storing uploaded notification icons, badges, and campaign hero banners with zero egress fees.",
    code: "npx wrangler r2 bucket create pushkit-media",
    success: "Success: Outputs 'Creating bucket pushkit-media... Created bucket pushkit-media.'",
  },
  {
    title: "Create Cloudflare Queues",
    body: "Creates the delivery queue for fan-out processing and a dead-letter queue (DLQ) for poisoned messages.",
    code: "npx wrangler queues create pushkit-send && npx wrangler queues create pushkit-dlq",
    success: "Success: Both pushkit-send and pushkit-dlq queues created in your Cloudflare account.",
  },
  {
    title: "Set variables in wrangler.toml",
    body: "Configure your deployment origin, owner email, sender address, and push contact subject.",
    code: 'NEXT_PUBLIC_APP_URL = "https://push.example.com"\nOWNER_EMAIL = "you@example.com"\nEMAIL_FROM = "PushKit <auth@yourdomain.com>"\nVAPID_SUBJECT = "mailto:you@example.com"',
    success: "Success: wrangler.toml saved with your domain and verified email address.",
  },
  {
    title: "Set the Resend API key secret",
    body: "Login OTP codes and magic links are delivered by Resend. Get an API key at resend.com and verify your sending domain.",
    code: "npx wrangler secret put RESEND_API_KEY",
    success: "Success: Wrangler prompts for secret and confirms '✨ Success! Uploaded secret RESEND_API_KEY'.",
  },
  {
    title: "Deploy to Cloudflare Workers",
    body: "Builds the Next.js application with OpenNext and publishes the unified Worker with queue consumers and cron triggers.",
    code: "npm run deploy",
    success: "Success: Deployment finishes with live URL: 'https://pushkit.<your-subdomain>.workers.dev'.",
  },
  {
    title: "First login & account bootstrapping",
    body: "Open /login on your deployed domain, enter your OWNER_EMAIL, and authenticate with the emailed OTP code. The owner record is automatically created.",
    code: "https://push.example.com/login",
    success: "Success: Redirects directly to the PushKit dashboard with full owner permissions.",
  },
];

const checklist = [
  "Dashboard → Sites → Add Site: enter your domain. An isolated VAPID key pair is generated for that site.",
  "Download sw.js from the site card and host it at the root of your domain (https://yoursite.com/sw.js) or use the WordPress plugin.",
  "Paste the 1-line integration snippet before </body> on your site. Subscribers begin registering immediately.",
  "Composer → Fetch URL Metadata with any blog post URL → Send Now. The test campaign confirms end-to-end delivery.",
  "Optional: configure RSS/Atom feed URL for automated 5-minute polling, or set up a CMS publish webhook.",
  "Dashboard → Settings → Team: invite team members. Staff accounts cannot access VAPID keys, webhook secrets, or Resend keys.",
];

export default function DeployPage() {
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Deploy Guide", path: "/deploy" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <BreadcrumbsSchema items={breadcrumbs} />
      <MarketingHeader />

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Deployment Runbook
            </span>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              Deploy Self-Hosted Push Notifications on Cloudflare Free Tier
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              One Worker, one D1 database, one R2 bucket, and one Queue. Total running cost is
              $0/month with zero credit card required. Setup takes about 10 minutes.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {CAPACITY_STATS.map((s) => (
                <div key={s.label}>
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-bold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Capacity Math */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">Free-Tier Capacity — the Math</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              These numbers are computed directly from Cloudflare&apos;s published free tier quotas and PushKit&apos;s
              batching design.
            </p>
            <div className="mt-8 overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-normal">Resource</TableHead>
                    <TableHead className="whitespace-normal">Free limit</TableHead>
                    <TableHead className="whitespace-normal">How PushKit uses it</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">Queues operations</TableCell>
                    <TableCell className="whitespace-normal">10,000 / day</TableCell>
                    <TableCell className="whitespace-normal">
                      40 subscribers per message batch, one message per consumer invocation (50-subrequest
                      limit). One delivered message costs ~3 operations (write, read, delete)
                      → ~3,333 messages/day → ≈130,000 pushes/day.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">Workers requests</TableCell>
                    <TableCell className="whitespace-normal">100,000 / day</TableCell>
                    <TableCell className="whitespace-normal">
                      Dashboard, API, SDK config, subscribe and click endpoints. Push delivery
                      itself goes from the queue consumer directly to push services — ≈4,000,000 pushes/month of headroom.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">D1 storage</TableCell>
                    <TableCell className="whitespace-normal">500 MB per database</TableCell>
                    <TableCell className="whitespace-normal">
                      One subscriber row with endpoint, keys, country, browser, OS, and device is
                      under 500 bytes → 1,000,000+ subscribers stored.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">D1 rows written</TableCell>
                    <TableCell className="whitespace-normal">100,000 / day</TableCell>
                    <TableCell className="whitespace-normal">
                      Delivery results are batched counters on the campaign row (~1 write per 40
                      deliveries) plus 1 write per new subscriber. Delivery writes stay under ~5% of daily budget.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">R2 storage</TableCell>
                    <TableCell className="whitespace-normal">10 GB, zero egress fees</TableCell>
                    <TableCell className="whitespace-normal">Notification icons, badges, and hero images only.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">Resend email</TableCell>
                    <TableCell className="whitespace-normal">100 / day, 3,000 / month (free plan)</TableCell>
                    <TableCell className="whitespace-normal">
                      Only login codes, magic links, and staff invites send email. Push campaigns never consume email quota.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">Sites</TableCell>
                    <TableCell className="whitespace-normal">Unlimited</TableCell>
                    <TableCell className="whitespace-normal">
                      Sites are rows in D1 with their own independent VAPID key pairs. PushKit imposes no artificial limits.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Exceeding a free limit does not delete data: Workers requests and Queue operations
              reset daily, and Cloudflare pauses the resource until the reset.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">Deployment Steps (In Order)</h2>
            <p className="mt-2 text-muted-foreground">
              Follow these 10 steps in sequence. Each step includes a confirmation of what success looks like.
            </p>
            <ol className="mt-10 space-y-8">
              {steps.map((step, i) => (
                <li key={step.title} id={`step-${i + 1}`} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{step.body}</p>
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs sm:text-sm">
                      {step.code}
                    </pre>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span>{step.success}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* Stuck Box */}
            <div className="mt-12 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="size-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-foreground">Stuck on a Step?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    If any Wrangler command throws an unexpected error, check the Cloudflare status or open an issue on GitHub with your terminal error output.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
                    <a
                      href={GITHUB_BUG_REPORT_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      &rarr; Open a Bug Report on GitHub
                    </a>
                    <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      &rarr; View PushKit Repository
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* After Deploy */}
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">After Deploy — Initial Checklist</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {checklist.map((item, i) => (
                <Card key={item}>
                  <CardHeader>
                    <CardTitle className="text-base">Step {i + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{item}</CardContent>
                </Card>
              ))}
            </div>

            {/* Next Steps Links */}
            <div className="mt-10 rounded-xl border bg-card p-6">
              <h3 className="text-base font-bold text-foreground">Next Steps & Integration Guides</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Connect your websites, migrate existing subscribers, or automate push alerts with the API:
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link
                  href="/docs/wordpress"
                  className="flex items-center justify-between rounded-lg border p-3 text-xs font-semibold hover:border-primary/50"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <span>WordPress Setup Guide</span>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </Link>
                <Link
                  href="/docs/migrate-from-onesignal"
                  className="flex items-center justify-between rounded-lg border p-3 text-xs font-semibold hover:border-primary/50"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    <span>Migrate from OneSignal</span>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </Link>
                <Link
                  href="/docs/api"
                  className="flex items-center justify-between rounded-lg border p-3 text-xs font-semibold hover:border-primary/50"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="size-4 text-primary" />
                    <span>Web Push API Docs</span>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Configuration Reference */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">Configuration Reference</h2>
            <div className="mt-8 overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">DB</TableCell>
                    <TableCell className="whitespace-normal">D1 binding</TableCell>
                    <TableCell className="whitespace-normal">All data: users, sessions, sites, subscribers, campaigns, settings.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">MEDIA</TableCell>
                    <TableCell className="whitespace-normal">R2 binding</TableCell>
                    <TableCell className="whitespace-normal">Notification icons and hero images stored in R2 bucket pushkit-media.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">PUSH_QUEUE</TableCell>
                    <TableCell className="whitespace-normal">Queue producer + consumer</TableCell>
                    <TableCell className="whitespace-normal">Campaign fan-out in the same Worker (cloudflare-worker.ts).</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">NEXT_PUBLIC_APP_URL</TableCell>
                    <TableCell className="whitespace-normal">Variable</TableCell>
                    <TableCell className="whitespace-normal">Public URL of the install. Used in snippets, sw.js, and email links.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">OWNER_EMAIL</TableCell>
                    <TableCell className="whitespace-normal">Variable</TableCell>
                    <TableCell className="whitespace-normal">The owner account. First login with this email bootstraps it.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">EMAIL_FROM</TableCell>
                    <TableCell className="whitespace-normal">Variable</TableCell>
                    <TableCell className="whitespace-normal">Sender for login email. Domain must be verified in Resend.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">VAPID_SUBJECT</TableCell>
                    <TableCell className="whitespace-normal">Variable</TableCell>
                    <TableCell className="whitespace-normal">Contact (mailto:) sent to push services with every VAPID token.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">RESEND_API_KEY</TableCell>
                    <TableCell className="whitespace-normal">Secret</TableCell>
                    <TableCell className="whitespace-normal">
                      Email delivery for login codes. Alternative: save the key in Dashboard → Settings → Email (Resend).
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
