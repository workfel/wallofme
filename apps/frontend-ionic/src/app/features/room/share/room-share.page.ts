import { Component, inject, signal, computed, OnInit, input, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef } from '@angular/core';
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
import { LikeBatchingService } from '@app/core/services/like-batching.service';
import { ThemeService } from '@app/core/services/theme.service';
import { PainCaveSceneComponent, type RoomItem3D } from '../components/pain-cave-scene/pain-cave-scene.component';
import { TrophyInfoSheetComponent, type TrophyInfoData } from '../components/trophy-info-sheet/trophy-info-sheet.component';
import type { RoomTheme } from '@app/types/room-theme';
import { DEFAULT_THEME } from '@app/types/room-theme';

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  burst: boolean;
}

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

        <!-- Floating Hearts Container -->
        <div class="hearts-container" #heartsContainer>
          @for (heart of floatingHearts(); track heart.id) {
            <div
              class="floating-heart"
              [class.heart-burst]="heart.burst"
              [style.left.px]="heart.x"
              [style.bottom.px]="heart.y"
              [style.animation-delay.ms]="heart.delay"
              [style.font-size.px]="heart.size"
            >
              ❤️
            </div>
          }
        </div>

        <!-- Like FAB (always visible, anonymous) -->
        <ion-fab vertical="bottom" horizontal="end" slot="fixed" #likeFab>
          <ion-fab-button
            color="danger"
            (click)="onTapLike($event)"
            [attr.aria-label]="'Like this room' + (comboCount() > 1 ? ' (×' + comboCount() + ')' : '')"
            [class.pulse-animation]="comboCount() > 5"
          >
            <ion-icon name="heart" [class.heart-pop]="showHeartPop()" />
          </ion-fab-button>
          @if (likeCount() > 0) {
            <ion-badge class="like-badge" color="danger">
              {{ formatLikeCount(likeCount()) }}
            </ion-badge>
          }
          @if (comboCount() > 1) {
            <ion-badge class="combo-badge" color="warning">
              ×{{ comboCount() }}
            </ion-badge>
          }
        </ion-fab>
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
          [isAuthenticated]="!!authService.user()"
          (dismiss)="clearInspection()"
          (viewDetails)="onViewDetails($event)"
          (seeFinishers)="onSeeFinishers($event)"
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

    .combo-badge {
      position: absolute;
      bottom: -4px;
      right: -4px;
      font-size: 11px;
      min-width: 20px;
      border-radius: 10px;
      font-weight: bold;
    }

    /* Hearts container */
    .hearts-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    }

    /* Floating heart animation */
    .floating-heart {
      position: absolute;
      font-size: 32px;
      opacity: 1;
      animation: floatUp 2s ease-out forwards;
      will-change: transform, opacity;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .floating-heart.heart-burst {
      animation: burstUp 1.5s ease-out forwards;
    }

    @keyframes floatUp {
      0% {
        transform: translateY(0) translateX(0) scale(0.8);
        opacity: 1;
      }
      20% {
        transform: translateY(-30px) translateX(var(--drift-x, 0)) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(-200px) translateX(var(--drift-x-end, 0)) scale(0.6);
        opacity: 0;
      }
    }

    @keyframes burstUp {
      0% {
        transform: translateY(0) translateX(0) scale(1.2) rotate(0deg);
        opacity: 1;
      }
      20% {
        transform: translateY(-40px) translateX(var(--drift-x, 0)) scale(1.4) rotate(15deg);
        opacity: 1;
      }
      100% {
        transform: translateY(-250px) translateX(var(--drift-x-end, 0)) scale(0.4) rotate(30deg);
        opacity: 0;
      }
    }

    /* FAB pulse animation on high combo */
    .pulse-animation {
      animation: pulse 0.6s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    /* Heart icon pop on click */
    .heart-pop {
      animation: heartPop 0.3s ease-out;
    }

    @keyframes heartPop {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.3);
      }
      100% {
        transform: scale(1);
      }
    }
  `,
})
export class RoomSharePage implements OnInit {
  slug = input.required<string>();
  @ViewChild('likeFab', { read: ElementRef }) likeFab?: ElementRef<HTMLElement>;

  private api = inject(ApiService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  authService = inject(AuthService);
  private likeBatchingService = inject(LikeBatchingService);

  room = signal<RoomData | null>(null);
  loading = signal(true);
  inspectedItemId = signal<string | null>(null);

  likeCount = computed(() => {
    const r = this.room();
    return this.likeBatchingService.getLikeCount(r?.id ?? '')();
  });

  comboCount = signal(0);
  private comboResetTimeout: ReturnType<typeof setTimeout> | null = null;

  // Floating hearts animation
  floatingHearts = signal<FloatingHeart[]>([]);
  private heartIdCounter = 0;
  showHeartPop = signal(false);

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

        // Track view and fetch initial like count
        this.likeBatchingService.fetchLikeCount(json.data.id);
        this.recordRoomView(json.data.id);
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
  }

  private async recordRoomView(roomId: string): Promise<void> {
    try {
      await this.api.client.api.social.rooms[':id'].view.$post({
        param: { id: roomId },
      });
    } catch {
      // fire and forget
    }
  }

  async onTapLike(event: Event): Promise<void> {
    const r = this.room();
    if (!r) return;

    // Haptic feedback - light on every tap
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }

    // Update combo
    const prevCombo = this.comboCount();
    this.comboCount.set(prevCombo + 1);

    // Medium haptic on 5+ combo
    if (this.comboCount() >= 5 && this.comboCount() === prevCombo + 1) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        Haptics.impact({ style: ImpactStyle.Medium });
      } catch {
        // Haptics not available
      }
    }

    // Trigger heart pop animation on button
    this.showHeartPop.set(true);
    setTimeout(() => this.showHeartPop.set(false), 300);

    // Spawn floating hearts (more hearts on combo)
    this.spawnFloatingHearts(event);

    // Add like to batching service
    this.likeBatchingService.addLike(r.id);

    // Reset combo after 1 second of inactivity
    if (this.comboResetTimeout) {
      clearTimeout(this.comboResetTimeout);
    }
    this.comboResetTimeout = setTimeout(() => {
      this.comboCount.set(0);
    }, 1000);
  }

  private spawnFloatingHearts(event: Event): void {
    // Get FAB position from the event target
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = window.innerHeight - rect.bottom + rect.height / 2;

    // Number of hearts increases with combo (1-5 hearts)
    const heartCount = Math.min(Math.max(1, Math.floor(this.comboCount() / 2)), 5);

    for (let i = 0; i < heartCount; i++) {
      const heart: FloatingHeart = {
        id: this.heartIdCounter++,
        x: centerX + (Math.random() - 0.5) * 40, // Spread around button
        y: centerY,
        size: 32 + Math.random() * 16, // Random size 32-48px
        delay: i * 80, // Stagger animation
        burst: this.comboCount() > 10, // Burst effect on high combo
      };

      // Add CSS variables for drift animation
      const heartElement = document.createElement('div');
      const driftX = (Math.random() - 0.5) * 60;
      const driftXEnd = (Math.random() - 0.5) * 100;
      heartElement.style.setProperty('--drift-x', `${driftX}px`);
      heartElement.style.setProperty('--drift-x-end', `${driftXEnd}px`);

      this.floatingHearts.update(hearts => [...hearts, heart]);

      // Remove heart after animation completes
      setTimeout(() => {
        this.floatingHearts.update(hearts =>
          hearts.filter(h => h.id !== heart.id)
        );
      }, heart.burst ? 1500 : 2000);
    }
  }

  formatLikeCount(count: number): string {
    if (count >= 1_000_000) {
      return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1_000) {
      return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
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
}
