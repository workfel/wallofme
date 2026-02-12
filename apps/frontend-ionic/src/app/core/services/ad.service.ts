import { Injectable, inject, signal } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { AdMob, RewardAdOptions, RewardAdPluginEvents, AdMobRewardItem } from '@capacitor-community/admob';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AdService {
  private platform = inject(Platform);

  /** True once AdMob.initialize() succeeds */
  readonly ready = signal(false);
  /** True while an ad is being loaded/shown */
  readonly loading = signal(false);

  private initialized = false;

  /**
   * Call once at app start (or lazily before first ad).
   * Safe to call multiple times — will only initialize once.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.platform.is('capacitor')) return; // skip on web

    try {
      await AdMob.initialize({
        initializeForTesting: !environment.production,
      });
      this.initialized = true;
      this.ready.set(true);
    } catch (e) {
      console.error('[AdService] Failed to initialize AdMob', e);
    }
  }

  /**
   * Show a rewarded video ad.
   * Resolves with `true` if the user earned the reward, `false` otherwise.
   */
  async showRewardedAd(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!this.initialized) return false;

    this.loading.set(true);

    try {
      const options: RewardAdOptions = {
        adId: environment.admob.rewardedAdId,
        isTesting: !environment.production,
      };

      // Listen for the reward event — store handles for cleanup
      let rewardHandle: Awaited<ReturnType<typeof AdMob.addListener>> | null = null;
      let dismissHandle: Awaited<ReturnType<typeof AdMob.addListener>> | null = null;
      let failHandle: Awaited<ReturnType<typeof AdMob.addListener>> | null = null;

      const cleanup = async () => {
        await rewardHandle?.remove();
        await dismissHandle?.remove();
        await failHandle?.remove();
      };

      const rewardPromise = new Promise<boolean>(async (resolve) => {
        let resolved = false;
        const safeResolve = (val: boolean) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve(val);
        };

        rewardHandle = await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          () => safeResolve(true),
        );

        dismissHandle = await AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => setTimeout(() => safeResolve(false), 300),
        );

        failHandle = await AdMob.addListener(
          RewardAdPluginEvents.FailedToLoad,
          () => safeResolve(false),
        );
      });

      // Prepare and show the ad
      await AdMob.prepareRewardVideoAd(options);
      await AdMob.showRewardVideoAd();

      return await rewardPromise;
    } catch (e) {
      console.error('[AdService] Rewarded ad error', e);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /** True if running on a native platform where ads can show */
  isAvailable(): boolean {
    return this.platform.is('capacitor');
  }
}
