import { Component, inject, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  IonButton,
  IonIcon,
  IonAvatar,
  IonSpinner,
  IonText,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  copyOutline,
  shareOutline,
  checkmarkOutline,
  peopleOutline,
  flameOutline,
} from "ionicons/icons";

import { environment } from "@env/environment";
import { ReferralService } from "@app/core/services/referral.service";

@Component({
  selector: "app-referral-card",
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    IonButton,
    IonIcon,
    IonAvatar,
    IonSpinner,
    IonText,
  ],
  template: `
    @if (referralService.info(); as info) {
      <div class="referral-card">
        <div class="card-header">
          <ion-icon name="people-outline" class="header-icon" />
          <div class="header-text">
            <h3>{{ "referral.title" | translate }}</h3>
            <p>{{ "referral.subtitle" | translate }}</p>
          </div>
        </div>

        @if (info.referralCode) {
          <!-- Code display -->
          <div class="code-row">
            <span class="code-value">{{ info.referralCode }}</span>
            <button class="copy-btn" (click)="copyCode()">
              <ion-icon
                [name]="copied() ? 'checkmark-outline' : 'copy-outline'"
              />
            </button>
          </div>

          <!-- Progress bar -->
          <div class="progress-section">
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="progressPercent()"
              ></div>
            </div>
            <span class="progress-label">
              {{ info.referralCount }}/{{ info.maxReferrals }}
              {{ "referral.friendsInvited" | translate }}
            </span>
          </div>

          @if (info.totalEarned > 0) {
            <div class="earned-row">
              <ion-icon name="flame-outline" color="warning" />
              <span>
                {{ info.totalEarned }}
                {{ "referral.totalEarned" | translate }}
              </span>
            </div>
          }

          <!-- Referral list -->
          @if (info.referrals.length > 0) {
            <div class="referral-list">
              @for (ref of info.referrals; track ref.id) {
                <div class="referral-item">
                  <ion-avatar class="referral-avatar">
                    @if (ref.image) {
                      <img [src]="ref.image" [alt]="ref.firstName ?? ''" />
                    } @else {
                      <div class="avatar-fallback">
                        {{ (ref.firstName ?? "?")[0] }}
                      </div>
                    }
                  </ion-avatar>
                  <span class="referral-name">{{ ref.firstName }}</span>
                  <span
                    class="referral-status"
                    [class.rewarded]="ref.status === 'rewarded'"
                  >
                    {{
                      ref.status === "rewarded"
                        ? ("referral.rewarded" | translate)
                        : ("referral.pending" | translate)
                    }}
                  </span>
                </div>
              }
            </div>
          }

          <!-- Share button -->
          @if (info.referralCount < info.maxReferrals) {
            <ion-button
              expand="block"
              fill="outline"
              (click)="onShare()"
              class="share-btn"
            >
              <ion-icon slot="start" name="share-outline" />
              {{ "referral.inviteButton" | translate }}
            </ion-button>
          } @else {
            <ion-text color="medium" class="limit-text">
              <p>{{ "referral.limitReached" | translate }}</p>
            </ion-text>
          }
        } @else {
          <!-- Code is being generated -->
          <div class="generating-state">
            <ion-spinner name="crescent" />
            <span>{{ "referral.generating" | translate }}</span>
          </div>
        }
      </div>
    } @else if (referralService.loading()) {
      <div class="loading-state">
        <ion-spinner name="crescent" />
      </div>
    }
  `,
  styles: `
    .referral-card {
      margin: 0 16px 20px;
      padding: 20px;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 24px;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .header-icon {
      font-size: 28px;
      color: var(--ion-color-primary);
      flex-shrink: 0;
    }

    .header-text {
      h3 {
        font-size: 17px;
        font-weight: 700;
        margin: 0;
        color: var(--ion-text-color);
      }
      p {
        font-size: 13px;
        color: var(--ion-color-step-500);
        margin: 2px 0 0;
      }
    }

    .code-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(var(--ion-color-primary-rgb), 0.08);
      border-radius: 14px;
      margin-bottom: 14px;
    }

    .code-value {
      flex: 1;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--ion-color-primary);
    }

    .copy-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(var(--ion-color-primary-rgb), 0.12);
      color: var(--ion-color-primary);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.15s;

      &:active {
        transform: scale(0.9);
      }

      ion-icon {
        font-size: 18px;
      }
    }

    .progress-section {
      margin-bottom: 12px;
    }

    .progress-bar {
      height: 6px;
      border-radius: 3px;
      background: var(--ion-color-step-200);
      overflow: hidden;
      margin-bottom: 6px;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(
        90deg,
        var(--ion-color-primary),
        var(--ion-color-primary-tint)
      );
      transition: width 0.4s ease;
    }

    .progress-label {
      font-size: 12px;
      color: var(--ion-color-step-500);
      font-weight: 600;
    }

    .earned-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 700;
      color: var(--wom-gold-text);
      margin-bottom: 14px;

      ion-icon {
        font-size: 18px;
      }
    }

    .referral-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
    }

    .referral-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .referral-avatar {
      width: 32px;
      height: 32px;
    }

    .avatar-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      border-radius: 50%;
      font-size: 14px;
      font-weight: 700;
      color: var(--ion-color-primary);
      text-transform: uppercase;
    }

    .referral-name {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
    }

    .referral-status {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 10px;
      background: var(--ion-color-step-100);
      color: var(--ion-color-step-600);

      &.rewarded {
        background: rgba(var(--ion-color-success-rgb), 0.12);
        color: var(--ion-color-success);
      }
    }

    .share-btn {
      margin-top: 4px;
      --border-radius: 14px;
    }

    .limit-text {
      text-align: center;
      p {
        font-size: 13px;
        margin: 4px 0 0;
      }
    }

    .generating-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px;
      color: var(--ion-color-step-500);
      font-size: 14px;
      font-weight: 600;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 24px;
    }
  `,
})
export class ReferralCardComponent implements OnInit {
  referralService = inject(ReferralService);

  copied = signal(false);

  progressPercent = computed(() => {
    const info = this.referralService.info();
    if (!info) return 0;
    return Math.min(100, (info.referralCount / info.maxReferrals) * 100);
  });

  constructor() {
    addIcons({
      copyOutline,
      shareOutline,
      checkmarkOutline,
      peopleOutline,
      flameOutline,
    });
  }

  ngOnInit(): void {
    // Only fetch if not already loaded with a valid code
    // (profile page's ionViewWillEnter handles re-fetches on tab re-entry)
    if (!this.referralService.info()?.referralCode) {
      this.referralService.fetchReferralInfo();
    }
  }

  async copyCode(): Promise<void> {
    const code = this.referralService.info()?.referralCode;
    if (!code) return;

    const url = `${environment.appUrl}/invite/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Ignore
    }
  }

  onShare(): void {
    this.referralService.shareReferralLink();
  }
}
