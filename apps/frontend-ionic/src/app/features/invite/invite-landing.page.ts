import { Component, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  IonContent,
  IonButton,
  IonSpinner,
  IonIcon,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { peopleOutline } from "ionicons/icons";

import { ReferralService } from "@app/core/services/referral.service";

@Component({
  selector: "app-invite-landing",
  standalone: true,
  imports: [TranslateModule, IonContent, IonButton, IonSpinner, IonIcon],
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <div class="invite-container animate-fade-in-up">
        @if (loading()) {
          <div class="loading-state">
            <ion-spinner name="crescent" />
          </div>
        } @else if (referrerName()) {
          <div class="invite-hero">
            <div class="invite-icon-wrapper">
              <ion-icon name="people-outline" class="invite-icon" />
            </div>
            <h1 class="invite-title">
              {{ referrerName() }} {{ "referral.invitesYou" | translate }}
            </h1>
            <p class="invite-subtitle">
              {{ "referral.inviteLandingSubtitle" | translate }}
            </p>
            <div class="bonus-pill">
              +500 {{ "referral.bonusFlames" | translate }}
            </div>
          </div>

          <ion-button expand="block" (click)="goToRegister()" class="cta-btn">
            {{ "referral.joinNow" | translate }}
          </ion-button>
        } @else {
          <div class="invite-hero">
            <h1 class="invite-title">{{ "referral.invalidCode" | translate }}</h1>
            <p class="invite-subtitle">
              {{ "referral.invalidCodeSubtitle" | translate }}
            </p>
          </div>
          <ion-button expand="block" (click)="goToRegister()" class="cta-btn">
            {{ "auth.register" | translate }}
          </ion-button>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .invite-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      max-width: 400px;
      margin: 0 auto;
      padding: 24px 0;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 64px;
    }

    .invite-hero {
      text-align: center;
      margin-bottom: 40px;
    }

    .invite-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        rgba(var(--ion-color-primary-rgb), 0.15),
        rgba(var(--ion-color-primary-rgb), 0.05)
      );
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .invite-icon {
      font-size: 40px;
      color: var(--ion-color-primary);
    }

    .invite-title {
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 12px;
      letter-spacing: -0.02em;
    }

    .invite-subtitle {
      font-size: 16px;
      color: var(--ion-color-step-500);
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .bonus-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 24px;
      background: linear-gradient(135deg, #fff8e1 0%, #fff3ca 100%);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 20px;
      font-size: 18px;
      font-weight: 800;
      color: #8b6b00;
      box-shadow: 0 4px 16px rgba(255, 200, 0, 0.15);
    }

    .cta-btn {
      margin-top: 16px;
    }
  `,
})
export class InviteLandingPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private referralService = inject(ReferralService);

  loading = signal(true);
  referrerName = signal<string | null>(null);

  constructor() {
    addIcons({ peopleOutline });
  }

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.paramMap.get("code") ?? "";

    if (!code) {
      this.loading.set(false);
      return;
    }

    // Store the code for later use during onboarding
    localStorage.setItem("referral_code", code);

    const result = await this.referralService.lookupCode(code);
    this.referrerName.set(result.valid ? result.referrerFirstName : null);
    this.loading.set(false);
  }

  goToRegister(): void {
    this.router.navigate(["/auth/register"]);
  }
}
