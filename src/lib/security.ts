import { timingSafeEqual } from "./crypto-utils";

/** Security headers applied to every response by src/proxy.ts. */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "notifications=(self), payment=(), camera=(), microphone=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

/**
 * In-isolate rate limiter. Good enough as a first line on Workers;
 * pair with Cloudflare WAF rate rules for production abuse traffic.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Origin check for the public subscribe endpoint: Origin must match a registered site domain. */
export function originMatchesDomain(request: Request, domain: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

/** Webhook auth: `Authorization: Bearer whsec_...` or HMAC-SHA256 signature header. */
export async function verifyWebhook(
  request: Request,
  secret: string,
  rawBody: string,
): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (auth && timingSafeEqual(auth, `Bearer ${secret}`)) return true;

  const signature = request.headers.get("x-pushkit-signature");
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(expected, signature.replace(/^sha256=/, ""));
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
