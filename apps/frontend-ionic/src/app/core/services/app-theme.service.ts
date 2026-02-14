import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type AppThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'app-theme';

@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly _mode = signal<AppThemeMode>('system');
  readonly mode = this._mode.asReadonly();

  readonly isDark = computed(() => {
    const m = this._mode();
    if (m === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return m === 'dark';
  });

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.mediaQuery.addEventListener('change', () => {
      if (this._mode() === 'system') {
        this.applyTheme();
      }
    });
  }

  async init(): Promise<void> {
    const { value } = await Preferences.get({ key: THEME_KEY });
    if (value === 'light' || value === 'dark' || value === 'system') {
      this._mode.set(value);
    }
    this.applyTheme();
  }

  async setTheme(mode: AppThemeMode): Promise<void> {
    this._mode.set(mode);
    this.applyTheme();
    await Preferences.set({ key: THEME_KEY, value: mode });
  }

  async toggle(): Promise<void> {
    const next = this.isDark() ? 'light' : 'dark';
    await this.setTheme(next);
  }

  private applyTheme(): void {
    const dark = this.isDark();
    document.body.classList.toggle('dark-theme', dark);
  }
}
