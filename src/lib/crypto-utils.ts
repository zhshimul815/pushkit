/** Base64url + hashing helpers built only on Web Crypto. Runs in Workers, Node 20+, browsers. */

export function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const bin = atob(input.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomId(): string {
  return crypto.randomUUID();
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hash a token before storage. Raw tokens never touch the database. */
export async function hashToken(token: string): Promise<string> {
  const salt = process.env.SESSION_SECRET ?? "";
  return sha256Hex(`${salt}:${token}`);
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------- AES-GCM value encryption (for secrets stored in D1 settings) ------- */

async function settingsKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`pushkit-settings:${secret}`),
  );
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Encrypt a secret for storage. Output format: enc:<iv b64url>:<ciphertext b64url> */
export async function encryptValue(plain: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await settingsKey(secret),
    new TextEncoder().encode(plain),
  );
  return `enc:${b64urlEncode(iv)}:${b64urlEncode(new Uint8Array(ct))}`;
}

/** Decrypt a value written by encryptValue. Returns null when decryption fails. */
export async function decryptValue(stored: string, secret: string): Promise<string | null> {
  if (!stored.startsWith("enc:")) return stored;
  const [, ivPart, ctPart] = stored.split(":");
  if (!ivPart || !ctPart) return null;
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64urlDecode(ivPart) as BufferSource },
      await settingsKey(secret),
      b64urlDecode(ctPart) as BufferSource,
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}
