import { withOwner } from "@/lib/api";
import { getEnv } from "@/lib/bindings";
import { resolveEmailConfig } from "@/lib/email-config";
import { sendEmail } from "@/lib/resend";
import { jsonError } from "@/lib/security";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Send a test email to the owner's own address using the active Resend config. Owner only. */
export async function POST() {
  return withOwner(async (user) => {
    const env = await getEnv();
    const store = await getStore();
    const config = await resolveEmailConfig(env, store);
    if (!config.apiKey) {
      return jsonError("No Resend API key configured", 400);
    }
    try {
      const result = await sendEmail(
        env,
        user.email,
        "PushKit test email",
        `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
  <h1 style="font-size:18px;margin:0 0 16px">PushKit test email</h1>
  <p style="font-size:14px;color:#444">Resend is configured. Login codes and staff invites will be delivered from ${config.from}.</p>
</div>`,
        store,
      );
      return Response.json({ ok: true, delivered: result.delivered, to: user.email });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Resend request failed", 502);
    }
  });
}
