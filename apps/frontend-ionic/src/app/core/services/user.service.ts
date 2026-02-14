import { Injectable, inject, signal, computed } from "@angular/core";
import { ApiService } from "./api.service";

export interface UserProfile {
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
  sports: string[] | null;
  scansRemaining: number | null;
  scanLimit: number | null;
  tokenBalance: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: "root" })
export class UserService {
  private api = inject(ApiService);

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _loading = signal(false);

  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly scansRemaining = computed(
    () => this._profile()?.scansRemaining ?? null,
  );
  readonly scanLimit = computed(() => this._profile()?.scanLimit ?? null);
  readonly isPro = computed(() => this._profile()?.isPro ?? false);

  readonly scansDisplay = computed(() => {
    if (this.isPro()) return "unlimited";
    const remaining = this.scansRemaining();
    if (remaining === null) return null;
    return remaining;
  });

  async fetchProfile(): Promise<UserProfile | null> {
    this._loading.set(true);
    try {
      const res = await this.api.client.api.users.me.$get();
      if (res.ok) {
        const json = (await res.json()) as { data: UserProfile };
        this._profile.set(json.data);
        return json.data;
      }
    } catch {
      // silently fail
    } finally {
      this._loading.set(false);
    }
    return null;
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    country?: string | null;
    locale?: string;
    sports?: string[];
    image?: string;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<boolean> {
    try {
      const res = await (this.api.client.api.users.me as any).$patch({
        json: data,
      });
      if (res.ok) {
        const json = (await res.json()) as { data: UserProfile };
        this._profile.set(json.data);
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  decrementScansRemaining(): void {
    const profile = this._profile();
    if (profile && profile.scansRemaining !== null) {
      this._profile.set({
        ...profile,
        scansRemaining: Math.max(0, profile.scansRemaining - 1),
      });
    }
  }
}
