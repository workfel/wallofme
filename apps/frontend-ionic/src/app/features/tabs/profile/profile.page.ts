import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import {
  ActionSheetController,
  IonAvatar,
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from "@ionic/angular/standalone";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  arrowForwardOutline,
  checkmarkOutline,
  createOutline,
  documentTextOutline,
  flameOutline,
  helpCircleOutline,
  languageOutline,
  logOutOutline,
  moonOutline,
  peopleOutline,
  personCircleOutline,
  ribbonOutline,
  settingsOutline,
  starOutline,
} from "ionicons/icons";

import { AppThemeService } from "@app/core/services/app-theme.service";
import { AuthService } from "@app/core/services/auth.service";
import { RoomService } from "@app/core/services/room.service";
import { TokenService } from "@app/core/services/token.service";
import { TrophyService } from "@app/core/services/trophy.service";
import { UserService } from "@app/core/services/user.service";
import { ProBadgeComponent } from "@app/shared/components/pro-badge/pro-badge.component";
import { ReferralService } from "@app/core/services/referral.service";
import { TutorialService } from "@app/core/services/tutorial.service";
import { ReferralCardComponent } from "@app/shared/components/referral-card/referral-card.component";

@Component({
  selector: "app-profile",
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
    IonChip,
    IonSpinner,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    ProBadgeComponent,
    ReferralCardComponent,
  ],
  template: `
    <ion-content [fullscreen]="true">
      <!-- Floating settings button -->
      <div class="floating-toolbar">
        <div class="toolbar-spacer"></div>
        <button
          class="toolbar-pill settings-pill"
          (click)="showSettings.set(true)"
        >
          <ion-icon name="settings-outline" />
        </button>
      </div>
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
              <ion-icon
                name="person-circle-outline"
                class="avatar-placeholder"
              />
            }
          </ion-avatar>
          <div class="avatar-edit-badge" (click)="onEditProfile()" aria-hidden>
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
                  {{ "sports." + sport | translate }}
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
          <span class="stat-label">{{
            "profile.statTrophies" | translate
          }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{
            roomService.room()?.likeCount || 0
          }}</span>
          <span class="stat-label">{{ "profile.statLikes" | translate }}</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{
            roomService.room()?.viewCount || 0
          }}</span>
          <span class="stat-label">{{ "profile.statViews" | translate }}</span>
        </div>
      </div>

      <!-- Referral Card -->
      <app-referral-card />

      <!-- Pro Banner -->
      @if (!authService.user()?.isPro) {
        <div class="pro-banner" (click)="onUpgradePro()" aria-hidden>
          <div class="pro-banner-content">
            <ion-icon name="star-outline" color="warning" />
            <span>{{ "profile.proBanner" | translate }}</span>
          </div>
          <ion-button fill="clear" size="small" color="warning">
            {{ "profile.goProCta" | translate }}
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
            <p>{{ "profile.noTrophies" | translate }}</p>
          </ion-text>
        </div>
      } @else {
        <div class="trophy-grid animate-fade-in-up">
          @for (trophy of trophyService.trophies(); track trophy.id) {
            <div
              class="trophy-cell"
              (click)="goToTrophy(trophy.id)"
              aria-hidden
            >
              @if (trophy.thumbnailUrl) {
                <img
                  [src]="trophy.thumbnailUrl"
                  [alt]="trophy.type"
                  class="trophy-img"
                  loading="lazy"
                />
              } @else {
                <div class="trophy-fallback">
                  <ion-icon
                    [name]="
                      trophy.type === 'medal'
                        ? 'ribbon-outline'
                        : 'document-text-outline'
                    "
                  />
                </div>
              }
              @if (
                trophy.status === "processing" || trophy.status === "pending"
              ) {
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
        [initialBreakpoint]="0.52"
        [breakpoints]="[0, 0.52]"
        (didDismiss)="showSettings.set(false)"
      >
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ "profile.settings" | translate }}</ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list lines="inset">
              <ion-item button [detail]="true" (click)="onGetTokens()">
                <ion-icon slot="start" name="flame-outline" color="warning" />
                <ion-label>
                  <h3>{{ "tokens.title" | translate }}</h3>
                  <p>
                    {{ tokenService.balance() }}
                    {{ "tokens.flames" | translate }}
                  </p>
                </ion-label>
              </ion-item>
              <ion-item button [detail]="true" (click)="onChangeLanguage()">
                <ion-icon slot="start" name="language-outline" />
                <ion-label>
                  {{ "profile.language" | translate }}
                  <p>{{ currentLanguage() }}</p>
                </ion-label>
              </ion-item>
              <ion-item button [detail]="true" (click)="onChangeTheme()">
                <ion-icon slot="start" name="moon-outline" />
                <ion-label>
                  {{ "profile.theme" | translate }}
                  <p>{{ currentTheme() | translate }}</p>
                </ion-label>
              </ion-item>
              <ion-item button [detail]="true" (click)="onInviteFriends()">
                <ion-icon slot="start" name="people-outline" color="primary" />
                <ion-label>{{ "referral.settingsEntry" | translate }}</ion-label>
              </ion-item>
              <ion-item button [detail]="true" (click)="onReplayTutorial()">
                <ion-icon slot="start" name="help-circle-outline" />
                <ion-label>{{ "profile.replayTutorial" | translate }}</ion-label>
              </ion-item>
              @if (!authService.user()?.isPro) {
                <ion-item button [detail]="true" (click)="onUpgradePro()">
                  <ion-icon slot="start" name="star-outline" color="warning" />
                  <ion-label color="warning">{{
                    "profile.pro" | translate
                  }}</ion-label>
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
                {{ "profile.logout" | translate }}
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: `
    :host {
      --toolbar-top: var(--ion-safe-area-top, 20px);
    }



    /* Floating toolbar */
    .floating-toolbar {
      position: sticky;
      top: calc(var(--toolbar-top) + 8px);
      left: 16px;
      right: 16px;
      margin: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 100;
      pointer-events: none;
    }

    .toolbar-pill {
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-family: inherit;
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease;

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 22px;
        color: var(--ion-text-color);
      }
    }

    .toolbar-spacer {
      flex: 1;
    }

    /* Glass Card Shared Styles */
    .glass-card {
      background: var(--wom-glass-bg);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 24px;
    }

    .hero-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 24px 24px;
      margin: 16px;
      background: var(--wom-glass-bg);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 24px;
    }

    .avatar-wrapper {
      position: relative;
      margin-bottom: 16px;

      &::before {
        content: "";
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: linear-gradient(
          135deg,
          var(--wom-glass-border-ring),
          var(--wom-glass-bg-wash)
        );
        z-index: 0;
      }
    }

    .avatar-large {
      width: 100px;
      height: 100px;
      cursor: pointer;
      position: relative;
      z-index: 1;
      border: 4px solid var(--wom-glass-border-ring);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .avatar-placeholder {
      font-size: 100px;
      color: var(--ion-color-step-300);
    }

    .avatar-edit-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.4);
      z-index: 2;
      border: 2px solid var(--ion-background-color);

      ion-icon {
        font-size: 16px;
      }
    }

    .display-name {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 4px;
      text-align: center;
      color: var(--ion-text-color);
      letter-spacing: -0.02em;
    }

    .country-label {
      font-size: 15px;
      margin: 0 0 12px;
      color: var(--ion-color-step-600);
      font-weight: 500;
    }

    .sport-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      margin-top: 8px;
    }

    .sport-chip {
      height: 28px;
      font-size: 12px;
      margin: 0;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      color: var(--ion-color-primary);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
      font-weight: 600;
      --padding-start: 12px;
      --padding-end: 12px;
    }

    .stats-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 16px 20px;
      padding: 16px 0;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 24px;
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: var(--ion-text-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--ion-color-step-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: var(--wom-divider);
    }

    .pro-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0 16px 24px;
      padding: 14px 20px;
      background: var(--wom-gold-bg);
      border: 1px solid var(--wom-gold-border);
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(255, 200, 0, 0.15);
    }

    .pro-banner-content {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 700;
      color: var(--wom-gold-text);

      ion-icon {
        font-size: 22px;
      }
    }

    .trophy-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 0 16px 40px;
    }

    .trophy-cell {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      cursor: pointer;
      border-radius: 16px;
      background: var(--wom-glass-bg-subtle);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border-strong);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:active {
        transform: scale(0.96);
        background: var(--wom-glass-bg-medium);
      }
    }

    .trophy-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;

      .trophy-cell:hover & {
        transform: scale(1.05);
      }
    }

    .trophy-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--wom-glass-bg-wash);

      ion-icon {
        font-size: 32px;
        color: rgba(var(--ion-color-primary-rgb), 0.5);
      }
    }

    .trophy-processing-overlay {
      position: absolute;
      inset: 0;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(4px);
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
      padding: 64px 24px;
      text-align: center;

      @extend .glass-card;
      margin: 0 16px;
      background: var(--wom-glass-bg-wash);

      .empty-icon {
        font-size: 56px;
        color: rgba(var(--ion-color-medium-rgb), 0.5);
        margin-bottom: 16px;
      }

      p {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--ion-color-medium);
      }
    }

    .logout-section {
      padding: 16px;
    }
  `,
})
export class ProfilePage implements ViewWillEnter {
  authService = inject(AuthService);
  tokenService = inject(TokenService);
  roomService = inject(RoomService);
  trophyService = inject(TrophyService);
  userService = inject(UserService);
  private router = inject(Router);
  private actionSheetCtrl = inject(ActionSheetController);
  private translate = inject(TranslateService);
  private appThemeService = inject(AppThemeService);
  private tutorialService = inject(TutorialService);
  private referralService = inject(ReferralService);

  private langChange = toSignal(this.translate.onLangChange);
  private currentLang = computed(() => {
    this.langChange(); // dependency
    return this.translate.currentLang;
  });

  showSettings = signal(false);

  constructor() {
    addIcons({
      logOutOutline,
      languageOutline,
      helpCircleOutline,
      moonOutline,
      starOutline,
      personCircleOutline,
      flameOutline,
      settingsOutline,
      ribbonOutline,
      documentTextOutline,
      createOutline,
      arrowForwardOutline,
      checkmarkOutline,
      peopleOutline,
    });
  }

  ionViewWillEnter(): void {
    this.trophyService.fetchTrophies();
    this.roomService.fetchMyRoom();
    this.userService.fetchProfile();
    this.tokenService.fetchBalance();
    this.referralService.fetchReferralInfo();
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await Promise.all([
      this.trophyService.fetchTrophies(),
      this.roomService.fetchMyRoom(),
      this.userService.fetchProfile(),
      this.referralService.fetchReferralInfo(),
    ]);
    (event.target as HTMLIonRefresherElement).complete();
  }

  onEditProfile(): void {
    this.router.navigate(["/profile/edit"]);
  }

  goToTrophy(id: string): void {
    this.router.navigate(["/trophy", id]);
  }

  onGetTokens(): void {
    this.showSettings.set(false);
    this.router.navigate(["/tokens"]);
  }

  onUpgradePro(): void {
    this.showSettings.set(false);
    this.router.navigate(["/pro"]);
  }

  async onInviteFriends(): Promise<void> {
    this.showSettings.set(false);
    await this.referralService.fetchReferralInfo();
    this.referralService.shareReferralLink();
  }

  async onReplayTutorial(): Promise<void> {
    this.showSettings.set(false);
    await this.tutorialService.resetCompletion();
    this.router.navigate(["/room/edit"], {
      queryParams: { tutorial: "true" },
    });
  }

  async onLogout(): Promise<void> {
    this.showSettings.set(false);
    await this.authService.signOut();
    this.router.navigate(["/auth/login"]);
  }

  currentLanguage = computed(() => {
    return this.currentLang() === "fr" ? "Français" : "English";
  });

  currentTheme = computed(() => {
    const mode = this.appThemeService.mode();
    switch (mode) {
      case "dark":
        return "profile.themeDark";
      case "light":
        return "profile.themeLight";
      default:
        return "profile.themeSystem";
    }
  });

  async onChangeLanguage(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant("profile.language"),
      buttons: [
        {
          text: "English",
          icon:
            this.translate.currentLang === "en"
              ? "checkmark-outline"
              : undefined,
          handler: () => this.setLanguage("en"),
        },
        {
          text: "Français",
          icon:
            this.translate.currentLang === "fr"
              ? "checkmark-outline"
              : undefined,
          handler: () => this.setLanguage("fr"),
        },
        {
          text: this.translate.instant("common.cancel"),
          role: "cancel",
        },
      ],
    });
    await actionSheet.present();
  }

  private async setLanguage(lang: string): Promise<void> {
    if (this.translate.currentLang === lang) return;
    this.translate.use(lang);
    await this.userService.updateProfile({ locale: lang });
  }

  async onChangeTheme(): Promise<void> {
    const current = this.appThemeService.mode();
    const actionSheet = await this.actionSheetCtrl.create({
      header: this.translate.instant("profile.theme"),
      buttons: [
        {
          text: this.translate.instant("profile.themeSystem"),
          icon: current === "system" ? "checkmark-outline" : undefined,
          handler: () => this.appThemeService.setTheme("system"),
        },
        {
          text: this.translate.instant("profile.themeLight"),
          icon: current === "light" ? "checkmark-outline" : undefined,
          handler: () => this.appThemeService.setTheme("light"),
        },
        {
          text: this.translate.instant("profile.themeDark"),
          icon: current === "dark" ? "checkmark-outline" : undefined,
          handler: () => this.appThemeService.setTheme("dark"),
        },
        {
          text: this.translate.instant("common.cancel"),
          role: "cancel",
        },
      ],
    });
    await actionSheet.present();
  }
}
