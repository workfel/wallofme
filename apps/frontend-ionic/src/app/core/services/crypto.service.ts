import { Injectable } from "@angular/core";
import { environment } from "@env/environment";

/**
 * AES-256-GCM Encryption / Decryption service.
 *
 * Uses the Web Crypto API (native in the browser).
 * Ciphertext format: base64( IV_12bytes || ciphertext || authTag )
 *
 * Must use the SAME algorithm, IV size, and encoding as the backend crypto.ts
 */
@Injectable({ providedIn: "root" })
export class CryptoService {
  private keyPromise: Promise<CryptoKey> | null = null;

  private getKey(): Promise<CryptoKey> {
    if (!this.keyPromise) {
      const keyHex = environment.encryptionKey;
      const bytes = new Uint8Array(keyHex.length / 2);
      for (let i = 0; i < keyHex.length; i += 2) {
        bytes[i / 2] = parseInt(keyHex.substring(i, i + 2), 16);
      }
      this.keyPromise = crypto.subtle.importKey(
        "raw",
        bytes.buffer,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
      );
    }
    return this.keyPromise;
  }

  /** Encrypt a plaintext string → base64 string */
  async encrypt(plaintext: string): Promise<string> {
    const key = await this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
    );

    const combined = new Uint8Array(iv.length + ciphertext.length);
    combined.set(iv);
    combined.set(ciphertext, iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /** Decrypt a base64 string → plaintext string */
  async decrypt(base64: string): Promise<string> {
    const key = await this.getKey();
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
}
