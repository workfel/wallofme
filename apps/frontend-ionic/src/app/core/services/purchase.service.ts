import { Injectable, inject, signal, effect } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Purchases as PurchasesJS } from '@revenuecat/purchases-js';
import type { Package as WebPackage } from '@revenuecat/purchases-js';
import { environment } from '@env/environment';
import { TokenService } from './token.service';
import { AuthService } from './auth.service';

export interface TokenPackOffering {
  identifier: string;
  localizedPrice: string;
  /** Only present for native IAP purchases */
  rcPackage?: PurchasesPackage;
  /** Only present for web billing purchases */
  webPackage?: WebPackage;
  /** Product ID */
  productId: string;
  tokens: number;
}

/** Maps RevenueCat product IDs → token amounts (must match App Store / Stripe products) */
const PRODUCT_TOKEN_MAP: Record<string, number> = {
  'wallofme_tokens_100': 100,
  'wallofme_tokens_550': 550,
  'wallofme_tokens_1200': 1200,
  'wallofme_tokens_2600': 2600,
  'wallofme_tokens_7000': 7000,
};

const FALLBACK_PRICES: Record<string, string> = {
  'wallofme_tokens_100': '$0.99',
  'wallofme_tokens_550': '$4.99',
  'wallofme_tokens_1200': '$9.99',
  'wallofme_tokens_2600': '$19.99',
  'wallofme_tokens_7000': '$49.99',
};

