import {
  Component,
  input,
  output,
  signal,
  inject,
  effect,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { flameOutline, checkmarkCircle } from 'ionicons/icons';
import { TokenService } from '@app/core/services/token.service';

@Component({
  selector: 'app-daily-reward-sheet',
  standalone: true,
  imports: [IonButton, IonIcon, IonSpinner, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="sheet-content">
      <div class="sheet-handle"></div>

      <!-- Title -->
      <h2 class="sheet-title" [class.gold]="isDay7Bonus()">
        {{ isDay7Bonus() ? ('dailyReward.day7Title' | translate) : ('dailyReward.title' | translate) }}
      </h2>

      <!-- Streak progress dots -->
      <div class="streak-progress">
        @for (day of days; track day) {
          <div class="progress-step" [class.completed]="day <= streakDays()" [class.bonus]="day === 7">
            @if (day === 7) {
              <span class="step-label">x5</span>
            } @else {
              <span class="step-label">{{ day }}</span>
            }
          </div>
          @if (day < 7) {
            <div class="progress-line" [class.filled]="day < streakDays()"></div>
          }
        }
      </div>

      <!-- Reward display -->
      <div class="reward-display" [class.gold]="isDay7Bonus()">
        <ion-icon name="flame-outline" />
        <span class="reward-amount">+{{ rewardAmount() }}</span>
      </div>

      <!-- Claim button or claimed state -->
      @if (claimed()) {
        <div class="claimed-state">
          <ion-icon name="checkmark-circle" class="claimed-icon" />
          <span>{{ 'dailyReward.claimed' | translate }}</span>
        </div>
        <p class="keep-it-up">{{ 'dailyReward.keepItUp' | translate }}</p>
      } @else {
        <ion-button
          expand="block"
          [color]="isDay7Bonus() ? 'warning' : 'primary'"
          [disabled]="claiming()"
          (click)="claim()"
          class="claim-btn"
        >
          @if (claiming()) {
            <ion-spinner name="crescent" />
          } @else {
            {{ 'dailyReward.claim' | translate }}
          }
        </ion-button>
      }
    </div>
  `,
  styles: `
    .sheet-content {
      padding: 16px 24px 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .sheet-handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--ion-color-step-300);
      margin-bottom: 4px;
    }

    .sheet-title {
      font-size: 22px;
      font-weight: 800;
      margin: 0;
      text-align: center;

      &.gold {
        background: linear-gradient(135deg, #f5a623, #ffd700);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    /* Streak progress */
    .streak-progress {
      display: flex;
      align-items: center;
      gap: 0;
      width: 100%;
      max-width: 320px;
      justify-content: center;
    }

    .progress-step {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-200);
      flex-shrink: 0;
      transition: all 0.3s ease;

      &.completed {
        background: var(--ion-color-success);
      }

      &.bonus {
        border: 2px solid #ffd700;
        background: var(--ion-color-step-200);

        &.completed {
          background: #ffd700;
        }
      }
    }

    .step-label {
      font-size: 10px;
      font-weight: 800;
      color: var(--ion-text-color);
    }

    .progress-step.completed .step-label {
      color: #fff;
    }

    .progress-step.bonus.completed .step-label {
      color: #333;
    }

    .progress-line {
      flex: 1;
      height: 3px;
      background: var(--ion-color-step-200);
      min-width: 8px;
      transition: background 0.3s ease;

      &.filled {
        background: var(--ion-color-success);
      }
    }

    /* Reward display */
    .reward-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      border-radius: 20px;
      background: rgba(var(--ion-color-primary-rgb), 0.08);

      ion-icon {
        font-size: 32px;
        color: var(--ion-color-warning);
      }

      &.gold {
        background: linear-gradient(135deg, rgba(245, 166, 35, 0.12), rgba(255, 215, 0, 0.12));
        border: 1px solid rgba(255, 215, 0, 0.3);
      }
    }

    .reward-amount {
      font-size: 36px;
      font-weight: 800;
      color: var(--ion-text-color);
    }

    .reward-display.gold .reward-amount {
      background: linear-gradient(135deg, #f5a623, #ffd700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Claim button */
    .claim-btn {
      width: 100%;
      max-width: 280px;
      --border-radius: 16px;
      font-weight: 700;
      font-size: 16px;
      margin-top: 8px;
    }

    /* Claimed state */
    .claimed-state {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ion-color-success);
      font-size: 18px;
      font-weight: 700;
    }

    .claimed-icon {
      font-size: 24px;
    }

    .keep-it-up {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0;
    }
  `,
})
export class DailyRewardSheetComponent {
  streakDays = input.required<number>();
  rewardAmount = input.required<number>();
  isDay7Bonus = input.required<boolean>();
  claimable = input.required<boolean>();

  claimSuccess = output<{ earned: number; streakDays: number }>();

  claiming = signal(false);
  claimed = signal(false);

  days = [1, 2, 3, 4, 5, 6, 7];

  private tokenService = inject(TokenService);

  constructor() {
    addIcons({ flameOutline, checkmarkCircle });
    // Sync claimed state from parent's claimable input
    effect(() => {
      this.claimed.set(!this.claimable());
    });
  }

  async claim(): Promise<void> {
    this.claiming.set(true);
    try {
      const result = await this.tokenService.earnDailyLogin();
      if (result.earned > 0) {
        this.claimed.set(true);
        this.claimSuccess.emit({
          earned: result.earned,
          streakDays: result.streakDays ?? this.streakDays() + 1,
        });
      }
    } finally {
      this.claiming.set(false);
    }
  }
}
