import { Component, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [
    TranslateModule,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>{{ 'review.resultsFound' | translate }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        @if (time()) {
          <div class="result-row">
            <span class="label">{{ 'review.time' | translate }}</span>
            <span class="value">{{ time() }}</span>
          </div>
        }
        @if (ranking()) {
          <div class="result-row">
            <span class="label">{{ 'review.ranking' | translate }}</span>
            <span class="value">
              {{ ranking() }}
              @if (totalParticipants()) {
                / {{ totalParticipants() }}
              }
            </span>
          </div>
        }
        @if (categoryRanking()) {
          <div class="result-row">
            <span class="label">{{ 'review.categoryRanking' | translate }}</span>
            <span class="value">{{ categoryRanking() }}</span>
          </div>
        }
      </ion-card-content>
    </ion-card>
  `,
  styles: `
    .result-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-step-100);

      &:last-child {
        border-bottom: none;
      }
    }

    .label {
      color: var(--ion-color-step-600);
      font-size: 14px;
    }

    .value {
      font-weight: 600;
      font-size: 14px;
    }
  `,
})
export class ResultCardComponent {
  time = input<string | null>(null);
  ranking = input<number | null>(null);
  categoryRanking = input<number | null>(null);
  totalParticipants = input<number | null>(null);
}
