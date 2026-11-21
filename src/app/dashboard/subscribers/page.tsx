import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteSubscriberButton, ImportCard } from "@/components/dashboard/subscribers-client";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; siteId?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const store = await getStore();
  const sites = await store.listSites();
  const { rows, total } = await store.listSubscribers({
    siteId: params.siteId || undefined,
    search: params.search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const siteName = new Map(sites.map((s) => [s.id, s.name]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Subscribers <span className="text-base font-normal text-muted-foreground">({total.toLocaleString()})</span>
        </h1>
        <Button
          variant="outline"
          render={<a href={`/api/subscribers?export=csv${params.siteId ? `&siteId=${params.siteId}` : ""}`} />}
        >
          Export CSV
        </Button>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <Input
          name="search"
          placeholder="Search endpoint, country, browser"
          defaultValue={params.search ?? ""}
          className="max-w-xs"
        />
        <select
          name="siteId"
          defaultValue={params.siteId ?? ""}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">All Sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Subscribed Page</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{siteName.get(sub.site_id) ?? "—"}</TableCell>
                  <TableCell>{sub.country ?? "—"}</TableCell>
                  <TableCell>{sub.browser ?? "—"}</TableCell>
                  <TableCell>{sub.os ?? "—"}</TableCell>
                  <TableCell className="capitalize">{sub.device ?? "—"}</TableCell>
                  <TableCell className="max-w-52 truncate text-muted-foreground">{sub.page_url ?? "—"}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1">
                      {Object.entries(sub.tags ?? {}).map(([k, v]) => (
                        <Badge key={k} variant="secondary">{k}={v}</Badge>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell>
                    {sub.deliverable === 1 ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Awaiting re-subscribe{sub.import_source ? ` · ${sub.import_source}` : ""}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DeleteSubscriberButton id={sub.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ImportCard sites={sites.map((s) => ({ id: s.id, name: s.name }))} />

      {pages > 1 ? (
        <p className="text-sm text-muted-foreground">
          Page {page} of {pages}
          {page < pages ? (
            <>
              {" · "}
              <a
                className="underline"
                href={`/dashboard/subscribers?page=${page + 1}${params.search ? `&search=${encodeURIComponent(params.search)}` : ""}${params.siteId ? `&siteId=${params.siteId}` : ""}`}
              >
                Next
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
