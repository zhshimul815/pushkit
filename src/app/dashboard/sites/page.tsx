import { AddSiteForm, SiteCard, type SiteView } from "@/components/dashboard/sites-client";
import { getCurrentUser } from "@/lib/auth";
import { appUrl, getEnv } from "@/lib/bindings";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const user = await getCurrentUser();
  const isOwner = user?.role === "owner";
  const store = await getStore();
  const env = await getEnv();
  const base = appUrl(env);
  const sites = await store.listSites();

  const health = new Map((await store.siteHealth()).map((h) => [h.siteId, h]));
  const views: SiteView[] = await Promise.all(
    sites.map(async (site) => ({
      ...site,
      // Secrets are owner-only. Staff never receive private keys or webhook secrets.
      vapid_private_key: isOwner ? site.vapid_private_key : undefined,
      webhook_secret: isOwner ? site.webhook_secret : undefined,
      subscriberCount: await store.countSubscribers(site.id),
      sent30: health.get(site.id)?.sent30 ?? 0,
      clicks30: health.get(site.id)?.clicks30 ?? 0,
    })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
      <AddSiteForm appUrl={base} />
      {views.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sites yet</p>
      ) : (
        views.map((site) => (
          <SiteCard key={site.id} site={site} appUrl={base} isOwner={isOwner} />
        ))
      )}
    </div>
  );
}
