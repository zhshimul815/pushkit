import type { CloudflareEnv } from "./bindings";
import { decryptValue, encryptValue } from "./crypto-utils";
import type { Store } from "./store";

export const SETTING_RESEND_KEY = "resend_api_key";
export const SETTING_EMAIL_FROM = "email_from";

export function settingsSecret(env: CloudflareEnv): string {
  return env.SESSION_SECRET ?? process.env.SESSION_SECRET ?? "pushkit-dev-secret";
}

export interface EmailConfig {
  apiKey: string | null;
  from: string;
  /** Where the active API key comes from. */
  source: "settings" | "environment" | null;
  /** Last 4 characters of the active key, for display. Never the full key. */
  keyHint: string | null;
}

/**
 * Resolve the active email configuration.
 * Priority: API key saved in Dashboard → Settings, then the
 * RESEND_API_KEY environment secret. From-address: Settings, then
 * EMAIL_FROM, then the built-in default.
 */
export async function resolveEmailConfig(env: CloudflareEnv, store: Store): Promise<EmailConfig> {
  const storedFrom = await store.getSetting(SETTING_EMAIL_FROM);
  const from = storedFrom ?? env.EMAIL_FROM ?? "PushKit <auth@example.com>";

  const storedKey = await store.getSetting(SETTING_RESEND_KEY);
  if (storedKey) {
    const decrypted = await decryptValue(storedKey, settingsSecret(env));
    if (decrypted) {
      return { apiKey: decrypted, from, source: "settings", keyHint: decrypted.slice(-4) };
    }
  }
  if (env.RESEND_API_KEY) {
    return {
      apiKey: env.RESEND_API_KEY,
      from,
      source: "environment",
      keyHint: env.RESEND_API_KEY.slice(-4),
    };
  }
  return { apiKey: null, from, source: null, keyHint: null };
}

export async function saveResendKey(env: CloudflareEnv, store: Store, apiKey: string): Promise<void> {
  await store.setSetting(SETTING_RESEND_KEY, await encryptValue(apiKey, settingsSecret(env)));
}
