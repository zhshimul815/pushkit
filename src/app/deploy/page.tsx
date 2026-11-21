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

export const metadata: Metadata = {
  title: "Deploy Guide — PushKit",
  description:
    "Step-by-step deployment of PushKit on the Cloudflare Free Tier, with the free-tier capacity math: pushes per day, subscribers, and limits.",
};

const steps = [
  {
    title: "Clone and install",
    body: "Node.js 20+ is required.",
    code: "git clone https://github.com/zhshimul815/pushkit.git && cd pushkit && npm install",
  },
  {
    title: "Log in to Cloudflare",
    body: "A free Cloudflare account is enough. No paid plan is used anywhere in this guide.",
    code: "npx wrangler login",
  },
  {
    title: "Create the D1 database",
    body: "Copy the database_id from the output and paste it into wrangler.toml, replacing REPLACE_WITH_D1_DATABASE_ID.",
    code: "npx wrangler d1 create pushkit-db",
  },
  {
    title: "Run migrations",
    body: "Creates all tables: users, sessions, sites, subscribers, campaigns, templates, daily stats, settings.",
    code: "npm run db:migrate:remote",
  },
  {
    title: "Create the R2 bucket and the Queues",
    body: "R2 stores notification icons and hero images. The queue carries campaign fan-out; the second queue is the dead-letter queue.",
    code: "npx wrangler r2 bucket create pushkit-media && npx wrangler queues create pushkit-send && npx wrangler queues create pushkit-dlq",
  },
  {
    title: "Set the variables in wrangler.toml",
    body: "NEXT_PUBLIC_APP_URL is the public URL of this install. OWNER_EMAIL is the only account that can sign in first — it becomes the owner. EMAIL_FROM must use a domain verified in Resend. VAPID_SUBJECT is a contact for push services.",
    code: 'NEXT_PUBLIC_APP_URL = "https://push.example.com"\nOWNER_EMAIL = "you@example.com"\nEMAIL_FROM = "PushKit <auth@yourdomain.com>"\nVAPID_SUBJECT = "mailto:you@example.com"',
  },
  {
    title: "Set the Resend API key as a secret",
    body: "Login codes are emailed, so the key must exist before the first login. Get a key at resend.com → API Keys and verify your sending domain there. After the first login you can replace or rotate this key at any time in Dashboard → Settings → Email (Resend) — a key saved there is stored encrypted in D1 and takes priority over this secret.",
    code: "npx wrangler secret put RESEND_API_KEY",
  },
  {
    title: "Deploy",
    body: "Builds the Next.js app with OpenNext and deploys one Worker containing the app, the queue consumer, and the cron triggers.",
    code: "npm run deploy",
  },
  {
    title: "First login",
    body: "Open /login on your URL, enter OWNER_EMAIL, and sign in with the 6-digit code or the magic link from the email. The owner account is created on this first login.",
    code: "https://push.example.com/login",
  },
];

const checklist = [
  "Dashboard → Sites → Add Site: enter the domain. A VAPID key pair is generated for the site.",
  "Download sw.js from the site card and place it at the root of the site: https://yoursite.com/sw.js",
  "Paste the integration snippet before </body> on the site. Subscribers start registering immediately.",
  "Composer → Fetch URL Metadata with a post URL → Send Now. The test campaign confirms delivery end to end.",
  "Optional per site: set the RSS / Atom feed URL and enable Auto-Push, or point a Ghost / CMS webhook at the site's publish endpoint.",
  "Dashboard → Settings → Team: invite staff. Staff cannot see VAPID keys, webhook secrets, or the Resend key.",
  "Dashboard → Settings → Email (Resend): optionally save the Resend API key here instead of the environment secret, and send a test email.",
];

export default function DeployPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              Deploy PushKit on the Cloudflare Free Tier
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              One Worker, one D1 database, one R2 bucket, one Queue. Total running cost is
              $0/month inside the free limits below. Setup takes about 10 minutes.
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

        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">Free-Tier Capacity — the Math</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              These numbers are computed from Cloudflare&apos;s published free limits and PushKit&apos;s
              batching design, not from a pricing page.
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
                      40 subscribers per message, one message per consumer invocation (50-subrequest
                      limit). One delivered message costs ~3 operations (write, read, delete)
                      → ~3,333 messages/day → ≈130,000 pushes/day.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">Workers requests</TableCell>
                    <TableCell className="whitespace-normal">100,000 / day</TableCell>
                    <TableCell className="whitespace-normal">
                      Dashboard, API, SDK config, subscribe and click endpoints. Push delivery
                      itself goes from the queue consumer directly to the push services — ≈4,000,000 pushes/month of headroom.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">D1 storage</TableCell>
                    <TableCell className="whitespace-normal">500 MB per database</TableCell>
                    <TableCell className="whitespace-normal">
                      One subscriber row with endpoint, keys, country, browser, OS, device is
                      under 500 bytes → 1,000,000+ subscribers stored.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">D1 rows written</TableCell>
                    <TableCell className="whitespace-normal">100,000 / day</TableCell>
                    <TableCell className="whitespace-normal">
                      Delivery results are batched counters on the campaign row (~1 write per 40
                      deliveries) plus 1 write per new subscriber. No per-delivery rows — delivery writes stay under ~5% of the daily budget.
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
                      Only login codes, magic links, and staff invites send email. Campaigns never send email — the free plan covers owner + staff logins.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium whitespace-normal">Sites</TableCell>
                    <TableCell className="whitespace-normal">—</TableCell>
                    <TableCell className="whitespace-normal">
                      Sites are rows in D1 with their own VAPID key pair. PushKit sets no limit.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Exceeding a free limit does not delete data: Workers requests and Queue operations
              reset daily, and Cloudflare pauses the resource until the reset. Paid plans raise
              every limit without code changes.
            </p>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">Deployment Steps</h2>
            <p className="mt-2 text-muted-foreground">
              Prerequisites: Node.js 20+, a free Cloudflare account, a free Resend account.
            </p>
            <ol className="mt-10 space-y-8">
              {steps.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{step.body}</p>
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs sm:text-sm">
                      {step.code}
                    </pre>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight">After Deploy — Checklist</h2>
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
          </div>
        </section>

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
                    <TableCell className="whitespace-normal">Notification icons and hero images.</TableCell>
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
                    <TableCell className="whitespace-normal">The owner account. First login with this email creates it.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">EMAIL_FROM</TableCell>
                    <TableCell className="whitespace-normal">Variable</TableCell>
                    <TableCell className="whitespace-normal">Sender for login email. Domain must be verified in Resend. Can be changed in Settings.</TableCell>
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
                      Email delivery. Alternative: save the key in Dashboard → Settings → Email
                      (Resend) after first login — stored AES-GCM encrypted in D1, takes priority.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm whitespace-normal">SESSION_SECRET</TableCell>
                    <TableCell className="whitespace-normal">Secret (optional)</TableCell>
                    <TableCell className="whitespace-normal">Salts session/token hashes and encrypts the Settings-stored Resend key. Set it before saving a key in Settings.</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Local development: <span className="font-mono">npm run dev</span> runs without any
              Cloudflare account — login codes print to the server log, and an in-memory demo
              store is used. Full details are in the{" "}
              <a href="https://github.com/zhshimul815/pushkit" className="underline">README</a>. Back
              to the <Link href="/" className="underline">product overview</Link>.
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
