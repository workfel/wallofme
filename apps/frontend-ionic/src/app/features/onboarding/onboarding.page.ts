import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-onboarding',
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
      <div class="onboarding-container animate-fade-in-up">
        <div class="header-section">
          <h1>{{ 'onboarding.title' | translate }}</h1>
          <p>{{ 'onboarding.subtitle' | translate }}</p>
        </div>

        <div class="form-section">
          <ion-list lines="none">
            <ion-item>
              <ion-input
                type="text"
                [label]="'onboarding.firstName' | translate"
                labelPlacement="floating"
                [(ngModel)]="firstName"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-input
                type="text"
                [label]="'onboarding.lastName' | translate"
                labelPlacement="floating"
                [(ngModel)]="lastName"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-input
                type="text"
                [label]="'onboarding.country' | translate"
                labelPlacement="floating"
                [(ngModel)]="country"
                [clearInput]="true"
                maxlength="3"
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
            (click)="onContinue()"
            [disabled]="isLoading()"
            class="continue-btn"
          >
            @if (isLoading()) {
              <ion-spinner name="crescent" />
            } @else {
              {{ 'onboarding.continue' | translate }}
            }
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: `
    .onboarding-container {
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
        font-size: 28px;
        font-weight: 800;
        margin: 0 0 12px;
      }

      p {
        font-size: 15px;
        opacity: 0.6;
        margin: 0;
        line-height: 1.5;
      }
    }

    .form-section ion-item {
      --background: transparent;
      --padding-start: 0;
      margin-bottom: 8px;
    }

    .continue-btn {
      margin-top: 24px;
    }

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
    }
  `,
})
export class OnboardingPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  country = '';
  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user) return;

    // Pre-fill from existing custom fields
    if (user.firstName) {
      this.firstName = user.firstName;
    }
    if (user.lastName) {
      this.lastName = user.lastName;
    }
    if (user.country) {
      this.country = user.country;
    }

    // Fallback: parse from name (e.g. Google OAuth sets "Johan Pujol")
    if (!this.firstName && !this.lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      this.firstName = parts[0] ?? '';
      this.lastName = parts.slice(1).join(' ');
    }
  }

  async onContinue(): Promise<void> {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.errorMessage.set('onboarding.fieldsRequired');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.updateUser({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        country: this.country.trim().toUpperCase() || undefined,
        displayName: `${this.firstName.trim()} ${this.lastName.trim()}`,
      });
      this.router.navigate(['/tabs']);
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error ? e.message : 'Update failed'
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
