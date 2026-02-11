import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { createAuthClient } from 'better-auth/client';
import { withCapacitor, isNativePlatform } from 'better-auth-capacitor/client';
import { environment } from '@env/environment';

export type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  displayName: string | null;
  isPro: boolean;
  locale: string | null;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _session = signal<Session | null>(null);
  private readonly _isPending = signal(true);
  private router = inject(Router);
  private zone = inject(NgZone);

  readonly user = this._user.asReadonly();
  readonly session = this._session.asReadonly();
  readonly isPending = this._isPending.asReadonly();
  readonly isAuthenticated = computed(() => !!this._session());
  readonly hasCompletedOnboarding = computed(() => !!this._user()?.firstName);

  private authClient = createAuthClient(
    withCapacitor(
      {
        baseURL: environment.apiUrl,
        fetchOptions: {
          credentials: 'include' as const,
        },
      },
      { scheme: 'wallofme' }
    )
  );

  constructor() {
    this.refreshSession();
    this.listenForSessionUpdates();
  }

  async refreshSession(): Promise<void> {
    this._isPending.set(true);
    try {
      const session = await this.authClient.getSession();
      if (session.data) {
        this._user.set(session.data.user as unknown as User);
        this._session.set(session.data.session as unknown as Session);
      } else {
        this._user.set(null);
        this._session.set(null);
      }
    } catch {
      this._user.set(null);
      this._session.set(null);
    } finally {
      this._isPending.set(false);
    }
  }

  async signInEmail(email: string, password: string): Promise<void> {
    const result = await this.authClient.signIn.email({ email, password });
    if (result.data) {
      this._user.set(result.data.user as unknown as User);
      await this.refreshSession();
    }
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  async signUpEmail(
    email: string,
    password: string,
    name: string
  ): Promise<void> {
    const result = await this.authClient.signUp.email({
      email,
      password,
      name,
    });
    if (result.data) {
      this._user.set(result.data.user as unknown as User);
      await this.refreshSession();
    }
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  async signInSocial(provider: 'google' | 'apple'): Promise<void> {
    // On web: use absolute URL (relative would resolve to backend origin)
    // On native: use relative URL (capacitorClient converts to wallofme:///auth/callback)
    const callbackURL = isNativePlatform()
      ? '/auth/callback'
      : `${window.location.origin}/auth/callback`;

    await this.authClient.signIn.social({
      provider,
      callbackURL,
    });
    // On web: browser redirects, this never resolves
    // On native: library handles OAuth via native AuthSession,
    // stores cookie, and resolves when complete
    await this.refreshSession();
  }

  async signOut(): Promise<void> {
    await this.authClient.signOut();
    this._user.set(null);
    this._session.set(null);
  }

  async updateUser(data: {
    firstName?: string;
    lastName?: string;
    country?: string;
    displayName?: string;
  }): Promise<void> {
    const result = await this.authClient.updateUser(data as any);
    if (result.error) {
      throw new Error(result.error.message);
    }
    // BetterAuth returns {status: true}, not the updated user.
    // Refresh session to get fresh user data with the new fields.
    await this.refreshSession();
  }

  /**
   * Listen for session updates from the capacitor plugin.
   * After native OAuth completes, the plugin dispatches this event.
   */
  private listenForSessionUpdates(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('better-auth:session-update', () => {
      this.zone.run(() => {
        this.refreshSession();
      });
    });
  }
}
