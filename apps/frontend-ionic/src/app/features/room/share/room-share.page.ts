import { Component, inject, signal, computed, OnInit, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonText,
  IonModal,
  IonFab,
  IonFabButton,
  IonIcon,
  IonBadge,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NgtCanvas } from 'angular-three/dom';
import { addIcons } from 'ionicons';
import { heart, heartOutline } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';
import { AuthService } from '@app/core/services/auth.service';
import { SocialService } from '@app/core/services/social.service';
import { ThemeService } from '@app/core/services/theme.service';
import { PainCaveSceneComponent, type RoomItem3D } from '../components/pain-cave-scene/pain-cave-scene.component';
import { TrophyInfoSheetComponent, type TrophyInfoData } from '../components/trophy-info-sheet/trophy-info-sheet.component';
import type { RoomTheme } from '@app/types/room-theme';
import { DEFAULT_THEME } from '@app/types/room-theme';

interface RoomData {
  id: string;
  userId: string;
  themeId: string | null;
  customTheme: string | null;
  floor: string | null;
  likeCount: number;
  viewCount: number;
  items: RoomItem3D[];
}

@Component({
  selector: 'app-room-share',
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
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonText,
    IonModal,
    IonFab,
    IonFabButton,
    IonIcon,
    IonBadge,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" />
        </ion-buttons>
        <ion-title>{{ 'room.shareTitle' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (room()) {
        <div class="canvas-container animate-fade-in">
          <ngt-canvas
            [shadows]="true"
            [dpr]="[1, 2]"
            [camera]="{ position: [5, 5, 5], fov: 45 }"
            [frameloop]="'demand'"
          >
            <app-pain-cave-scene
              *canvasContent
              [items]="room()!.items"
              [inspectedItemId]="inspectedItemId()"
              [shadowMapSize]="512"
              [theme]="resolvedTheme()"
              (itemPressed)="onItemPressed($event)"
            />
          </ngt-canvas>
        </div>

        <!-- Like FAB (only for authenticated users viewing others' rooms) -->
        @if (canLike()) {
          <ion-fab vertical="bottom" horizontal="end" slot="fixed">
            <ion-fab-button
              [color]="liked() ? 'danger' : 'medium'"
              (click)="onToggleLike()"
            >
              <ion-icon [name]="liked() ? 'heart' : 'heart-outline'" />
            </ion-fab-button>
            @if (likeCount() > 0) {
              <ion-badge class="like-badge" color="danger">
                {{ likeCount() }}
              </ion-badge>
            }
          </ion-fab>
        }
      } @else {
        <div class="centered">
          <ion-text color="medium">
            <p>{{ 'room.empty' | translate }}</p>
          </ion-text>
        </div>
      }
    </ion-content>

    <!-- Trophy Info Bottom Sheet -->
    <ion-modal
      [isOpen]="inspectedItemId() !== null"
      [initialBreakpoint]="0.45"
      [breakpoints]="[0, 0.45, 0.75]"
      (didDismiss)="clearInspection()"
    >
      <ng-template>
        <app-trophy-info-sheet
          [trophy]="inspectedTrophyData()"
          [trophyIndex]="currentTrophyIndex()"
          [totalTrophies]="trophyItems().length"
          [hasPrev]="currentTrophyIndex() > 0"
          [hasNext]="currentTrophyIndex() < trophyItems().length - 1"
          (dismiss)="clearInspection()"
          (viewDetails)="onViewDetails($event)"
          (navigatePrev)="navigatePrev()"
          (navigateNext)="navigateNext()"
        />
      </ng-template>
    </ion-modal>
  `,
  styles: `
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
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

    .like-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      font-size: 11px;
      min-width: 20px;
      border-radius: 10px;
    }
  `,
})
export class RoomSharePage implements OnInit {
  slug = input.required<string>();

  private api = inject(ApiService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private socialService = inject(SocialService);

  room = signal<RoomData | null>(null);
  loading = signal(true);
  inspectedItemId = signal<string | null>(null);

  canLike = computed(() => {
    const user = this.authService.user();
    const r = this.room();
    return !!user && !!r && r.userId !== user.id;
  });

  liked = signal(false);
  likeCount = signal(0);

  resolvedTheme = computed<RoomTheme>(() => {
    const r = this.room();
    if (!r) return DEFAULT_THEME;
    return this.themeService.resolveThemeFromRoom(r);
  });

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

  constructor() {
    addIcons({ heart, heartOutline });
  }

  ngOnInit(): void {
    this.fetchRoom();
  }

  async fetchRoom(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.rooms.share[':slug'].$get({
        param: { slug: this.slug() },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: RoomData };
        this.room.set(json.data);

        // Track view and fetch like status
        this.socialService.recordView(json.data.id);
        const likeState = this.socialService.getLikeState(json.data.id);
        this.socialService.fetchLikeStatus(json.data.id).then(() => {
          this.liked.set(likeState.liked());
          this.likeCount.set(likeState.likeCount());
        });
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
  }

  async onToggleLike(): Promise<void> {
    const r = this.room();
    if (!r) return;

    // Haptic feedback
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }

    await this.socialService.toggleLike(r.id);
    const likeState = this.socialService.getLikeState(r.id);
    this.liked.set(likeState.liked());
    this.likeCount.set(likeState.likeCount());
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
    const idx = this.currentTrophyIndex();
    const items = this.trophyItems();
    if (idx > 0) {
      this.inspectedItemId.set(items[idx - 1].id);
    }
  }

  navigateNext(): void {
    const idx = this.currentTrophyIndex();
    const items = this.trophyItems();
    if (idx < items.length - 1) {
      this.inspectedItemId.set(items[idx + 1].id);
    }
  }

  onViewDetails(trophyId: string): void {
    this.inspectedItemId.set(null);
    this.router.navigate(['/trophy', trophyId]);
  }
}
