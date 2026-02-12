import { Component, inject, signal, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonText,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flameOutline,
  videocamOutline,
  calendarOutline,
  cartOutline,
  chevronBackOutline,
  timerOutline,
} from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TokenService } from '@app/core/services/token.service';
import { AdService } from '@app/core/services/ad.service';
import { PurchaseService } from '@app/core/services/purchase.service';

interface TokenPack {
  id: string;
  nameKey: string;
  tokens: number;
  bonusPercent: number;
  productId: string;
}

const TOKEN_PACKS: TokenPack[] = [
  { id: 'starter', nameKey: 'tokens.starter', tokens: 100, bonusPercent: 0, productId: 'wallofme_tokens_100' },
  { id: 'popular', nameKey: 'tokens.popular', tokens: 550, bonusPercent: 10, productId: 'wallofme_tokens_550' },
  { id: 'best-value', nameKey: 'tokens.bestValue', tokens: 1200, bonusPercent: 20, productId: 'wallofme_tokens_1200' },
  { id: 'pro', nameKey: 'tokens.pro', tokens: 2600, bonusPercent: 30, productId: 'wallofme_tokens_2600' },
  { id: 'ultimate', nameKey: 'tokens.ultimate', tokens: 7000, bonusPercent: 40, productId: 'wallofme_tokens_7000' },
];

