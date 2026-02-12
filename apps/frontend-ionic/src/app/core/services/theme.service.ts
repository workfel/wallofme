import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  RoomTheme,
  DEFAULT_THEME,
  BUILT_IN_THEMES,
  CustomThemeColors,
  CUSTOM_THEME_ID,
  buildCustomRoomTheme,
} from '@app/types/room-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private api = inject(ApiService);

  readonly themes = signal<RoomTheme[]>(BUILT_IN_THEMES);
  readonly activeTheme = signal<RoomTheme>(DEFAULT_THEME);
  readonly loading = signal(false);
  readonly customColors = signal<CustomThemeColors | null>(null);

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
    if (theme.id !== CUSTOM_THEME_ID) {
      this.customColors.set(null);
    }
  }

  applyCustomColors(colors: CustomThemeColors): void {
    this.customColors.set(colors);
    this.activeTheme.set(buildCustomRoomTheme(colors));
  }

  getThemeBySlug(slug: string): RoomTheme | undefined {
    return this.themes().find((t) => t.slug === slug);
  }

  getThemeById(id: string): RoomTheme | undefined {
    return this.builtInThemes.find((t) => t.id === id);
  }

  resolveThemeFromRoom(room: { themeId: string | null; customTheme: string | null }): RoomTheme {
    if (room.customTheme) {
      try {
        const colors: CustomThemeColors = JSON.parse(room.customTheme);
        return buildCustomRoomTheme(colors);
      } catch {
        // fall through to themeId or default
      }
    }
    if (room.themeId) {
      const found = this.getThemeById(room.themeId);
      if (found) return found;
    }
    return DEFAULT_THEME;
  }
}
