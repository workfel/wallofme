import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '@env/environment';
import { ApiService } from './api.service';
import { ShareCardService, type StoryCardOptions } from './share-card.service';
import { ReferralService } from './referral.service';

export interface ShareTrophyOptions {
  trophyId: string;
  trophyImageUrl: string;
  raceName: string;
  time: string | null;
  percentile: number | null;
  themeColor: string;
}

@Injectable({ providedIn: 'root' })
export class ShareService {
  private api = inject(ApiService);
  private shareCardService = inject(ShareCardService);
  private referralService = inject(ReferralService);
  private translate = inject(TranslateService);

  readonly shareSlug = signal<string | null>(null);
  readonly loading = signal(false);

  async generateShareLink(): Promise<string | null> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.rooms.me.share.$post({});
      if (res.ok) {
        const json = (await res.json()) as { data: { shareSlug: string } };
        this.shareSlug.set(json.data.shareSlug);
        return json.data.shareSlug;
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
    return null;
  }

  getShareUrl(slug: string): string {
    return `${window.location.origin}/room/share/${slug}`;
  }

  /**
   * Share a trophy as an Instagram Story-optimized image + claim 50 token reward.
   */
  async shareTrophy(options: ShareTrophyOptions): Promise<{ rewarded: boolean }> {
    // 1. Generate story card image
    const cardOptions: StoryCardOptions = {
      trophyImageUrl: options.trophyImageUrl,
      raceName: options.raceName,
      time: options.time,
      percentile: options.percentile,
      themeColor: options.themeColor,
    };
    const blob = await this.shareCardService.generateStoryCard(cardOptions);

    // 2. Build share URL: use referral code if available, otherwise room share
    const referralCode = this.referralService.info()?.referralCode;
    const shareUrl = referralCode
      ? `${environment.appUrl}/invite/${referralCode}`
      : `${environment.appUrl}`;

    // 3. Share via native or web
    const file = new File([blob], 'wallofme-trophy.png', { type: 'image/png' });
    const shareText = `${this.translate.instant('share.storyText')} ${shareUrl}`;
    const shareTitle = this.translate.instant('share.storyTitle');

    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Share } = await import('@capacitor/share');
        const { Filesystem, Directory } = await import('@capacitor/filesystem');

        const reader = new FileReader();
        const dataUri = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const base64Data = dataUri.split(',')[1];
        const tempFile = await Filesystem.writeFile({
          path: 'wallofme-trophy.png',
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({ title: shareTitle, text: shareText, files: [tempFile.uri] });
      } else if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: shareTitle, text: shareText, files: [file] });
      } else {
        // Download fallback
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wallofme-trophy.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // User cancelled — still claim reward
    }

    // 4. Claim token reward (idempotent)
    try {
      const res = await this.api.client.api.trophies[':id'].share.$post({
        param: { id: options.trophyId },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: { rewarded: boolean; balance: number } };
        return { rewarded: json.data.rewarded };
      }
    } catch {
      // Best-effort — don't fail share if reward fails
    }

    return { rewarded: false };
  }
}
