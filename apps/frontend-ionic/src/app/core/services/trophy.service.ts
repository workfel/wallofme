import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface Trophy {
  id: string;
  userId: string;
  type: 'medal' | 'bib';
  status: 'pending' | 'processing' | 'ready' | 'error';
  originalImageUrl: string | null;
  processedImageUrl: string | null;
  textureUrl: string | null;
  thumbnailUrl: string | null;
  aiIdentifiedRace: string | null;
  aiConfidence: number | null;
  raceResultId: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class TrophyService {
  private api = inject(ApiService);

  readonly trophies = signal<Trophy[]>([]);
  readonly loading = signal(false);

  async fetchTrophies(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.trophies.$get({ query: {} });
      if (res.ok) {
        const json = (await res.json()) as { data: Trophy[] };
        this.trophies.set(json.data);
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
  }

  async fetchTrophy(id: string): Promise<Trophy | null> {
    try {
      const res = await this.api.client.api.trophies[':id'].$get({
        param: { id },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: Trophy };
        return json.data;
      }
    } catch {
      // silently fail
    }
    return null;
  }

  async deleteTrophy(id: string): Promise<boolean> {
    try {
      const res = await this.api.client.api.trophies[':id'].$delete({
        param: { id },
      });
      if (res.ok) {
        this.trophies.update((list) => list.filter((t) => t.id !== id));
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }
}
