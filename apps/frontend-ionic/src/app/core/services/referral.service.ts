import { Injectable, inject, signal } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { environment } from "@env/environment";
import { ApiService } from "./api.service";

export interface ReferralInfo {
  referralCode: string | null;
  referralCount: number;
  maxReferrals: number;
  totalEarned: number;
  referrals: {
    id: string;
    firstName: string | null;
    image: string | null;
    status: "pending" | "rewarded";
    joinedAt: string;
  }[];
}

@Injectable({ providedIn: "root" })
export class ReferralService {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  info = signal<ReferralInfo | null>(null);
  loading = signal(false);

  async fetchReferralInfo(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.referrals.me.$get();
      if (res.ok) {
        const json = await res.json();
        this.info.set(json.data as ReferralInfo);
      }
    } catch (e) {
      console.error("[ReferralService] fetchReferralInfo error:", e);
    } finally {
      this.loading.set(false);
    }
  }

  async lookupCode(
    code: string
  ): Promise<{ valid: boolean; referrerFirstName: string | null }> {
    try {
      const res = await this.api.client.api.referrals.code[":code"].$get({
        param: { code },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data as { valid: boolean; referrerFirstName: string | null };
      }
    } catch (e) {
      console.error("[ReferralService] lookupCode error:", e);
    }
    return { valid: false, referrerFirstName: null };
  }

  async applyCode(code: string): Promise<boolean> {
    try {
      const res = await this.api.client.api.referrals.apply.$post({
        json: { code },
      });
      return res.ok;
    } catch (e) {
      console.error("[ReferralService] applyCode error:", e);
      return false;
    }
  }

  /**
   * Check for unread referral_reward notifications.
   * If found, mark as read and return the referred user's name.
   */
  async checkForNewReward(): Promise<string | null> {
    try {
      const res = await this.api.client.api.social.notifications.$get();
      if (!res.ok) return null;
      const json = await res.json();
      const notifications = json.data as Array<{
        id: string;
        type: string;
        readAt: string | null;
        metadata: string | null;
      }>;

      const reward = notifications.find(
        (n) => n.type === "referral_reward" && !n.readAt
      );
      if (!reward) return null;

      // Mark as read
      await this.api.client.api.social.notifications[":id"].read.$patch({
        param: { id: reward.id },
      });

      try {
        const meta = reward.metadata ? JSON.parse(reward.metadata) : {};
        return meta.referredUserName ?? null;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }

  async shareReferralLink(): Promise<void> {
    const code = this.info()?.referralCode;
    if (!code) return;

    const url = `${environment.appUrl}/invite/${code}`;

    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({
        title: this.translate.instant("referral.shareTitle"),
        text: this.translate.instant("referral.shareText"),
        url,
      });
    } catch {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Ignore
      }
    }
  }
}
