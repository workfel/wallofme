import { Injectable, inject, signal, type Signal } from '@angular/core';
import { ApiService } from './api.service';

interface LikeState {
  liked: ReturnType<typeof signal<boolean>>;
  likeCount: ReturnType<typeof signal<number>>;
}

@Injectable({ providedIn: 'root' })
export class SocialService {
  private api = inject(ApiService);
  private likeCache = new Map<string, LikeState>();

  getLikeState(roomId: string): { liked: Signal<boolean>; likeCount: Signal<number> } {
    const state = this.getOrCreateState(roomId);
    return {
      liked: state.liked.asReadonly(),
      likeCount: state.likeCount.asReadonly(),
    };
  }

  async fetchLikeStatus(roomId: string): Promise<void> {
    try {
      const res = await this.api.client.api.social.rooms[':id'].likes.$get({
        param: { id: roomId },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { liked: boolean; likeCount: number } };
        const state = this.getOrCreateState(roomId);
        state.liked.set(json.data.liked);
        state.likeCount.set(json.data.likeCount);
      }
    } catch {
      // silently fail
    }
  }

  async toggleLike(roomId: string): Promise<void> {
    const state = this.getOrCreateState(roomId);

    // Optimistic update
    const wasLiked = state.liked();
    const prevCount = state.likeCount();
    state.liked.set(!wasLiked);
    state.likeCount.set(wasLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await this.api.client.api.social.rooms[':id'].like.$post({
        param: { id: roomId },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { liked: boolean; likeCount: number } };
        state.liked.set(json.data.liked);
        state.likeCount.set(json.data.likeCount);
      } else {
        // Revert optimistic update
        state.liked.set(wasLiked);
        state.likeCount.set(prevCount);
      }
    } catch {
      // Revert optimistic update
      state.liked.set(wasLiked);
      state.likeCount.set(prevCount);
    }
  }

  async recordView(roomId: string): Promise<void> {
    try {
      await this.api.client.api.social.rooms[':id'].view.$post({
        param: { id: roomId },
      });
    } catch {
      // fire and forget
    }
  }

  private getOrCreateState(roomId: string): LikeState {
    let state = this.likeCache.get(roomId);
    if (!state) {
      state = {
        liked: signal(false),
        likeCount: signal(0),
      };
      this.likeCache.set(roomId, state);
    }
    return state;
  }
}
