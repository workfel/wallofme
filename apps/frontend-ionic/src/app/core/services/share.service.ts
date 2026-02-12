import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ShareService {
  private api = inject(ApiService);

  readonly shareSlug = signal<string | null>(null);
  readonly loading = signal(false);

  async generateShareLink(): Promise<string | null> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.rooms.me.share.$post({});
      if (res.ok) {
        const json = (await res.json()) as { data: { shareSlug: string } };
        this.shareSlug.set(json.data.shareSlug);
        return json.data.shareSlug;
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
    return null;
  }

  getShareUrl(slug: string): string {
    return `${window.location.origin}/room/share/${slug}`;
  }
}
