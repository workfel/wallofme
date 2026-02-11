import { Component } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonText,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'explore.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'explore.title' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="centered">
        <ion-text color="medium">
          <p>{{ 'explore.subtitle' | translate }}</p>
        </ion-text>
      </div>
    </ion-content>
  `,
  styles: `
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      text-align: center;
    }
  `,
})
export class ExplorePage {}
