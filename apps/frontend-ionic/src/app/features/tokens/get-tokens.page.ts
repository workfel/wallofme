import { Component, inject, signal, computed, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
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
  arrowBackOutline,
  timerOutline,
  phonePortraitOutline,
  starOutline,
  arrowForwardOutline,
  giftOutline,
  peopleOutline,
} from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TokenService } from '@app/core/services/token.service';
import { AdService } from '@app/core/services/ad.service';
import { PurchaseService, type TokenPackOffering } from '@app/core/services/purchase.service';
import { AuthService } from '@app/core/services/auth.service';
import { ReferralService } from '@app/core/services/referral.service';
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
    IonContent,
    IonIcon,
    IonBadge,
    IonSpinner,
    TranslateModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="true">
      <!-- Banner with balance -->
      <div class="banner">
        <div class="floating-toolbar">
          <button class="toolbar-pill" (click)="goBack()">
            <ion-icon name="arrow-back-outline" />
          </button>
          <div class="toolbar-spacer"></div>
        </div>

        <!-- Balance centered in banner -->
        <div class="balance-hero">
          <span class="balance-label">{{ 'tokens.balance' | translate }}</span>
          <div class="balance-value">
            <ion-icon name="flame-outline" />
            <span>{{ tokenService.balance() }}</span>
          </div>
          <span class="balance-unit">{{ 'tokens.flames' | translate }}</span>
        </div>
      </div>

      <!-- Card body -->
      <div class="card-body">
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
            <button
              class="action-btn gold"
              [disabled]="starterPackLoading()"
              (click)="buyStarterPack()"
            >
              @if (starterPackLoading()) {
                <ion-spinner name="crescent" />
              } @else {
                {{ 'tokens.starterPackCta' | translate }} — €1.99
              }
            </button>
          </div>
        }

        <!-- Free Tokens Section -->
        <h2 class="section-title">{{ 'tokens.freeTokens' | translate }}</h2>

        <!-- Daily Streak -->
        <div class="free-card">
          <div class="free-card-row">
            <div class="free-card-icon success">
              <ion-icon name="calendar-outline" />
            </div>
            <div class="free-card-content">
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
            </div>
            <div class="free-card-action">
              @if (dailyClaimed()) {
                <ion-badge color="medium">{{ 'tokens.claimed' | translate }}</ion-badge>
              } @else {
                <ion-badge color="success">{{ 'tokens.claimAvailable' | translate }}</ion-badge>
              }
            </div>
          </div>
        </div>

        <!-- Watch Ad -->
        <div class="free-card">
          <div class="free-card-row">
            <div class="free-card-icon primary">
              <ion-icon name="videocam-outline" />
            </div>
            <div class="free-card-content">
              <h3>{{ 'tokens.watchAd' | translate }}</h3>
              @if (!isNativePlatform()) {
                <p class="web-only-hint">
                  <ion-icon name="phone-portrait-outline" />
                  {{ 'tokens.watchAdWebOnly' | translate }}
                </p>
              } @else if (videoCooldownMinutes() > 0) {
                <p class="cooldown-hint">
                  <ion-icon name="timer-outline" />
                  {{ 'tokens.cooldown' | translate: { minutes: videoCooldownMinutes() } }}
                </p>
              } @else {
                <p>{{ 'tokens.watchAdDesc' | translate }}</p>
              }
            </div>
            <div class="free-card-action">
              @if (videoCooldownMinutes() > 0) {
                <ion-badge color="medium">{{ videoCooldownMinutes() }} min</ion-badge>
              } @else {
                <button
                  class="earn-btn"
                  [disabled]="!isNativePlatform() || videoLoading() || adService.loading()"
                  (click)="watchAd()"
                >
                  @if (videoLoading() || adService.loading()) {
                    <ion-spinner name="crescent" />
                  } @else {
                    +5
                  }
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Refer & Earn Section -->
        <h2 class="section-title">{{ 'referral.earnSection' | translate }}</h2>
        <div class="referral-earn-card" (click)="goToReferral()">
          <div class="referral-earn-left">
            <div class="free-card-icon primary">
              <ion-icon name="people-outline" />
            </div>
            <div class="referral-earn-text">
              <h3>{{ 'referral.settingsEntry' | translate }}</h3>
              <p>{{ 'referral.earnDesc' | translate }}</p>
            </div>
          </div>
          <ion-badge color="warning" class="referral-earn-badge">+500</ion-badge>
        </div>

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
                <ion-icon name="flame-outline" />
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
              <ion-icon name="star-outline" />
              <span class="pro-card-text">{{ 'tokens.proCard' | translate }}</span>
            </div>
            <button class="action-btn gold small">
              {{ 'tokens.subscribeCta' | translate }}
              <ion-icon name="arrow-forward-outline" />
            </button>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: `
    :host {
      --toolbar-top: var(--ion-safe-area-top, 20px);
      --banner-height: 200px;
    }

    /* ── Banner ─────────────────────────────── */
    .banner {
      position: relative;
      height: var(--banner-height);
      background: linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%);
      overflow: hidden;
      border-bottom-left-radius: 40px;
      border-bottom-right-radius: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      margin-bottom: 20px;

      &::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(
            circle at 20% 80%,
            rgba(255, 215, 0, 0.12) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at 80% 20%,
            rgba(255, 255, 255, 0.05) 0%,
            transparent 40%
          );
      }
    }

    .floating-toolbar {
      position: absolute;
      top: calc(var(--toolbar-top) + 8px);
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }

    .toolbar-pill {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #fff;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-family: inherit;
      transition: transform 0.18s ease;

      &:active {
        transform: scale(0.9);
        background: rgba(0, 0, 0, 0.6);
      }

      ion-icon {
        font-size: 22px;
      }
    }

    .toolbar-spacer {
      width: 44px;
    }

    /* ── Balance hero (inside banner) ──────── */
    .balance-hero {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: calc(var(--toolbar-top) + 20px);
      z-index: 5;
    }

    .balance-label {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .balance-value {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 52px;
      font-weight: 800;
      color: #fff;
      line-height: 1;
      margin: 8px 0 4px;
      letter-spacing: -0.03em;

      ion-icon {
        font-size: 38px;
        color: #ffd700;
      }
    }

    .balance-unit {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
    }

    /* ── Card body ───────────────────────────── */
    .card-body {
      position: relative;
      margin: -60px 0px 0px;
      padding: 24px 16px 40px;
      min-height: 200px;
      background: var(--wom-glass-bg);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 32px;
    }

    /* ── Starter pack ──────────────────────── */
    .starter-pack-card {
      background: linear-gradient(135deg, #f5a623 0%, #ffd700 100%);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 24px;
      color: #1a1a1a;
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
      opacity: 0.8;
    }

    .starter-pack-timer {
      display: block;
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: 12px;
    }

    /* ── Section title ─────────────────────── */
    .section-title {
      font-size: 16px;
      font-weight: 800;
      margin: 24px 0 12px;
      letter-spacing: -0.01em;
      color: var(--ion-text-color);
    }

    .section-title:first-child {
      margin-top: 0;
    }

    /* ── Free token cards ──────────────────── */
    .free-card {
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 18px;
      padding: 16px;
      margin-bottom: 10px;
    }

    .free-card-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .free-card-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      ion-icon {
        font-size: 22px;
        color: #fff;
      }

      &.success {
        background: linear-gradient(135deg, var(--ion-color-success), var(--ion-color-success-shade));
      }

      &.primary {
        background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
      }
    }

    .free-card-content {
      flex: 1;
      min-width: 0;

      h3 {
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 4px;
        color: var(--ion-text-color);
      }

      p {
        font-size: 12px;
        color: var(--ion-color-step-500);
        margin: 0;
      }
    }

    .free-card-action {
      flex-shrink: 0;
    }

    .earn-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      height: 36px;
      padding: 0 14px;
      border-radius: 100px;
      font-size: 15px;
      font-weight: 800;
      font-family: inherit;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      border: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.15s ease;

      &:active {
        transform: scale(0.94);
      }

      &:disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      ion-spinner {
        width: 18px;
        height: 18px;
      }
    }

    /* ── Streak dots ───────────────────────── */
    .streak-dots {
      display: flex;
      gap: 5px;
      margin: 6px 0 4px;
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
      font-size: 11px;
      color: var(--ion-color-step-500);
    }

    .cooldown-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-medium);
      font-size: 12px;

      ion-icon {
        font-size: 14px;
      }
    }

    .web-only-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-warning);
      font-size: 12px;

      ion-icon {
        font-size: 14px;
      }
    }

    /* ── Referral earn card ─────────────────── */
    .referral-earn-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 18px;
      cursor: pointer;
      transition: transform 0.15s ease;
      margin-bottom: 8px;

      &:active {
        transform: scale(0.98);
      }
    }

    .referral-earn-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .referral-earn-text {
      h3 {
        font-size: 15px;
        font-weight: 700;
        margin: 0;
        color: var(--ion-text-color);
      }

      p {
        font-size: 12px;
        color: var(--ion-color-step-500);
        margin: 2px 0 0;
      }
    }

    .referral-earn-badge {
      font-size: 14px;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 12px;
    }

    /* ── Packs grid ────────────────────────── */
    .packs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .pack-card {
      background: var(--wom-glass-bg-medium);
      border: 2px solid var(--wom-glass-border-strong);
      border-radius: 18px;
      padding: 18px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      position: relative;
      overflow: visible;
      font-family: inherit;
      transition:
        transform 0.15s ease,
        border-color 0.2s ease;

      &:active {
        transform: scale(0.97);
        border-color: var(--ion-color-primary);
      }

      &:disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      &.highlighted {
        border-color: var(--ion-color-primary);
        background: rgba(var(--ion-color-primary-rgb), 0.06);
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
      border-radius: 100px;
      padding: 3px 10px;
    }

    .web-bonus-badge {
      font-size: 8px;
    }

    .pack-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-step-600);
    }

    .pack-tokens {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 26px;
      font-weight: 800;
      color: var(--ion-text-color);
      letter-spacing: -0.02em;

      ion-icon {
        font-size: 20px;
        color: #ffd700;
      }
    }

    .pack-price {
      font-size: 16px;
      font-weight: 700;
      color: var(--ion-color-primary);
      margin-top: 2px;
    }

    ion-badge {
      font-size: 10px;
    }

    /* ── Pro card ───────────────────────────── */
    .pro-card {
      margin-top: 24px;
      padding: 18px;
      background: var(--wom-gold-bg);
      border: 1px solid var(--wom-gold-border);
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(255, 200, 0, 0.1);
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }

    .pro-card-content {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;

      ion-icon {
        font-size: 24px;
        color: #f5a623;
        flex-shrink: 0;
      }
    }

    .pro-card-text {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--wom-gold-text);
    }

    /* ── Action buttons ────────────────────── */
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      border-radius: 100px;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      border: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.15s ease;

      &:active {
        transform: scale(0.97);
      }

      &:disabled {
        opacity: 0.6;
        pointer-events: none;
      }

      ion-spinner {
        width: 20px;
        height: 20px;
      }
    }

    .action-btn.gold {
      background: rgba(255, 255, 255, 0.9);
      color: #1a1a1a;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .action-btn.gold.small {
      width: auto;
      padding: 10px 20px;
      font-size: 13px;
      background: linear-gradient(135deg, #f5a623, #ffd700);
      color: #1a1a1a;

      ion-icon {
        font-size: 16px;
      }
    }
  `,
})
export class GetTokensPage implements OnInit, OnDestroy, ViewDidEnter {
  tokenService = inject(TokenService);
  adService = inject(AdService);
  purchaseService = inject(PurchaseService);
  private authService = inject(AuthService);
  private referralService = inject(ReferralService);
  private userService = inject(UserService);
  private toastCtrl = inject(ToastController);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private location = inject(Location);

  packs = TOKEN_PACKS;
  streakDays = [1, 2, 3, 4, 5, 6, 7];

  videoLoading = signal(false);
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
      arrowBackOutline,
      timerOutline,
      phonePortraitOutline,
      starOutline,
      arrowForwardOutline,
      giftOutline,
      peopleOutline,
    });
  }

  ngOnInit(): void {
    this.tokenService.fetchBalance();
    this.purchaseService.fetchOfferings();
    this.checkDailyStatusReadOnly();
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

  goBack(): void {
    this.location.back();
  }

  private async checkStarterPack(): Promise<void> {
    try {
      const res = await this.tokenService.fetchStarterPackStatus();
      if (res) {
        if (!localStorage.getItem(STARTER_PACK_KEY)) {
          localStorage.setItem(STARTER_PACK_KEY, new Date().toISOString());
        }
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

  private async checkDailyStatusReadOnly(): Promise<void> {
    const status = await this.tokenService.fetchDailyStatus();
    if (status) {
      this.dailyClaimed.set(!status.claimable);
      this.currentStreak.set(status.streakDays);
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

  goToReferral(): void {
    this.router.navigate(['/tabs/profile']);
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
