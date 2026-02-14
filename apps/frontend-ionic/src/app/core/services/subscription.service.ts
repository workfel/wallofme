import { Injectable, inject, signal } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Purchases as PurchasesJS } from '@revenuecat/purchases-js';
import type { Package as WebPackage } from '@revenuecat/purchases-js';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

export interface SubscriptionOffering {
  identifier: string;
  localizedPrice: string;
  productId: string;
  rcPackage?: PurchasesPackage;
  webPackage?: WebPackage;
}

const FALLBACK_PRICES: Record<string, string> = {
  wallofme_pro_weekly: '€2.49',
  wallofme_pro_monthly: '€6.99',
  wallofme_pro_annual: '€35.99',
};

type CheckoutMode = 'native_iap' | 'web_billing';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private platform = inject(Platform);
  private authService = inject(AuthService);

  readonly offerings = signal<SubscriptionOffering[]>([]);
  readonly loading = signal(false);
  readonly purchasing = signal(false);

  private mode: CheckoutMode = 'web_billing';
  private webPurchasesInstance: PurchasesJS | null = null;
  private webBillingReady = false;

  constructor() {
    this.mode =
      this.platform.is('capacitor') && this.platform.is('ios')
        ? 'native_iap'
        : 'web_billing';
  }

  async fetchOfferings(): Promise<void> {
    this.loading.set(true);
    try {
      if (this.mode === 'native_iap') {
        await this.fetchNativeOfferings();
      } else {
        await this.fetchWebOfferings();
      }
    } catch (e) {
      console.error('[SubscriptionService] Failed to fetch offerings', e);
      this.setFallbackOfferings();
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchNativeOfferings(): Promise<void> {
    const offerings = await Purchases.getOfferings();
    const subOffering = offerings.all?.['pro'] ?? offerings.current;
    if (subOffering?.availablePackages) {
      const packs: SubscriptionOffering[] = subOffering.availablePackages
        .filter((pkg) =>
          pkg.product.identifier.startsWith('wallofme_pro_'),
        )
        .map((pkg) => ({
          identifier: pkg.identifier,
          localizedPrice: pkg.product.priceString,
          rcPackage: pkg,
          productId: pkg.product.identifier,
        }));
      if (packs.length > 0) {
        this.offerings.set(packs);
        return;
      }
    }
    this.setFallbackOfferings();
  }

  private async fetchWebOfferings(): Promise<void> {
    const userId = this.authService.user()?.id;
    if (userId && !this.webBillingReady) {
      try {
        this.webPurchasesInstance = PurchasesJS.configure(
          environment.revenueCat.webApiKey,
          userId,
        );
        this.webBillingReady = true;
      } catch (e) {
        console.error('[SubscriptionService] Web Billing init failed', e);
      }
    }

    if (this.webPurchasesInstance) {
      try {
        const offerings = await this.webPurchasesInstance.getOfferings();
        const subOffering = offerings.all?.['pro'] ?? offerings.current;
        if (subOffering?.availablePackages?.length) {
          const packs: SubscriptionOffering[] = subOffering.availablePackages
            .filter((pkg) =>
              pkg.webBillingProduct.identifier.startsWith('wallofme_pro_'),
            )
            .map((pkg) => ({
              identifier: pkg.identifier,
              localizedPrice: pkg.webBillingProduct.price.formattedPrice,
              webPackage: pkg,
              productId: pkg.webBillingProduct.identifier,
            }));
          if (packs.length > 0) {
            this.offerings.set(packs);
            return;
          }
        }
      } catch (e) {
        console.warn('[SubscriptionService] Web offerings fetch failed', e);
      }
    }

    this.setFallbackOfferings();
  }

  private setFallbackOfferings(): void {
    this.offerings.set(
      Object.entries(FALLBACK_PRICES).map(([productId, price]) => ({
        identifier: productId,
        localizedPrice: price,
        productId,
      })),
    );
  }

  async purchase(
    offering: SubscriptionOffering,
  ): Promise<{ success: boolean }> {
    if (this.mode === 'native_iap' && offering.rcPackage) {
      return this.purchaseNative(offering);
    }
    return this.purchaseWeb(offering);
  }

  private async purchaseNative(
    offering: SubscriptionOffering,
  ): Promise<{ success: boolean }> {
    if (!offering.rcPackage) return { success: false };

    this.purchasing.set(true);
    try {
      await Purchases.purchasePackage({ aPackage: offering.rcPackage });
      await this.authService.refreshSession();
      return { success: true };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { success: false };
      }
      console.error('[SubscriptionService] Native purchase failed', e);
      return { success: false };
    } finally {
      this.purchasing.set(false);
    }
  }

  private async purchaseWeb(
    offering: SubscriptionOffering,
  ): Promise<{ success: boolean }> {
    if (!this.webPurchasesInstance) {
      console.warn('[SubscriptionService] Web Billing SDK not initialized');
      return { success: false };
    }

    if (!offering.webPackage) {
      await this.fetchWebOfferings();
      const refreshed = this.offerings().find(
        (o) => o.productId === offering.productId,
      );
      if (!refreshed?.webPackage) {
        return { success: false };
      }
      offering = refreshed;
    }

    this.purchasing.set(true);
    try {
      await this.webPurchasesInstance.purchase({
        rcPackage: offering.webPackage!,
      });
      await this.authService.refreshSession();
      return { success: true };
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err.code === 1) {
        return { success: false };
      }
      console.error('[SubscriptionService] Web purchase failed', e);
      return { success: false };
    } finally {
      this.purchasing.set(false);
    }
  }

  async restorePurchases(): Promise<{ success: boolean }> {
    if (this.mode !== 'native_iap') return { success: false };
    try {
      await Purchases.restorePurchases();
      await this.authService.refreshSession();
      return { success: true };
    } catch (e) {
      console.error('[SubscriptionService] Restore failed', e);
      return { success: false };
    }
  }

  getWeeklyOffering(): SubscriptionOffering | undefined {
    return this.offerings().find((o) => o.productId === 'wallofme_pro_weekly');
  }

  getMonthlyOffering(): SubscriptionOffering | undefined {
    return this.offerings().find((o) => o.productId === 'wallofme_pro_monthly');
  }

  getAnnualOffering(): SubscriptionOffering | undefined {
    return this.offerings().find((o) => o.productId === 'wallofme_pro_annual');
  }
}
