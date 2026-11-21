import { Composer } from "@/components/dashboard/composer";
import { getStore } from "@/lib/store";
import type { Template } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const store = await getStore();
  const [sites, templates] = await Promise.all([store.listSites(), store.listTemplates()]);
  let initial: Partial<Template> | undefined;
  if (template) initial = (await store.getTemplate(template)) ?? undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New Campaign</h1>
      {sites.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a site first — campaigns need a target site.
        </p>
      ) : (
        <Composer
          sites={sites.map((s) => ({ id: s.id, name: s.name, icon_url: s.icon_url }))}
          templates={templates}
          initial={initial}
        />
      )}
    </div>
  );
}
