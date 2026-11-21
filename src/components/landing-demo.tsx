"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  LayoutDashboard,
  Globe,
  Send,
  PlusCircle,
  Users,
  FileText,
  Settings,
  Smartphone,
  Search,
  Download,
  Bell,
  Laptop,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock Data                                                           */
/* ------------------------------------------------------------------ */

type NavTab =
  | "Overview"
  | "Sites"
  | "Campaigns"
  | "New Campaign"
  | "Subscribers"
  | "Templates";

const NAV_ITEMS: { name: NavTab; icon: typeof LayoutDashboard }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Sites", icon: Globe },
  { name: "Campaigns", icon: Send },
  { name: "New Campaign", icon: PlusCircle },
  { name: "Subscribers", icon: Users },
  { name: "Templates", icon: FileText },
];

/* 30 days series for Overview chart */
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
  { title: "Morning headlines — top stories", time: "Today, 8:00 AM", sent: "47,930", clicks: "1,412", ctr: "2.9%", status: "Sent" },
  { title: "New post: Cloudflare Workers, explained", time: "Yesterday, 6:30 PM", sent: "47,502", clicks: "1,388", ctr: "2.9%", status: "Sent" },
  { title: "Weekend reading roundup", time: "Nov 15, 10:00 AM", sent: "46,980", clicks: "1,104", ctr: "2.3%", status: "Sent" },
  { title: "Breaking: budget announcement live blog", time: "Nov 14, 1:15 PM", sent: "46,455", clicks: "1,530", ctr: "3.3%", status: "Sent" },
  { title: "Black Friday Early Access Alert", time: "Scheduled for Nov 28, 9:00 AM", sent: "—", clicks: "—", ctr: "—", status: "Scheduled" },
  { title: "Monthly Dev Community Digest #18", time: "Edited 2 days ago", sent: "—", clicks: "—", ctr: "—", status: "Draft" },
];

const SITES = [
  { name: "Daily Tech Blog", domain: "dailytech.blog", subscribers: "34,120", status: "Active", siteId: "site_849204" },
  { name: "WordPress News Hub", domain: "wpnewshub.io", subscribers: "11,850", status: "Active", siteId: "site_192841" },
  { name: "Acme Store & Merch", domain: "shop.acme.co", subscribers: "2,244", status: "Active", siteId: "site_552194" },
];

const SUBSCRIBERS = [
  { id: "sub_9f81a702", country: "🇺🇸 US", browser: "Chrome 130", os: "macOS", device: "Desktop", tags: ["tech", "daily"], seen: "2m ago" },
  { id: "sub_4b22c981", country: "🇬🇧 UK", browser: "Safari 18", os: "iOS", device: "Mobile", tags: ["weekly"], seen: "14m ago" },
  { id: "sub_1a78e433", country: "🇩🇪 DE", browser: "Firefox 132", os: "Windows", device: "Desktop", tags: ["tech"], seen: "1h ago" },
  { id: "sub_88c4d219", country: "🇮🇳 IN", browser: "Chrome 130", os: "Android", device: "Mobile", tags: ["daily", "vip"], seen: "3h ago" },
  { id: "sub_33e0b571", country: "🇯🇵 JP", browser: "Edge 130", os: "Windows", device: "Desktop", tags: ["news"], seen: "5h ago" },
  { id: "sub_55f1a812", country: "🇧🇷 BR", browser: "Chrome 129", os: "Android", device: "Mobile", tags: ["daily"], seen: "8h ago" },
];

const TEMPLATES = [
  {
    title: "Breaking News Alert",
    body: "Major story just developing. Tap to read the live reporting.",
    tags: ["breaking", "urgent"],
    actions: ["Read Now", "Dismiss"],
  },
  {
    title: "Weekly Roundup",
    body: "Your 5-minute Sunday briefing of the biggest tech stories this week.",
    tags: ["weekly", "digest"],
    actions: ["Open Digest", "Save"],
  },
  {
    title: "Flash Product Launch",
    body: "Now live: 40% discount for early adopters with code EDGE.",
    tags: ["launch", "deal"],
    actions: ["Shop Deal", "Details"],
  },
  {
    title: "New Post Published",
    body: "New deep-dive tutorial published. Sub-50ms TTFB on Cloudflare Workers.",
    tags: ["blog", "tutorial"],
    actions: ["Read Article", "Later"],
  },
];

/* ------------------------------------------------------------------ */
/* Main Interactive Demo Component                                    */
/* ------------------------------------------------------------------ */

