import { cookies } from "next/headers";
import { appUrl, getEnv } from "./bindings";
import { hashToken, randomHex } from "./crypto-utils";
import { inviteEmailHtml, otpEmailHtml, sendEmail } from "./resend";
import { getStore } from "./store";
import type { User } from "./types";

import { SESSION_COOKIE } from "./auth-constants";
export { SESSION_COOKIE };
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, sliding
const OTP_TTL_MS = 10 * 60 * 1000;
const INVITE_TTL_MS = 72 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export function normalizeEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

/**
 * Request a login code. Returns a generic result for every email so the
 * endpoint never reveals whether an account exists.
 * Only the owner email (bootstrap) and existing users receive mail.
 */
export async function requestLoginCode(emailRaw: string): Promise<{ ok: true; devCode?: string }> {
  const email = normalizeEmail(emailRaw);
  if (!email) return { ok: true };
  const env = await getEnv();
  const store = await getStore();
  const ownerEmail = (env.OWNER_EMAIL ?? "").toLowerCase();
  const existing = await store.getUserByEmail(email);
  const isBootstrapOwner = email === ownerEmail && (await store.listUsers()).filter((u) => u.role === "owner").length === 0;
  if (!existing && !isBootstrapOwner && email !== ownerEmail) return { ok: true };
  if (!existing && email !== ownerEmail) return { ok: true };

  // Cryptographically secure 6-digit code (rejection-sampled, no modulo bias).
  const buf = new Uint32Array(1);
  let n = 0;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= 4_294_800_000); // largest multiple of 900,000 below 2^32
  const code = String(100000 + (n % 900000));
  const magicToken = randomHex(32);
  const now = Date.now();
  await store.invalidateTokens(email, "otp");
  await store.invalidateTokens(email, "magic");
  await store.createAuthToken({
    email, type: "otp", code_hash: await hashToken(`otp:${code}`),
    role: null, created_by: null, created_at: now, expires_at: now + OTP_TTL_MS,
  });
  await store.createAuthToken({
    email, type: "magic", code_hash: await hashToken(`magic:${magicToken}`),
    role: null, created_by: null, created_at: now, expires_at: now + OTP_TTL_MS,
  });
  const magicUrl = `${appUrl(env)}/api/auth/magic?token=${magicToken}`;
  const result = await sendEmail(env, email, "PushKit login code", otpEmailHtml(code, magicUrl), store);
  return result.dev ? { ok: true, devCode: code } : { ok: true };
}

/** Verify an OTP code or magic token and create the session user if needed. */
export async function verifyAndCreateSession(opts: {
  email?: string;
  code?: string;
  magicToken?: string;
  inviteToken?: string;
}): Promise<{ user: User; sessionToken: string } | { error: string }> {
  const env = await getEnv();
  const store = await getStore();
  const now = Date.now();
  let email: string | null = null;
  let invitedRole: User["role"] | null = null;

  if (opts.inviteToken) {
    const row = await store.getAuthTokenByHash(await hashToken(`invite:${opts.inviteToken}`));
    if (!row || row.type !== "invite" || row.expires_at < now) return { error: "Invite link invalid or expired" };
    email = row.email;
    invitedRole = "staff";
    await store.markTokenUsed(row.id);
  } else if (opts.magicToken) {
    const row = await store.getAuthTokenByHash(await hashToken(`magic:${opts.magicToken}`));
    if (!row || row.type !== "magic" || row.expires_at < now) return { error: "Link invalid or expired" };
    email = row.email;
    await store.markTokenUsed(row.id);
  } else if (opts.email && opts.code) {
    email = normalizeEmail(opts.email);
    if (!email) return { error: "Invalid email" };
    const latest = await store.getLatestAuthToken(email, "otp");
    if (!latest) return { error: "Invalid code" };
    if (latest.expires_at < now) return { error: "Code expired" };
    if (latest.attempts >= MAX_OTP_ATTEMPTS) return { error: "Too many attempts. Request a new code." };
    const row = await store.getAuthToken(email, "otp", await hashToken(`otp:${opts.code}`));
    if (!row) {
      await store.incrementTokenAttempts(latest.id);
      return { error: "Invalid code" };
    }
    await store.markTokenUsed(row.id);
    await store.invalidateTokens(email, "magic");
  } else {
    return { error: "Missing credentials" };
  }

  if (!email) return { error: "Invalid request" };

  let user = await store.getUserByEmail(email);
  if (!user) {
    const ownerEmail = (env.OWNER_EMAIL ?? "").toLowerCase();
    if (email === ownerEmail) {
      user = await store.createUser(email, "owner");
    } else if (invitedRole) {
      user = await store.createUser(email, invitedRole);
    } else {
      return { error: "Account not authorized" };
    }
  }
  await store.touchUserLogin(user.id);

  const sessionToken = randomHex(32);
  await store.createSession({
    user_id: user.id,
    token_hash: await hashToken(`session:${sessionToken}`),
    created_at: now,
    expires_at: now + SESSION_TTL_MS,
    last_seen_at: now,
  });
  return { user, sessionToken };
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const store = await getStore();
    const session = await store.getSession(await hashToken(`session:${token}`));
    if (session) await store.deleteSession(session.id);
  }
  jar.delete(SESSION_COOKIE);
}

/** Current user from the session cookie, with sliding expiration. Null when logged out. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const store = await getStore();
    const session = await store.getSession(await hashToken(`session:${token}`));
    if (!session || session.expires_at < Date.now()) return null;
    // Slide expiration when the session is older than a day.
    if (Date.now() - session.last_seen_at > 24 * 60 * 60 * 1000) {
      await store.touchSession(session.id, Date.now() + SESSION_TTL_MS);
    }
    return session.user;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "owner") throw new AuthError("Owner access required", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Create a single-use staff invite and email it. Owner only (checked by caller). */
export async function createStaffInvite(emailRaw: string, createdBy: string): Promise<{ ok: boolean; devUrl?: string }> {
  const email = normalizeEmail(emailRaw);
  if (!email) return { ok: false };
  const env = await getEnv();
  const store = await getStore();
  const token = randomHex(32);
  const now = Date.now();
  await store.createAuthToken({
    email, type: "invite", code_hash: await hashToken(`invite:${token}`),
    role: "staff", created_by: createdBy, created_at: now, expires_at: now + INVITE_TTL_MS,
  });
  const url = `${appUrl(env)}/login?invite=${token}`;
  const result = await sendEmail(env, email, "PushKit staff invite", inviteEmailHtml(url), store);
  return result.dev ? { ok: true, devUrl: url } : { ok: true };
}
