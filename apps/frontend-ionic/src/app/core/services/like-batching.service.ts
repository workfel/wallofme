import { Injectable, inject, signal, computed, type Signal } from '@angular/core';
import { ApiService } from './api.service';

interface RoomBatch {
  roomId: string;
  pendingCount: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

@Injectable({ providedIn: 'root' })
export class LikeBatchingService {
  private api = inject(ApiService);
  private batches = new Map<string, RoomBatch>();
  private likeCountMap = new Map<string, ReturnType<typeof signal<number>>>();

  private readonly BATCH_DELAY_MS = 500;
  private readonly MAX_BATCH_SIZE = 100;

  getLikeCount(roomId: string): Signal<number> {
    let counter = this.likeCountMap.get(roomId);
    if (!counter) {
      counter = signal(0);
      this.likeCountMap.set(roomId, counter);
    }
    return counter.asReadonly();
  }

  async fetchLikeCount(roomId: string): Promise<void> {
    try {
      const res = await this.api.client.api.social.rooms[':id'].likes.$get({
        param: { id: roomId },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { likeCount: number } };
        const counter = this.getOrCreateCounter(roomId);
        counter.set(json.data.likeCount);
      }
    } catch {
      // silently fail
    }
  }

  addLike(roomId: string): void {
    // Increment optimistic counter immediately
    const counter = this.getOrCreateCounter(roomId);
    counter.set(counter() + 1);

    // Get or create batch
    let batch = this.batches.get(roomId);
    if (!batch) {
      batch = { roomId, pendingCount: 0, timeoutId: null };
      this.batches.set(roomId, batch);
    }

    batch.pendingCount++;

    // Cancel existing timeout if any
    if (batch.timeoutId) {
      clearTimeout(batch.timeoutId);
    }

    // Schedule flush after delay
    batch.timeoutId = setTimeout(() => {
      this.flushBatch(roomId);
    }, this.BATCH_DELAY_MS);
  }

  private async flushBatch(roomId: string): Promise<void> {
    const batch = this.batches.get(roomId);
    if (!batch || batch.pendingCount === 0) return;

    const count = Math.min(batch.pendingCount, this.MAX_BATCH_SIZE);
    batch.pendingCount -= count;

    try {
      const res = await this.api.client.api.social.rooms[':id'].like.$post({
        json: { count },
        param: { id: roomId },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { likeCount: number } };
        const counter = this.getOrCreateCounter(roomId);
        counter.set(json.data.likeCount);
      } else {
        // Revert optimistic count on error
        const counter = this.getOrCreateCounter(roomId);
        counter.set(counter() - count);
      }
    } catch {
      // Revert optimistic count on error
      const counter = this.getOrCreateCounter(roomId);
      counter.set(counter() - count);
    }

    // If there are more pending likes, schedule another flush
    if (batch.pendingCount > 0) {
      batch.timeoutId = setTimeout(() => {
        this.flushBatch(roomId);
      }, this.BATCH_DELAY_MS);
    }
  }

  private getOrCreateCounter(roomId: string): ReturnType<typeof signal<number>> {
    let counter = this.likeCountMap.get(roomId);
    if (!counter) {
      counter = signal(0);
      this.likeCountMap.set(roomId, counter);
    }
    return counter;
  }
}