export function LandingDemo() {
  const [activeTab, setActiveTab] = useState<NavTab>("Overview");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [composerPreview, setComposerPreview] = useState<"android" | "windows" | "macos">("android");

  return (
    <div className="w-full">
      {/* Device Mode Switcher Bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Interactive Demo Mode:</span>
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === "desktop"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Laptop className="size-3.5" /> Desktop View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === "mobile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="size-3.5" /> Mobile View
            </button>
          </div>
        </div>

        <span className="hidden text-xs text-muted-foreground sm:inline">
          Click any menu tab to preview that screen
        </span>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* DESKTOP SCREEN FRAME                                          */}
      {/* -------------------------------------------------------------- */}
      {viewMode === "desktop" ? (
        <div className="overflow-hidden rounded-xl border bg-background shadow-lg transition-all">
          {/* Window Title Bar */}
          <div className="flex h-11 items-center justify-between border-b px-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs font-mono text-muted-foreground">
                pushkit.your-domain.com/dashboard/{activeTab.toLowerCase().replace(" ", "-")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Demo · Read-only
              </span>
            </div>
          </div>

          <div className="flex h-[600px] overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-52 shrink-0 border-r bg-muted/10 p-3 flex flex-col justify-between">
              <div>
                <div className="px-2 pb-3 pt-1 flex items-center justify-between">
                  <p className="text-sm font-bold tracking-tight">PushKit</p>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">v1.0</span>
                </div>
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setActiveTab(item.name)}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition text-left ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        {item.name}
                      </button>
                    );
                  })}
                  <div className="pt-2 border-t border-border/40 mt-2">
                    <div className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2.5">
                        <Settings className="size-4 shrink-0 text-muted-foreground/70" />
                        Settings
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Site selector badge */}
              <div className="rounded-lg border bg-background p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Selected Site</p>
                <p className="mt-0.5 text-xs font-medium truncate">Daily Tech Blog</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">● 34,120 Subscribers</p>
              </div>
            </div>

            {/* Scrollable Main Content Area */}
            <div className="flex-1 overflow-y-auto p-5 scroll-smooth">
              <div className="max-w-5xl mx-auto space-y-4">
                {/* Header of Active Tab */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold tracking-tight">{activeTab}</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "Overview" && "Performance metrics, audience breakdown, and recent delivery history."}
                      {activeTab === "Sites" && "Websites registered under this PushKit install with independent VAPID keys."}
                      {activeTab === "Campaigns" && "Sent broadcasts, scheduled notifications, and message performance."}
                      {activeTab === "New Campaign" && "Compose and preview rich web push notifications with instant device preview."}
                      {activeTab === "Subscribers" && "Audience directory with browser, OS, device, tags, and export options."}
                      {activeTab === "Templates" && "Reusable campaign templates for breaking news, digests, and deals."}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Site: <strong className="text-foreground">Daily Tech Blog</strong>
                  </span>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === "Overview" && (
                  <div className="space-y-4">
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
                            {CAMPAIGNS.slice(0, 4).map((c) => (
                              <TableRow key={c.title}>
                                <TableCell className="whitespace-normal">
                                  <p className="font-medium text-xs sm:text-sm">{c.title}</p>
                                  <p className="text-[11px] text-muted-foreground">{c.time}</p>
                                </TableCell>
                                <TableCell>{c.sent}</TableCell>
                                <TableCell>{c.clicks}</TableCell>
                                <TableCell>{c.ctr}</TableCell>
                                <TableCell>
                                  <Badge variant={c.status === "Sent" ? "default" : "secondary"}>
                                    {c.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* TAB 2: SITES */}
                {activeTab === "Sites" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {SITES.map((site) => (
                        <Card key={site.siteId} className="relative overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold truncate">{site.name}</CardTitle>
                            <p className="text-xs text-muted-foreground font-mono truncate">{site.domain}</p>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold">{site.subscribers}</p>
                            <p className="text-xs text-muted-foreground">Subscribers connected</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Embed Code for Your Sites</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-2">
                          Add this 1-line script to your WordPress theme or website &lt;head&gt; to prompt visitors and handle push tokens:
                        </p>
                        <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto text-foreground">
                          {`<script src="https://pushkit.your-domain.com/sw.js" defer data-site="site_849204"></script>`}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* TAB 3: CAMPAIGNS */}
                {activeTab === "Campaigns" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground flex-1 max-w-sm">
                        <Search className="size-3.5" /> Search campaigns...
                      </div>
                      <Button size="sm" onClick={() => setActiveTab("New Campaign")}>
                        <PlusCircle className="size-3.5 mr-1.5" /> Compose New
                      </Button>
                    </div>

                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>CTR</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {CAMPAIGNS.map((c) => (
                            <TableRow key={c.title}>
                              <TableCell>
                                <p className="font-medium text-xs sm:text-sm">{c.title}</p>
                                <p className="text-[11px] text-muted-foreground">{c.time}</p>
                              </TableCell>
                              <TableCell>{c.sent}</TableCell>
                              <TableCell>{c.clicks}</TableCell>
                              <TableCell>{c.ctr}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    c.status === "Sent"
                                      ? "default"
                                      : c.status === "Scheduled"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {c.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )}

                {/* TAB 4: NEW CAMPAIGN (COMPOSER) */}
                {activeTab === "New Campaign" && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Composer Form Preview */}
                    <div className="space-y-3 rounded-lg border bg-background p-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Notification Title</label>
                        <p className="mt-1 rounded-md border bg-muted/20 px-3 py-2 text-xs font-medium">
                          10 Ways to Scale WordPress with Cloudflare Workers
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Message Body</label>
                        <p className="mt-1 rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          Sub-50ms TTFB worldwide with zero egress costs, smart edge caching, and automated web push broadcasts.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground">Target URL</label>
                        <p className="mt-1 rounded-md border bg-muted/20 px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                          https://dailytech.blog/scale-wordpress-cloudflare
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Button 1</label>
                          <p className="mt-1 rounded-md border bg-muted/20 px-2.5 py-1.5 text-xs">Read Article</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Button 2</label>
                          <p className="mt-1 rounded-md border bg-muted/20 px-2.5 py-1.5 text-xs">Later</p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t">
                        <span className="text-xs text-muted-foreground">Estimated Audience: <strong>48,214</strong></span>
                        <Button size="sm" disabled>
                          <Send className="size-3.5 mr-1.5" /> Send Push (Demo)
                        </Button>
                      </div>
                    </div>

                    {/* Live Device Notification Preview */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Device Preview</CardTitle>
                          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
                            <button
                              type="button"
                              onClick={() => setComposerPreview("android")}
                              className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
                                composerPreview === "android" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              Android
                            </button>
                            <button
                              type="button"
                              onClick={() => setComposerPreview("windows")}
                              className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
                                composerPreview === "windows" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              Windows
                            </button>
                            <button
                              type="button"
                              onClick={() => setComposerPreview("macos")}
                              className={`px-2 py-1 text-[11px] font-medium rounded-md transition ${
                                composerPreview === "macos" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                              }`}
                            >
                              macOS
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-xl border bg-muted/40 p-4">
                          <div className="rounded-xl border bg-background p-3.5 shadow-sm">
                            <div className="flex items-start gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Bell className="size-5" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold">10 Ways to Scale WordPress with Cloudflare Workers</p>
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                  Sub-50ms TTFB worldwide with zero egress costs, smart edge caching, and automated web push broadcasts.
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {composerPreview === "android" && "Chrome · now · dailytech.blog"}
                                  {composerPreview === "windows" && "Chrome · Windows · dailytech.blog"}
                                  {composerPreview === "macos" && "Safari · macOS · dailytech.blog"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2 border-t pt-2.5">
                              <span className="rounded-md border px-2.5 py-1 text-[11px] font-medium">Read Article</span>
                              <span className="rounded-md border px-2.5 py-1 text-[11px] font-medium">Later</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* TAB 5: SUBSCRIBERS */}
                {activeTab === "Subscribers" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs text-muted-foreground flex-1 max-w-sm">
                        <Search className="size-3.5" /> Search by ID or Tag...
                      </div>
                      <Button size="sm" variant="outline" disabled>
                        <Download className="size-3.5 mr-1.5" /> Export CSV (48,214)
                      </Button>
                    </div>

                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subscriber ID</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Browser / OS</TableHead>
                            <TableHead>Device</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Last Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {SUBSCRIBERS.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                              <TableCell>{sub.country}</TableCell>
                              <TableCell className="text-xs">{sub.browser} · {sub.os}</TableCell>
                              <TableCell className="text-xs">{sub.device}</TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {sub.tags.map((t) => (
                                    <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{sub.seen}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )}

                {/* TAB 6: TEMPLATES */}
                {activeTab === "Templates" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {TEMPLATES.map((tmpl) => (
                      <Card key={tmpl.title}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold">{tmpl.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">{tmpl.body}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex gap-1">
                              {tmpl.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setActiveTab("New Campaign")}>
                              Use Template →
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------------- */
        /* MOBILE PHONE DEMO FRAME                                       */
        /* -------------------------------------------------------------- */
        <div className="mx-auto max-w-sm overflow-hidden rounded-[36px] border-4 border-neutral-800 bg-background shadow-2xl ring-1 ring-white/10">
          {/* Mobile Top Speaker & Camera Dynamic Notch */}
          <div className="flex h-7 items-center justify-center bg-neutral-950 px-6">
            <span className="h-3.5 w-24 rounded-full bg-neutral-900 ring-1 ring-neutral-800" />
          </div>

          {/* Mobile App Header */}
          <div className="flex items-center justify-between border-b px-4 py-2.5 bg-muted/40">
            <div>
              <p className="text-xs font-bold">PushKit Dashboard</p>
              <p className="text-[10px] text-muted-foreground">Daily Tech Blog (48,214)</p>
            </div>
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Horizontal Nav Bar for Mobile */}
          <div className="flex gap-1 overflow-x-auto border-b bg-background px-3 py-2 scrollbar-none">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setActiveTab(item.name)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
            <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground bg-muted/50 opacity-60">
              Settings
            </span>
          </div>

          {/* Mobile Scrollable Viewport */}
          <div className="h-[480px] overflow-y-auto p-4 space-y-3 scroll-smooth">
            {activeTab === "Overview" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {KPIS.map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border bg-muted/20 p-3">
                      <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                      <p className="text-lg font-bold">{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border bg-card p-3">
                  <p className="text-xs font-semibold mb-2">30-Day Activity</p>
                  <OverviewChart series={SERIES.slice(14)} />
                </div>

                <div className="rounded-xl border bg-card p-3">
                  <p className="text-xs font-semibold mb-2">Recent Broadcasts</p>
                  <div className="space-y-2">
                    {CAMPAIGNS.slice(0, 3).map((c) => (
                      <div key={c.title} className="rounded-lg border bg-muted/20 p-2 text-xs">
                        <p className="font-medium truncate">{c.title}</p>
                        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                          <span>{c.sent} sent</span>
                          <span className="font-semibold text-primary">{c.ctr} CTR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Sites" && (
              <div className="space-y-2">
                {SITES.map((site) => (
                  <div key={site.siteId} className="rounded-xl border bg-card p-3">
                    <p className="text-xs font-bold">{site.name}</p>
                    <p className="text-[11px] text-muted-foreground">{site.domain}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {site.subscribers} subscribers
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Campaigns" && (
              <div className="space-y-2">
                {CAMPAIGNS.map((c) => (
                  <div key={c.title} className="rounded-xl border bg-card p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{c.title}</p>
                      <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{c.time}</p>
                    <div className="flex justify-between text-[11px] pt-1 border-t text-muted-foreground">
                      <span>Sent: {c.sent}</span>
                      <span>Clicks: {c.clicks}</span>
                      <span className="font-medium text-foreground">{c.ctr}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "New Campaign" && (
              <div className="space-y-3 rounded-xl border bg-card p-3 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Title</label>
                  <p className="mt-0.5 rounded border bg-muted/30 p-2 text-xs font-medium">
                    10 Ways to Scale WordPress with Cloudflare Workers
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Body</label>
                  <p className="mt-0.5 rounded border bg-muted/30 p-2 text-xs text-muted-foreground">
                    Sub-50ms TTFB worldwide with zero egress costs and instant edge cache purges.
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Android Notification</p>
                  <div className="rounded-md border bg-background p-2">
                    <p className="font-medium text-xs">10 Ways to Scale WordPress...</p>
                    <p className="text-[10px] text-muted-foreground">Chrome · now · dailytech.blog</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Subscribers" && (
              <div className="space-y-2">
                {SUBSCRIBERS.map((s) => (
                  <div key={s.id} className="rounded-xl border bg-card p-2.5 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-mono font-medium text-[11px]">{s.id}</p>
                      <p className="text-[10px] text-muted-foreground">{s.country} · {s.browser}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{s.seen}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Templates" && (
              <div className="space-y-2">
                {TEMPLATES.map((tmpl) => (
                  <div key={tmpl.title} className="rounded-xl border bg-card p-3 text-xs">
                    <p className="font-bold">{tmpl.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{tmpl.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Bottom Home Bar */}
          <div className="h-5 bg-neutral-950 flex items-center justify-center">
            <span className="h-1 w-28 rounded-full bg-neutral-700" />
          </div>
        </div>
      )}
    </div>
  );
}