type CheckoutMode = 'native_iap' | 'web_billing';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private platform = inject(Platform);
  private tokenService = inject(TokenService);
  private authService = inject(AuthService);

  /** Available token pack offerings */
  readonly offerings = signal<TokenPackOffering[]>([]);
  /** True while fetching offerings */
  readonly loadingOfferings = signal(false);
  /** True while a purchase is in progress */
  readonly purchasing = signal(false);

  private mode: CheckoutMode = 'web_billing';
  private webPurchasesInstance: PurchasesJS | null = null;
  private webBillingReady = false;

  constructor() {
    // iOS native → Apple IAP, everything else → Web Billing (Stripe)
    this.mode =
      this.platform.is('capacitor') && this.platform.is('ios')
        ? 'native_iap'
        : 'web_billing';

    // Auto-identify user with RevenueCat when auth state changes
    effect(() => {
      const user = this.authService.user();
      if (user?.id) {
        this.identifyUser(user.id);
      }
    });
  }

  /**
   * Initialize Web Billing SDK after user authenticates.
   * Native IAP is initialized in AppComponent.
   */
  private async initWebBilling(userId: string): Promise<void> {
    if (this.mode !== 'web_billing') return;
    if (this.webBillingReady) return;
    try {
      this.webPurchasesInstance = PurchasesJS.configure(
        environment.revenueCat.webApiKey,
        userId,
      );
      this.webBillingReady = true;
    } catch (e) {
      console.error('[PurchaseService] Failed to configure Web Billing', e);
    }
  }

  /**
   * Identify user with RevenueCat after login.
   * Ensures app_user_id matches BetterAuth user.id for cross-platform sync.
   */
  async identifyUser(userId: string): Promise<void> {
    if (this.mode === 'native_iap') {
      try {
        await Purchases.logIn({ appUserID: userId });
      } catch (e) {
        console.error('[PurchaseService] Native logIn failed', e);
      }
    } else {
      await this.initWebBilling(userId);
    }
  }

  /**
   * Fetch available offerings.
   * Native: fetches from RevenueCat Capacitor SDK.
   * Web: fetches from RevenueCat JS SDK (real packages needed for purchase).
   * Falls back to hardcoded prices if SDK not ready.
   */
  async fetchOfferings(): Promise<void> {
    this.loadingOfferings.set(true);
    try {
      if (this.mode === 'native_iap') {
        await this.fetchNativeOfferings();
      } else {
        await this.fetchWebOfferings();
      }
    } catch (e) {
      console.error('[PurchaseService] Failed to fetch offerings', e);
    } finally {
      this.loadingOfferings.set(false);
    }
  }

  private async fetchNativeOfferings(): Promise<void> {
    const offerings = await Purchases.getOfferings();
    if (offerings.current?.availablePackages) {
      const packs: TokenPackOffering[] = offerings.current.availablePackages.map(
        (pkg) => ({
          identifier: pkg.identifier,
          localizedPrice: pkg.product.priceString,
          rcPackage: pkg,
          productId: pkg.product.identifier,
          tokens: PRODUCT_TOKEN_MAP[pkg.product.identifier] ?? 0,
        }),
      );
      this.offerings.set(packs);
    }
  }

  private async fetchWebOfferings(): Promise<void> {
    // Try to fetch real offerings from the web SDK
    if (this.webPurchasesInstance) {
      try {
        const offerings = await this.webPurchasesInstance.getOfferings();
        console.debug('[PurchaseService] Web offerings response:', {
          hasCurrentOffering: !!offerings.current,
          currentId: offerings.current?.identifier,
          allOfferingIds: Object.keys(offerings.all),
          availablePackages: offerings.current?.availablePackages?.map((p) => ({
            id: p.identifier,
            productId: p.webBillingProduct.identifier,
            price: p.webBillingProduct.price?.formattedPrice,
          })),
        });
        const current = offerings.current;
        if (current?.availablePackages?.length) {
          const packs: TokenPackOffering[] = current.availablePackages
            .filter((pkg) => {
              const productId = pkg.webBillingProduct.identifier;
              return productId in PRODUCT_TOKEN_MAP;
            })
            .map((pkg) => {
              const productId = pkg.webBillingProduct.identifier;
              return {
                identifier: pkg.identifier,
                localizedPrice: pkg.webBillingProduct.price.formattedPrice,
                webPackage: pkg,
                productId,
                tokens: PRODUCT_TOKEN_MAP[productId] ?? 0,
              };
            });
          if (packs.length > 0) {
            this.offerings.set(packs);
            return;
          }
        }
      } catch (e) {
        console.warn('[PurchaseService] Failed to fetch web offerings, using fallback', e);
      }
    }

    // Fallback: hardcoded offerings (prices shown on checkout page anyway)
    const packs: TokenPackOffering[] = Object.entries(PRODUCT_TOKEN_MAP).map(
      ([productId, tokens]) => ({
        identifier: productId,
        localizedPrice: FALLBACK_PRICES[productId] ?? '',
        productId,
        tokens,
      }),
    );
    this.offerings.set(packs);
  }

  /**
   * Purchase a token pack.
   * Native: uses Apple IAP via Capacitor SDK, credits tokens client-side.
   * Web: uses RevenueCat JS SDK checkout. Webhook credits tokens server-side.
   */
  async purchasePackage(
    offering: TokenPackOffering,
  ): Promise<{ success: boolean; tokens: number }> {
    if (this.mode === 'native_iap' && offering.rcPackage) {
      return this.purchaseNative(offering);
    }
    return this.purchaseWeb(offering);
  }

  private async purchaseNative(
    offering: TokenPackOffering,
  ): Promise<{ success: boolean; tokens: number }> {
    if (!offering.rcPackage) return { success: false, tokens: 0 };

    this.purchasing.set(true);
    try {
      await Purchases.purchasePackage({ aPackage: offering.rcPackage });
      const tokens = offering.tokens;
      if (tokens > 0) {
        await this.tokenService.creditPurchase(offering.productId, tokens);
      }
      return { success: true, tokens };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { success: false, tokens: 0 };
      }
      console.error('[PurchaseService] Native purchase failed', e);
      return { success: false, tokens: 0 };
    } finally {
      this.purchasing.set(false);
    }
  }

  private async purchaseWeb(
    offering: TokenPackOffering,
  ): Promise<{ success: boolean; tokens: number }> {
    if (!this.webPurchasesInstance) {
      console.warn('[PurchaseService] Web Billing SDK not initialized');
      return { success: false, tokens: 0 };
    }

    // If we don't have a real webPackage, try to fetch offerings first
    if (!offering.webPackage) {
      await this.fetchWebOfferings();
      const refreshed = this.offerings().find((o) => o.productId === offering.productId);
      if (!refreshed?.webPackage) {
        console.warn('[PurchaseService] No web package available for', offering.productId);
        return { success: false, tokens: 0 };
      }
      offering = refreshed;
    }

    this.purchasing.set(true);
    try {
      await this.webPurchasesInstance.purchase({
        rcPackage: offering.webPackage!,
      });
      // Purchase succeeded — credit tokens client-side as well.
      // The webhook also credits in production (with idempotency check
      // on referenceId to prevent double-crediting).
      const tokens = offering.tokens;
      if (tokens > 0) {
        await this.tokenService.creditPurchase(offering.productId, tokens);
      }
      return { success: true, tokens };
    } catch (e: unknown) {
      const err = e as { code?: number };
      // ErrorCode 1 = user cancelled in purchases-js
      if (err.code === 1) {
        return { success: false, tokens: 0 };
      }
      console.error('[PurchaseService] Web purchase failed', e);
      return { success: false, tokens: 0 };
    } finally {
      this.purchasing.set(false);
    }
  }

  /**
   * Restore previous purchases (native only).
   */
  async restorePurchases(): Promise<void> {
    if (this.mode !== 'native_iap') return;
    try {
      await Purchases.restorePurchases();
    } catch (e) {
      console.error('[PurchaseService] Restore failed', e);
    }
  }

  /** Purchases are now available on all platforms */
  isAvailable(): boolean {
    return true;
  }

  /** Refresh balance — call when returning to app after web checkout */
  async refreshAfterWebCheckout(): Promise<void> {
    await this.tokenService.fetchBalance();
  }
}
