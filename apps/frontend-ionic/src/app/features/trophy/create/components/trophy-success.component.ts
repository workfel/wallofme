import { Component, EventEmitter, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, shareOutline } from 'ionicons/icons';

@Component({
  selector: 'app-trophy-success',
  standalone: true,
  imports: [TranslateModule, IonButton, IonIcon],
  template: `
    <div class="success-container">
      <div class="success-icon-wrapper">
        <ion-icon name="checkmark-circle-outline" class="success-icon" />
      </div>

      <h2>{{ 'share.trophyAdded' | translate }}</h2>

      <div class="actions">
        <ion-button expand="block" (click)="share.emit()">
          <ion-icon slot="start" name="share-outline" />
          {{ 'share.shareResult' | translate }} — +50 🔥
        </ion-button>
        <ion-button expand="block" fill="clear" (click)="done.emit()">
          {{ 'share.goToRoom' | translate }}
        </ion-button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
    }

    .success-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 24px;
      max-width: 400px;
      width: 100%;
      gap: 16px;
    }

    .success-icon-wrapper {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--ion-color-success) 0%,
        var(--ion-color-primary) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes bounce-in {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      60% {
        transform: scale(1.12);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .success-icon {
      font-size: 50px;
      color: #fff;
    }

    h2 {
      font-size: 24px;
      font-weight: 800;
      margin: 8px 0 0;
      line-height: 1.2;
      animation: fade-up 0.4s 0.2s ease both;
    }

    @keyframes fade-up {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .actions {
      width: 100%;
      margin-top: 16px;
      animation: fade-up 0.4s 0.4s ease both;

      ion-button {
        margin-bottom: 4px;
      }
    }
  `,
})
export class TrophySuccessComponent {
  @Output() share = new EventEmitter<void>();
  @Output() done = new EventEmitter<void>();

  constructor() {
    addIcons({ checkmarkCircleOutline, shareOutline });
  }
}
