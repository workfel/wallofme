import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { NgtCanvas } from "angular-three/dom";
import { addIcons } from "ionicons";
import {
  cameraOutline,
  createOutline,
  eyeOutline,
  heartOutline,
  infiniteOutline,
  lockClosedOutline,
  personCircleOutline,
  rocketOutline,
  trophyOutline,
} from "ionicons/icons";

import { AuthService } from "@app/core/services/auth.service";
import { RoomService } from "@app/core/services/room.service";
import { ThemeService } from "@app/core/services/theme.service";
import { UserService } from "@app/core/services/user.service";
import type { RoomTheme } from "@app/types/room-theme";
import { DEFAULT_THEME } from "@app/types/room-theme";
import { PainCaveSceneComponent } from "../../room/components/pain-cave-scene/pain-cave-scene.component";
import {
  TrophyInfoSheetComponent,
  type TrophyInfoData,
} from "../../room/components/trophy-info-sheet/trophy-info-sheet.component";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    TranslateModule,
    NgtCanvas,
    PainCaveSceneComponent,
    TrophyInfoSheetComponent,
    IonContent,
    IonButton,
    IonText,
    IonSpinner,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonAvatar,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="false">
      <div class="home-layout">
        <!-- Dashboard Header -->
        <div class="dashboard-header animate-fade-in-down">
          <!-- Greeting row -->
          <div class="greeting-row">
            <div class="greeting-left" (click)="goToProfile()">
              <ion-avatar class="greeting-avatar">
                @if (authService.user()?.image) {
                  <img [src]="authService.user()!.image!" alt="avatar" />
                } @else {
                  <ion-icon
                    name="person-circle-outline"
                    class="avatar-fallback"
                  />
                }
              </ion-avatar>
              <span class="greeting-text">{{
                "home.greeting"
                  | translate: { name: authService.user()?.firstName || "" }
              }}</span>
            </div>
            @if (userService.scansDisplay(); as display) {
              <div
                class="scan-pill"
                [class.pro]="display === 'unlimited'"
                [class.danger]="display === 0"
              >
                @if (display === "unlimited") {
                  <ion-icon name="infinite-outline" />
                } @else {
                  <ion-icon name="camera-outline" />
                  <span>{{ display }}</span>
                }
              </div>
            }
          </div>

          <!-- Stats row -->
          <div class="stats-strip glass-card animate-fade-in-up">
            <div class="stat-item">
              <div class="stat-top">
                <ion-icon name="trophy-outline" color="primary" />
                <span class="stat-value">{{ trophyItemCount() }}</span>
              </div>
              <span class="stat-label">{{
                "home.statTrophies" | translate
              }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-top">
                <ion-icon name="heart-outline" color="danger" />
                <span class="stat-value">{{
                  roomService.room()?.likeCount || 0
                }}</span>
              </div>
              <span class="stat-label">{{ "home.statLikes" | translate }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-top">
                <ion-icon name="eye-outline" color="medium" />
                <span class="stat-value">{{
                  roomService.room()?.viewCount || 0
                }}</span>
              </div>
              <span class="stat-label">{{ "home.statViews" | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Room 3D -->
        <div class="room-container animate-fade-in">
          @if (roomService.loading()) {
            <div class="centered">
              <ion-spinner name="crescent" />
            </div>
          } @else if (error()) {
            <div class="centered">
              <ion-text>{{ "common.error" | translate }}</ion-text>
              <ion-button fill="clear" (click)="fetchRoom()">
                {{ "common.retry" | translate }}
              </ion-button>
            </div>
          } @else if (!hasItems()) {
            <div class="centered">
              <h2 class="empty-title">{{ "home.emptyTitle" | translate }}</h2>
              <ion-text color="medium">
                <p class="empty-subtitle">
                  {{ "home.emptySubtitle" | translate }}
                </p>
              </ion-text>
            </div>
          } @else {
            <ngt-canvas
              [shadows]="true"
              [dpr]="[1, 2]"
              [camera]="{ position: [5, 5, 5], fov: 45 }"
            >
              <app-pain-cave-scene
                *canvasContent
                [items]="roomService.room()!.items"
                [inspectedItemId]="inspectedItemId()"
                [theme]="resolvedTheme()"
                (itemPressed)="onItemPressed($event)"
              />
            </ngt-canvas>
          }

          <!-- Edit room button -->
          @if (!roomService.loading() && !error()) {
            <button class="edit-room-btn" (click)="goToEdit()">
              <ion-icon name="create-outline" />
              <span>{{ "home.editRoom" | translate }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Trophy Info Bottom Sheet -->
      <ion-modal
        [isOpen]="inspectedItemId() !== null"
        [initialBreakpoint]="0.55"
        [breakpoints]="[0, 0.55, 0.85]"
        (didDismiss)="clearInspection()"
      >
        <ng-template>
          <app-trophy-info-sheet
            [trophy]="inspectedTrophyData()"
            [trophyIndex]="currentTrophyIndex()"
            [totalTrophies]="trophyItems().length"
            [hasPrev]="trophyItems().length > 1"
            [hasNext]="trophyItems().length > 1"
            (dismiss)="clearInspection()"
            (viewDetails)="onViewDetails($event)"
            (seeFinishers)="onSeeFinishers($event)"
            (navigatePrev)="navigatePrev()"
            (navigateNext)="navigateNext()"
          />
        </ng-template>
      </ion-modal>

      <!-- Upgrade modal when scan limit reached -->
      <ion-modal
        [isOpen]="showUpgradeModal()"
        (didDismiss)="showUpgradeModal.set(false)"
      >
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ "scan.limitReached" | translate }}</ion-title>
              <ion-button
                slot="end"
                fill="clear"
                (click)="showUpgradeModal.set(false)"
              >
                {{ "common.cancel" | translate }}
              </ion-button>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="upgrade-container">
              <ion-icon name="lock-closed-outline" class="upgrade-icon" />
              <h2>{{ "scan.limitReachedTitle" | translate }}</h2>
              <ion-text color="medium">
                <p>{{ "scan.limitReachedMessage" | translate }}</p>
              </ion-text>
              <p class="reset-info">
                {{ "scan.resetsIn" | translate: { days: daysUntilReset() } }}
              </p>
              <ion-button expand="block" (click)="onUpgrade()">
                <ion-icon slot="start" name="rocket-outline" />
                {{ "profile.pro" | translate }}
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: `
    .home-layout {
      position: relative;
      height: 100%;
      overflow: hidden;
    }

    /* 3D Scene Background */
    .room-container {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    /* Gradient overlay for text readability */
    .home-layout::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 180px;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.6) 0%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 1;
    }

    ngt-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    /* Header Overlay */
    .dashboard-header {
      position: relative;
      z-index: 10;
      padding: calc(env(safe-area-inset-top) + 12px) 16px 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none; /* Let clicks pass through around items */
    }

    /* Glass Card Shared Styles */
    .glass-card {
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.65);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.08);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.08),
        0 1px 2px rgba(0, 0, 0, 0.04);
      border-radius: 24px;
      pointer-events: auto;
    }

    /* Top Row: Greeting & Scan Pill */
    .greeting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .greeting-left {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 16px 6px 6px;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:active {
        transform: scale(0.96);
      }
    }

    .greeting-avatar {
      width: 40px;
      height: 40px;
      border: 2px solid rgba(255, 255, 255, 0.8);
    }

    .avatar-fallback {
      font-size: 40px;
      color: var(--ion-color-step-500);
    }

    .greeting-text {
      font-size: 16px;
      font-weight: 700;
      color: #fff; /* Force white text */
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      letter-spacing: -0.01em;
    }

    .scan-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 100px;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      background: rgba(0, 0, 0, 0.8); /* Dark pill for contrast */
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;

      ion-icon {
        font-size: 18px;
      }

      &.pro {
        background: linear-gradient(135deg, #111, #333);
        border: 1px solid rgba(255, 255, 255, 0.2);

        ion-icon {
          color: #ffd700;
        }
      }

      &.danger {
        background: var(--ion-color-danger);
      }
    }

    /* Stats Strip */
    .stats-strip {
      display: flex;
      align-items: center;
      padding: 12px 0;
      margin-top: 8px;
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .stat-top {
      display: flex;
      align-items: center;
      gap: 6px;

      ion-icon {
        font-size: 18px;
        color: rgba(255, 255, 255, 0.9);
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
      }
    }

    .stat-value {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .stat-label {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.8);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .stat-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.3);
    }

    /* Empty States & Loading */
    .centered {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      z-index: 5;
      pointer-events: none;

      * {
        pointer-events: auto;
      }
    }

    .empty-title {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 8px;
      color: var(--ion-text-color);
    }

    .empty-subtitle {
      font-size: 15px;
      line-height: 1.5;
      color: var(--ion-color-step-600);
      max-width: 280px;
    }

    /* Edit Button (Bottom) */
    .edit-room-btn {
      position: absolute;
      bottom: calc(env(safe-area-inset-bottom, 20px) + 90px);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 100px;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 4px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      z-index: 20;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      -webkit-tap-highlight-color: transparent;
      outline: none;

      &:active {
        transform: translateX(-50%) scale(0.95);
      }

      ion-icon {
        font-size: 20px;
        color: var(--ion-text-color);
      }

      span {
        font-size: 15px;
        font-weight: 700;
        color: var(--ion-text-color);
        letter-spacing: -0.01em;
      }
    }

    /* Upgrade Modal */
    .upgrade-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 24px;
      gap: 12px;

      h2 {
        font-size: 24px;
        font-weight: 800;
        margin: 0;
      }

      p {
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
        color: var(--ion-color-step-600);
      }

      .reset-info {
        font-size: 13px;
        margin-top: 8px;
        font-weight: 500;
        color: var(--ion-color-primary);
        background: rgba(var(--ion-color-primary-rgb), 0.1);
        padding: 4px 12px;
        border-radius: 12px;
      }

      ion-button {
        margin-top: 24px;
        width: 100%;
        --border-radius: 16px;
        font-weight: 700;
      }
    }

    .upgrade-icon {
      font-size: 64px;
      color: var(--ion-color-warning);
      margin-bottom: 8px;
      filter: drop-shadow(0 4px 12px rgba(var(--ion-color-warning-rgb), 0.3));
    }
  `,
})
export class HomePage implements OnInit {
  private router = inject(Router);
  private themeService = inject(ThemeService);
  roomService = inject(RoomService);
  userService = inject(UserService);
  authService = inject(AuthService);

  error = signal(false);
  showUpgradeModal = signal(false);
  inspectedItemId = signal<string | null>(null);

  hasItems = computed(() => (this.roomService.room()?.items?.length ?? 0) > 0);

  trophyItemCount = computed(() => {
    return (this.roomService.room()?.items ?? []).filter((i) => i.trophyId)
      .length;
  });

  trophyItems = computed(() => {
    return (this.roomService.room()?.items ?? []).filter(
      (item) => item.trophyId && item.trophy,
    );
  });

  currentTrophyIndex = computed(() => {
    const itemId = this.inspectedItemId();
    if (!itemId) return -1;
    return this.trophyItems().findIndex((i) => i.id === itemId);
  });

  inspectedTrophyData = computed<TrophyInfoData | null>(() => {
    const itemId = this.inspectedItemId();
    if (!itemId) return null;
    const item = this.roomService.room()?.items.find((i) => i.id === itemId);
    if (!item?.trophy) return null;
    return {
      id: item.trophy.id,
      type: item.trophy.type,
      thumbnailUrl: item.trophy.thumbnailUrl,
      race: item.trophy.raceResult?.race ?? null,
      result: item.trophy.raceResult
        ? {
            time: item.trophy.raceResult.time,
            ranking: item.trophy.raceResult.ranking,
            categoryRanking: item.trophy.raceResult.categoryRanking,
          }
        : null,
    };
  });

  resolvedTheme = computed<RoomTheme>(() => {
    const r = this.roomService.room();
    if (!r) return DEFAULT_THEME;
    return this.themeService.resolveThemeFromRoom(r);
  });

  daysUntilReset = computed(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil(
      (endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  });

  constructor() {
    addIcons({
      cameraOutline,
      createOutline,
      lockClosedOutline,
      rocketOutline,
      infiniteOutline,
      trophyOutline,
      heartOutline,
      eyeOutline,
      personCircleOutline,
    });
  }

  ngOnInit(): void {
    this.fetchRoom();
    this.userService.fetchProfile();
  }

  async fetchRoom(): Promise<void> {
    this.error.set(false);
    try {
      const room = await this.roomService.fetchMyRoom();
      if (!room) {
        this.error.set(true);
      }
    } catch {
      this.error.set(true);
    }
  }

  onItemPressed(itemId: string): void {
    const item = this.roomService.room()?.items.find((i) => i.id === itemId);
    if (item?.trophy) {
      this.inspectedItemId.set(itemId);
    }
  }

  clearInspection(): void {
    this.inspectedItemId.set(null);
  }

  navigatePrev(): void {
    const items = this.trophyItems();
    if (items.length <= 1) return;
    const idx = this.currentTrophyIndex();
    const newIdx = idx <= 0 ? items.length - 1 : idx - 1;
    this.inspectedItemId.set(items[newIdx].id);
  }

  navigateNext(): void {
    const items = this.trophyItems();
    if (items.length <= 1) return;
    const idx = this.currentTrophyIndex();
    const newIdx = idx >= items.length - 1 ? 0 : idx + 1;
    this.inspectedItemId.set(items[newIdx].id);
  }

  onViewDetails(trophyId: string): void {
    this.inspectedItemId.set(null);
    this.router.navigate(["/trophy", trophyId]);
  }

  onSeeFinishers(raceId: string): void {
    this.inspectedItemId.set(null);
    this.router.navigate(["/race", raceId, "finishers"]);
  }

  goToEdit(): void {
    this.router.navigate(["/room/edit"]);
  }

  goToProfile(): void {
    this.router.navigate(["/tabs/profile"]);
  }

  onUpgrade(): void {
    this.showUpgradeModal.set(false);
    this.router.navigate(["/pro"]);
  }
}
