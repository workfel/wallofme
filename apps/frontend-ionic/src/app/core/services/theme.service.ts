import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  RoomTheme,
  DEFAULT_THEME,
  BUILT_IN_THEMES,
  CustomThemeColors,
  CUSTOM_THEME_ID,
  buildCustomRoomTheme,
  applyMaterialOverridesToTheme,
  type MaterialOverrides,
} from '@app/types/room-theme';

export interface ThemeSnapshot {
  baseTheme: RoomTheme;
  activeTheme: RoomTheme;
  materialOverrides: MaterialOverrides | null;
  customColors: CustomThemeColors | null;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private api = inject(ApiService);

  readonly themes = signal<RoomTheme[]>(BUILT_IN_THEMES);
  readonly activeTheme = signal<RoomTheme>(DEFAULT_THEME);
  readonly loading = signal(false);
  readonly customColors = signal<CustomThemeColors | null>(null);
  readonly materialOverrides = signal<MaterialOverrides | null>(null);

  readonly baseTheme = signal<RoomTheme>(DEFAULT_THEME);
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
    this.baseTheme.set(theme);
    this.materialOverrides.set(null);
    this.activeTheme.set(theme);
    if (theme.id !== CUSTOM_THEME_ID) {
      this.customColors.set(null);
    }
  }

  applyCustomColors(colors: CustomThemeColors): void {
    this.customColors.set(colors);
    const base = buildCustomRoomTheme(colors);
    this.baseTheme.set(base);
    this.materialOverrides.set(null);
    this.activeTheme.set(base);
  }

  applyMaterialOverrides(overrides: MaterialOverrides): void {
    this.materialOverrides.set(overrides);
    this.activeTheme.set(applyMaterialOverridesToTheme(this.baseTheme(), overrides));
  }

  clearMaterialOverrides(): void {
    this.materialOverrides.set(null);
    this.activeTheme.set(this.baseTheme());
  }

  saveSnapshot(): ThemeSnapshot {
    return {
      baseTheme: this.baseTheme(),
      activeTheme: this.activeTheme(),
      materialOverrides: this.materialOverrides(),
      customColors: this.customColors(),
    };
  }

  restoreSnapshot(snapshot: ThemeSnapshot): void {
    this.baseTheme.set(snapshot.baseTheme);
    this.activeTheme.set(snapshot.activeTheme);
    this.materialOverrides.set(snapshot.materialOverrides);
    this.customColors.set(snapshot.customColors);
  }

  getThemeBySlug(slug: string): RoomTheme | undefined {
    return this.themes().find((t) => t.slug === slug);
  }

  getThemeById(id: string): RoomTheme | undefined {
    return this.builtInThemes.find((t) => t.id === id);
  }

  /**
   * Pure resolver — safe to call inside `computed()`.
   * Returns a fully resolved theme (with material overrides baked in if present).
   * Does NOT write to any signals.
   *
   * Base theme priority:
   *   1. themeId → built-in theme (preserves original textures)
   *   2. customTheme colors → buildCustomRoomTheme
   *   3. DEFAULT_THEME
   * Then material overrides from customTheme.materials are applied on top.
   */
  resolveThemeFromRoom(room: { themeId: string | null; customTheme: string | null }): RoomTheme {
    let materials: MaterialOverrides | null = null;

    // Extract materials from customTheme JSON
    if (room.customTheme) {
      try {
        const parsed = JSON.parse(room.customTheme);
        materials = parsed.materials ?? null;
      } catch {
        // ignore parse errors
      }
    }

    // Determine base theme
    let base: RoomTheme;
    if (room.themeId) {
      base = this.getThemeById(room.themeId) ?? DEFAULT_THEME;
    } else if (room.customTheme) {
      try {
        base = buildCustomRoomTheme(JSON.parse(room.customTheme));
      } catch {
        base = DEFAULT_THEME;
      }
    } else {
      base = DEFAULT_THEME;
    }

    // Apply material overrides on top of the resolved base
    return materials ? applyMaterialOverridesToTheme(base, materials) : base;
  }

  /**
   * Imperative init — call from ngOnInit / async contexts (NOT from computed).
   * Resolves theme AND hydrates all signals (baseTheme, materialOverrides,
   * customColors, activeTheme) from stored room data.
   */
  initThemeFromRoom(room: { themeId: string | null; customTheme: string | null }): void {
    let materials: MaterialOverrides | null = null;

    // Extract materials from customTheme JSON
    if (room.customTheme) {
      try {
        const parsed = JSON.parse(room.customTheme);
        materials = parsed.materials ?? null;
      } catch {
        // ignore
      }
    }

    // Determine base theme (without materials)
    let base: RoomTheme;
    if (room.themeId) {
      base = this.getThemeById(room.themeId) ?? DEFAULT_THEME;
      this.customColors.set(null);
    } else if (room.customTheme) {
      try {
        const parsed = JSON.parse(room.customTheme);
        base = buildCustomRoomTheme(parsed);
        this.customColors.set(parsed);
      } catch {
        base = DEFAULT_THEME;
        this.customColors.set(null);
      }
    } else {
      base = DEFAULT_THEME;
      this.customColors.set(null);
    }

    this.baseTheme.set(base);
    this.materialOverrides.set(materials);
    this.activeTheme.set(materials ? applyMaterialOverridesToTheme(base, materials) : base);
  }
}
