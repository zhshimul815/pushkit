import { withUser } from "@/lib/api";
import { randomId } from "@/lib/crypto-utils";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

export async function GET() {
  return withUser(async () => {
    const store = await getStore();
    return Response.json({ templates: await store.listTemplates() });
  });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    if (!body.name || !body.title || !body.body || !body.url) {
      return jsonError("name, title, body and url required", 400);
    }
    const store = await getStore();
    const template = await store.createTemplate({
      id: randomId(),
      site_id: (body.siteId as string) ?? null,
      name: String(body.name),
      title: String(body.title),
      body: String(body.body),
      url: String(body.url),
      icon_url: (body.icon_url as string) ?? null,
      image_url: (body.image_url as string) ?? null,
      actions: [],
      created_by: user.id,
      created_at: Date.now(),
    });
    return Response.json({ template }, { status: 201 });
  });
}

export async function DELETE(request: Request) {
  return withUser(async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return jsonError("id required", 400);
    const store = await getStore();
    await store.deleteTemplate(id);
    return Response.json({ ok: true });
  });
}
