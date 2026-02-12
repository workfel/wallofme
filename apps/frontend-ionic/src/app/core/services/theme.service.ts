import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { RoomTheme, DEFAULT_THEME, BUILT_IN_THEMES } from '@app/types/room-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private api = inject(ApiService);

  readonly themes = signal<RoomTheme[]>(BUILT_IN_THEMES);
  readonly activeTheme = signal<RoomTheme>(DEFAULT_THEME);
  readonly loading = signal(false);

  readonly builtInThemes = BUILT_IN_THEMES;

  async fetchThemes(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.themes.$get();
      if (res.ok) {
        const json = await res.json();
        this.themes.set(json.data as unknown as RoomTheme[]);
      }
    } catch (e) {
      console.error('Failed to fetch themes', e);
    } finally {
      this.loading.set(false);
    }
  }

  applyTheme(theme: RoomTheme): void {
    this.activeTheme.set(theme);
  }

  getThemeBySlug(slug: string): RoomTheme | undefined {
    return this.themes().find((t) => t.slug === slug);
  }
}
