import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAvatar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  languageOutline,
  moonOutline,
  starOutline,
  personCircleOutline,
} from 'ionicons/icons';

import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonAvatar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'profile.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'profile.title' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="profile-header animate-fade-in">
        <ion-avatar class="avatar">
          @if (authService.user()?.image) {
            <img [src]="authService.user()!.image!" alt="avatar" />
          } @else {
            <ion-icon name="person-circle-outline" class="avatar-placeholder" />
          }
        </ion-avatar>
        <h2 class="name">
          {{ authService.user()?.displayName || authService.user()?.name }}
        </h2>
        <ion-text color="medium">
          <p class="email">{{ authService.user()?.email }}</p>
        </ion-text>
      </div>

      <ion-list lines="inset" class="settings-list">
        <ion-item button [detail]="true">
          <ion-icon slot="start" name="language-outline" />
          <ion-label>{{ 'profile.language' | translate }}</ion-label>
        </ion-item>
        <ion-item button [detail]="true">
          <ion-icon slot="start" name="moon-outline" />
          <ion-label>{{ 'profile.theme' | translate }}</ion-label>
        </ion-item>
        @if (!authService.user()?.isPro) {
          <ion-item button [detail]="true">
            <ion-icon slot="start" name="star-outline" color="warning" />
            <ion-label color="warning">{{ 'profile.pro' | translate }}</ion-label>
          </ion-item>
        }
      </ion-list>

      <div class="logout-section">
        <ion-button
          expand="block"
          fill="clear"
          color="danger"
          (click)="onLogout()"
        >
          <ion-icon slot="start" name="log-out-outline" />
          {{ 'profile.logout' | translate }}
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: `
    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px 24px;
    }

    .avatar {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
    }

    .avatar-placeholder {
      font-size: 80px;
      color: var(--ion-color-step-300);
    }

    .name {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 4px;
    }

    .email {
      font-size: 14px;
      margin: 0;
    }

    .settings-list {
      margin-top: 16px;
    }

    .logout-section {
      padding: 24px 16px;
    }
  `,
})
export class ProfilePage {
  authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({
      logOutOutline,
      languageOutline,
      moonOutline,
      starOutline,
      personCircleOutline,
    });
  }

  async onLogout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }
}
