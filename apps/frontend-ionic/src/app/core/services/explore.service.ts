import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';

export interface ExploreRoom {
  id: string;
  userId: string;
  displayName: string | null;
  firstName: string | null;
  image: string | null;
  sports: string[];
  country: string | null;
  thumbnailUrl: string | null;
  likeCount: number;
  viewCount: number;
  trophyCount: number;
  isPro: boolean;
  updatedAt: string;
}

export type ExploreSortBy = 'recent' | 'popular' | 'liked';

@Injectable({ providedIn: 'root' })
export class ExploreService {
  private api = inject(ApiService);

  readonly rooms = signal<ExploreRoom[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(true);
  readonly total = signal(0);

  private page = 1;
  private currentSort: ExploreSortBy = 'recent';
  private currentSport: string | null = null;
  private currentSearch: string | null = null;

  readonly isEmpty = computed(() => !this.loading() && this.rooms().length === 0);

  async loadRooms(params?: {
    sort?: ExploreSortBy;
    sport?: string | null;
    search?: string | null;
    reset?: boolean;
  }): Promise<void> {
    if (params?.sort !== undefined) this.currentSort = params.sort;
    if (params?.sport !== undefined) this.currentSport = params.sport;
    if (params?.search !== undefined) this.currentSearch = params.search;
    if (params?.reset) this.page = 1;

    this.loading.set(true);
    try {
      const query = {
        sort: this.currentSort,
        page: String(this.page),
        limit: '20',
        ...(this.currentSport && { sport: this.currentSport }),
        ...(this.currentSearch && { search: this.currentSearch }),
      };

      const res = await this.api.client.api.rooms.explore.$get({ query });
      if (res.ok) {
        const json = (await res.json()) as {
          data: {
            rooms: ExploreRoom[];
            total: number;
            hasMore: boolean;
          };
        };
        if (this.page === 1) {
          this.rooms.set(json.data.rooms);
        } else {
          this.rooms.update((prev) => [...prev, ...json.data.rooms]);
        }
        this.total.set(json.data.total);
        this.hasMore.set(json.data.hasMore);
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore() || this.loading()) return;
    this.page++;
    await this.loadRooms();
  }

  async refresh(): Promise<void> {
    this.page = 1;
    await this.loadRooms({ reset: true });
  }
}
