import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface Decoration {
  id: string;
  name: string;
  description: string | null;
  modelUrl: string;
  thumbnailUrl: string | null;
  category: string | null;
  isPremium: boolean;
  priceTokens: number;
  defaultScale: number;
  wallMountable: boolean;
  floorOnly: boolean;
}

export interface UserDecoration {
  id: string;
  userId: string;
  decorationId: string;
  acquiredAt: string;
  decoration: Decoration;
}

@Injectable({ providedIn: 'root' })
export class DecorationService {
  private api = inject(ApiService);

  readonly decorations = signal<Decoration[]>([]);
  readonly inventory = signal<UserDecoration[]>([]);
  readonly loading = signal(false);

  async fetchDecorations(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.decorations.$get({ query: { page: '1', limit: '50' } });
      if (res.ok) {
        const json = await res.json();
        this.decorations.set(json.data as unknown as Decoration[]);
      }
    } catch (e) {
      console.error('Failed to fetch decorations', e);
    } finally {
      this.loading.set(false);
    }
  }

  async fetchInventory(): Promise<void> {
    try {
      const res = await this.api.client.api.decorations.inventory.me.$get({ query: { page: '1', limit: '50' } });
      if (res.ok) {
        const json = await res.json();
        this.inventory.set(json.data as unknown as UserDecoration[]);
      }
    } catch (e) {
      console.error('Failed to fetch inventory', e);
    }
  }

  async acquire(decorationId: string): Promise<boolean> {
    try {
      const res = await this.api.client.api.decorations[':id'].acquire.$post({
        param: { id: decorationId },
      });
      if (res.ok) {
        await this.fetchInventory();
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  isOwned(decorationId: string): boolean {
    return this.inventory().some((ud) => ud.decorationId === decorationId);
  }
}
