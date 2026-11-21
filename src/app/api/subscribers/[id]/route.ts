import { withUser } from "@/lib/api";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/subscribers/[id] — remove a single subscriber (G7). */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withUser(async () => {
    const store = await getStore();
    if (!(await store.getSubscriber(id))) return jsonError("Subscriber not found", 404);
    await store.deleteSubscriber(id);
    return Response.json({ ok: true });
  });
}
