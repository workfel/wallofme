/**
 * AES-256-GCM Encryption / Decryption utilities
 *
 * Uses the Web Crypto API (native in Bun & Browser).
 * Ciphertext format: base64( IV_12bytes || ciphertext || authTag )
 */

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

async function importKey(keyHex: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    hexToBuffer(keyHex),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt a plaintext string → base64 string
 */
export async function encrypt(
  plaintext: string,
  keyHex: string,
): Promise<string> {
  const key = await importKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
  );

  // Prepend IV to ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv);
  combined.set(ciphertext, iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64 string → plaintext string
 */
export async function decrypt(base64: string, keyHex: string): Promise<string> {
  const key = await importKey(keyHex);
  const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Generate a random 256-bit key as a hex string.
 * Run with: bun -e "import { generateKey } from './src/lib/crypto'; console.log(generateKey())"
 */
export function generateKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
