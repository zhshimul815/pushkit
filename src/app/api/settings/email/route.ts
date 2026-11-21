import { withOwner } from "@/lib/api";
import { getEnv } from "@/lib/bindings";
import {
  SETTING_EMAIL_FROM,
  SETTING_RESEND_KEY,
  resolveEmailConfig,
  saveResendKey,
} from "@/lib/email-config";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Email (Resend) configuration status. Owner only. Never returns the full key. */
export async function GET() {
  return withOwner(async () => {
    const env = await getEnv();
    const store = await getStore();
    const config = await resolveEmailConfig(env, store);
    return Response.json({
      configured: config.apiKey !== null,
      source: config.source,
      keyHint: config.keyHint,
      from: config.from,
    });
  });
}

/** Save a Resend API key (and optional From address) from the dashboard. Owner only. */
export async function POST(request: Request) {
  return withOwner(async () => {
    const body = (await request.json().catch(() => null)) as {
      apiKey?: string;
      from?: string;
    } | null;
    const apiKey = body?.apiKey?.trim();
    if (!apiKey || apiKey.length < 8) {
      return jsonError("A valid Resend API key is required", 400);
    }
    const env = await getEnv();
    const store = await getStore();
    await saveResendKey(env, store, apiKey);
    const from = body?.from?.trim();
    if (from) await store.setSetting(SETTING_EMAIL_FROM, from);
    const config = await resolveEmailConfig(env, store);
    return Response.json({
      ok: true,
      configured: true,
      source: config.source,
      keyHint: config.keyHint,
      from: config.from,
    });
  });
}

/** Remove the dashboard-saved Resend API key. Falls back to the environment secret. Owner only. */
export async function DELETE() {
  return withOwner(async () => {
    const store = await getStore();
    await store.deleteSetting(SETTING_RESEND_KEY);
    const env = await getEnv();
    const config = await resolveEmailConfig(env, store);
    return Response.json({
      ok: true,
      configured: config.apiKey !== null,
      source: config.source,
      keyHint: config.keyHint,
      from: config.from,
    });
  });
}
