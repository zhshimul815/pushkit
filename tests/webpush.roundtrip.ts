/**
 * Round-trip verification for src/lib/push/webpush.ts
 * Run: npx tsx tests/webpush.roundtrip.ts
 *
 * 1. Generates a browser-style subscription (ECDH P-256 + 16-byte auth).
 * 2. Encrypts a payload with encryptPayload() and decrypts it here with an
 *    independent RFC 8291 decryption path.
 * 3. Signs a VAPID JWT and verifies the ES256 signature with the public key.
 */
import assert from "node:assert";
import { b64urlDecode, b64urlEncode } from "../src/lib/crypto-utils";
import {
  encryptPayload,
  generateVapidKeys,
  signVapidJwt,
} from "../src/lib/push/webpush";

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
      key,
      length * 8,
    ),
  );
}

async function main() {
  // --- Browser subscription keys ---
  const uaPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const uaPublic = new Uint8Array(await crypto.subtle.exportKey("raw", uaPair.publicKey));
  const authSecret = new Uint8Array(16);
  crypto.getRandomValues(authSecret);
  const p256dh = b64urlEncode(uaPublic);
  const auth = b64urlEncode(authSecret);

  // --- Encrypt (server side) ---
  const plaintext = JSON.stringify({ title: "Hello", body: "Round trip", url: "https://example.com" });
  const body = await encryptPayload(plaintext, p256dh, auth);

  // --- Parse aes128gcm header ---
  const salt = body.slice(0, 16);
  const rs = new DataView(body.buffer, body.byteOffset).getUint32(16, false);
  assert.equal(rs, 4096);
  assert.equal(body[20], 65);
  const serverPublic = body.slice(21, 86);
  const ciphertext = body.slice(86);

  // --- Decrypt (browser side, independent path) ---
  const serverKey = await crypto.subtle.importKey(
    "raw", serverPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: serverKey }, uaPair.privateKey, 256),
  );
  const enc = new TextEncoder();
  const keyInfo = new Uint8Array([
    ...enc.encode("WebPush: info\0"), ...uaPublic, ...serverPublic,
  ]);
  const ikm = await hkdf(authSecret, shared, keyInfo, 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const aesKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["decrypt"]);
  const decrypted = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce as BufferSource, tagLength: 128 }, aesKey, ciphertext as BufferSource),
  );
  // Strip padding: last non-zero byte is the 0x02 record delimiter.
  let end = decrypted.length;
  while (end > 0 && decrypted[end - 1] === 0) end--;
  assert.equal(decrypted[end - 1], 0x02);
  const recovered = new TextDecoder().decode(decrypted.slice(0, end - 1));
  assert.equal(recovered, plaintext);
  console.log("✓ RFC 8291 aes128gcm encrypt → decrypt round trip");

  // --- VAPID JWT ---
  const vapid = await generateVapidKeys();
  assert.equal(b64urlDecode(vapid.publicKey).length, 65);
  const jwt = await signVapidJwt("https://fcm.googleapis.com/fcm/send/abc", vapid, "mailto:owner@example.com");
  const [h, p, s] = jwt.split(".");
  const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as { aud: string; sub: string; exp: number };
  assert.equal(claims.aud, "https://fcm.googleapis.com");
  assert.equal(claims.sub, "mailto:owner@example.com");
  assert.ok(claims.exp > Date.now() / 1000);
  void h;
  const rawPublic = b64urlDecode(vapid.publicKey);
  const verifyKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC", crv: "P-256",
      x: b64urlEncode(rawPublic.slice(1, 33)),
      y: b64urlEncode(rawPublic.slice(33, 65)),
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    verifyKey,
    b64urlDecode(s) as BufferSource,
    enc.encode(`${h}.${p}`),
  );
  assert.equal(valid, true);
  console.log("✓ RFC 8292 VAPID ES256 JWT sign → verify");
  console.log("All Web Push checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
