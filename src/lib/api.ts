import { AuthError, requireOwner, requireUser } from "./auth";
import { jsonError } from "./security";
import type { User } from "./types";

/** Wrap a route handler with session auth. Returns 401/403 JSON on failure. */
export async function withUser(
  fn: (user: User) => Promise<Response>,
): Promise<Response> {
  try {
    const user = await requireUser();
    return await fn(user);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    if (err instanceof AuthError || e?.status === 401 || e?.status === 403) {
      return jsonError(e.message || "Unauthorized", e.status || 401);
    }
    throw err;
  }
}

export async function withOwner(
  fn: (user: User) => Promise<Response>,
): Promise<Response> {
  try {
    const user = await requireOwner();
    return await fn(user);
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number };
    if (err instanceof AuthError || e?.status === 401 || e?.status === 403) {
      return jsonError(e.message || "Owner access required", e.status || 403);
    }
    throw err;
  }
}

/** CORS for public endpoints. Config is public; subscribe validates Origin separately. */
export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function corsPreflight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}
