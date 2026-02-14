import { Component, inject, signal, computed, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
  IonBadge,
  IonModal,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NgtCanvas } from 'angular-three/dom';
import { addIcons } from 'ionicons';
import { add, camera, create, lockClosedOutline, rocketOutline } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';
import { ThemeService } from '@app/core/services/theme.service';
import { UserService } from '@app/core/services/user.service';
import { PainCaveSceneComponent, type RoomItem3D } from '../../room/components/pain-cave-scene/pain-cave-scene.component';
import { TrophyInfoSheetComponent, type TrophyInfoData } from '../../room/components/trophy-info-sheet/trophy-info-sheet.component';
import type { RoomTheme } from '@app/types/room-theme';
import { DEFAULT_THEME } from '@app/types/room-theme';

interface RoomData {
  id: string;
  userId: string;
  themeId: string | null;
  customTheme: string | null;
  floor: string | null;
  items: RoomItem3D[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TranslateModule,
    NgtCanvas,
    PainCaveSceneComponent,
    TrophyInfoSheetComponent,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonFabList,
    IonIcon,
    IonBadge,
    IonModal,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'home.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'home.title' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (error()) {
        <div class="centered">
          <ion-text>{{ 'common.error' | translate }}</ion-text>
          <ion-button fill="clear" (click)="fetchRoom()">
            {{ 'common.retry' | translate }}
          </ion-button>
        </div>
      } @else if (!hasItems()) {
        <div class="centered animate-fade-in">
          <h2>{{ 'home.title' | translate }}</h2>
          <ion-text color="medium">
            <p>{{ 'room.empty' | translate }}</p>
          </ion-text>
          <ion-button (click)="onScanTap()">
            {{ 'trophies.scan' | translate }}
          </ion-button>
        </div>
      } @else {
        <div class="canvas-container animate-fade-in">
          <ngt-canvas
            [shadows]="true"
            [dpr]="[1, 2]"
            [camera]="{ position: [5, 5, 5], fov: 45 }"
          >
            <app-pain-cave-scene
              *canvasContent
              [items]="room()!.items"
              [inspectedItemId]="inspectedItemId()"
              [theme]="resolvedTheme()"
              (itemPressed)="onItemPressed($event)"
            />
          </ngt-canvas>
        </div>
      }

      <!-- Scan remaining badge -->
      @if (userService.scansDisplay(); as display) {
        <div class="scan-remaining-badge">
          @if (display === 'unlimited') {
            <ion-badge color="success">{{ 'scan.unlimited' | translate }}</ion-badge>
          } @else {
            <ion-badge [color]="display === 0 ? 'danger' : 'primary'">
              {{ 'scan.remaining' | translate: { count: display } }}
            </ion-badge>
          }
        </div>
      }

      <!-- Floating action buttons -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon name="add" />
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-fab-button (click)="onScanTap()" color="primary">
            <ion-icon name="camera" />
          </ion-fab-button>
          <ion-fab-button (click)="goToEdit()" color="secondary">
            <ion-icon name="create" />
          </ion-fab-button>
        </ion-fab-list>
      </ion-fab>

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
      <ion-modal [isOpen]="showUpgradeModal()" (didDismiss)="showUpgradeModal.set(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ 'scan.limitReached' | translate }}</ion-title>
              <ion-button slot="end" fill="clear" (click)="showUpgradeModal.set(false)">
                {{ 'common.cancel' | translate }}
              </ion-button>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="upgrade-container">
              <ion-icon name="lock-closed-outline" class="upgrade-icon" />
              <h2>{{ 'scan.limitReachedTitle' | translate }}</h2>
              <ion-text color="medium">
                <p>{{ 'scan.limitReachedMessage' | translate }}</p>
              </ion-text>
              <p class="reset-info">{{ 'scan.resetsIn' | translate: { days: daysUntilReset() } }}</p>
              <ion-button expand="block" (click)="onUpgrade()">
                <ion-icon slot="start" name="rocket-outline" />
                {{ 'profile.pro' | translate }}
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: `
    .centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      text-align: center;

      h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px;
      }

      p {
        margin: 0 0 24px;
      }
    }

    .canvas-container {
      width: 100%;
      height: 100%;
    }

    ngt-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .scan-remaining-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
    }

    .upgrade-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 24px;
      gap: 12px;

      h2 {
        font-size: 22px;
        font-weight: 700;
        margin: 0;
      }

      p {
        margin: 0;
        line-height: 1.5;
      }

      .reset-info {
        font-size: 13px;
        color: var(--ion-color-medium);
      }

      ion-button {
        margin-top: 16px;
        width: 100%;
      }
    }

    .upgrade-icon {
      font-size: 56px;
      color: var(--ion-color-warning);
    }
  `,
})
export class HomePage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  userService = inject(UserService);

  room = signal<RoomData | null>(null);
  loading = signal(true);
  error = signal(false);
  hasItems = signal(false);
  showUpgradeModal = signal(false);
  inspectedItemId = signal<string | null>(null);

  trophyItems = computed(() => {
    return (this.room()?.items ?? []).filter(
      (item) => item.trophyId && item.trophy
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
    const item = this.room()?.items.find((i) => i.id === itemId);
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
    const r = this.room();
    if (!r) return DEFAULT_THEME;
    return this.themeService.resolveThemeFromRoom(r);
  });

  daysUntilReset = computed(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  });

  constructor() {
    addIcons({ add, camera, create, lockClosedOutline, rocketOutline });
  }

  ngOnInit(): void {
    this.fetchRoom();
    this.userService.fetchProfile();
  }

  async fetchRoom(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const res = await this.api.client.api.rooms.me.$get();
      if (res.ok) {
        const json = (await res.json()) as { data: RoomData };
        this.room.set(json.data);
        this.hasItems.set(json.data.items.length > 0);
      } else {
        this.error.set(true);
      }
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  onItemPressed(itemId: string): void {
    const item = this.room()?.items.find((i) => i.id === itemId);
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
    this.router.navigate(['/trophy', trophyId]);
  }

  onSeeFinishers(raceId: string): void {
    this.inspectedItemId.set(null);
    this.router.navigate(['/race', raceId, 'finishers']);
  }

  onScanTap(): void {
    const remaining = this.userService.scansRemaining();
    if (remaining !== null && remaining <= 0 && !this.userService.isPro()) {
      this.showUpgradeModal.set(true);
      return;
    }
    this.router.navigate(['/trophy/create']);
  }

  goToEdit(): void {
    this.router.navigate(['/room/edit']);
  }

  onUpgrade(): void {
    this.showUpgradeModal.set(false);
    this.router.navigate(['/pro']);
  }
}
