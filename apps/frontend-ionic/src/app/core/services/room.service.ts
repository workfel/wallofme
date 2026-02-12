import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { getNextSlotPosition } from '@app/shared/lib/room-placement';
import type { SlotPosition } from '@app/shared/lib/room-placement';

export interface RoomItem {
  id: string;
  trophyId: string | null;
  decorationId: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
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
  } | null;
}

export interface Room {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: RoomItem[];
}

@Injectable({ providedIn: 'root' })
export class RoomService {
  private api = inject(ApiService);

  readonly room = signal<Room | null>(null);
  readonly loading = signal(false);

  async fetchMyRoom(): Promise<Room | null> {
    this.loading.set(true);
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
      this.loading.set(false);
    }
    return null;
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
    data: { positionX: number; positionY: number; positionZ: number; wall?: 'left' | 'right' | null; rotationY?: number }
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
