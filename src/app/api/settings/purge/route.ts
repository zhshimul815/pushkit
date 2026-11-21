import { withOwner } from "@/lib/api";
import { getStore } from "@/lib/store";

/** POST /api/settings/purge — owner only. Deletes subscribers not seen in 180 days. */
export async function POST() {
  return withOwner(async () => {
    const store = await getStore();
    const purged = await store.purgeExpiredSubscribers(180 * 24 * 60 * 60 * 1000);
    return Response.json({ ok: true, purged });
  });
}
