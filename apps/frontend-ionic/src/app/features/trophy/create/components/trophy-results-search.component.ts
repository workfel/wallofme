import { Component, inject, computed } from '@angular/core';
import {
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { searchOutline, trophyOutline } from 'ionicons/icons';

import { ScanService } from '@app/core/services/scan.service';

@Component({
  selector: 'app-trophy-results-search',
  standalone: true,
  imports: [
    TranslateModule,
    IonIcon,
    IonText,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
  template: `
    @if (scan.step() === 'search') {
      <!-- Searching state -->
      <div class="searching-container animate-fade-in">
        <div class="search-ring">
          <ion-icon name="search-outline" class="search-icon" />
        </div>
        <ion-text>
          <p class="searching-hint">{{ 'scan.searchingHint' | translate }}</p>
        </ion-text>
      </div>
    }

    @if (scan.step() === 'done' && scan.searchResult()) {
      @if (scan.searchResult()!.found) {
        <!-- Results found: podium reveal -->
        <div class="results-reveal animate-fade-in">
          <div class="trophy-bounce">
            <ion-icon name="trophy-outline" class="trophy-icon" />
          </div>

          <ion-card class="result-card">
            <ion-card-header>
              <ion-card-title>
                {{ 'review.resultsFound' | translate }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (scan.searchResult()!.time) {
                <div class="stat-row reveal-1">
                  <span class="stat-label">{{ 'review.time' | translate }}</span>
                  <span class="stat-value">{{ scan.searchResult()!.time }}</span>
                </div>
              }
              @if (scan.searchResult()!.ranking) {
                <div class="stat-row reveal-2">
                  <span class="stat-label">{{ 'review.ranking' | translate }}</span>
                  <span class="stat-value">
                    {{ scan.searchResult()!.ranking }}
                    @if (scan.searchResult()!.totalParticipants) {
                      / {{ scan.searchResult()!.totalParticipants }}
                    }
                  </span>
                </div>
              }
              @if (scan.searchResult()!.categoryRanking) {
                <div class="stat-row reveal-3">
                  <span class="stat-label">{{ 'review.categoryRanking' | translate }}</span>
                  <span class="stat-value">{{ scan.searchResult()!.categoryRanking }}</span>
                </div>
              }
            </ion-card-content>
          </ion-card>
        </div>
      } @else {
        <!-- No results -->
        <div class="no-results animate-fade-in">
          <ion-text color="medium">
            <p>{{ 'review.noResultsMessage' | translate }}</p>
          </ion-text>
        </div>
      }
    }
  `,
  styles: `
    /* Searching state */
    .searching-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 24px;
    }

    .search-ring {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid var(--ion-color-step-200);
      border-top-color: var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: spin 1.2s linear infinite;
    }

    .search-icon {
      font-size: 32px;
      color: var(--ion-color-primary);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .searching-hint {
      font-size: 15px;
      text-align: center;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* Results reveal */
    .results-reveal {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px 0;
    }

    .trophy-bounce {
      animation: bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    .trophy-icon {
      font-size: 56px;
      color: var(--ion-color-warning);
    }

    .result-card {
      width: 100%;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-step-100);

      &:last-child {
        border-bottom: none;
      }
    }

    .stat-label {
      font-size: 14px;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 700;
    }

    .reveal-1 {
      animation: fadeInUp 0.4s ease-out 0.2s both;
    }

    .reveal-2 {
      animation: fadeInUp 0.4s ease-out 0.5s both;
    }

    .reveal-3 {
      animation: fadeInUp 0.4s ease-out 0.8s both;
    }

    /* No results */
    .no-results {
      text-align: center;
      padding: 40px 0;

      p {
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
      }
    }

    /* Keyframes */
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.15);
      }
    }

    @keyframes bounceIn {
      0% {
        transform: scale(0.3);
        opacity: 0;
      }
      50% {
        transform: scale(1.05);
      }
      70% {
        transform: scale(0.95);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class TrophyResultsSearchComponent {
  scan = inject(ScanService);

  constructor() {
    addIcons({ searchOutline, trophyOutline });
  }
}
