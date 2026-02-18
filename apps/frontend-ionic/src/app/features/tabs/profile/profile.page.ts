import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import {
  ActionSheetController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
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
  cubeOutline,
  flameOutline,
  helpCircleOutline,
  languageOutline,
  logOutOutline,
  moonOutline,
  peopleOutline,
  personCircleOutline,
  settingsOutline,
  starOutline,
} from "ionicons/icons";

import { AppThemeService } from "@app/core/services/app-theme.service";
import { AuthService } from "@app/core/services/auth.service";
import { RoomService } from "@app/core/services/room.service";
import { TokenService } from "@app/core/services/token.service";
import { TrophyService } from "@app/core/services/trophy.service";
import { UserService } from "@app/core/services/user.service";
import { ReferralService } from "@app/core/services/referral.service";
import { TutorialService } from "@app/core/services/tutorial.service";
import { ProfileInfoComponent } from "@app/shared/components/profile-info/profile-info.component";
import { StatsRowComponent } from "@app/shared/components/stats-row/stats-row.component";
import {
  TrophyGridComponent,
  type TrophyGridItem,
} from "@app/shared/components/trophy-grid/trophy-grid.component";
import { ReferralCardComponent } from "@app/shared/components/referral-card/referral-card.component";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    ProfileInfoComponent,
    StatsRowComponent,
    TrophyGridComponent,
    ReferralCardComponent,
  ],
  template: `
    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Banner -->
      <div class="banner">
        <div class="floating-toolbar">
          <div class="toolbar-spacer"></div>
          <button class="toolbar-pill" (click)="showSettings.set(true)">
            <ion-icon name="settings-outline" />
          </button>
        </div>
      </div>

      <!-- Card body -->
      <div class="card-body">
        <!-- Avatar overlapping banner / card -->
        <div class="avatar-anchor">
          <div class="avatar-ring" (click)="onEditProfile()">
            @if (authService.user()?.image) {
            <img
              [src]="authService.user()!.image!"
              alt="avatar"
              class="avatar-img"
            />
            } @else {
            <div class="avatar-placeholder-wrapper">
              <ion-icon
                name="person-circle-outline"
                class="avatar-placeholder"
              />
            </div>
            }
            <div class="avatar-edit-badge">
              <ion-icon name="create-outline" />
            </div>
          </div>
        </div>

        <app-profile-info
          [displayName]="
            authService.user()?.displayName || authService.user()?.name || ''
          "
          [isPro]="authService.user()?.isPro ?? false"
          [country]="userService.profile()?.country ?? null"
          [sports]="userService.profile()?.sports ?? []"
        />

        <app-stats-row [stats]="profileStats()" variant="inline" />

        <!-- Action buttons -->
        <div class="action-row">
          <button class="action-btn secondary" (click)="onEditProfile()">
            <ion-icon name="create-outline" />
            {{ "profileEdit.title" | translate }}
          </button>
          <button class="action-btn primary" (click)="visitMyRoom()">
            <ion-icon name="cube-outline" />
            {{ "publicProfile.visitRoom" | translate }}
          </button>
        </div>

        <!-- Referral Card -->
        <div class="below-card">
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
        </div>

        <app-trophy-grid
          [trophies]="trophyGridItems()"
          [loading]="trophyService.loading()"
          [clickable]="true"
          emptyMessage="profile.noTrophies"
          (trophyClick)="goToTrophy($event)"
        />
      </div>

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
                <ion-label>{{
                  "referral.settingsEntry" | translate
                }}</ion-label>
              </ion-item>
              <ion-item button [detail]="true" (click)="onReplayTutorial()">
                <ion-icon slot="start" name="help-circle-outline" />
                <ion-label>{{
                  "profile.replayTutorial" | translate
                }}</ion-label>
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
      --banner-height: 150px;
      --avatar-size: 110px;
      --avatar-overlap: 55px;
    }

    /* ── Banner ─────────────────────────────── */
    .banner {
      position: relative;
      height: var(--banner-height);
      background: linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%);
      overflow: hidden;
      border-bottom-left-radius: 40px;
      border-bottom-right-radius: 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      margin-bottom: 20px;

      &::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(
            circle at 20% 80%,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 50%
          ),
          radial-gradient(
            circle at 80% 20%,
            rgba(255, 255, 255, 0.05) 0%,
            transparent 40%
          );
      }
    }

    .floating-toolbar {
      position: absolute;
      top: calc(var(--toolbar-top) + 8px);
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }

    .toolbar-pill {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--wom-glass-border-subtle);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #fff;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-family: inherit;
      transition: transform 0.18s ease;

      &:active {
        transform: scale(0.9);
        background: rgba(0, 0, 0, 0.6);
      }

      ion-icon {
        font-size: 22px;
      }
    }

    .toolbar-spacer {
      width: 44px;
    }

    /* ── Card body ───────────────────────────── */
    .card-body {
      position: relative;
      margin: -80px 0px 0px;
      padding-top: calc(var(--avatar-overlap) + 8px);
      min-height: 200px;
      background: var(--wom-glass-bg);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      border-radius: 32px;
    }

    /* ── Avatar ──────────────────────────────── */
    .avatar-anchor {
      position: absolute;
      top: calc(-1 * var(--avatar-overlap));
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      z-index: 5;
    }

    .avatar-ring {
      position: relative;
      width: var(--avatar-size);
      height: var(--avatar-size);
      border-radius: 50%;
      border: 4px solid var(--wom-glass-border-ring);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      overflow: visible;
      background: var(--ion-color-step-100);
      cursor: pointer;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 50%;
    }

    .avatar-placeholder-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-100);
      border-radius: 50%;
    }

    .avatar-placeholder {
      font-size: 72px;
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
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.4);
      z-index: 2;
      border: 2px solid var(--ion-background-color);

      ion-icon {
        font-size: 16px;
      }
    }

    /* ── Action buttons ────────────────────── */
    .action-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 24px 24px 28px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease;

      &:active {
        transform: scale(0.96);
      }

      ion-icon {
        font-size: 18px;
      }
    }

    .action-btn.primary {
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      border: none;
      box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4);
    }

    .action-btn.secondary {
      background: var(--wom-glass-bg-medium);
      color: var(--ion-text-color);
      border: 1px solid var(--wom-glass-border-strong);
    }

    /* ── Below card ─────────────────────────── */
    .below-card {
      padding: 20px 0 0;
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
    this.langChange();
    return this.translate.currentLang;
  });

  showSettings = signal(false);

  profileStats = computed(() => [
    {
      value: this.trophyService.trophies().length,
      label: "profile.statTrophies",
    },
    {
      value: this.roomService.room()?.likeCount || 0,
      label: "profile.statLikes",
    },
    {
      value: this.roomService.room()?.viewCount || 0,
      label: "profile.statViews",
    },
  ]);

  trophyGridItems = computed<TrophyGridItem[]>(() =>
    this.trophyService.trophies().map((t) => ({
      id: t.id,
      type: t.type,
      thumbnailUrl: t.thumbnailUrl,
      status: t.status,
    }))
  );

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
      createOutline,
      arrowForwardOutline,
      checkmarkOutline,
      peopleOutline,
      cubeOutline,
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

  visitMyRoom(): void {
    this.router.navigate(["/room/edit"]);
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
