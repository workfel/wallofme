import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private api = inject(ApiService);

  async recordView(roomId: string): Promise<void> {
    try {
      await this.api.client.api.social.rooms[':id'].view.$post({
        param: { id: roomId },
      });
    } catch {
      // fire and forget
    }
  }
}
