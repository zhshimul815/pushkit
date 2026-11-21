import { withOwner } from "@/lib/api";
import { randomHex } from "@/lib/crypto-utils";
import { generateVapidKeys } from "@/lib/push/webpush";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/:id/rotate { target: "webhook" | "vapid" } — owner only.
 * Rotating VAPID keys invalidates existing subscriptions for the site.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  return withOwner(async () => {
    let body: { target?: string };
    try {
      body = (await request.json()) as { target?: string };
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    const store = await getStore();
    const site = await store.getSite(id);
    if (!site) return jsonError("Site not found", 404);
    if (body.target === "webhook") {
      const webhook_secret = `whsec_${randomHex(24)}`;
      await store.updateSite(id, { webhook_secret });
      return Response.json({ webhook_secret });
    }
    if (body.target === "vapid") {
      const keys = await generateVapidKeys();
      await store.updateSite(id, {
        vapid_public_key: keys.publicKey,
        vapid_private_key: keys.privateKey,
      });
      return Response.json({ vapid_public_key: keys.publicKey });
    }
    return jsonError('target must be "webhook" or "vapid"', 400);
  });
}
