import { withOwner } from "@/lib/api";
import { createStaffInvite } from "@/lib/auth";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

/** Owner-only team management: list users + sessions, invite staff, revoke. */
export async function GET() {
  return withOwner(async () => {
    const store = await getStore();
    const [users, sessions] = await Promise.all([store.listUsers(), store.listSessions()]);
    return Response.json({ users, sessions });
  });
}

export async function POST(request: Request) {
  return withOwner(async (owner) => {
    let body: { email?: string };
    try {
      body = (await request.json()) as { email?: string };
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    if (!body.email) return jsonError("email required", 400);
    const result = await createStaffInvite(body.email, owner.id);
    if (!result.ok) return jsonError("Invalid email", 400);
    return Response.json(result, { status: 201 });
  });
}

export async function DELETE(request: Request) {
  return withOwner(async (owner) => {
    const params = new URL(request.url).searchParams;
    const store = await getStore();
    const userId = params.get("userId");
    const sessionId = params.get("sessionId");
    if (userId) {
      if (userId === owner.id) return jsonError("Cannot remove the owner", 400);
      await store.deleteUser(userId);
      return Response.json({ ok: true });
    }
    if (sessionId) {
      await store.deleteSession(sessionId);
      return Response.json({ ok: true });
    }
    return jsonError("userId or sessionId required", 400);
  });
}
