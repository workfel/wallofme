import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface RaceCard {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  distance: string | null;
  sport: string | null;
  finisherCount: number;
  userHasRun: boolean;
}

@Injectable({ providedIn: 'root' })
export class RaceDiscoveryService {
  private api = inject(ApiService);

  readonly trendingRaces = signal<RaceCard[]>([]);
  readonly races = signal<RaceCard[]>([]);
  readonly loadingTrending = signal(false);
  readonly loadingRaces = signal(false);
  readonly hasMore = signal(true);
  private page = 1;

  async loadTrending(): Promise<void> {
    if (this.loadingTrending()) return;
    this.loadingTrending.set(true);
    try {
      const res = await (this.api.client.api.races as any).trending.$get();
      if (res.ok) {
        const json = (await res.json()) as { data: RaceCard[] };
        this.trendingRaces.set(json.data);
      }
    } catch {
      // silently fail
    } finally {
      this.loadingTrending.set(false);
    }
  }

  async loadRaces(params?: { q?: string; sports?: string[]; reset?: boolean }): Promise<void> {
    if (this.loadingRaces()) return;
    if (params?.reset) {
      this.page = 1;
      this.hasMore.set(true);
    }
    this.loadingRaces.set(true);
    try {
      const query: Record<string, string | string[]> = {
        page: String(this.page),
        limit: '20',
      };
      if (params?.q) query['q'] = params.q;
      if (params?.sports && params.sports.length > 0) query['sport'] = params.sports;

      const res = await this.api.client.api.races.$get({ query: query as any });
      if (res.ok) {
        const json = (await res.json()) as { data: RaceCard[]; page: number; limit: number };
        if (params?.reset) {
          this.races.set(json.data);
        } else {
          this.races.update((prev) => [...prev, ...json.data]);
        }
        this.hasMore.set(json.data.length === 20);
      }
    } catch {
      // silently fail
    } finally {
      this.loadingRaces.set(false);
    }
  }

  async loadMore(params?: { q?: string; sports?: string[] }): Promise<void> {
    if (!this.hasMore() || this.loadingRaces()) return;
    this.page++;
    await this.loadRaces(params);
  }
}
