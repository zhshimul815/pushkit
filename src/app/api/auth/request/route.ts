import { requestLoginCode } from "@/lib/auth";
import { clientIp, jsonError, rateLimit } from "@/lib/security";

/** POST /api/auth/request { email } — sends OTP + magic link via Resend. */
export async function POST(request: Request) {
  if (!rateLimit(`auth-request:${clientIp(request)}`, 5, 60_000)) {
    return jsonError("Rate limit exceeded", 429);
  }
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  if (!body.email) return jsonError("Email required", 400);
  // Per-email throttle: stops login-email bombing of a single inbox even
  // from rotating IPs. The response stays identical either way.
  if (!rateLimit(`auth-request-email:${body.email.toLowerCase()}`, 3, 600_000)) {
    return Response.json({ ok: true });
  }
  const result = await requestLoginCode(body.email);
  // devCode exists only when no Resend key is configured anywhere, and is
  // only exposed outside production (local development convenience).
  if (process.env.NODE_ENV === "production") {
    const safe = { ...result };
    delete safe.devCode;
    return Response.json(safe);
  }
  return Response.json(result);
}
