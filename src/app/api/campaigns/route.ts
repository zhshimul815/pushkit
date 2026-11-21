import { withUser } from "@/lib/api";
import { randomId } from "@/lib/crypto-utils";
import { enqueueCampaign } from "@/lib/push/fanout";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";
import type { AudienceFilter, Campaign, CampaignAction } from "@/lib/types";

export async function GET(request: Request) {
  return withUser(async () => {
    const siteId = new URL(request.url).searchParams.get("siteId") ?? undefined;
    const store = await getStore();
    const campaigns = await store.listCampaigns({ siteId });
    return Response.json({ campaigns });
  });
}

interface CreateCampaignBody {
  siteId?: string;
  title?: string;
  body?: string;
  url?: string;
  icon_url?: string;
  image_url?: string;
  actions?: CampaignAction[];
  audience?: AudienceFilter;
  action?: "send" | "schedule" | "draft" | "template";
  scheduledAt?: number;
  templateName?: string;
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    let body: CreateCampaignBody;
    try {
      body = (await request.json()) as CreateCampaignBody;
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    if (!body.siteId || !body.title || !body.body || !body.url) {
      return jsonError("siteId, title, body and url required", 400);
    }
    const store = await getStore();
    const site = await store.getSite(body.siteId);
    if (!site) return jsonError("Site not found", 404);

    const actions = (body.actions ?? []).slice(0, 2).filter((a) => a.label && a.url);
    const action = body.action ?? "send";

    if (action === "template") {
      const template = await store.createTemplate({
        id: randomId(),
        site_id: body.siteId,
        name: body.templateName || body.title,
        title: body.title,
        body: body.body,
        url: body.url,
        icon_url: body.icon_url ?? null,
        image_url: body.image_url ?? null,
        actions,
        created_by: user.id,
        created_at: Date.now(),
      });
      return Response.json({ template }, { status: 201 });
    }

    const campaign: Campaign = {
      id: randomId(),
      site_id: body.siteId,
      title: body.title,
      body: body.body,
      url: body.url,
      icon_url: body.icon_url ?? null,
      image_url: body.image_url ?? null,
      actions,
      audience: body.audience ?? {},
      status: action === "schedule" ? "scheduled" : "draft",
      source: "manual",
      scheduled_at: action === "schedule" ? (body.scheduledAt ?? null) : null,
      sent_count: 0,
      failed_count: 0,
      failed_gone: 0,
      failed_error: 0,
      click_count: 0,
      target_count: 0,
      created_by: user.id,
      created_at: Date.now(),
      sent_at: null,
    };
    await store.createCampaign(campaign);
    if (action === "send") {
      const targets = await enqueueCampaign(store, campaign);
      return Response.json({ campaign: await store.getCampaign(campaign.id), targets }, { status: 201 });
    }
    return Response.json({ campaign }, { status: 201 });
  });
}
