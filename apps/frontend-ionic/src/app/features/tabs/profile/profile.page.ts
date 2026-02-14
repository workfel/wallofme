import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonButtons,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAvatar,
  IonChip,
  IonSpinner,
  IonModal,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  languageOutline,
  moonOutline,
  starOutline,
  personCircleOutline,
  flameOutline,
  settingsOutline,
  ribbonOutline,
  documentTextOutline,
  createOutline,
  arrowForwardOutline,
} from 'ionicons/icons';

import { AuthService } from '@app/core/services/auth.service';
import { TokenService } from '@app/core/services/token.service';
import { RoomService } from '@app/core/services/room.service';
import { TrophyService, type Trophy } from '@app/core/services/trophy.service';
import { UserService } from '@app/core/services/user.service';
import { ProBadgeComponent } from '@app/shared/components/pro-badge/pro-badge.component';

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
    IonButtons,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonAvatar,
    IonChip,
    IonSpinner,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    ProBadgeComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'profile.title' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showSettings.set(true)">
            <ion-icon name="settings-outline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Hero Header -->
      <div class="hero-header animate-fade-in">
        <div class="avatar-wrapper">
          <ion-avatar class="avatar-large" (click)="onEditProfile()">
            @if (authService.user()?.image) {
              <img [src]="authService.user()!.image!" alt="avatar" />
            } @else {
              <ion-icon name="person-circle-outline" class="avatar-placeholder" />
            }
          </ion-avatar>
          <div class="avatar-edit-badge" (click)="onEditProfile()">
            <ion-icon name="create-outline" />
          </div>
        </div>

        <h2 class="display-name">
          {{ authService.user()?.displayName || authService.user()?.name }}
          @if (authService.user()?.isPro) {
            <app-pro-badge size="medium" />
          }
        </h2>

        @if (userService.profile()?.country) {
          <ion-text color="medium">
            <p class="country-label">{{ userService.profile()!.country }}</p>
          </ion-text>
        }

        @if (userService.profile()?.sports; as sports) {
          @if (sports.length > 0) {
            <div class="sport-chips">
              @for (sport of sports; track sport) {
                <ion-chip outline color="primary" class="sport-chip">
                  {{ 'sports.' + sport | translate }}
                </ion-chip>
              }
            </div>
          }
        }
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar animate-fade-in-up">
        <div class="stat-item">
          <span class="stat-value">{{ trophyService.trophies().length }}</span>
          <span class="stat-label">{{ 'profile.statTrophies' | translate }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ roomService.room()?.likeCount || 0 }}</span>
          <span class="stat-label">{{ 'profile.statLikes' | translate }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ roomService.room()?.viewCount || 0 }}</span>
          <span class="stat-label">{{ 'profile.statViews' | translate }}</span>
        </div>
      </div>

      <!-- Pro Banner -->
      @if (!authService.user()?.isPro) {
        <div class="pro-banner" (click)="onUpgradePro()">
          <div class="pro-banner-content">
            <ion-icon name="star-outline" color="warning" />
            <span>{{ 'profile.proBanner' | translate }}</span>
          </div>
          <ion-button fill="clear" size="small" color="warning">
            {{ 'profile.goProCta' | translate }}
            <ion-icon slot="end" name="arrow-forward-outline" />
          </ion-button>
        </div>
      }

      <!-- Trophy Grid -->
      @if (trophyService.loading()) {
        <div class="grid-loading">
          <ion-spinner name="crescent" />
        </div>
      } @else if (trophyService.trophies().length === 0) {
        <div class="empty-state animate-fade-in">
          <ion-icon name="ribbon-outline" class="empty-icon" />
          <ion-text color="medium">
            <p>{{ 'profile.noTrophies' | translate }}</p>
          </ion-text>
        </div>
      } @else {
        <div class="trophy-grid animate-fade-in-up">
          @for (trophy of trophyService.trophies(); track trophy.id) {
            <div class="trophy-cell" (click)="goToTrophy(trophy.id)">
              @if (trophy.thumbnailUrl) {
                <img [src]="trophy.thumbnailUrl" [alt]="trophy.type" class="trophy-img" loading="lazy" />
              } @else {
                <div class="trophy-fallback">
                  <ion-icon [name]="trophy.type === 'medal' ? 'ribbon-outline' : 'document-text-outline'" />
                </div>
              }
              @if (trophy.status === 'processing' || trophy.status === 'pending') {
                <div class="trophy-processing-overlay">
                  <ion-spinner name="crescent" color="light" />
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Settings Bottom Sheet -->
      <ion-modal
        [isOpen]="showSettings()"
        [initialBreakpoint]="0.45"
        [breakpoints]="[0, 0.45]"
        (didDismiss)="showSettings.set(false)"
      >
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ 'profile.settings' | translate }}</ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list lines="inset">
              <ion-item button [detail]="true" (click)="onGetTokens()">
                <ion-icon slot="start" name="flame-outline" color="warning" />
                <ion-label>
                  <h3>{{ 'tokens.title' | translate }}</h3>
                  <p>{{ tokenService.balance() }} {{ 'tokens.flames' | translate }}</p>
                </ion-label>
              </ion-item>
              <ion-item button [detail]="true">
                <ion-icon slot="start" name="language-outline" />
                <ion-label>{{ 'profile.language' | translate }}</ion-label>
              </ion-item>
              <ion-item button [detail]="true">
                <ion-icon slot="start" name="moon-outline" />
                <ion-label>{{ 'profile.theme' | translate }}</ion-label>
              </ion-item>
              @if (!authService.user()?.isPro) {
                <ion-item button [detail]="true" (click)="onUpgradePro()">
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
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: `
    .hero-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 24px 16px;
    }

    .avatar-wrapper {
      position: relative;
      margin-bottom: 12px;
    }

    .avatar-large {
      width: 100px;
      height: 100px;
      cursor: pointer;
    }

    .avatar-placeholder {
      font-size: 100px;
      color: var(--ion-color-step-300);
    }

    .avatar-edit-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

      ion-icon {
        font-size: 14px;
      }
    }

    .display-name {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 2px;
      text-align: center;
    }

    .country-label {
      font-size: 14px;
      margin: 0 0 8px;
    }

    .sport-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px;
      margin-top: 4px;
    }

    .sport-chip {
      height: 26px;
      font-size: 12px;
      margin: 0;
      --padding-start: 10px;
      --padding-end: 10px;
    }

    .stats-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 8px 16px 16px;
      padding: 14px 0;
      background: var(--ion-color-step-50);
      border-radius: 16px;
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 800;
    }

    .stat-label {
      font-size: 12px;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-divider {
      width: 1px;
      height: 28px;
      background: var(--ion-color-step-200);
    }

    .pro-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0 16px 16px;
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(245, 166, 35, 0.08) 0%, rgba(255, 215, 0, 0.08) 100%);
      border-left: 3px solid var(--ion-color-warning);
      border-radius: 12px;
    }

    .pro-banner-content {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;

      ion-icon {
        font-size: 20px;
      }
    }

    .trophy-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
      padding: 0 2px;
    }

    .trophy-cell {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      cursor: pointer;
      background: var(--ion-color-step-50);

      &:active {
        opacity: 0.85;
      }
    }

    .trophy-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .trophy-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-100);

      ion-icon {
        font-size: 32px;
        color: var(--ion-color-step-400);
      }
    }

    .trophy-processing-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .grid-loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      text-align: center;

      .empty-icon {
        font-size: 48px;
        color: var(--ion-color-step-300);
        margin-bottom: 12px;
      }

      p {
        margin: 0;
        font-size: 15px;
      }
    }

    .logout-section {
      padding: 16px;
    }
  `,
})
export class ProfilePage implements OnInit {
  authService = inject(AuthService);
  tokenService = inject(TokenService);
  roomService = inject(RoomService);
  trophyService = inject(TrophyService);
  userService = inject(UserService);
  private router = inject(Router);

  showSettings = signal(false);

  constructor() {
    addIcons({
      logOutOutline,
      languageOutline,
      moonOutline,
      starOutline,
      personCircleOutline,
      flameOutline,
      settingsOutline,
      ribbonOutline,
      documentTextOutline,
      createOutline,
      arrowForwardOutline,
    });
  }

  ngOnInit(): void {
    this.trophyService.fetchTrophies();
    this.roomService.fetchMyRoom();
    this.userService.fetchProfile();
    this.tokenService.fetchBalance();
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await Promise.all([
      this.trophyService.fetchTrophies(),
      this.roomService.fetchMyRoom(),
      this.userService.fetchProfile(),
    ]);
    (event.target as HTMLIonRefresherElement).complete();
  }

  onEditProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  goToTrophy(id: string): void {
    this.router.navigate(['/trophy', id]);
  }

  onGetTokens(): void {
    this.showSettings.set(false);
    this.router.navigate(['/tokens']);
  }

  onUpgradePro(): void {
    this.showSettings.set(false);
    this.router.navigate(['/pro']);
  }

  async onLogout(): Promise<void> {
    this.showSettings.set(false);
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }
}
