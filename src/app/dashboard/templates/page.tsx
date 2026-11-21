import { TemplateCard } from "@/components/dashboard/templates-client";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const store = await getStore();
  const templates = await store.listTemplates();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No templates yet. Save one from the campaign composer.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
