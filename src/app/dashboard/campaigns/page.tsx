import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function ctr(sent: number, clicks: number): string {
  if (!sent) return "—";
  return `${Math.round((clicks / sent) * 1000) / 10}%`;
}

export default async function CampaignsPage() {
  const store = await getStore();
  const [campaigns, sites] = await Promise.all([store.listCampaigns(), store.listSites()]);
  const siteName = new Map(sites.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <Button render={<Link href="/dashboard/campaigns/new" />}>New Campaign</Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No campaigns yet
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="max-w-60 truncate font-medium">
                    <Link href={`/dashboard/campaigns/${campaign.id}`} className="hover:underline">{campaign.title}</Link>
                  </TableCell>
                  <TableCell>{siteName.get(campaign.site_id) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{campaign.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{campaign.sent_count.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{campaign.click_count.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{ctr(campaign.sent_count, campaign.click_count)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(campaign.sent_at ?? campaign.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
