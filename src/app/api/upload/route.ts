import { withUser } from "@/lib/api";
import { getEnv } from "@/lib/bindings";
import { randomHex } from "@/lib/crypto-utils";
import { jsonError } from "@/lib/security";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB per image
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

/** POST /api/upload (multipart, field "file") — stores to R2, returns a proxied URL. */
export async function POST(request: Request) {
  return withUser(async () => {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return jsonError('Multipart field "file" required', 400);
    if (!ALLOWED.has(file.type)) return jsonError("File type not allowed", 400);
    if (file.size > MAX_BYTES) return jsonError("File exceeds 2 MB", 400);
    const ext = file.type.split("/")[1].replace("svg+xml", "svg");
    const key = `uploads/${Date.now()}-${randomHex(8)}.${ext}`;
    const env = await getEnv();
    if (!env.MEDIA) {
      return jsonError("R2 bucket not bound (MEDIA). Configure the MEDIA binding in wrangler.toml.", 501);
    }
    await env.MEDIA.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    return Response.json({ key, url: `/api/media/${key}` }, { status: 201 });
  });
}
