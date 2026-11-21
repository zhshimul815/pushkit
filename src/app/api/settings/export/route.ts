import { withOwner } from "@/lib/api";
import { getStore } from "@/lib/store";

/**
 * GET /api/settings/export — full data export (G7), owner only.
 * Everything in the database that belongs to this install: sites
 * (including VAPID keys — this file is a backup, store it safely),
 * subscribers with push keys, campaigns and templates.
 */
export async function GET() {
  return withOwner(async () => {
    const store = await getStore();
    const data = await store.exportAll();
    const payload = {
      product: "PushKit",
      exportedAt: new Date().toISOString(),
      counts: {
        sites: data.sites.length,
        subscribers: data.subscribers.length,
        campaigns: data.campaigns.length,
        templates: data.templates.length,
      },
      ...data,
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="pushkit-export.json"',
      },
    });
  });
}
