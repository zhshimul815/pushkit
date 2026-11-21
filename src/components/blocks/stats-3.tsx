import Link from "next/link";
import { Send, Megaphone, Users, Globe } from "lucide-react";

const stats = [
  {
    icon: Send,
    value: "≈130,000",
    label: "Pushes per day",
    subtext: "40 pushes per queue batch",
  },
  {
    icon: Megaphone,
    value: "≈4,000,000",
    label: "Pushes per month",
    subtext: "10,000 daily queue operations",
  },
  {
    icon: Users,
    value: "1,000,000+",
    label: "Subscribers stored",
    subtext: "500 MB SQLite database limit",
  },
  {
    icon: Globe,
    value: "Unlimited",
    label: "Sites",
    subtext: "Separate VAPID & settings",
  },
];

export default function StatsBlock() {
  return (
    <section className="flex w-full items-center justify-center border-y bg-secondary/30 px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Cloudflare Free Tier
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            What you can achieve with $0/mo Cloudflare free hosting
          </h2>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            With $0/mo Cloudflare free hosting, you can scale web push delivery without recurring SaaS costs.
            Capacity computed from Cloudflare&apos;s published free-tier limits and PushKit&apos;s batching design — full math on the{" "}
            <Link
              href="/deploy"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Deploy page
            </Link>.
          </p>
        </div>

        <dl className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stats.map(({ icon: Icon, value, label, subtext }) => (
            <div
              key={label}
              className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-xs"
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <dt className="mt-6 text-3xl font-bold tracking-tight tabular-nums">
                {value}
              </dt>
              <dd className="mt-1 text-sm font-medium text-muted-foreground">{label}</dd>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>{subtext}</span>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
