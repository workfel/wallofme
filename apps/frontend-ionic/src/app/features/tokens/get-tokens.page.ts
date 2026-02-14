import { Component, inject, signal, computed, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
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
  ToastController,
  ViewDidEnter,
} from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import {
  flameOutline,
  videocamOutline,
  calendarOutline,
  cartOutline,
  chevronBackOutline,
  timerOutline,
  phonePortraitOutline,
  starOutline,
  arrowForwardOutline,
  giftOutline,
} from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TokenService } from '@app/core/services/token.service';
import { AdService } from '@app/core/services/ad.service';
import { PurchaseService, type TokenPackOffering } from '@app/core/services/purchase.service';
import { AuthService } from '@app/core/services/auth.service';
import { UserService } from '@app/core/services/user.service';

interface TokenPack {
  id: string;
  nameKey: string;
  tokens: number;
  bonusPercent: number;
  productId: string;
  badge?: 'popular' | 'best-value';
}

const TOKEN_PACKS: TokenPack[] = [
  { id: 'starter', nameKey: 'tokens.starter', tokens: 100, bonusPercent: 0, productId: 'wallofme_tokens_100' },
  { id: 'popular', nameKey: 'tokens.popular', tokens: 550, bonusPercent: 10, productId: 'wallofme_tokens_550', badge: 'popular' },
  { id: 'best-value', nameKey: 'tokens.bestValue', tokens: 1200, bonusPercent: 20, productId: 'wallofme_tokens_1200' },
  { id: 'pro', nameKey: 'tokens.pro', tokens: 2600, bonusPercent: 30, productId: 'wallofme_tokens_2600' },
  { id: 'ultimate', nameKey: 'tokens.ultimate', tokens: 7000, bonusPercent: 40, productId: 'wallofme_tokens_7000', badge: 'best-value' },
];

