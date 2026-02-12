import { Injectable, inject, signal } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';
import type {
  PurchasesPackage,
  PurchasesOfferings,
} from '@revenuecat/purchases-capacitor';
import { TokenService } from './token.service';

export interface TokenPackOffering {
  /** RevenueCat package identifier (e.g. "$rc_monthly", custom id, etc.) */
  identifier: string;
  /** Localized price string from the store (e.g. "$0.99") */
  localizedPrice: string;
  /** The underlying RevenueCat package */
  rcPackage: PurchasesPackage;
}

/** Maps RevenueCat product IDs → token amounts (must match App Store / Play Store products) */
const PRODUCT_TOKEN_MAP: Record<string, number> = {
  'wallofme_tokens_100': 100,
  'wallofme_tokens_550': 550,
  'wallofme_tokens_1200': 1200,
  'wallofme_tokens_2600': 2600,
  'wallofme_tokens_7000': 7000,
};

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private platform = inject(Platform);
  private tokenService = inject(TokenService);

  /** Available token pack offerings from RevenueCat */
  readonly offerings = signal<TokenPackOffering[]>([]);
  /** True while fetching offerings */
  readonly loadingOfferings = signal(false);
  /** True while a purchase is in progress */
  readonly purchasing = signal(false);

  /**
   * Fetch available offerings from RevenueCat.
   * Call this when the tokens page loads.
   */
  async fetchOfferings(): Promise<void> {
    if (!this.platform.is('capacitor')) return;

    this.loadingOfferings.set(true);
    try {
      const offerings: PurchasesOfferings =
        await Purchases.getOfferings();

      if (offerings.current?.availablePackages) {
        const packs: TokenPackOffering[] = offerings.current.availablePackages.map(
          (pkg) => ({
            identifier: pkg.identifier,
            localizedPrice: pkg.product.priceString,
            rcPackage: pkg,
          }),
        );
        this.offerings.set(packs);
      }
    } catch (e) {
      console.error('[PurchaseService] Failed to fetch offerings', e);
    } finally {
      this.loadingOfferings.set(false);
    }
  }

  /**
   * Purchase a token pack.
   * Returns `{ success, tokens }` — tokens are credited via the backend.
   */
  async purchasePackage(
    pkg: PurchasesPackage,
  ): Promise<{ success: boolean; tokens: number }> {
    this.purchasing.set(true);
    try {
      await Purchases.purchasePackage({ aPackage: pkg });

      // Identify the product to map to token amount
      const productId = pkg.product.identifier;
      const tokens = PRODUCT_TOKEN_MAP[productId] ?? 0;

      if (tokens > 0) {
        // Credit tokens via the backend (server-side validation)
        await this.tokenService.creditPurchase(productId, tokens);
      }

      return { success: true, tokens };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        // User cancelled — not an error
        return { success: false, tokens: 0 };
      }
      console.error('[PurchaseService] Purchase failed', e);
      return { success: false, tokens: 0 };
    } finally {
      this.purchasing.set(false);
    }
  }

  /**
   * Restore previous purchases (e.g. after reinstall).
   */
  async restorePurchases(): Promise<void> {
    if (!this.platform.is('capacitor')) return;
    try {
      await Purchases.restorePurchases();
    } catch (e) {
      console.error('[PurchaseService] Restore failed', e);
    }
  }

  /** True if running on a native platform where purchases can happen */
  isAvailable(): boolean {
    return this.platform.is('capacitor');
  }
}
