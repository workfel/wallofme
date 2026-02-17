import { Component, computed, input, output } from '@angular/core';
import { IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  lockClosedOutline,
  timerOutline,
  trophyOutline,
  podiumOutline,
  starOutline,
} from 'ionicons/icons';

import {
  hasValidStats,
  calculatePercentile,
  formatThousands,
  generateFakeRanking,
  generateFakeTotalParticipants,
  generateFakeCategoryRanking,
  generateFakePercentile,
} from '@app/shared/lib/stats-utils';

@Component({
  selector: 'app-stats-preview-card',
  standalone: true,
  imports: [IonButton, IonIcon, IonText, TranslateModule],
  template: `
    @if (showCard()) {
      <div class="stats-card animate-fade-in">
        <!-- Header -->
        <div class="stats-header">
          <ion-icon name="checkmark-circle-outline" class="header-icon" />
          <span class="header-text">{{ 'stats.officialResultsFound' | translate }}</span>
        </div>

        <!-- Stats rows -->
        <div class="stats-rows">
          <!-- Time — always visible -->
          @if (time()) {
            <div class="stat-row">
              <div class="stat-row-left">
                <ion-icon name="timer-outline" class="stat-icon" />
                <span class="stat-label">{{ 'stats.time' | translate }}</span>
              </div>
              <span class="stat-value">{{ time() }}</span>
            </div>
          }

          <!-- Ranking — Pro: real, Free: blurred fake -->
          <div class="stat-row">
            <div class="stat-row-left">
              <ion-icon name="trophy-outline" class="stat-icon" />
              <span class="stat-label">{{ 'stats.ranking' | translate }}</span>
            </div>
            @if (isPro()) {
              <span class="stat-value">~#{{ formattedRanking() }} / {{ formattedTotal() }}</span>
            } @else {
              <div class="stat-locked">
                <span class="blurred">{{ fakeRanking }} / {{ fakeTotalParticipants }}</span>
                <ion-icon name="lock-closed-outline" class="lock-icon" />
              </div>
            }
          </div>

          <!-- Category Ranking — Pro: real, Free: blurred fake -->
          @if (categoryRanking()) {
            <div class="stat-row">
              <div class="stat-row-left">
                <ion-icon name="podium-outline" class="stat-icon" />
                <span class="stat-label">{{ 'stats.category' | translate }}</span>
              </div>
              @if (isPro()) {
                <span class="stat-value">~#{{ categoryRanking() }}</span>
              } @else {
                <div class="stat-locked">
                  <span class="blurred">{{ fakeCategoryRanking }}</span>
                  <ion-icon name="lock-closed-outline" class="lock-icon" />
                </div>
              }
            </div>
          }

          <!-- Percentile — Pro: real, Free: blurred fake -->
          <div class="stat-row">
            <div class="stat-row-left">
              <ion-icon name="star-outline" class="stat-icon" />
              <span class="stat-label">{{ 'stats.percentile' | translate }}</span>
            </div>
            @if (isPro()) {
              <span class="stat-value stat-value-accent">~Top {{ percentile() }}%</span>
            } @else {
              <div class="stat-locked">
                <span class="blurred">~Top {{ fakePercentile }}%</span>
                <ion-icon name="lock-closed-outline" class="lock-icon" />
              </div>
            }
          </div>
        </div>

        <!-- Unlock CTA (free only) -->
        @if (!isPro()) {
          <ion-button expand="block" class="unlock-btn" (click)="unlock.emit()">
            <ion-icon slot="start" name="lock-closed-outline" />
            {{ 'stats.unlockResults' | translate }}
          </ion-button>
        }

        <!-- Disclaimer — always shown -->
        <div class="disclaimer">
          <ion-text color="medium">
            <small>{{ 'stats.disclaimer' | translate }}</small>
          </ion-text>
        </div>
      </div>
    }
  `,
  styles: `
    .stats-card {
      width: 100%;
      padding: 20px 16px 16px;
      border-radius: 20px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.55);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stats-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-icon {
      font-size: 22px;
      color: var(--ion-color-success);
    }

    .header-text {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .stats-rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.03);
    }

    .stat-row-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat-icon {
      font-size: 18px;
      color: var(--ion-color-medium);
    }

    .stat-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--ion-color-step-600, #666);
    }

    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .stat-value-accent {
      color: var(--ion-color-primary);
    }

    .stat-locked {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .blurred {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-text-color);
      filter: blur(6px);
      user-select: none;
      -webkit-user-select: none;
      pointer-events: none;
    }

    .lock-icon {
      font-size: 14px;
      color: var(--ion-color-medium);
    }

    .unlock-btn {
      --border-radius: 14px;
      font-weight: 700;
      margin: 0;
    }

    .disclaimer {
      text-align: center;

      small {
        font-size: 11px;
        line-height: 1.4;
        font-style: italic;
      }
    }
  `,
})
export class StatsPreviewCardComponent {
  time = input<string | null>(null);
  ranking = input<number | null>(null);
  categoryRanking = input<number | null>(null);
  totalParticipants = input<number | null>(null);
  isPro = input(false);

  unlock = output<void>();

  // Fake values — stable per instance, never real data
  readonly fakeRanking = generateFakeRanking();
  readonly fakeTotalParticipants = generateFakeTotalParticipants();
  readonly fakeCategoryRanking = generateFakeCategoryRanking();
  readonly fakePercentile = generateFakePercentile();

  showCard = computed(() =>
    hasValidStats(this.ranking(), this.totalParticipants()),
  );

  percentile = computed(() =>
    calculatePercentile(this.ranking()!, this.totalParticipants()!),
  );

  formattedRanking = computed(() =>
    formatThousands(this.ranking()!),
  );

  formattedTotal = computed(() =>
    formatThousands(this.totalParticipants()!),
  );

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      lockClosedOutline,
      timerOutline,
      trophyOutline,
      podiumOutline,
      starOutline,
    });
  }
}
