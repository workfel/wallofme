import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { home, compass, trophy, person } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    TranslateModule,
  ],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="home" />
          <ion-label>{{ 'tabs.home' | translate }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="explore">
          <ion-icon name="compass" />
          <ion-label>{{ 'tabs.explore' | translate }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="trophies">
          <ion-icon name="trophy" />
          <ion-label>{{ 'tabs.trophies' | translate }}</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile">
          <ion-icon name="person" />
          <ion-label>{{ 'tabs.profile' | translate }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  constructor() {
    addIcons({ home, compass, trophy, person });
  }
}
