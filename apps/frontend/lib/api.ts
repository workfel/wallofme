import { hc } from "hono/client";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { AppType } from "../../backend/src/index";

/**
 * Build a cookie string from the JSON stored by @better-auth/expo.
 * Mirrors the `getCookie` helper from the expo client plugin (client.mjs).
 */
function getCookieHeader(): string {
  try {
    // expo-secure-store exposes a synchronous getItem (same API the expo plugin uses)
    const raw = SecureStore.getItem("wallofme_cookie");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as Record<
      string,
      { value: string; expires: string | null }
    >;
    return Object.entries(parsed)
      .filter(
        ([, v]) => !v.expires || new Date(v.expires) > new Date()
      )
      .map(([k, v]) => `${k}=${v.value}`)
      .join("; ");
  } catch {
    return "";
  }
}

const authFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);

  if (Platform.OS !== "web") {
    const cookie = getCookieHeader();
    if (cookie) {
      headers.set("cookie", cookie);
    }
  }

  // credentials: 'include' sends browser cookies cross-origin on web
  return fetch(input, { ...init, headers, credentials: "include" });
};

export const api = hc<AppType>(process.env.EXPO_PUBLIC_API_URL!, {
  fetch: authFetch,
});
