import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { getNextSlotPosition } from '@app/shared/lib/room-placement';
import type { SlotPosition } from '@app/shared/lib/room-placement';
import type { MaterialOverrides } from '@app/types/room-theme';

export interface RoomItem {
  id: string;
  trophyId: string | null;
  decorationId: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  wall: 'left' | 'right' | null;
  trophy?: {
    id: string;
    type: 'medal' | 'bib';
    textureUrl: string | null;
    thumbnailUrl: string | null;
    raceResult?: {
      time: string | null;
      ranking: number | null;
      categoryRanking: number | null;
      totalParticipants: number | null;
      race: {
        name: string;
        date: string | null;
        city: string | null;
        country: string | null;
        sport: string | null;
      };
    } | null;
  } | null;
  decoration?: {
    id: string;
    name: string;
    modelUrl: string | null;
    category?: string | null;
  } | null;
  customImageUrl?: string | null;
}

export interface Room {
  id: string;
  userId: string;
  themeId: string | null;
  customTheme: string | null;
  floor: string | null;
  likeCount: number;
  viewCount: number;
  items: RoomItem[];
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private api = inject(ApiService);

  readonly room = signal<Room | null>(null);
  readonly loading = signal(false);

  async fetchMyRoom(): Promise<Room | null> {
    // Only show loading spinner on initial fetch (room not yet loaded)
    const isInitial = this.room() === null;
    if (isInitial) this.loading.set(true);
    try {
      const res = await this.api.client.api.rooms.me.$get();
      if (res.ok) {
        const json = (await res.json()) as { data: Room };
        this.room.set(json.data);
        return json.data;
      }
    } catch {
      // silently fail
    } finally {
      if (isInitial) this.loading.set(false);
    }
    return null;
  }

  async updateRoom(data: { themeId?: string | null; customTheme?: { leftWallColor: string; backWallColor: string; floorColor: string; background: string; materials?: MaterialOverrides } | null; thumbnailKey?: string }): Promise<boolean> {
    try {
      const res = await this.api.client.api.rooms.me.$patch({
        json: data,
      });
      if (res.ok) {
        const json = await res.json();
        const d = json.data as { themeId: string | null; customTheme: string | null };
        const current = this.room();
        if (current) {
          this.room.set({ ...current, themeId: d.themeId, customTheme: d.customTheme });
        }
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  async addDecorationToRoom(decorationId: string): Promise<boolean> {
    try {
      const res = await this.api.client.api.rooms.items.$post({
        json: {
          decorationId,
          positionX: 0,
          positionY: 0,
          positionZ: 0,
          rotationY: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          scaleZ: 0.5,
        },
      });
      if (res.ok) {
        await this.fetchMyRoom();
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  async addFrameToRoom(decorationId: string): Promise<boolean> {
    try {
      const res = await this.api.client.api.rooms.items.$post({
        json: {
          decorationId,
          positionX: 0,
          positionY: 1.5,
          positionZ: 0,
          rotationY: 0,
          wall: 'right',
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
        },
      });
      if (res.ok) {
        await this.fetchMyRoom();
        return true;
      }
      // Check for frame limit
      if (res.status === 409) {
        return false;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  async updateFrameImage(itemId: string, imageKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await this.api.client.api.rooms.items[':id'].image.$patch({
        param: { id: itemId },
        json: { imageKey },
      });
      if (res.ok) {
        await this.fetchMyRoom();
        return { success: true };
      }
      if (res.status === 422) {
        const body = await res.json() as { error?: string };
        return { success: false, error: body.error ?? 'image_rejected' };
      }
      return { success: false, error: 'update_failed' };
    } catch {
      return { success: false, error: 'network_error' };
    }
  }

  async addItemToRoom(trophyId: string): Promise<boolean> {
    const room = this.room();
    const existingItems = room?.items ?? [];
    const slot = getNextSlotPosition(existingItems);

    if (!slot) return false;

    try {
      const res = await this.api.client.api.rooms.items.$post({
        json: {
          trophyId,
          positionX: slot.positionX,
          positionY: slot.positionY,
          positionZ: slot.positionZ,
          wall: slot.wall,
          rotationY: 0,
        },
      });
      if (res.ok) {
        // Refresh room data
        await this.fetchMyRoom();
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  async updateItem(
    itemId: string,
    data: { positionX: number; positionY: number; positionZ: number; wall?: 'left' | 'right' | null; rotationY?: number; scaleX?: number; scaleY?: number; scaleZ?: number }
  ): Promise<boolean> {
    try {
      const res = await this.api.client.api.rooms.items[':id'].$patch({
        param: { id: itemId },
        json: data,
      });
      if (res.ok) {
        await this.fetchMyRoom();
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  async removeItem(itemId: string): Promise<boolean> {
    try {
      const res = await this.api.client.api.rooms.items[':id'].$delete({
        param: { id: itemId },
      });
      if (res.ok) {
        await this.fetchMyRoom();
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }

  getNextSlot(): SlotPosition | null {
    const room = this.room();
    return getNextSlotPosition(room?.items ?? []);
  }
}