@Component({
  selector: 'app-get-tokens',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonText,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" />
        </ion-buttons>
        <ion-title>{{ 'tokens.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Balance -->
      <div class="balance-card">
        <span class="balance-label">{{ 'tokens.balance' | translate }}</span>
        <div class="balance-value">
          <ion-icon name="flame-outline" color="warning" />
          <span>{{ tokenService.balance() }}</span>
        </div>
        <span class="balance-unit">{{ 'tokens.flames' | translate }}</span>
      </div>

      <!-- Free Tokens Section -->
      <h2 class="section-title">{{ 'tokens.freeTokens' | translate }}</h2>

      <ion-list [inset]="true">
        <!-- Watch Ad -->
        <ion-item>
          <ion-icon name="videocam-outline" slot="start" color="primary" />
          <ion-label>
            <h3>{{ 'tokens.watchAd' | translate }}</h3>
            @if (videoCooldownMinutes() > 0) {
              <p class="cooldown-text">
                <ion-icon name="timer-outline" />
                {{ 'tokens.cooldown' | translate: { minutes: videoCooldownMinutes() } }}
              </p>
            } @else {
              <p>{{ 'tokens.watchAdDesc' | translate }}</p>
            }
          </ion-label>
          @if (videoCooldownMinutes() > 0) {
            <ion-badge slot="end" color="medium">
              {{ videoCooldownMinutes() }} min
            </ion-badge>
          } @else {
            <ion-button
              slot="end"
              fill="solid"
              size="small"
              [disabled]="videoLoading() || adService.loading()"
              (click)="watchAd()"
            >
              @if (videoLoading() || adService.loading()) {
                <ion-spinner name="crescent" />
              } @else {
                +15
              }
            </ion-button>
          }
        </ion-item>

        <!-- Daily Login -->
        <ion-item>
          <ion-icon name="calendar-outline" slot="start" color="success" />
          <ion-label>
            <h3>{{ 'tokens.dailyLogin' | translate }}</h3>
            <p>{{ 'tokens.dailyLoginDesc' | translate }}</p>
          </ion-label>
          @if (dailyClaimed()) {
            <ion-badge slot="end" color="medium">
              {{ 'tokens.claimed' | translate }}
            </ion-badge>
          } @else {
            <ion-button
              slot="end"
              fill="solid"
              size="small"
              color="success"
              [disabled]="dailyLoading()"
              (click)="claimDaily()"
            >
              @if (dailyLoading()) {
                <ion-spinner name="crescent" />
              } @else {
                {{ 'tokens.claimNow' | translate }}
              }
            </ion-button>
          }
        </ion-item>
      </ion-list>

      <!-- Buy Tokens Section -->
      <h2 class="section-title">{{ 'tokens.buyTokens' | translate }}</h2>

      @if (!purchaseService.isAvailable()) {
        <ion-text color="medium">
          <p class="store-hint">{{ 'tokens.purchaseOnDevice' | translate }}</p>
        </ion-text>
      }

      <div class="packs-grid">
        @for (pack of packs; track pack.id) {
          <button
            class="pack-card"
            [disabled]="purchaseService.purchasing()"
            (click)="buyPack(pack)"
          >
            <span class="pack-name">{{ pack.nameKey | translate }}</span>
            <div class="pack-tokens">
              <ion-icon name="flame-outline" color="warning" />
              <span>{{ pack.tokens }}</span>
            </div>
            @if (pack.bonusPercent > 0) {
              <ion-badge color="success">
                {{ 'tokens.bonus' | translate: { percent: pack.bonusPercent } }}
              </ion-badge>
            }
            <span class="pack-price">{{ getPackPrice(pack) }}</span>
          </button>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .balance-card {
      background: var(--ion-color-primary);
      color: white;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
    }

    .balance-label {
      font-size: 14px;
      opacity: 0.8;
      display: block;
      margin-bottom: 8px;
    }

    .balance-value {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 48px;
      font-weight: 700;
      line-height: 1;

      ion-icon {
        font-size: 36px;
        color: #ffd700;
      }
    }

    .balance-unit {
      font-size: 14px;
      opacity: 0.7;
      display: block;
      margin-top: 4px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 24px 0 8px;
      padding: 0 4px;
    }

    .cooldown-text {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 14px;
      }
    }

    .store-hint {
      font-size: 13px;
      text-align: center;
      padding: 8px 0;
    }

    .packs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 4px;
    }

    .pack-card {
      background: var(--ion-card-background, var(--ion-background-color));
      border: 2px solid var(--ion-color-light-shade);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      transition: border-color 0.2s;

      &:active {
        border-color: var(--ion-color-primary);
      }

      &:disabled {
        opacity: 0.5;
        pointer-events: none;
      }
    }

    .pack-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .pack-tokens {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 24px;
      font-weight: 700;
      color: var(--ion-text-color);

      ion-icon {
        font-size: 20px;
      }
    }

    .pack-price {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-primary);
      margin-top: 4px;
    }

    ion-badge {
      font-size: 10px;
    }
  `,
})
export class GetTokensPage implements OnInit {
  tokenService = inject(TokenService);
  adService = inject(AdService);
  purchaseService = inject(PurchaseService);
  private toastCtrl = inject(ToastController);
  private translate = inject(TranslateService);

  packs = TOKEN_PACKS;

  videoLoading = signal(false);
  dailyLoading = signal(false);
  dailyClaimed = signal(false);
  /** Minutes remaining before next rewarded video is available */
  videoCooldownMinutes = signal(0);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  private readonly fallbackPrices: Record<string, string> = {
    wallofme_tokens_100: '$0.99',
    wallofme_tokens_550: '$4.99',
    wallofme_tokens_1200: '$9.99',
    wallofme_tokens_2600: '$19.99',
    wallofme_tokens_7000: '$49.99',
  };

  constructor() {
    addIcons({
      flameOutline,
      videocamOutline,
      calendarOutline,
      cartOutline,
      chevronBackOutline,
      timerOutline,
    });
  }

  ngOnInit(): void {
    this.tokenService.fetchBalance();
    this.purchaseService.fetchOfferings();
    this.checkDailyStatus();
    this.checkVideoCooldown();
  }

  /** Probe the daily-login endpoint to see if already claimed today */
  private async checkDailyStatus(): Promise<void> {
    const result = await this.tokenService.earnDailyLogin();
    if (result.blocked === 'already_claimed') {
      this.dailyClaimed.set(true);
    } else if (result.earned > 0) {
      // It wasn't claimed yet but now it is!
      this.dailyClaimed.set(true);
      await this.showToast(
        this.translate.instant('tokens.loginClaimed', { amount: result.earned }),
        'success',
      );
    }
  }

  /** Probe the video endpoint to check cooldown status */
  private async checkVideoCooldown(): Promise<void> {
    const result = await this.tokenService.earnFromVideo();
    if (result.blocked === 'cooldown' && result.retryAfterSeconds) {
      this.startCooldownTimer(result.retryAfterSeconds);
    } else if (result.blocked === 'daily_limit') {
      // Keep button hidden via high cooldown
      this.videoCooldownMinutes.set(-1);
    } else if (result.earned > 0) {
      // Oops — it actually earned, which means it was available. Show the reward.
      await this.showToast(
        this.translate.instant('tokens.adWatched', { amount: result.earned }),
        'success',
      );
    }
  }

  private startCooldownTimer(seconds: number): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);

    let remaining = seconds;
    this.videoCooldownMinutes.set(Math.ceil(remaining / 60));

    this.cooldownTimer = setInterval(() => {
      remaining -= 60;
      if (remaining <= 0) {
        this.videoCooldownMinutes.set(0);
        if (this.cooldownTimer) clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      } else {
        this.videoCooldownMinutes.set(Math.ceil(remaining / 60));
      }
    }, 60_000);
  }

  getPackPrice(pack: TokenPack): string {
    const offering = this.purchaseService.offerings().find(
      (o) => o.rcPackage.product.identifier === pack.productId,
    );
    return offering?.localizedPrice ?? this.fallbackPrices[pack.productId] ?? '';
  }

  async watchAd(): Promise<void> {
    this.videoLoading.set(true);
    try {
      // On native: show real ad first
      if (this.adService.isAvailable()) {
        const rewarded = await this.adService.showRewardedAd();
        if (!rewarded) return;
      }

      const result = await this.tokenService.earnFromVideo();
      if (result.earned > 0) {
        await this.showToast(
          this.translate.instant('tokens.adWatched', { amount: result.earned }),
          'success',
        );
      } else if (result.blocked === 'cooldown' && result.retryAfterSeconds) {
        this.startCooldownTimer(result.retryAfterSeconds);
        await this.showToast(
          this.translate.instant('tokens.cooldown', {
            minutes: Math.ceil(result.retryAfterSeconds / 60),
          }),
          'warning',
        );
      } else {
        await this.showToast(
          this.translate.instant('tokens.dailyLimitReached'),
          'warning',
        );
      }
    } finally {
      this.videoLoading.set(false);
    }
  }

  async claimDaily(): Promise<void> {
    this.dailyLoading.set(true);
    try {
      const result = await this.tokenService.earnDailyLogin();
      if (result.earned > 0) {
        this.dailyClaimed.set(true);
        await this.showToast(
          this.translate.instant('tokens.loginClaimed', { amount: result.earned }),
          'success',
        );
      } else {
        // Already claimed (429)
        this.dailyClaimed.set(true);
      }
    } finally {
      this.dailyLoading.set(false);
    }
  }

  async buyPack(pack: TokenPack): Promise<void> {
    const offering = this.purchaseService.offerings().find(
      (o) => o.rcPackage.product.identifier === pack.productId,
    );

    if (!offering) {
      await this.showToast(
        this.translate.instant('tokens.purchaseUnavailable'),
        'warning',
      );
      return;
    }

    const result = await this.purchaseService.purchasePackage(offering.rcPackage);

    if (result.success) {
      await this.showToast(
        this.translate.instant('tokens.purchaseSuccess', { amount: result.tokens }),
        'success',
      );
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
