import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  input,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import {
  IonContent,
  IonSpinner,
  IonText,
  IonModal,
  IonFab,
  IonFabButton,
  IonIcon,
  IonBadge,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { NgtCanvas } from "angular-three/dom";
import { addIcons } from "ionicons";
import {
  arrowBackOutline,
  ellipsisVerticalOutline,
  heart,
  heartOutline,
} from "ionicons/icons";

import { ApiService } from "@app/core/services/api.service";
import { AuthService } from "@app/core/services/auth.service";
import { SocialService } from "@app/core/services/social.service";
import { LikeBatchingService } from "@app/core/services/like-batching.service";
import { ThemeService } from "@app/core/services/theme.service";
import {
  PainCaveSceneComponent,
  type RoomItem3D,
} from "../components/pain-cave-scene/pain-cave-scene.component";
import {
  TrophyInfoSheetComponent,
  type TrophyInfoData,
} from "../components/trophy-info-sheet/trophy-info-sheet.component";
import type { RoomTheme } from "@app/types/room-theme";
import { DEFAULT_THEME } from "@app/types/room-theme";

interface RoomData {
  id: string;
  userId: string;
  themeId: string | null;
  customTheme: string | null;
  floor: string | null;
  likeCount: number;
  viewCount: number;
  items: RoomItem3D[];
  user?: {
    displayName: string | null;
    firstName: string | null;
    image: string | null;
  };
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  burst: boolean;
}

@Component({
  selector: "app-room-view",
  standalone: true,
  imports: [
    TranslateModule,
    NgtCanvas,
    PainCaveSceneComponent,
    TrophyInfoSheetComponent,
    IonContent,
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
    <ion-content [fullscreen]="true">
      <!-- Floating toolbar overlay -->
      <div class="floating-toolbar">
        <button class="toolbar-pill back-pill" (click)="goBack()">
          <ion-icon name="arrow-back-outline" />
        </button>

        @if (ownerName()) {
          <button class="toolbar-pill username-pill" (click)="goToOwnerProfile()">
            <span class="username-text">{{ ownerName() }}</span>
          </button>
        }

        <button class="toolbar-pill more-pill" (click)="goToOwnerProfile()">
          <ion-icon name="ellipsis-vertical-outline" />
        </button>
      </div>

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

        <!-- Like FAB (always visible) -->
        <ion-fab vertical="bottom" horizontal="end" slot="fixed" #likeFab>
          <ion-fab-button color="danger" (click)="onToggleLike($event)">
            <ion-icon name="heart" [class.heart-pop]="showHeartPop()" />
          </ion-fab-button>
          @if (likeCount() > 0) {
            <ion-badge class="like-badge" color="danger">
              {{ formatLikeCount(likeCount()) }}
            </ion-badge>
          }
        </ion-fab>
      } @else {
        <div class="centered">
          <ion-text color="medium">
            <p>{{ "room.empty" | translate }}</p>
          </ion-text>
        </div>
      }
    </ion-content>

    <!-- Trophy Info Bottom Sheet -->
    <ion-modal
      class="trophy-info-modal"
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
    :host {
      --toolbar-top: var(--ion-safe-area-top, 20px);
    }

    ::ng-deep {
      --backdrop-opacity: 0;
    }

    /* Floating toolbar */
    .floating-toolbar {
      position: absolute;
      top: calc(var(--toolbar-top) + 8px);
      left: 16px;
      right: 16px;
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
      border: none;
      border-radius: 100px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.10),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-family: inherit;
      transition: transform 0.18s ease, box-shadow 0.18s ease;

      &:active {
        transform: scale(0.92);
      }
    }

    .back-pill,
    .more-pill {
      width: 40px;
      height: 40px;
      flex-shrink: 0;

      ion-icon {
        font-size: 20px;
        color: var(--ion-text-color);
      }
    }

    .username-pill {
      padding: 12px 18px;
      gap: 6px;
    }

    .username-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-text-color);
      letter-spacing: -0.01em;
      white-space: nowrap;
      max-width: 180px;
      text-overflow: ellipsis;
      text-transform: capitalize;
      cursor: pointer;
    }

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
        transform: translateY(-200px) translateX(var(--drift-x-end, 0))
          scale(0.6);
        opacity: 0;
      }
    }

    @keyframes burstUp {
      0% {
        transform: translateY(0) translateX(0) scale(1.2) rotate(0deg);
        opacity: 1;
      }
      20% {
        transform: translateY(-40px) translateX(var(--drift-x, 0)) scale(1.4)
          rotate(15deg);
        opacity: 1;
      }
      100% {
        transform: translateY(-250px) translateX(var(--drift-x-end, 0))
          scale(0.4) rotate(30deg);
        opacity: 0;
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
export class RoomViewPage implements OnInit {
  userId = input.required<string>();
  @ViewChild("likeFab", { read: ElementRef }) likeFab?: ElementRef<HTMLElement>;

  private api = inject(ApiService);
  private router = inject(Router);
  private location = inject(Location);
  private themeService = inject(ThemeService);
  authService = inject(AuthService);
  private socialService = inject(SocialService);
  private likeBatchingService = inject(LikeBatchingService);

  room = signal<RoomData | null>(null);
  loading = signal(true);
  inspectedItemId = signal<string | null>(null);

  ownerName = computed(() => {
    const r = this.room();
    if (!r?.user) return null;
    return r.user.displayName || r.user.firstName || null;
  });

  likeCount = computed(() => {
    const r = this.room();
    return this.likeBatchingService.getLikeCount(r?.id ?? "")();
  });

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
    const item = this.room()?.items.find((i) => i.id === itemId);
    if (!item?.trophy) return null;
    return {
      id: item.trophy.id,
      type: item.trophy.type,
      thumbnailUrl: item.trophy.thumbnailUrl,
      race: item.trophy.raceResult?.race
        ? {
            id: item.trophy.raceResult.race.id,
            name: item.trophy.raceResult.race.name,
            date: item.trophy.raceResult.race.date,
            city: item.trophy.raceResult.race.city ?? null,
            country: item.trophy.raceResult.race.country ?? null,
            sport: item.trophy.raceResult.race.sport,
          }
        : null,
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
    addIcons({ heart, heartOutline, arrowBackOutline, ellipsisVerticalOutline });
  }

  ngOnInit(): void {
    this.fetchRoom();
  }

  async fetchRoom(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.rooms.user[":id"].$get({
        param: { id: this.userId() },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: RoomData };
        this.room.set(json.data);

        // Track view and fetch initial like count
        this.socialService.recordView(json.data.id);
        this.likeBatchingService.fetchLikeCount(json.data.id);
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
  }

  async onToggleLike(event: Event): Promise<void> {
    const r = this.room();
    if (!r) return;

    // Capture target before any await (currentTarget resets to null after dispatch)
    const target = event.currentTarget as HTMLElement | null;

    // Haptic feedback
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }

    // Trigger heart pop animation on button
    this.showHeartPop.set(true);
    setTimeout(() => this.showHeartPop.set(false), 300);

    // Spawn floating hearts
    this.spawnFloatingHearts(target);

    this.likeBatchingService.addLike(r.id);
  }

  private spawnFloatingHearts(target: HTMLElement | null): void {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = window.innerHeight - rect.bottom + rect.height / 2;

    // Spawn 1-3 hearts
    const heartCount = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < heartCount; i++) {
      const heart: FloatingHeart = {
        id: this.heartIdCounter++,
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY,
        size: 32 + Math.random() * 16,
        delay: i * 80,
        burst: false,
      };

      this.floatingHearts.update((hearts) => [...hearts, heart]);

      // Remove heart after animation completes
      setTimeout(() => {
        this.floatingHearts.update((hearts) =>
          hearts.filter((h) => h.id !== heart.id),
        );
      }, 2000);
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

  goBack(): void {
    this.location.back();
  }

  goToOwnerProfile(): void {
    this.router.navigate(["/profile", this.userId()]);
  }

  onViewDetails(trophyId: string): void {
    this.inspectedItemId.set(null);
    this.router.navigate(["/trophy", trophyId]);
  }

  onSeeFinishers(raceId: string): void {
    this.inspectedItemId.set(null);
    this.router.navigate(["/race", raceId, "finishers"]);
  }

  formatLikeCount(count: number): string {
    if (count >= 1_000_000) {
      return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1_000) {
      return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return count.toString();
  }
}
