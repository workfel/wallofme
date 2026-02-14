import { Component, inject, input, computed, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBadge,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, videocamOutline, flameOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
import { TokenService } from '@app/core/services/token.service';
import { PurchaseService, type TokenPackOffering } from '@app/core/services/purchase.service';
import { AdService } from '@app/core/services/ad.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-insufficient-tokens-sheet',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonBadge,
    IonSpinner,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'tokens.quickBuy' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p class="sheet-title">
        {{ 'tokens.insufficientTitle' | translate:{ amount: missingTokens() } }}
      </p>

      <!-- Option 1: Watch Ad -->
      <button
        class="option-card"
        [class.disabled]="!isNative()"
        [disabled]="!isNative() || watchingAd()"
        (click)="onWatchAd()"
      >
        <div class="option-icon">
          @if (watchingAd()) {
            <ion-spinner name="crescent" />
          } @else {
            <ion-icon name="videocam-outline" />
          }
        </div>
        <div class="option-text">
          <span class="option-label">{{ 'tokens.watchAdOption' | translate }}</span>
          @if (!isNative()) {
            <span class="option-hint">{{ 'tokens.watchAdWebOnly' | translate }}</span>
          }
        </div>
      </button>

      <!-- Option 2: Recommended Pack -->
      @if (recommendedPack(); as pack) {
        <button
          class="option-card recommended"
          [disabled]="purchasing()"
          (click)="onBuyPack(pack)"
        >
          <div class="option-icon flame">
            @if (purchasing()) {
              <ion-spinner name="crescent" />
            } @else {
              <ion-icon name="flame-outline" />
            }
          </div>
          <div class="option-text">
            <div class="option-label-row">
              <span class="option-label">{{ pack.tokens }} {{ 'tokens.flames' | translate }}</span>
              <ion-badge color="warning">{{ 'tokens.recommendedPack' | translate }}</ion-badge>
            </div>
            <span class="option-price">{{ pack.localizedPrice }}</span>
          </div>
        </button>
      }

      <!-- Option 3: See All Packs -->
      <ion-button
        expand="block"
        fill="clear"
        class="see-all-btn"
        (click)="onSeeAllPacks()"
      >
        {{ 'tokens.seeAllPacks' | translate }}
      </ion-button>
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .sheet-title {
      font-size: 18px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 20px;
      color: var(--ion-text-color);
    }

    .option-card {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 14px 16px;
      margin-bottom: 12px;
      background: var(--ion-color-step-50);
      border: 2px solid var(--ion-color-step-100);
      border-radius: 14px;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.2s;

      &:active:not(:disabled) {
        transform: scale(0.97);
      }

      &.disabled,
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.recommended {
        border-color: var(--ion-color-warning);
        background: var(--ion-color-warning-tint);
      }
    }

    .option-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-100);
      border-radius: 12px;
      flex-shrink: 0;

      ion-icon {
        font-size: 22px;
        color: var(--ion-color-primary);
      }

      ion-spinner {
        width: 22px;
        height: 22px;
      }

      &.flame {
        background: rgba(var(--ion-color-warning-rgb), 0.2);

        ion-icon {
          color: var(--ion-color-warning-shade);
        }
      }
    }

    .option-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .option-label-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .option-label {
      font-size: 15px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .option-hint {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .option-price {
      font-size: 13px;
      font-weight: 500;
      color: var(--ion-color-medium);
    }

    ion-badge {
      font-size: 10px;
      flex-shrink: 0;
    }

    .see-all-btn {
      margin-top: 4px;
    }
  `,
})
export class InsufficientTokensSheetComponent {
  private modalCtrl = inject(ModalController);
  private router = inject(Router);
  tokenService = inject(TokenService);
  purchaseService = inject(PurchaseService);
  adService = inject(AdService);

  missingTokens = input<number>(0);
  itemName = input<string>('');
  itemPrice = input<number>(0);

  watchingAd = signal(false);
  purchasing = signal(false);

  isNative = computed(() => {
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android';
  });

  recommendedPack = computed<TokenPackOffering | null>(() => {
    const missing = this.missingTokens();
    const offerings = this.purchaseService.offerings();
    if (offerings.length === 0) return null;

    // Find cheapest pack that covers the gap
    const sorted = [...offerings].sort((a, b) => a.tokens - b.tokens);
    const covering = sorted.find((p) => p.tokens >= missing);
    return covering ?? sorted[sorted.length - 1];
  });

  constructor() {
    addIcons({ closeOutline, videocamOutline, flameOutline });
    this.purchaseService.fetchOfferings();
  }

  dismiss(data?: { purchased: boolean }): void {
    this.modalCtrl.dismiss(data);
  }

  async onWatchAd(): Promise<void> {
    if (!this.isNative()) return;
    this.watchingAd.set(true);
    try {
      const rewarded = await this.adService.showRewardedAd();
      if (rewarded) {
        const result = await this.tokenService.earnFromVideo();
        if (result.earned > 0) {
          await this.tokenService.fetchBalance();
          // Check if balance now covers the item
          if (this.tokenService.balance() >= this.itemPrice()) {
            this.dismiss({ purchased: true });
          }
        }
      }
    } finally {
      this.watchingAd.set(false);
    }
  }

  async onBuyPack(pack: TokenPackOffering): Promise<void> {
    this.purchasing.set(true);
    try {
      const result = await this.purchaseService.purchasePackage(pack);
      if (result.success) {
        await this.tokenService.fetchBalance();
        // Check if balance now covers the item
        if (this.tokenService.balance() >= this.itemPrice()) {
          this.dismiss({ purchased: true });
        }
      }
    } finally {
      this.purchasing.set(false);
    }
  }

  onSeeAllPacks(): void {
    this.dismiss();
    this.router.navigate(['/tokens']);
  }
}
