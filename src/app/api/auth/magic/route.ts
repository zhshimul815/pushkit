import { setSessionCookie, verifyAndCreateSession } from "@/lib/auth";

/** GET /api/auth/magic?token=... — magic link landing. Sets session, redirects to /dashboard. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.redirect(new URL("/login?error=missing-token", request.url));
  const result = await verifyAndCreateSession({ magicToken: token });
  if ("error" in result) {
    return Response.redirect(new URL("/login?error=invalid-link", request.url));
  }
  await setSessionCookie(result.sessionToken);
  return Response.redirect(new URL("/dashboard", request.url));
}
