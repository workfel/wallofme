import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { rocketOutline, closeOutline, starOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-upgrade-prompt',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'pro.upgradeRequired' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss.emit()">
            <ion-icon name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="prompt-container">
        <ion-icon name="star-outline" class="prompt-icon" />
        <h2>{{ 'pro.unlockFeature' | translate }}</h2>
        <p class="feature-text">
          {{ 'pro.featureRequiresPro' | translate: { feature: feature() } }}
        </p>
        <ion-button expand="block" (click)="goToPro()">
          <ion-icon slot="start" name="rocket-outline" />
          {{ 'pro.viewPlans' | translate }}
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: `
    .prompt-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 24px;
      gap: 12px;

      h2 {
        font-size: 22px;
        font-weight: 700;
        margin: 0;
      }

      .feature-text {
        margin: 0;
        font-size: 15px;
        color: var(--ion-color-medium);
        line-height: 1.5;
      }

      ion-button {
        margin-top: 16px;
        width: 100%;
      }
    }

    .prompt-icon {
      font-size: 56px;
      color: var(--ion-color-warning);
    }
  `,
})
export class UpgradePromptComponent {
  feature = input.required<string>();
  dismiss = output<void>();

  private router = inject(Router);

  constructor() {
    addIcons({ rocketOutline, closeOutline, starOutline });
  }

  goToPro(): void {
    this.dismiss.emit();
    this.router.navigate(['/pro']);
  }
}