const STARTER_PACK_KEY = 'wallofme_starter_pack_first_seen';

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
      <!-- Balance Hero -->
      <div class="balance-card">
        <span class="balance-label">{{ 'tokens.balance' | translate }}</span>
        <div class="balance-value">
          <ion-icon name="flame-outline" color="warning" />
          <span>{{ tokenService.balance() }}</span>
        </div>
        <span class="balance-unit">{{ 'tokens.flames' | translate }}</span>
      </div>

      <!-- Starter Pack (one-time offer) -->
      @if (starterPackAvailable()) {
        <div class="starter-pack-card">
          <div class="starter-pack-header">
            <ion-icon name="gift-outline" />
            <span class="starter-pack-title">{{ 'tokens.starterPack' | translate }}</span>
          </div>
          <p class="starter-pack-desc">{{ 'tokens.starterPackDesc' | translate }}</p>
          @if (starterPackExpiry()) {
            <span class="starter-pack-timer">
              {{ 'tokens.starterPackExpires' | translate: starterPackExpiry()! }}
            </span>
          }
          <ion-button
            expand="block"
            color="warning"
            [disabled]="starterPackLoading()"
            (click)="buyStarterPack()"
          >
            @if (starterPackLoading()) {
              <ion-spinner name="crescent" />
            } @else {
              {{ 'tokens.starterPackCta' | translate }} — €1.99
            }
          </ion-button>
        </div>
      }

      <!-- Free Tokens Section -->
      <h2 class="section-title">{{ 'tokens.freeTokens' | translate }}</h2>

      <ion-list [inset]="true">
        <!-- Daily Streak -->
        <ion-item>
          <ion-icon name="calendar-outline" slot="start" color="success" />
          <ion-label>
            <h3>{{ 'tokens.streak' | translate }}</h3>
            <div class="streak-dots">
              @for (day of streakDays; track day) {
                <div
                  class="streak-dot"
                  [class.filled]="day <= currentStreak()"
                  [class.bonus]="day === 7"
                >
                  @if (day === 7) {
                    <span class="streak-dot-label">x5</span>
                  }
                </div>
              }
            </div>
            <p class="streak-info">
              {{ 'tokens.streakDay' | translate: { current: currentStreak() } }}
              @if (currentStreak() >= 6) {
                — {{ 'tokens.streakBonus' | translate }}
              }
            </p>
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

        <!-- Watch Ad -->
        <ion-item>
          <ion-icon name="videocam-outline" slot="start" color="primary" />
          <ion-label>
            <h3>{{ 'tokens.watchAd' | translate }}</h3>
            @if (!isNativePlatform()) {
              <p class="web-only-message">
                <ion-icon name="phone-portrait-outline" />
                {{ 'tokens.watchAdWebOnly' | translate }}
              </p>
            } @else if (videoCooldownMinutes() > 0) {
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
              [disabled]="!isNativePlatform() || videoLoading() || adService.loading()"
              (click)="watchAd()"
            >
              @if (videoLoading() || adService.loading()) {
                <ion-spinner name="crescent" />
              } @else {
                +5
              }
            </ion-button>
          }
        </ion-item>
      </ion-list>

      <!-- Buy Tokens Section -->
      <h2 class="section-title">{{ 'tokens.buyTokens' | translate }}</h2>

      <div class="packs-grid">
        @for (pack of packs; track pack.id) {
          <button
            class="pack-card"
            [class.highlighted]="pack.badge === 'popular'"
            [disabled]="purchaseService.purchasing()"
            (click)="buyPack(pack)"
          >
            @if (pack.badge === 'popular') {
              <ion-badge color="primary" class="pack-badge">
                {{ 'tokens.mostPopular' | translate }}
              </ion-badge>
            }
            @if (pack.badge === 'best-value') {
              <ion-badge color="success" class="pack-badge">
                {{ 'tokens.bestValue' | translate }}
              </ion-badge>
            }
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
            @if (isWebPlatform() && pack.bonusPercent > 0) {
              <ion-badge color="tertiary" class="web-bonus-badge">
                {{ 'tokens.webBonus' | translate }}
              </ion-badge>
            }
            <span class="pack-price">{{ getPackPrice(pack) }}</span>
          </button>
        }
      </div>

      <!-- Pro Card (non-Pro users only) -->
      @if (!isPro()) {
        <div class="pro-card" (click)="goToPro()">
          <div class="pro-card-content">
            <ion-icon name="star-outline" color="warning" />
            <span class="pro-card-text">{{ 'tokens.proCard' | translate }}</span>
          </div>
          <ion-button fill="solid" color="warning" size="small">
            {{ 'tokens.subscribeCta' | translate }}
            <ion-icon slot="end" name="arrow-forward-outline" />
          </ion-button>
        </div>
      }
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

    /* Starter Pack */
    .starter-pack-card {
      background: linear-gradient(135deg, #f5a623 0%, #ffd700 100%);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      color: #fff;
    }

    .starter-pack-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      ion-icon {
        font-size: 24px;
      }
    }

    .starter-pack-title {
      font-size: 18px;
      font-weight: 800;
    }

    .starter-pack-desc {
      font-size: 14px;
      margin: 0 0 8px;
      opacity: 0.9;
    }

    .starter-pack-timer {
      display: block;
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 12px;
    }

    .starter-pack-card ion-button {
      --color: #333;
      font-weight: 700;
    }

    /* Section */
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 24px 0 8px;
      padding: 0 4px;
    }

    /* Streak */
    .streak-dots {
      display: flex;
      gap: 6px;
      margin: 8px 0 4px;
    }

    .streak-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--ion-color-step-200);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s;

      &.filled {
        background: var(--ion-color-success);
      }

      &.bonus {
        background: var(--ion-color-step-200);
        border: 2px solid #ffd700;

        &.filled {
          background: #ffd700;
        }
      }
    }

    .streak-dot-label {
      font-size: 8px;
      font-weight: 800;
      color: #333;
    }

    .streak-info {
      font-size: 12px;
      color: var(--ion-color-medium);
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

    .web-only-message {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-warning);
      font-size: 12px;

      ion-icon {
        font-size: 14px;
      }
    }

    /* Packs Grid */
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
      position: relative;
      overflow: visible;

      &:active {
        border-color: var(--ion-color-primary);
      }

      &:disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      &.highlighted {
        border-color: var(--ion-color-primary);
      }
    }

    .pack-badge {
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8px;
      font-weight: 700;
      white-space: nowrap;
      z-index: 1;
    }

    .web-bonus-badge {
      font-size: 8px;
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

    /* Pro Card */
    .pro-card {
      margin-top: 24px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(245, 166, 35, 0.08) 0%, rgba(255, 215, 0, 0.08) 100%);
      border: 1px solid rgba(245, 166, 35, 0.2);
      border-radius: 16px;
      cursor: pointer;
    }

    .pro-card-content {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      ion-icon {
        font-size: 24px;
        flex-shrink: 0;
      }
    }

    .pro-card-text {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
    }

    .pro-card ion-button {
      font-weight: 700;
    }
  `,
})
export class GetTokensPage implements OnInit, OnDestroy, ViewDidEnter {
  tokenService = inject(TokenService);
  adService = inject(AdService);
  purchaseService = inject(PurchaseService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toastCtrl = inject(ToastController);
  private translate = inject(TranslateService);
  private router = inject(Router);

  packs = TOKEN_PACKS;
  streakDays = [1, 2, 3, 4, 5, 6, 7];

  videoLoading = signal(false);
  dailyLoading = signal(false);
  dailyClaimed = signal(false);
  videoCooldownMinutes = signal(0);
  starterPackAvailable = signal(false);
  starterPackLoading = signal(false);
  currentStreak = signal(0);

  isNativePlatform = computed(() => {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android';
  });

  isWebPlatform = computed(() => Capacitor.getPlatform() === 'web');

  isPro = computed(() => this.authService.user()?.isPro ?? false);

  starterPackExpiry = computed<{ days: number; hours: number } | null>(() => {
    const firstSeen = localStorage.getItem(STARTER_PACK_KEY);
    if (!firstSeen) return null;
    const expiresAt = new Date(firstSeen).getTime() + 7 * 24 * 60 * 60 * 1000;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return null;
    return {
      days: Math.floor(remaining / (24 * 60 * 60 * 1000)),
      hours: Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
    };
  });

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  private readonly fallbackPrices: Record<string, string> = {
    wallofme_tokens_100: '€0.99',
    wallofme_tokens_550: '€4.99',
    wallofme_tokens_1200: '€9.99',
    wallofme_tokens_2600: '€19.99',
    wallofme_tokens_7000: '€49.99',
  };

  constructor() {
    addIcons({
      flameOutline,
      videocamOutline,
      calendarOutline,
      cartOutline,
      chevronBackOutline,
      timerOutline,
      phonePortraitOutline,
      starOutline,
      arrowForwardOutline,
      giftOutline,
    });
  }

  ngOnInit(): void {
    this.tokenService.fetchBalance();
    this.purchaseService.fetchOfferings();
    this.checkDailyStatus();
    this.checkVideoCooldown();
    this.checkStarterPack();
    this.userService.fetchProfile().then(() => this.loadStreak());
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  ionViewDidEnter(): void {
    this.tokenService.fetchBalance();
  }

  private async checkStarterPack(): Promise<void> {
    try {
      const res = await this.tokenService.fetchStarterPackStatus();
      if (res) {
        // Record first-seen date for countdown
        if (!localStorage.getItem(STARTER_PACK_KEY)) {
          localStorage.setItem(STARTER_PACK_KEY, new Date().toISOString());
        }
        // Check if expired (7 days)
        const firstSeen = localStorage.getItem(STARTER_PACK_KEY)!;
        const expiresAt = new Date(firstSeen).getTime() + 7 * 24 * 60 * 60 * 1000;
        this.starterPackAvailable.set(Date.now() < expiresAt);
      } else {
        this.starterPackAvailable.set(false);
      }
    } catch {
      this.starterPackAvailable.set(false);
    }
  }

  private loadStreak(): void {
    const profile = this.userService.profile();
    if (profile) {
      this.currentStreak.set(profile.streakDays ?? 0);
    }
  }

  private async checkDailyStatus(): Promise<void> {
    const result = await this.tokenService.earnDailyLogin();
    if (result.blocked === 'already_claimed') {
      this.dailyClaimed.set(true);
    } else if (result.earned > 0) {
      this.dailyClaimed.set(true);
      await this.showToast(
        this.translate.instant('tokens.loginClaimed', { amount: result.earned }),
        'success',
      );
    }
  }

  private async checkVideoCooldown(): Promise<void> {
    const result = await this.tokenService.earnFromVideo();
    if (result.blocked === 'cooldown' && result.retryAfterSeconds) {
      this.startCooldownTimer(result.retryAfterSeconds);
    } else if (result.blocked === 'daily_limit') {
      this.videoCooldownMinutes.set(-1);
    } else if (result.earned > 0) {
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
      (o) => o.productId === pack.productId,
    );
    return offering?.localizedPrice ?? this.fallbackPrices[pack.productId] ?? '';
  }

  async watchAd(): Promise<void> {
    this.videoLoading.set(true);
    try {
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
        this.currentStreak.update((s) => s + 1);
        await this.showToast(
          this.translate.instant('tokens.loginClaimed', { amount: result.earned }),
          'success',
        );
      } else {
        this.dailyClaimed.set(true);
      }
    } finally {
      this.dailyLoading.set(false);
    }
  }

  async buyPack(pack: TokenPack): Promise<void> {
    const offering: TokenPackOffering | undefined = this.purchaseService.offerings().find(
      (o) => o.productId === pack.productId,
    );

    if (!offering) {
      await this.showToast(
        this.translate.instant('tokens.purchaseUnavailable'),
        'warning',
      );
      return;
    }

    const result = await this.purchaseService.purchasePackage(offering);

    if (result.success) {
      await this.showToast(
        this.translate.instant('tokens.purchaseSuccess', { amount: result.tokens }),
        'success',
      );
    }
  }

  async buyStarterPack(): Promise<void> {
    this.starterPackLoading.set(true);
    try {
      await this.tokenService.purchaseStarterPack();
      this.starterPackAvailable.set(false);
      await this.showToast(
        this.translate.instant('tokens.purchaseSuccess', { amount: 300 }),
        'success',
      );
    } catch {
      await this.showToast(
        this.translate.instant('tokens.purchaseUnavailable'),
        'warning',
      );
    } finally {
      this.starterPackLoading.set(false);
    }
  }

  goToPro(): void {
    this.router.navigate(['/pro']);
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
