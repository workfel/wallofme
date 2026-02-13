import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { logoGoogle, logoApple } from 'ionicons/icons';

import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-login',
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
      <div class="login-container animate-fade-in-up">
        <div class="logo-section">
          <h1 class="app-title">WallOfMe</h1>
          <p class="app-subtitle">{{ 'auth.appSubtitle' | translate }}</p>
        </div>

        <div class="form-section">
          <ion-list lines="none">
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
            (click)="onLogin()"
            [disabled]="isLoading()"
            class="login-btn"
          >
            @if (isLoading()) {
              <ion-spinner name="crescent" />
            } @else {
              {{ 'auth.login' | translate }}
            }
          </ion-button>
        </div>

        <div class="divider">
          <span>{{ 'auth.orContinueWith' | translate }}</span>
        </div>

        <div class="social-section">
          <ion-button
            expand="block"
            fill="outline"
            (click)="onSocialLogin('google')"
            [disabled]="isLoading()"
          >
            <ion-icon slot="start" name="logo-google" />
            {{ 'auth.google' | translate }}
          </ion-button>

          <ion-button
            expand="block"
            fill="outline"
            color="dark"
            (click)="onSocialLogin('apple')"
            [disabled]="isLoading()"
          >
            <ion-icon slot="start" name="logo-apple" />
            {{ 'auth.apple' | translate }}
          </ion-button>
        </div>

        <div class="footer-section">
          <ion-text>
            {{ 'auth.noAccount' | translate }}
            <a routerLink="/auth/register" class="link">
              {{ 'auth.register' | translate }}
            </a>
          </ion-text>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .login-container {
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
      font-size: 14px;
      opacity: 0.6;
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

    .login-btn {
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
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {
    addIcons({ logoGoogle, logoApple });
  }

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.signInEmail(this.email, this.password);
      this.navigateAfterAuth();
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error ? e.message : this.translate.instant('auth.loginFailed')
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSocialLogin(provider: 'google' | 'apple'): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.signInSocial(provider);
      // On native: signInSocial resolves after OAuth completes
      // On web: browser redirects, this never reaches
      this.navigateAfterAuth();
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error ? e.message : this.translate.instant('auth.socialLoginFailed')
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private navigateAfterAuth(): void {
    if (this.authService.hasCompletedOnboarding()) {
      this.router.navigate(['/tabs']);
    } else {
      this.router.navigate(['/onboarding']);
    }
  }
}
