import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { I18nService } from './core/services/i18n.service';
import { AdService } from './core/services/ad.service';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { environment } from '@env/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent implements OnInit {
  private i18n = inject(I18nService);
  private platform = inject(Platform);
  private adService = inject(AdService);
  private router = inject(Router);

  constructor() {
    this.platform.ready().then(async () => {
      // Initialize RevenueCat Capacitor SDK only on iOS native (Apple IAP)
      // Web/Android use RevenueCat Web Billing via PurchaseService
      if (this.platform.is('capacitor') && this.platform.is('ios')) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey: environment.revenueCat.apiKey });
      }

      // Initialize AdMob
      await this.adService.initialize();

      // Deep link handling on native platforms
      if (this.platform.is('capacitor')) {
        App.addListener('appUrlOpen', (event) => {
          const url = new URL(event.url);
          // wallofme://room/share/abc → host="room", pathname="/share/abc"
          const path = url.host ? '/' + url.host + url.pathname : url.pathname;
          if (path) {
            this.router.navigateByUrl(path);
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.i18n.init();
  }
}
