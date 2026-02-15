import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { encrypt, decrypt } from "../lib/crypto";

const ENCRYPT_PAYLOADS = process.env.ENCRYPT_PAYLOADS === "true";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

/** Paths that should never be encrypted (external callers, auth flow) */
const EXCLUDED_PREFIXES = ["/api/auth/", "/api/webhooks/"];

function isExcluded(path: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Payload encryption middleware for Hono.
 *
 * When ENCRYPT_PAYLOADS=true:
 * - Incoming JSON bodies with `{ _enc: "..." }` are decrypted before route handlers
 * - Outgoing JSON responses are encrypted as `{ _enc: "..." }` with X-Encrypted: 1 header
 *
 * Excluded paths: /api/auth/*, /api/webhooks/*
 */
export const encryptionMiddleware: MiddlewareHandler = async (c, next) => {
  // Skip if encryption is disabled or route is excluded
  if (!ENCRYPT_PAYLOADS || !ENCRYPTION_KEY || isExcluded(c.req.path)) {
    await next();
    return;
  }

  // ── REQUEST: Decrypt incoming body ──────────────────────
  const contentType = c.req.header("content-type") || "";
  if (
    contentType.includes("application/json") &&
    ["POST", "PATCH", "PUT"].includes(c.req.method)
  ) {
    try {
      const raw = await c.req.text();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed._enc && typeof parsed._enc === "string") {
          const decrypted = await decrypt(parsed._enc, ENCRYPTION_KEY);

          // Create a new Request with the decrypted body
          const newReq = new Request(c.req.raw.url, {
            method: c.req.raw.method,
            headers: c.req.raw.headers,
            body: decrypted,
          });

          // Replace the raw request object so downstream handlers see plaintext
          Object.defineProperty(c.req, "raw", {
            value: newReq,
            writable: true,
            configurable: true,
          });

          // Clear Hono's internal body cache so it re-reads from the new raw request
          (c.req as any).bodyCache = {};
        }
      }
    } catch {
      // If decryption fails, let the request through as-is
      // (could be a non-encrypted request during migration)
    }
  }

  await next();

  // ── RESPONSE: Encrypt outgoing body ────────────────────
  const resContentType = c.res.headers.get("content-type") || "";
  if (resContentType.includes("application/json") && c.res.body) {
    try {
      const originalBody = await c.res.text();
      const encrypted = await encrypt(originalBody, ENCRYPTION_KEY);

      const headers = new Headers(c.res.headers);
      headers.set("X-Encrypted", "1");
      headers.set("Content-Type", "application/json; charset=UTF-8");

      c.res = new Response(JSON.stringify({ _enc: encrypted }), {
        status: c.res.status,
        headers,
      });
    } catch {
      // If encryption fails, return original response
    }
  }
};
