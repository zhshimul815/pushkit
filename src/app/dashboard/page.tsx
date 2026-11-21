import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { getStore } from "@/lib/store";
import type { OverviewStats } from "@/lib/types";

export const dynamic = "force-dynamic";

function Breakdown({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          rows.map((row) => (
            <div key={row.name}>
              <div className="flex justify-between text-sm">
                <span>{row.name}</span>
                <span className="tabular-nums text-muted-foreground">{row.count}</span>
              </div>
              <div className="mt-1 h-1.5 rounded bg-muted">
                <div
                  className="h-1.5 rounded bg-primary"
                  style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default async function OverviewPage() {
  let stats: OverviewStats;
  try {
    const store = await getStore();
    stats = await store.overview();
  } catch (err) {
    console.error("Dashboard overview failed:", err);
    stats = {
      totalSubscribers: 0,
      newToday: 0,
      notificationsSent: 0,
      averageCtr: 0,
      series: [],
      countries: [],
      devices: [],
      browsers: [],
      os: [],
      services: [],
      promptAb: { a: 0, b: 0 },
      ctr30: { sent: 0, clicks: 0 },
    };
  }
  const ctr30 = stats.ctr30.sent > 0 ? Math.round((stats.ctr30.clicks / stats.ctr30.sent) * 1000) / 10 : 0;
  const lowEngagement = stats.ctr30.sent > 5000 && ctr30 < 1;

  const kpis = [
    { label: "Total Subscribers", value: stats.totalSubscribers.toLocaleString() },
    { label: "New Today", value: stats.newToday.toLocaleString() },
    { label: "Notifications Sent", value: stats.notificationsSent.toLocaleString() },
    { label: "Average CTR", value: `${stats.averageCtr}%` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriber Growth &amp; Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewChart series={stats.series} />
        </CardContent>
      </Card>
      {lowEngagement ? (
        <Card className="border-amber-500/60 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base">Low engagement warning — 30-day CTR is {ctr30}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.ctr30.sent.toLocaleString()} notifications sent in 30 days with a CTR under 1%.
              Since October 2025, Chrome can automatically revoke notification permission for
              high-volume, low-engagement sites. Send the next campaign with{" "}
              <span className="font-medium text-foreground">Engaged subscribers only</span> in the
              composer audience, and reduce send frequency until CTR recovers.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Breakdown title="Top Countries" rows={stats.countries} />
        <Breakdown title="Devices" rows={stats.devices} />
        <Breakdown title="Browsers" rows={stats.browsers} />
        <Breakdown title="OS" rows={stats.os} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Breakdown title="Push Services (by endpoint)" rows={stats.services} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prompt A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {stats.promptAb.a + stats.promptAb.b === 0 ? (
              <p className="text-muted-foreground">
                No A/B data yet. Enable Prompt A/B Test in a site&apos;s settings to split new
                subscribers between two prompt texts.
              </p>
            ) : (
              <>
                <p>Variant A opt-ins: <span className="font-medium tabular-nums">{stats.promptAb.a.toLocaleString()}</span></p>
                <p>Variant B opt-ins: <span className="font-medium tabular-nums">{stats.promptAb.b.toLocaleString()}</span></p>
                <p className="text-muted-foreground">
                  Variants are assigned randomly per visitor, so the split compares opt-in rates directly.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
