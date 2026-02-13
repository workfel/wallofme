# Sprint: Web Rewarded Ads (Google Ad Manager GPT)

> Status: PLANNED — Not yet implemented

## Goal

Replace AdMob (native-only) with Google Ad Manager rewarded ads on the web/PWA, so free users can earn tokens by watching ads regardless of platform.

## Architecture

```
Platform detection (AdService)
├── Web/PWA    → WebRewardedAdService (Google Publisher Tag / Ad Manager)
├── iOS native → AdMob SDK via Capacitor (existing, unchanged)
└── Android    → AdMob SDK via Capacitor (existing, unchanged)
```

The backend doesn't change — `POST /api/tokens/earn/rewarded-video` is already platform-agnostic.

## Prerequisites

1. **Google Ad Manager account** — Create at https://admanager.google.com
   - Link to existing AdSense account
   - Create a **rewarded ad unit** (Out-of-page format > Rewarded)
   - Note the ad unit path: `/your-network-id/rewarded-unit-name`

2. **Environment config** — Add to `environment.ts`:
   ```typescript
   adManager: {
     rewardedAdUnitPath: '/your-network-id/rewarded-unit',
   }
   ```

## Implementation Plan

### Task 1: WebRewardedAdService

**File**: `apps/frontend-ionic/src/app/core/services/web-rewarded-ad.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class WebRewardedAdService {
  readonly ready = signal(false);
  readonly loading = signal(false);

  private gptLoaded = false;
  private rewardedSlot: googletag.Slot | null = null;

  /**
   * Load the GPT script and define the rewarded slot.
   * Call once at app start on web platforms.
   */
  async initialize(): Promise<void>;

  /**
   * Show a rewarded ad.
   * Returns true if the user earned the reward, false if dismissed/failed.
   *
   * Flow:
   * 1. Listen for RewardedSlotReadyEvent → call makeRewardedVisible()
   * 2. Listen for RewardedSlotGrantedEvent → reward earned
   * 3. Listen for RewardedSlotClosedEvent → ad closed (resolve)
   * 4. Call googletag.display(slot) to trigger the ad request
   */
  async showRewardedAd(): Promise<boolean>;

  /** True if running on web (not Capacitor native) */
  isAvailable(): boolean;
}
```

**GPT integration details:**

```typescript
// 1. Load GPT script dynamically
const script = document.createElement('script');
script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
script.async = true;
document.head.appendChild(script);

// 2. Define rewarded slot
googletag.cmd.push(() => {
  this.rewardedSlot = googletag.defineOutOfPageSlot(
    environment.adManager.rewardedAdUnitPath,
    googletag.enums.OutOfPageFormat.REWARDED
  );
  if (this.rewardedSlot) {
    this.rewardedSlot.addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  }
});

// 3. Listen for events
googletag.pubads().addEventListener('rewardedSlotReady', (event) => {
  // Ad is ready — show it to the user
  event.makeRewardedVisible();
});

googletag.pubads().addEventListener('rewardedSlotGranted', (event) => {
  // User watched the ad — grant reward
  this.rewardGranted = true;
});

googletag.pubads().addEventListener('rewardedSlotClosed', () => {
  // Ad closed — resolve with reward status
});

// 4. Trigger ad request
googletag.cmd.push(() => {
  googletag.display(this.rewardedSlot!);
});
```

### Task 2: Update AdService to be platform-aware

**File**: `apps/frontend-ionic/src/app/core/services/ad.service.ts`

Current `AdService` only supports Capacitor/native. Make it a facade that delegates to the right implementation:

```typescript
@Injectable({ providedIn: 'root' })
export class AdService {
  private platform = inject(Platform);
  private webAds = inject(WebRewardedAdService);

  readonly ready = signal(false);
  readonly loading = signal(false);

  async initialize(): Promise<void> {
    if (this.platform.is('capacitor')) {
      // Existing AdMob initialization (unchanged)
      await this.initializeAdMob();
    } else {
      // Web: use Google Ad Manager GPT
      await this.webAds.initialize();
    }
    this.ready.set(true);
  }

  async showRewardedAd(): Promise<boolean> {
    if (this.platform.is('capacitor')) {
      return this.showAdMobRewarded(); // existing code
    } else {
      return this.webAds.showRewardedAd();
    }
  }

  isAvailable(): boolean {
    if (this.platform.is('capacitor')) {
      return true; // AdMob
    }
    return this.webAds.isAvailable(); // GPT loaded
  }
}
```

### Task 3: Add GPT type definitions

**File**: `apps/frontend-ionic/src/types/googletag.d.ts`

Add TypeScript declarations for the `googletag` global (or install `@types/googletag` if available).

### Task 4: Environment config

**Files**:
- `apps/frontend-ionic/src/environments/environment.ts`
- `apps/frontend-ionic/src/environments/environment.prod.ts`

```typescript
adManager: {
  rewardedAdUnitPath: '/test-network/test-rewarded', // dev
}
```

### Task 5: Token page — show rewarded ads on web

**File**: `apps/frontend-ionic/src/app/features/tokens/get-tokens.page.ts`

Currently the rewarded video section is hidden on web (`adService.isAvailable()` returns false for non-Capacitor). With the updated AdService facade, it will automatically show on web too. Verify and test.

## Files Changed

| File | Change |
|---|---|
| `core/services/web-rewarded-ad.service.ts` | NEW — GPT rewarded ad wrapper |
| `core/services/ad.service.ts` | MODIFY — platform-aware facade |
| `types/googletag.d.ts` | NEW — GPT type definitions |
| `environments/environment.ts` | MODIFY — add adManager config |
| `environments/environment.prod.ts` | MODIFY — add adManager config |
| `features/tokens/get-tokens.page.ts` | VERIFY — should work automatically |

## Backend Changes

None. `POST /api/tokens/earn/rewarded-video` already works for any platform.

## Testing

1. Open app in browser (not Capacitor)
2. Go to token store → rewarded video section should be visible
3. Click "Watch Ad" → GPT rewarded ad should appear
4. Watch full ad → reward granted → 15 tokens credited
5. Dismiss ad early → no reward
6. Cooldown timer (20min) and daily limit (5/day) still enforced by backend

## Notes

- Google Ad Manager rewarded ads for web are relatively new — fill rates may be lower than native AdMob
- GPT script is ~100KB, loaded async — no impact on initial page load
- Rewarded ads on web show as an overlay/modal, similar to native experience
- Ad Manager uses the same Google ad network as AdMob — similar ad quality
- For testing: use Google's test ad units until production is ready
