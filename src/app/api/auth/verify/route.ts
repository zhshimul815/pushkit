import { setSessionCookie, verifyAndCreateSession } from "@/lib/auth";
import { clientIp, jsonError, rateLimit } from "@/lib/security";

/** POST /api/auth/verify { email, code } | { inviteToken, email? } */
export async function POST(request: Request) {
  if (!rateLimit(`auth-verify:${clientIp(request)}`, 10, 60_000)) {
    return jsonError("Rate limit exceeded", 429);
  }
  let body: { email?: string; code?: string; inviteToken?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const result = await verifyAndCreateSession({
    email: body.email,
    code: body.code,
    inviteToken: body.inviteToken,
  });
  if ("error" in result) return jsonError(result.error, 401);
  await setSessionCookie(result.sessionToken);
  return Response.json({ ok: true, user: { email: result.user.email, role: result.user.role } });
}
