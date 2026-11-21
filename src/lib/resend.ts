import type { CloudflareEnv } from "./bindings";
import { resolveEmailConfig } from "./email-config";
import type { Store } from "./store";

/**
 * Send email via Resend. The API key is resolved from Dashboard → Settings
 * first, then the RESEND_API_KEY environment secret. With no key anywhere,
 * the message is logged instead (local development only).
 */
export async function sendEmail(
  env: CloudflareEnv,
  to: string,
  subject: string,
  html: string,
  store?: Store,
): Promise<{ delivered: boolean; dev: boolean }> {
  const config = store
    ? await resolveEmailConfig(env, store)
    : {
        apiKey: env.RESEND_API_KEY ?? null,
        from: env.EMAIL_FROM ?? "PushKit <auth@example.com>",
      };
  if (!config.apiKey) {
    console.log(`[pushkit:dev-email] to=${to} subject="${subject}"\n${html}`);
    return { delivered: false, dev: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: config.from, to, subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  return { delivered: true, dev: false };
}

export function otpEmailHtml(code: string, magicUrl: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
  <h1 style="font-size:18px;margin:0 0 16px">PushKit login</h1>
  <p style="font-size:14px;color:#444">Code:</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:8px 0 24px">${code}</p>
  <p style="font-size:14px;color:#444">Or open this link (expires in 10 minutes):</p>
  <p><a href="${magicUrl}" style="font-size:14px">${magicUrl}</a></p>
  <p style="font-size:12px;color:#888">If you did not request this, ignore this email.</p>
</div>`;
}

export function inviteEmailHtml(inviteUrl: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
  <h1 style="font-size:18px;margin:0 0 16px">PushKit staff invite</h1>
  <p style="font-size:14px;color:#444">Open this link to accept (expires in 72 hours, single use):</p>
  <p><a href="${inviteUrl}" style="font-size:14px">${inviteUrl}</a></p>
</div>`;
}
