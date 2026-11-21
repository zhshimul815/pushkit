/**
 * Cloudflare bindings access.
 * In production (OpenNext on Workers) bindings come from getCloudflareContext().
 * In local `next dev` / plain Node they are absent — the store layer then
 * falls back to the in-memory demo store so the UI runs without Wrangler.
 */

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

export interface R2BucketLike {
  put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
  delete(key: string): Promise<void>;
}

export interface QueueLike {
  send(message: unknown): Promise<void>;
  sendBatch(messages: { body: unknown }[]): Promise<void>;
}

export interface CloudflareEnv {
  DB?: D1DatabaseLike;
  MEDIA?: R2BucketLike;
  PUSH_QUEUE?: QueueLike;
  NEXT_PUBLIC_APP_URL?: string;
  OWNER_EMAIL?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  VAPID_SUBJECT?: string;
  SESSION_SECRET?: string;
}

export async function getEnv(): Promise<CloudflareEnv> {
  try {
    // Optional at runtime: present when deployed with OpenNext on Cloudflare.
    const mod = (await import("@opennextjs/cloudflare")) as {
      getCloudflareContext: (opts?: { async?: boolean }) => Promise<{ env: CloudflareEnv }>;
    };
    const ctx = await mod.getCloudflareContext({ async: true });
    if (ctx?.env) return { ...envFromProcess(), ...ctx.env };
  } catch {
    // Not running on Cloudflare — fall through to process env.
  }
  return envFromProcess();
}

function envFromProcess(): CloudflareEnv {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    OWNER_EMAIL: process.env.OWNER_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    SESSION_SECRET: process.env.SESSION_SECRET,
  };
}

export function appUrl(env: CloudflareEnv): string {
  return (env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
