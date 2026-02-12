import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
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

  constructor() {
    this.platform.ready().then(async () => {
      // Initialize RevenueCat
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: environment.revenueCat.apiKey });

      // Initialize AdMob
      await this.adService.initialize();
    });
  }

  ngOnInit(): void {
    this.i18n.init();
  }
}
