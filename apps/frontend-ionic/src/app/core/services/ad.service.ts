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

      // Listen for the reward event
      const rewardPromise = new Promise<boolean>((resolve) => {
        const rewardHandler = AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          (_info: AdMobRewardItem) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            rewardHandler.then((h) => h.remove());
            resolve(true);
          },
        );

        const dismissHandler = AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => {
            dismissHandler.then((h) => h.remove());
            // Give the reward event a moment to fire before resolving false
            setTimeout(() => resolve(false), 300);
          },
        );

        const failHandler = AdMob.addListener(
          RewardAdPluginEvents.FailedToLoad,
          () => {
            failHandler.then((h) => h.remove());
            resolve(false);
          },
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
