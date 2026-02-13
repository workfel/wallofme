import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonSpinner,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonSpinner,
  ],
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <div class="otp-container animate-fade-in-up">
        <div class="header-section">
          <h1>{{ 'auth.verifyEmail' | translate }}</h1>
          <p>{{ 'auth.otpSent' | translate }}</p>
        </div>

        <div class="form-section">
          <ion-list lines="none">
            <ion-item>
              <ion-input
                type="text"
                [label]="'auth.otpPlaceholder' | translate"
                labelPlacement="floating"
                [(ngModel)]="otpCode"
                inputmode="numeric"
                maxlength="6"
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
            (click)="onVerify()"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
              <ion-spinner name="crescent" />
            } @else {
              {{ 'common.confirm' | translate }}
            }
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .otp-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      max-width: 400px;
      margin: 0 auto;
      padding: 24px 0;
    }

    .header-section {
      text-align: center;
      margin-bottom: 40px;

      h1 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px;
      }

      p {
        font-size: 14px;
        opacity: 0.6;
        margin: 0;
      }
    }

    .form-section ion-item {
      --background: transparent;
      --padding-start: 0;
      margin-bottom: 16px;
    }

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
    }
  `,
})
export class OtpPage {
  private translate = inject(TranslateService);

  otpCode = '';
  isLoading = signal(false);
  errorMessage = signal('');

  async onVerify(): Promise<void> {
    if (!this.otpCode || this.otpCode.length < 6) return;
    // OTP verification would be implemented when BetterAuth supports it
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      // TODO: Implement OTP verification
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error ? e.message : this.translate.instant('auth.verificationFailed')
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
