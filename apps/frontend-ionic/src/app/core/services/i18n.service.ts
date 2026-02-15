import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANG_STORAGE_KEY = 'app_language';
const SUPPORTED_LANGS = ['en', 'fr'];

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translate = inject(TranslateService);

  init(): void {
    this.translate.addLangs(SUPPORTED_LANGS);
    this.translate.setDefaultLang('en');

    // Check localStorage first, then fall back to browser/device locale
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang && SUPPORTED_LANGS.includes(savedLang)) {
      this.translate.use(savedLang);
    } else {
      const browserLang = this.translate.getBrowserLang();
      const lang = browserLang?.match(/en|fr/) ? browserLang : 'en';
      this.translate.use(lang);
    }
  }

  get currentLang(): string {
    return this.translate.currentLang || 'en';
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
