import { Injectable, inject } from "@angular/core";
import { hc } from "hono/client";
import {
  isNativePlatform,
  getCapacitorAuthToken,
} from "better-auth-capacitor/client";
import { environment } from "@env/environment";
import type { AppType } from "@backend/index";
import { CryptoService } from "./crypto.service";

@Injectable({ providedIn: "root" })
export class ApiService {
  private crypto = inject(CryptoService);

  readonly client = hc<AppType>(environment.apiUrl, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      this.authFetch(input, init),
  });

  /**
   * Wraps fetch to attach auth credentials and handle payload encryption.
   * - Web: uses credentials: 'include' (browser handles cookies)
   * - Native: reads bearer token from Capacitor Preferences
   * - Encryption: if enabled, encrypts request body and decrypts response body
   */
  private async authFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const headers = new Headers(init?.headers);

    if (isNativePlatform()) {
      const token = await getCapacitorAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    // ── Encrypt request body ─────────────────────────────
    let body = init?.body;
    if (environment.encryptPayloads && body && typeof body === "string") {
      try {
        // Only encrypt if it looks like JSON
        JSON.parse(body);
        const encrypted = await this.crypto.encrypt(body);
        body = JSON.stringify({ _enc: encrypted });
      } catch {
        // Not JSON — send as-is
      }
    }

    const response = await fetch(input, {
      ...init,
      body,
      headers,
      credentials: isNativePlatform() ? "omit" : "include",
    });

    // ── Decrypt response body ────────────────────────────
    if (response.headers.get("X-Encrypted") === "1") {
      try {
        const { _enc } = await response.json();
        const decrypted = await this.crypto.decrypt(_enc);
        return new Response(decrypted, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch {
        // Decryption failed — return original response
        return response;
      }
    }

    return response;
  }
}
