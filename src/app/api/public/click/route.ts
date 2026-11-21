import { corsHeaders, corsPreflight } from "@/lib/api";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/** POST /api/public/click — notificationclick telemetry from sw.js (keepalive). */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    let body: { campaignId?: string; subscriberId?: string };
    try {
      body = (await request.json()) as { campaignId?: string; subscriberId?: string };
    } catch {
      return jsonError("Invalid JSON", 400, headers);
    }
    if (!body.campaignId) return jsonError("campaignId required", 400, headers);
    const store = await getStore();
    const campaign = await store.incrementCampaignClick(body.campaignId, body.subscriberId);
    if (!campaign) return jsonError("Campaign not found", 404, headers);
    return Response.json(
      { ok: true },
      { headers },
    );
  } catch (err: unknown) {
    const e = err as Error;
    return Response.json({ error: e.message || "Failed to record click" }, { status: 500, headers });
  }
}
