import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translate = inject(TranslateService);

  init(): void {
    this.translate.addLangs(['en', 'fr']);
    this.translate.setDefaultLang('en');

    // Detect browser/device locale
    const browserLang = this.translate.getBrowserLang();
    const lang = browserLang?.match(/en|fr/) ? browserLang : 'en';
    this.translate.use(lang);
  }

  get currentLang(): string {
    return this.translate.currentLang || 'en';
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
