import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await getStore();
  const campaign = await store.getCampaign(id);
  if (!campaign) notFound();
  const site = await store.getSite(campaign.site_id);
  const daily = await store.campaignDailyClicks(id);

  const ctr = campaign.sent_count > 0
    ? Math.round((campaign.click_count / campaign.sent_count) * 1000) / 10
    : 0;
  const deliveredPct = campaign.target_count > 0
    ? Math.round((campaign.sent_count / campaign.target_count) * 1000) / 10
    : 0;
  const maxDayClicks = Math.max(1, ...daily.map((d) => d.clicks));

  const kpis = [
    { label: "Target Audience", value: campaign.target_count.toLocaleString() },
    { label: "Delivered", value: campaign.sent_count.toLocaleString() },
    { label: "Clicks", value: campaign.click_count.toLocaleString() },
    { label: "CTR", value: `${ctr}%` },
  ];

  const audienceParts: string[] = [];
  const a = campaign.audience;
  if (a.country) audienceParts.push(`Country: ${a.country}`);
  if (a.device) audienceParts.push(`Device: ${a.device}`);
  if (a.browser) audienceParts.push(`Browser: ${a.browser}`);
  if (a.os) audienceParts.push(`OS: ${a.os}`);
  if (a.tagKey) audienceParts.push(`Tag: ${a.tagKey}${a.tagValue ? ` = ${a.tagValue}` : ""}`);
  if (a.engagedOnly) audienceParts.push("Engaged subscribers only");
  if (a.inactiveDays) audienceParts.push(`Win-back: not seen in ${a.inactiveDays}+ days`);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/campaigns" className="text-sm text-muted-foreground hover:underline">
          ← Campaigns
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.title}</h1>
          <Badge variant="secondary" className="capitalize">{campaign.status}</Badge>
          <Badge variant="outline" className="capitalize">{campaign.source}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {site?.name ?? "Unknown site"} · Created {new Date(campaign.created_at).toLocaleString()}
          {campaign.sent_at ? ` · Sent ${new Date(campaign.sent_at).toLocaleString()}` : ""}
          {campaign.scheduled_at && campaign.status === "scheduled"
            ? ` · Scheduled ${new Date(campaign.scheduled_at).toLocaleString()}`
            : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex justify-between"><span>Delivered</span><span className="tabular-nums">{campaign.sent_count.toLocaleString()} ({deliveredPct}% of target)</span></p>
            <p className="flex justify-between"><span>Failed — endpoint gone (404/410, auto-deleted)</span><span className="tabular-nums">{campaign.failed_gone.toLocaleString()}</span></p>
            <p className="flex justify-between"><span>Failed — other errors</span><span className="tabular-nums">{campaign.failed_error.toLocaleString()}</span></p>
            <p className="flex justify-between border-t pt-2"><span>Total failed</span><span className="tabular-nums">{campaign.failed_count.toLocaleString()}</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clicks by Day</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {daily.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clicks recorded yet</p>
            ) : (
              daily.map((d) => (
                <div key={d.day}>
                  <div className="flex justify-between text-sm">
                    <span>{d.day}</span>
                    <span className="tabular-nums text-muted-foreground">{d.clicks}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-muted">
                    <div className="h-1.5 rounded bg-primary" style={{ width: `${Math.round((d.clicks / maxDayClicks) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification &amp; Audience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{campaign.title}</p>
            <p className="mt-1 text-muted-foreground">{campaign.body}</p>
            <p className="mt-2 break-all text-muted-foreground">{campaign.url}</p>
            {campaign.actions.length > 0 ? (
              <p className="mt-2">
                Buttons: {campaign.actions.map((action) => action.label).join(" · ")}
              </p>
            ) : null}
          </div>
          <p>
            <span className="text-muted-foreground">Audience: </span>
            {audienceParts.length ? audienceParts.join(" · ") : "All subscribers"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
