import { Component, inject, signal, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonCard,
  IonCardContent,
  IonSpinner,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  checkmarkCircle,
  closeCircle,
  chevronBackOutline,
  sparklesOutline,
  ribbonOutline,
} from "ionicons/icons";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ProBadgeComponent } from "@app/shared/components/pro-badge/pro-badge.component";
import { SubscriptionService } from "@app/core/services/subscription.service";
import { AuthService } from "@app/core/services/auth.service";

@Component({
  selector: "app-pro-upgrade",
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonCard,
    IonCardContent,
    IonSpinner,
    TranslateModule,
    ProBadgeComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" />
        </ion-buttons>
        <ion-title>{{ "pro.title" | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Hero -->
      <div class="hero">
        <div class="hero-badge">
          <app-pro-badge size="medium" />
        </div>
        <h1 class="hero-title">{{ "pro.heroTitle" | translate }}</h1>
        <p class="hero-subtitle">{{ "pro.heroSubtitle" | translate }}</p>
      </div>

      <!-- Feature comparison -->
      <h2 class="section-title">{{ "pro.whatsIncluded" | translate }}</h2>

      <ion-list [inset]="true" class="feature-list">
        <!-- Scans -->
        <ion-item>
          <ion-label>
            <h3>{{ "pro.featureScans" | translate }}</h3>
            <p class="free-value">{{ "pro.freeScans" | translate }}</p>
          </ion-label>
          <div slot="end" class="pro-value">
            <ion-icon name="checkmark-circle" color="success" />
            <span>{{ "pro.proScans" | translate }}</span>
          </div>
        </ion-item>

        <!-- Premium themes -->
        <ion-item>
          <ion-label>
            <h3>{{ "pro.featureThemes" | translate }}</h3>
            <p class="free-value">{{ "pro.freeThemes" | translate }}</p>
          </ion-label>
          <div slot="end" class="pro-value">
            <ion-icon name="checkmark-circle" color="success" />
            <span>{{ "pro.proThemes" | translate }}</span>
          </div>
        </ion-item>

        <!-- Decoration discount -->
        <ion-item>
          <ion-label>
            <h3>{{ "pro.featureDiscount" | translate }}</h3>
            <p class="free-value">{{ "pro.freeDiscount" | translate }}</p>
          </ion-label>
          <div slot="end" class="pro-value">
            <ion-icon name="checkmark-circle" color="success" />
            <span>{{ "pro.proDiscount" | translate }}</span>
          </div>
        </ion-item>

        <!-- Custom colors -->
        <ion-item>
          <ion-label>
            <h3>{{ "pro.featureColors" | translate }}</h3>
            <p class="free-value">
              <ion-icon name="close-circle" color="danger" />
            </p>
          </ion-label>
          <div slot="end" class="pro-value">
            <ion-icon name="checkmark-circle" color="success" />
            <span>{{ "common.yes" | translate }}</span>
          </div>
        </ion-item>

        <!-- Ads -->
        <ion-item>
          <ion-label>
            <h3>{{ "pro.featureAds" | translate }}</h3>
            <p class="free-value">{{ "pro.freeAds" | translate }}</p>
          </ion-label>
          <div slot="end" class="pro-value">
            <ion-icon name="checkmark-circle" color="success" />
            <span>{{ "pro.proAds" | translate }}</span>
          </div>
        </ion-item>

        <!-- Monthly bonus -->
        <ion-item>
          <ion-label>
            <h3>{{ "pro.featureBonus" | translate }}</h3>
            <p class="free-value">—</p>
          </ion-label>
          <div slot="end" class="pro-value">
            <ion-icon name="checkmark-circle" color="success" />
            <span>{{ "pro.proBonus" | translate }}</span>
          </div>
        </ion-item>

        <!-- Pro badge -->
        <ion-item>
          <ion-label>
            <h3>{{ "pro.featureBadge" | translate }}</h3>
            <p class="free-value">—</p>
          </ion-label>
          <div slot="end" class="pro-value">
            <ion-icon name="checkmark-circle" color="success" />
            <span>{{ "common.yes" | translate }}</span>
          </div>
        </ion-item>
      </ion-list>

      <!-- Pricing cards -->
      <h2 class="section-title">{{ "pro.choosePlan" | translate }}</h2>

      <div class="pricing-grid">
        <!-- Weekly (anchor) -->
        <ion-card
          class="pricing-card"
          [class.selected]="selectedPlan() === 'weekly'"
          button
          (click)="selectedPlan.set('weekly')"
        >
          <ion-card-content>
            <span class="plan-name">{{ "pro.weekly" | translate }}</span>
            <span class="plan-price">
              {{
                subscriptionService.getWeeklyOffering()?.localizedPrice ||
                  "€2.49"
              }}
            </span>
            <span class="plan-period">{{ "pro.perWeek" | translate }}</span>
          </ion-card-content>
        </ion-card>

        <!-- Monthly (most popular) -->
        <ion-card
          class="pricing-card"
          [class.selected]="selectedPlan() === 'monthly'"
          button
          (click)="selectedPlan.set('monthly')"
        >
          <ion-badge color="primary" class="popular-badge">
            {{ "pro.mostPopular" | translate }}
          </ion-badge>
          <ion-card-content>
            <span class="plan-name">{{ "pro.monthly" | translate }}</span>
            <span class="plan-price">
              {{
                subscriptionService.getMonthlyOffering()?.localizedPrice ||
                  "€6.99"
              }}
            </span>
            <span class="plan-period">{{ "pro.perMonth" | translate }}</span>
          </ion-card-content>
        </ion-card>

        <!-- Annual (best value) -->
        <ion-card
          class="pricing-card annual"
          [class.selected]="selectedPlan() === 'annual'"
          button
          (click)="selectedPlan.set('annual')"
        >
          <ion-badge color="success" class="best-value-badge">
            {{ "pro.bestValue" | translate }}
          </ion-badge>
          <ion-card-content>
            <span class="plan-name">{{ "pro.annual" | translate }}</span>
            <span class="plan-price">
              {{
                subscriptionService.getAnnualOffering()?.localizedPrice ||
                  "€35.99"
              }}
            </span>
            <span class="plan-period">{{ "pro.perYear" | translate }}</span>
            <span class="plan-equivalent">
              {{ "pro.monthlyEquivalent" | translate: { price: "€3.00" } }}
            </span>
            <ion-badge color="warning" class="save-badge">
              {{ "pro.save57" | translate }}
            </ion-badge>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Subscribe button -->
      <ion-button
        expand="block"
        class="subscribe-btn"
        [disabled]="subscriptionService.purchasing()"
        (click)="onSubscribe()"
      >
        @if (subscriptionService.purchasing()) {
          <ion-spinner name="crescent" />
        } @else {
          <ion-icon slot="start" name="sparkles-outline" />
          {{ "pro.subscribe" | translate }}
        }
      </ion-button>

      <!-- Restore purchases -->
      <ion-button
        expand="block"
        fill="clear"
        size="small"
        (click)="onRestore()"
      >
        {{ "pro.restorePurchases" | translate }}
      </ion-button>

      <!-- Terms footer -->
      <p class="terms-footer">
        {{ "pro.termsFooter" | translate }}
      </p>
    </ion-content>
  `,
  styles: `
    .hero {
      background: linear-gradient(
        135deg,
        #f5a623 0%,
        #f7c948 50%,
        #ffd700 100%
      );
      border-radius: 20px;
      padding: 32px 24px;
      text-align: center;
      margin-bottom: 24px;
      color: #fff;
    }

    .hero-badge {
      margin-bottom: 12px;
    }

    .hero-title {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 8px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .hero-subtitle {
      font-size: 15px;
      margin: 0;
      opacity: 0.9;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 24px 0 8px;
      padding: 0 4px;
    }

    .feature-list {
      ion-item {
        --padding-top: 10px;
        --padding-bottom: 10px;
      }

      h3 {
        font-weight: 600;
        font-size: 15px;
      }

      .free-value {
        font-size: 13px;
        color: var(--ion-color-medium);
        display: flex;
        align-items: center;
        gap: 4px;

        ion-icon {
          font-size: 16px;
        }
      }
    }

    .pro-value {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-success);

      ion-icon {
        font-size: 18px;
      }
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin: 0 0 20px;
      padding-top: 14px;
      align-items: stretch;
      overflow: visible;
    }

    .pricing-card {
      margin: 0;
      border-radius: 16px;
      border: 2px solid var(--ion-color-light-shade);
      transition:
        border-color 0.2s,
        transform 0.2s;
      position: relative;
      overflow: visible;

      &.selected {
        border-color: var(--ion-color-primary);
      }

      &.annual.selected {
        border-color: var(--ion-color-success);
      }

      ion-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 24px 6px;
        height: 100%;
        box-sizing: border-box;
      }
    }

    .popular-badge,
    .best-value-badge {
      position: absolute;
      top: 8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      font-weight: 700;
      z-index: 1;
      white-space: nowrap;
    }

    .plan-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--ion-text-color);
      text-align: center;
      line-height: 1.2;
    }

    .plan-price {
      font-size: 22px;
      font-weight: 800;
      color: var(--ion-text-color);
      white-space: nowrap;
    }

    .plan-period {
      font-size: 11px;
      color: var(--ion-color-medium);
    }

    .plan-equivalent {
      font-size: 10px;
      color: var(--ion-color-success);
      font-weight: 600;
      margin-top: 2px;
    }

    .save-badge {
      font-size: 9px;
      margin-top: 4px;
    }

    .subscribe-btn {
      margin: 20px 0 8px;
      --border-radius: 12px;
      font-weight: 700;
      height: 50px;
    }

    .terms-footer {
      text-align: center;
      font-size: 11px;
      color: var(--ion-color-medium);
      margin: 16px 0 32px;
      line-height: 1.5;
      padding: 0 16px;
    }
  `,
})
export class ProUpgradePage implements OnInit {
  subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private translate = inject(TranslateService);

  selectedPlan = signal<"weekly" | "monthly" | "annual">("monthly");

  constructor() {
    addIcons({
      checkmarkCircle,
      closeCircle,
      chevronBackOutline,
      sparklesOutline,
      ribbonOutline,
    });
  }

  ngOnInit(): void {
    this.subscriptionService.fetchOfferings();

    // If already Pro, redirect back
    if (this.authService.user()?.isPro) {
      this.router.navigate(["/tabs/profile"]);
    }
  }

  async onSubscribe(): Promise<void> {
    let offering;
    switch (this.selectedPlan()) {
      case "weekly":
        offering = this.subscriptionService.getWeeklyOffering();
        break;
      case "annual":
        offering = this.subscriptionService.getAnnualOffering();
        break;
      default:
        offering = this.subscriptionService.getMonthlyOffering();
    }

    if (!offering) {
      await this.showToast(
        this.translate.instant("pro.unavailable"),
        "warning",
      );
      return;
    }

    const result = await this.subscriptionService.purchase(offering);
    if (result.success) {
      await this.showToast(
        this.translate.instant("pro.purchaseSuccess"),
        "success",
      );
      this.router.navigate(["/tabs/profile"]);
    }
  }

  async onRestore(): Promise<void> {
    const result = await this.subscriptionService.restorePurchases();
    if (result.success) {
      await this.showToast(
        this.translate.instant("pro.restoreSuccess"),
        "success",
      );
      this.router.navigate(["/tabs/profile"]);
    } else {
      await this.showToast(
        this.translate.instant("pro.restoreFailed"),
        "warning",
      );
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: "bottom",
    });
    await toast.present();
  }
}
