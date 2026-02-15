import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonSpinner,
  IonIcon,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  logoGoogle,
  logoApple,
  sunnyOutline,
  moonOutline,
  contrastOutline,
} from "ionicons/icons";

import { TranslateService } from "@ngx-translate/core";
import { AuthService } from "@app/core/services/auth.service";
import { I18nService } from "@app/core/services/i18n.service";
import {
  AppThemeService,
  type AppThemeMode,
} from "@app/core/services/app-theme.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonSpinner,
    IonIcon,
  ],
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <div class="register-container animate-fade-in-up">
        <div class="settings-bar">
          <div class="lang-toggle">
            <button
              class="lang-btn"
              [class.active]="i18n.currentLang === 'en'"
              (click)="i18n.setLanguage('en')"
            >
              EN
            </button>
            <span class="lang-sep">|</span>
            <button
              class="lang-btn"
              [class.active]="i18n.currentLang === 'fr'"
              (click)="i18n.setLanguage('fr')"
            >
              FR
            </button>
          </div>
          <button class="theme-btn" (click)="cycleTheme()">
            <ion-icon [name]="themeIcon()" />
          </button>
        </div>
        <div class="logo-section">
          <h1 class="app-title">WallOfMe</h1>
          <p class="app-subtitle">{{ "auth.register" | translate }}</p>
        </div>

        <div class="form-section">
          <ion-list lines="none">
            <ion-item>
              <ion-input
                type="text"
                [label]="'auth.firstname' | translate"
                labelPlacement="floating"
                [(ngModel)]="name"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-input
                type="email"
                [label]="'auth.email' | translate"
                labelPlacement="floating"
                [(ngModel)]="email"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-input
                type="password"
                [label]="'auth.password' | translate"
                labelPlacement="floating"
                [(ngModel)]="password"
              />
            </ion-item>
          </ion-list>

          @if (errorMessage()) {
          <ion-text color="danger">
            <p class="error-text">{{ errorMessage() }}</p>
          </ion-text>
          }

          <ion-button
            expand="block"
            (click)="onRegister()"
            [disabled]="isLoading()"
            class="register-btn"
          >
            @if (isLoading()) {
            <ion-spinner name="crescent" />
            } @else {
            {{ "auth.register" | translate }}
            }
          </ion-button>
        </div>

        <div class="divider">
          <span>{{ "auth.orContinueWith" | translate }}</span>
        </div>

        <div class="social-section">
          <ion-button
            expand="block"
            fill="outline"
            (click)="onSocialLogin('google')"
            [disabled]="isLoading()"
          >
            <ion-icon slot="start" name="logo-google" />
            {{ "auth.google" | translate }}
          </ion-button>

          <!-- <ion-button
            expand="block"
            fill="outline"
            color="dark"
            (click)="onSocialLogin('apple')"
            [disabled]="isLoading()"
          >
            <ion-icon slot="start" name="logo-apple" />
            {{ "auth.apple" | translate }}
          </ion-button> -->
        </div>

        <div class="footer-section">
          <ion-text>
            {{ "auth.hasAccount" | translate }}
            <a routerLink="/auth/login" class="link">
              {{ "auth.login" | translate }}
            </a>
          </ion-text>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .settings-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0 0;
    }

    .lang-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .lang-btn {
      background: none;
      border: none;
      font-size: 13px;
      font-weight: 500;
      color: var(--ion-color-step-500);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;

      &.active {
        color: var(--ion-color-primary);
        font-weight: 700;
        background: rgba(var(--ion-color-primary-rgb), 0.1);
      }
    }

    .lang-sep {
      color: var(--ion-color-step-300);
      font-size: 13px;
    }

    .theme-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      color: var(--ion-color-step-500);
      font-size: 20px;
      display: flex;
      align-items: center;
      transition: all 0.2s;

      ion-icon {
        pointer-events: none;
      }
    }

    .register-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      max-width: 400px;
      margin: 0 auto;
      padding: 24px 0;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 40px;
    }

    .app-title {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: var(--ion-color-primary);
    }

    .app-subtitle {
      font-size: 16px;
      font-weight: 600;
      margin: 8px 0 0;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .form-section ion-item {
      --background: transparent;
      --padding-start: 0;
      margin-bottom: 8px;
    }

    .register-btn {
      margin-top: 16px;
    }

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 24px 0;
      color: var(--ion-color-step-500);
      font-size: 13px;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--ion-color-step-200);
      }

      span {
        padding: 0 16px;
      }
    }

    .social-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-section {
      text-align: center;
      margin-top: 32px;
      font-size: 14px;
    }

    .link {
      color: var(--ion-color-primary);
      text-decoration: none;
      font-weight: 600;
    }
  `,
})
export class RegisterPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  i18n = inject(I18nService);
  appTheme = inject(AppThemeService);

  name = "";
  email = "";
  password = "";
  isLoading = signal(false);
  errorMessage = signal("");

  themeIcon = computed(() => {
    switch (this.appTheme.mode()) {
      case "light":
        return "sunny-outline";
      case "dark":
        return "moon-outline";
      default:
        return "contrast-outline";
    }
  });

  constructor() {
    addIcons({
      logoGoogle,
      logoApple,
      sunnyOutline,
      moonOutline,
      contrastOutline,
    });
  }

  cycleTheme(): void {
    const order: AppThemeMode[] = ["system", "light", "dark"];
    const next =
      order[(order.indexOf(this.appTheme.mode()) + 1) % order.length];
    this.appTheme.setTheme(next);
  }

  async onRegister(): Promise<void> {
    if (!this.name || !this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set("");

    try {
      await this.authService.signUpEmail(this.email, this.password, this.name);
      this.router.navigate(["/onboarding"]);
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error
          ? e.message
          : this.translate.instant("auth.registrationFailed")
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSocialLogin(provider: "google" | "apple"): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set("");
    try {
      await this.authService.signInSocial(provider);
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error
          ? e.message
          : this.translate.instant("auth.socialLoginFailed")
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
