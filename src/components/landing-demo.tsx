"use client";

/**
 * Landing-page product demo.
 *
 * This is NOT a screenshot: it renders the same dashboard components
 * (KPI cards, OverviewChart, breakdown bars, campaigns table) with
 * hard-coded sample data, inside a view-only frame — pointer events
 * are disabled, nothing here is editable or clickable.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OverviewChart } from "@/components/dashboard/overview-chart";

/* Deterministic sample series: 30 days of a mid-size publisher. */
const SERIES = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 23 + i));
  const sent = i % 6 === 5 ? 6000 + ((i * 311) % 2500) : 42000 + ((i * 1373) % 9000);
  return {
    day: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    subscribers: 190 + ((i * 53) % 160) + i * 3,
    sent,
    clicks: Math.round(sent * (0.024 + ((i * 7) % 10) / 1000)),
  };
});

const KPIS = [
  { label: "Total Subscribers", value: "48,214" },
  { label: "New Today", value: "312" },
  { label: "Notifications Sent", value: "1,284,930" },
  { label: "Average CTR", value: "2.9%" },
];

const BREAKDOWNS: { title: string; rows: [string, number][] }[] = [
  { title: "Top Countries", rows: [["India", 38], ["Bangladesh", 14], ["United States", 11], ["Brazil", 7], ["United Kingdom", 5]] },
  { title: "Devices", rows: [["Mobile", 71], ["Desktop", 26], ["Tablet", 3]] },
  { title: "Browsers", rows: [["Chrome", 82], ["Firefox", 8], ["Edge", 6], ["Safari", 4]] },
  { title: "Operating Systems", rows: [["Android", 64], ["Windows", 24], ["Linux", 6], ["macOS", 4]] },
];

const CAMPAIGNS = [
  { title: "Morning headlines — top stories", time: "Today, 8:00 AM", sent: "47,930", clicks: "1,412", ctr: "2.9%" },
  { title: "New post: Cloudflare Workers, explained", time: "Yesterday, 6:30 PM", sent: "47,502", clicks: "1,388", ctr: "2.9%" },
  { title: "Weekend reading roundup", time: "Nov 15, 10:00 AM", sent: "46,980", clicks: "1,104", ctr: "2.3%" },
  { title: "Breaking: budget announcement live blog", time: "Nov 14, 1:15 PM", sent: "46,455", clicks: "1,530", ctr: "3.3%" },
];

const NAV = ["Overview", "Sites", "Campaigns", "New Campaign", "Subscribers", "Templates", "Settings"];

export function LandingDemo() {
  return (
    <div className="pointer-events-none select-none" aria-hidden="true">
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* Window bar */}
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-muted-foreground">pushkit.your-domain.com/dashboard</span>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar (same labels as the real dashboard) */}
          <div className="hidden w-44 shrink-0 border-r p-3 md:block">
            <p className="px-2 pb-3 text-sm font-bold">PushKit</p>
            <div className="space-y-1">
              {NAV.map((item, i) => (
                <p
                  key={item}
                  className={`rounded-md px-2 py-1.5 text-sm ${i === 0 ? "bg-secondary font-medium" : "text-muted-foreground"}`}
                >
                  {item}
                </p>
              ))}
            </div>
            <p className="px-2 pt-4 text-xs text-muted-foreground">Site: Daily Tech Blog</p>
          </div>

          {/* Main panel */}
          <div className="min-w-0 flex-1 space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {KPIS.map((kpi) => (
                <Card key={kpi.label}>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-sm">Subscribers, Sent &amp; Clicks — last 30 days</CardTitle>
              </CardHeader>
              <CardContent>
                <OverviewChart series={SERIES} />
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {BREAKDOWNS.map((group) => (
                <Card key={group.title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{group.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.rows.map(([label, pct]) => (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{label}</span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary">
                          <div className="h-1.5 rounded-full bg-foreground/70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CAMPAIGNS.map((c) => (
                      <TableRow key={c.title}>
                        <TableCell className="whitespace-normal">
                          <p className="font-medium">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.time}</p>
                        </TableCell>
                        <TableCell>{c.sent}</TableCell>
                        <TableCell>{c.clicks}</TableCell>
                        <TableCell>{c.ctr}</TableCell>
                        <TableCell>
                          <Badge>Sent</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
