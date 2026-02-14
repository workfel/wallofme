import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

interface TokenBalanceResponse {
  data?: { balance?: number; earned?: number };
  balance?: number;
  earned?: number;
}

interface ErrorResponse {
  error?: string;
  retryAfterSeconds?: number;
}

export interface EarnResult {
  earned: number;
  /** 'cooldown' | 'daily_limit' | 'already_claimed' when blocked */
  blocked?: 'cooldown' | 'daily_limit' | 'already_claimed';
  /** Seconds until the action is available again */
  retryAfterSeconds?: number;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private api = inject(ApiService);

  readonly balance = signal(0);
  readonly loading = signal(false);

  async fetchBalance(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.tokens.balance.$get();
      if (res.ok) {
        const json = (await res.json()) as unknown as TokenBalanceResponse;
        const balance = json?.data?.balance ?? json?.balance ?? 0;
        this.balance.set(balance);
      }
    } catch (e) {
      console.error('Failed to fetch token balance', e);
    } finally {
      this.loading.set(false);
    }
  }

  async earnFromVideo(): Promise<EarnResult> {
    try {
      const res = await this.api.client.api.tokens.earn['rewarded-video'].$post();
      if (res.ok) {
        const json = (await res.json()) as unknown as TokenBalanceResponse;
        const balance = json?.data?.balance ?? json?.balance ?? this.balance();
        const earned = json?.data?.earned ?? json?.earned ?? 0;
        this.balance.set(balance);
        return { earned };
      }
      // Handle 429 responses
      if (res.status === 429) {
        const err = (await res.json()) as unknown as ErrorResponse;
        if (err.retryAfterSeconds) {
          return { earned: 0, blocked: 'cooldown', retryAfterSeconds: err.retryAfterSeconds };
        }
        return { earned: 0, blocked: 'daily_limit' };
      }
    } catch (e) {
      console.error('Failed to earn tokens', e);
    }
    return { earned: 0 };
  }

  async earnDailyLogin(): Promise<EarnResult> {
    try {
      const res = await this.api.client.api.tokens.earn['daily-login'].$post();
      if (res.ok) {
        const json = (await res.json()) as unknown as TokenBalanceResponse;
        const balance = json?.data?.balance ?? json?.balance ?? this.balance();
        const earned = json?.data?.earned ?? json?.earned ?? 0;
        this.balance.set(balance);
        return { earned };
      }
      if (res.status === 429) {
        return { earned: 0, blocked: 'already_claimed' };
      }
    } catch (e) {
      console.error('Failed to claim daily login', e);
    }
    return { earned: 0 };
  }

  async creditPurchase(productId: string, tokens: number): Promise<void> {
    try {
      const res = await this.api.client.api.tokens.earn.purchase.$post({
        json: { productId, tokens },
      });
      if (res.ok) {
        const json = (await res.json()) as unknown as TokenBalanceResponse;
        const balance = json?.data?.balance ?? json?.balance ?? this.balance();
        this.balance.set(balance);
      }
    } catch (e) {
      console.error('Failed to credit purchase', e);
    }
  }

  async fetchStarterPackStatus(): Promise<boolean> {
    try {
      const res = await this.api.client.api.tokens['starter-pack'].status.$get();
      if (res.ok) {
        const json = (await res.json()) as unknown as { data?: { available?: boolean } };
        return json?.data?.available ?? false;
      }
    } catch (e) {
      console.error('Failed to fetch starter pack status', e);
    }
    return false;
  }

  async purchaseStarterPack(): Promise<void> {
    const res = await this.api.client.api.tokens['starter-pack'].purchase.$post();
    if (res.ok) {
      const json = (await res.json()) as unknown as TokenBalanceResponse;
      const balance = json?.data?.balance ?? json?.balance ?? this.balance();
      this.balance.set(balance);
    } else {
      throw new Error('Starter pack purchase failed');
    }
  }
}
