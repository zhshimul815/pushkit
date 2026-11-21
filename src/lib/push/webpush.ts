/**
 * Web Push protocol implemented from the RFCs on Web Crypto only.
 * No Node dependencies — runs inside the 10 ms CPU budget of a free Worker.
 *
 * - RFC 8292: VAPID — ES256 JWT signed with the site's P-256 private key.
 * - RFC 8291: payload encryption, `aes128gcm` content encoding.
 *   ECDH (ephemeral P-256) → HKDF(auth) → HKDF(salt) → AES-128-GCM.
 */
import { b64urlDecode, b64urlEncode } from "../crypto-utils";
import type { PushPayload } from "../types";

export interface VapidKeys {
  publicKey: string; // base64url, 65-byte uncompressed point (87 chars)
  privateKey: string; // base64url JWK `d` value
}

/** Generate a per-site VAPID key pair (ECDSA P-256). */
export async function generateVapidKeys(): Promise<VapidKeys> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const rawPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  if (!jwk.d) throw new Error("VAPID key generation failed");
  return { publicKey: b64urlEncode(rawPublic), privateKey: jwk.d };
}

async function importVapidPrivateKey(keys: VapidKeys): Promise<CryptoKey> {
  const rawPublic = b64urlDecode(keys.publicKey);
  if (rawPublic.length !== 65 || rawPublic[0] !== 0x04) {
    throw new Error("Invalid VAPID public key");
  }
  const x = b64urlEncode(rawPublic.slice(1, 33));
  const y = b64urlEncode(rawPublic.slice(33, 65));
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d: keys.privateKey, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

/** Sign a VAPID JWT (ES256) for one push service origin. Valid 12 hours. */
export async function signVapidJwt(
  endpoint: string,
  keys: VapidKeys,
  subject: string,
): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };
  const enc = new TextEncoder();
  const unsigned =
    b64urlEncode(enc.encode(JSON.stringify(header))) +
    "." +
    b64urlEncode(enc.encode(JSON.stringify(payload)));
  const key = await importVapidPrivateKey(keys);
  // Web Crypto ECDSA returns the raw r||s signature Web Push expects.
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned),
  );
  return `${unsigned}.${b64urlEncode(new Uint8Array(signature))}`;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

const RECORD_SIZE = 4096;
export const MAX_PAYLOAD_BYTES = 3993;

/**
 * Encrypt a payload for one subscription (RFC 8291, aes128gcm).
 * Returns the full body: salt(16) | rs(4) | keyidLen(1) | serverPublic(65) | ciphertext.
 */
export async function encryptPayload(
  plaintext: string,
  p256dh: string,
  auth: string,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const data = enc.encode(plaintext);
  if (data.length > MAX_PAYLOAD_BYTES) throw new Error("Payload exceeds 3993 bytes");

  const uaPublic = b64urlDecode(p256dh); // subscriber public key, 65 bytes
  const authSecret = b64urlDecode(auth); // subscriber auth secret, 16 bytes

  const localPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const localPublic = new Uint8Array(
    await crypto.subtle.exportKey("raw", localPair.publicKey),
  );
  const uaKey = await crypto.subtle.importKey(
    "raw",
    uaPublic as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: uaKey },
      localPair.privateKey,
      256,
    ),
  );

  // key_info = "WebPush: info" || 0x00 || ua_public || as_public
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublic, localPublic);
  const ikm = await hkdf(authSecret, sharedSecret, keyInfo, 32);

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  // Single record: data || 0x02 (final-record delimiter), no extra padding.
  const record = concat(data, new Uint8Array([0x02]));
  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, [
    "encrypt",
  ]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource, tagLength: 128 },
      aesKey,
      record as BufferSource,
    ),
  );

  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, RECORD_SIZE, false);
  header[20] = 65;
  header.set(localPublic, 21);
  return concat(header, ciphertext);
}

/** Push services a subscription endpoint may point to. Anything else is refused (SSRF guard). */
const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    if (ALLOWED_PUSH_HOSTS.includes(url.hostname)) return true;
    return url.hostname.endsWith(".notify.windows.com");
  } catch {
    return false;
  }
}

export type SendResult =
  | { outcome: "sent"; status: number }
  | { outcome: "gone"; status: number } // 404 / 410 — delete the subscription
  | { outcome: "failed"; status: number; reason: string };

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Encrypt + POST one notification to the subscriber's push service. */
export async function sendPush(
  subscription: PushSubscriptionKeys,
  payload: PushPayload,
  vapid: VapidKeys,
  subject: string,
): Promise<SendResult> {
  if (!isAllowedPushEndpoint(subscription.endpoint)) {
    return { outcome: "failed", status: 0, reason: "Endpoint host not allowed" };
  }
  try {
    const body = await encryptPayload(
      JSON.stringify(payload),
      subscription.p256dh,
      subscription.auth,
    );
    const jwt = await signVapidJwt(subscription.endpoint, vapid, subject);
    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "Content-Length": String(body.length),
        TTL: "86400",
        Urgency: "normal",
      },
      body: body as BodyInit,
    });
    if (res.status === 404 || res.status === 410) {
      return { outcome: "gone", status: res.status };
    }
    if (res.status >= 200 && res.status < 300) {
      return { outcome: "sent", status: res.status };
    }
    return { outcome: "failed", status: res.status, reason: `Push service HTTP ${res.status}` };
  } catch (err) {
    return {
      outcome: "failed",
      status: 0,
      reason: err instanceof Error ? err.message : "Network error",
    };
  }
}
