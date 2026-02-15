import { Injectable, inject, signal } from '@angular/core';
import { DecorationService, type Decoration } from './decoration.service';
import type { RoomItem } from './room.service';

@Injectable({ providedIn: 'root' })
export class FrameService {
  private decorationService = inject(DecorationService);

  readonly frameStyles = signal<Decoration[]>([]);
  readonly loading = signal(false);

  async fetchFrameStyles(): Promise<void> {
    this.loading.set(true);
    try {
      // Ensure decorations are loaded
      if (this.decorationService.decorations().length === 0) {
        await this.decorationService.fetchDecorations();
      }
      const frames = this.decorationService.decorations().filter(
        (d) => d.category === 'frame',
      );
      this.frameStyles.set(frames);
    } finally {
      this.loading.set(false);
    }
  }

  getMyFrame(roomItems: RoomItem[]): RoomItem | null {
    return roomItems.find(
      (item) => item.decoration?.category === 'frame',
    ) ?? null;
  }

  hasFrame(roomItems: RoomItem[]): boolean {
    return this.getMyFrame(roomItems) !== null;
  }
}
