import { Injectable } from '@angular/core';
import { hc } from 'hono/client';
import { isNativePlatform, getCapacitorAuthToken } from 'better-auth-capacitor/client';
import { environment } from '@env/environment';
import type { AppType } from '@backend/index';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly client = hc<AppType>(environment.apiUrl, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      this.authFetch(input, init),
  });

  /**
   * Wraps fetch to attach auth credentials.
   * - Web: uses credentials: 'include' (browser handles cookies)
   * - Native: reads bearer token from Capacitor Preferences
   */
  private async authFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const headers = new Headers(init?.headers);

    if (isNativePlatform()) {
      const token = await getCapacitorAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return fetch(input, {
      ...init,
      headers,
      credentials: isNativePlatform() ? 'omit' : 'include',
    });
  }
}
