import { withUser } from "@/lib/api";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  return withUser(async () => {
    const params = new URL(request.url).searchParams;
    const store = await getStore();
    if (params.get("export") === "csv") {
      const csv = await store.exportSubscribersCsv(params.get("siteId") ?? undefined);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="subscribers.csv"',
        },
      });
    }
    const { rows, total } = await store.listSubscribers({
      siteId: params.get("siteId") ?? undefined,
      search: params.get("search") ?? undefined,
      limit: Math.min(Number(params.get("limit") ?? 50), 200),
      offset: Number(params.get("offset") ?? 0),
    });
    // Endpoints and push keys are credentials for a browser — mask them in list output.
    const masked = rows.map((r) => ({
      ...r,
      endpoint: `${r.endpoint.slice(0, 42)}…`,
      p256dh: undefined,
      auth: undefined,
    }));
    return Response.json({ subscribers: masked, total });
  });
}
