import { getEnv } from "@/lib/bindings";
import { jsonError } from "@/lib/security";

type Params = { params: Promise<{ key: string[] }> };

/** GET /api/media/<key> — public proxy for R2 objects (notification images). */
export async function GET(_request: Request, { params }: Params) {
  const { key } = await params;
  const env = await getEnv();
  if (!env.MEDIA) return jsonError("R2 bucket not bound", 501);
  const object = await env.MEDIA.get(key.join("/"));
  if (!object) return jsonError("Not found", 404);
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400, immutable",
      // Uploaded SVGs must never execute script in this origin's context.
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
