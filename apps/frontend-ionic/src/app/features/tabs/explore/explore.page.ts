import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonChip,
  IonIcon,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonText,
  IonAvatar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  ViewWillLeave,
  ViewDidEnter,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  heartOutline,
  personCircleOutline,
  starOutline,
  searchOutline,
  listOutline,
  globeOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

import {
  ExploreService,
  type ExploreRoom,
  type ExploreSortBy,
  type GlobePoint,
} from '@app/core/services/explore.service';
import { ProBadgeComponent } from '@app/shared/components/pro-badge/pro-badge.component';
import { ExploreGlobeComponent } from './globe/explore-globe.component';
import { UserPreviewSheetComponent } from './globe/user-preview-sheet.component';

const SPORT_FILTERS = [
  'running',
  'trail',
  'triathlon',
  'cycling',
  'crossfit',
  'swimming',
  'ocr',
  'duathlon',
  'hyrox',
  'ironman',
  'marathon',
  'ultra',
] as const;

const GRADIENT_PALETTES = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
];

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    SlicePipe,
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonChip,
    IonIcon,
    IonCard,
    IonCardContent,
    IonSpinner,
    IonText,
    IonAvatar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    ProBadgeComponent,
    ExploreGlobeComponent,
    UserPreviewSheetComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'explore.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">


      <!-- View Toggle -->
      <div class="toggle-container">
        <div class="toggle-track">
          <div class="toggle-slider" [class.globe]="activeView() === 'globe'"></div>
          <button
            class="toggle-btn"
            [class.active]="activeView() === 'list'"
            (click)="switchView('list')"
          >
            <ion-icon name="list-outline" />
            <span>{{ 'explore.listView' | translate }}</span>
          </button>
          <button
            class="toggle-btn"
            [class.active]="activeView() === 'globe'"
            (click)="switchView('globe')"
          >
            <ion-icon name="globe-outline" />
            <span>{{ 'explore.globeView' | translate }}</span>
          </button>
        </div>
      </div>

      @if (activeView() === 'list') {
        <!-- Pull to refresh -->
        <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
          <ion-refresher-content />
        </ion-refresher>

        <div class="explore-container">
          <!-- Globe Teaser Card -->
          <div class="globe-teaser" (click)="switchView('globe')" aria-hidden>
            <div class="globe-teaser-icon">
              <ion-icon name="globe-outline" />
            </div>
            <div class="globe-teaser-text">
              <span class="globe-teaser-title">{{ 'explore.globeTeaser' | translate }}</span>
              <span class="globe-teaser-sub">{{ 'explore.globeTeaserSub' | translate }}</span>
            </div>
            <ion-icon name="chevron-forward-outline" class="globe-teaser-chevron" />
          </div>

          <!-- Search bar -->
          <ion-searchbar
            [placeholder]="'explore.searchPlaceholder' | translate"
            [debounce]="300"
            (ionInput)="onSearch($event)"
            mode="ios"
          />

          <!-- Sport filter chips -->
          <div class="chip-scroll">
            @for (sport of sports; track sport) {
              <ion-chip
                [outline]="activeSport() !== sport"
                [color]="activeSport() === sport ? 'primary' : undefined"
                (click)="onSportFilter(sport)"
              >
                {{ 'sports.' + sport | translate }}
              </ion-chip>
            }
          </div>

          <!-- Sort segment -->
          <ion-segment
            [value]="activeSort()"
            (ionChange)="onSortChange($event)"
            mode="ios"
          >
            <ion-segment-button value="recent">
              <ion-label>{{ 'explore.recent' | translate }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="popular">
              <ion-label>{{ 'explore.popular' | translate }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="liked">
              <ion-label>{{ 'explore.mostLiked' | translate }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <!-- Loading state (initial) -->
          @if (exploreService.loading() && exploreService.rooms().length === 0) {
            <div class="centered-state">
              <ion-spinner name="crescent" />
            </div>
          }

          <!-- Empty state -->
          @if (exploreService.isEmpty()) {
            <div class="centered-state empty-state">
              <ion-icon name="search-outline" class="empty-icon" />
              <h3>{{ 'explore.noResults' | translate }}</h3>
              <ion-text color="medium">
                <p>{{ 'explore.noResultsSubtitle' | translate }}</p>
              </ion-text>
            </div>
          }

          <!-- Room cards grid -->
          @if (exploreService.rooms().length > 0) {
            <div class="rooms-grid">
              @for (room of exploreService.rooms(); track room.id; let i = $index) {
                <ion-card class="room-card" (click)="openRoom(room)" button>
                  <div class="card-thumbnail" [style.background]="getGradient(i)">
                    @if (room.thumbnailUrl) {
                      <img
                        [src]="room.thumbnailUrl"
                        alt=""
                        class="thumbnail-img"
                        loading="lazy"
                      />
                    }
                    @if (room.isPro) {
                      <div class="pro-badge">
                        <app-pro-badge size="small" />
                      </div>
                    }
                  </div>
                  <ion-card-content class="card-body">
                    <div class="card-user">
                      <ion-avatar class="card-avatar">
                        @if (room.image) {
                          <img [src]="room.image" alt="" />
                        } @else {
                          <ion-icon name="person-circle-outline" class="avatar-fallback" />
                        }
                      </ion-avatar>
                      <span class="card-name">{{ room.displayName || ('explore.athlete' | translate) }}</span>
                    </div>
                    @if (room.sports && room.sports.length > 0) {
                      <div class="card-sports">
                        @for (sport of room.sports | slice:0:2; track sport) {
                          <ion-chip class="sport-chip" color="medium" outline>
                            {{ 'sports.' + sport | translate }}
                          </ion-chip>
                        }
                      </div>
                    }
                    <div class="card-stats">
                      <span class="stat">
                        <ion-icon name="heart-outline" />
                        {{ room.likeCount }}
                      </span>
                    </div>
                  </ion-card-content>
                </ion-card>
              }
            </div>
          }
        </div>

        <!-- Infinite scroll -->
        <ion-infinite-scroll
          [disabled]="!exploreService.hasMore()"
          (ionInfinite)="onInfiniteScroll($event)"
        >
          <ion-infinite-scroll-content loadingSpinner="crescent" />
        </ion-infinite-scroll>
      }

      @if (activeView() === 'globe') {
        <!-- Sport filter for globe -->
        <div class="globe-filters">
          <div class="chip-scroll">
            @for (sport of sports; track sport) {
              <ion-chip
                [outline]="activeSport() !== sport"
                [color]="activeSport() === sport ? 'primary' : undefined"
                (click)="onSportFilter(sport)"
              >
                {{ 'sports.' + sport | translate }}
              </ion-chip>
            }
          </div>
        </div>

        @if (exploreService.globeLoading() && exploreService.globePoints().length === 0) {
          <div class="centered-state">
            <ion-spinner name="crescent" />
            <ion-text color="medium">
              <p>{{ 'globe.loading' | translate }}</p>
            </ion-text>
          </div>
        } @else if (showGlobe()) {
          <div class="globe-container">
            <app-explore-globe
              [points]="exploreService.globePoints()"
              (pointTapped)="onGlobePointTapped($event)"
            />
          </div>
        }
      }
    </ion-content>

    <!-- User preview bottom sheet -->
    <ion-modal
      #previewModal
      [isOpen]="!!selectedGlobeUser()"
      [initialBreakpoint]="0.45"
      [breakpoints]="[0, 0.45, 0.75]"
      (didDismiss)="selectedGlobeUser.set(null)"
    >
      <ng-template>
        <app-user-preview-sheet
          [user]="selectedGlobeUser()"
          (enterCave)="onEnterCave($event)"
          (dismiss)="selectedGlobeUser.set(null)"
        />
      </ng-template>
    </ion-modal>
  `,
  styles: `
    .toggle-container {
      padding: 8px 16px 4px;
    }

    .toggle-track {
      position: relative;
      display: flex;
      background: var(--ion-color-step-100);
      border-radius: 12px;
      padding: 3px;
    }

    .toggle-slider {
      position: absolute;
      top: 3px;
      left: 3px;
      width: calc(50% - 3px);
      height: calc(100% - 6px);
      background: var(--ion-background-color, #fff);
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.globe {
        transform: translateX(100%);
      }
    }

    .toggle-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 0;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-color-medium);
      cursor: pointer;
      position: relative;
      z-index: 1;
      transition: color 0.3s ease;

      &.active {
        color: var(--ion-text-color);
      }

      ion-icon {
        font-size: 18px;
      }
    }

    .globe-teaser {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 4px;
      padding: 12px 14px;
      background: linear-gradient(135deg, rgba(var(--ion-color-primary-rgb), 0.08), rgba(var(--ion-color-primary-rgb), 0.03));
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
      border-radius: 14px;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:active {
        transform: scale(0.98);
      }
    }

    .globe-teaser-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      ion-icon {
        font-size: 20px;
      }
    }

    .globe-teaser-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .globe-teaser-title {
      font-size: 14px;
      font-weight: 700;
    }

    .globe-teaser-sub {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .globe-teaser-chevron {
      font-size: 18px;
      color: var(--ion-color-medium);
      flex-shrink: 0;
    }

    .explore-container {
      padding: 0 8px;
    }

    ion-searchbar {
      --border-radius: 12px;
      padding: 8px 0 4px;
    }

    .chip-scroll {
      display: flex;
      overflow-x: auto;
      gap: 4px;
      padding: 4px 0 8px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      ion-chip {
        flex-shrink: 0;
        font-size: 13px;
      }
    }

    ion-segment {
      margin-bottom: 12px;
    }

    .centered-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }

    .empty-state {
      .empty-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      padding-bottom: 16px;
    }

    .room-card {
      margin: 0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease;

      &:active {
        transform: scale(0.97);
      }

      .card-thumbnail {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
      }

      .thumbnail-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .pro-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1;
      }
    }

    .card-body {
      padding: 8px 10px 10px;
    }

    .card-user {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .card-avatar {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }

    .avatar-fallback {
      font-size: 22px;
      color: var(--ion-color-step-400);
    }

    .card-name {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-sports {
      display: flex;
      gap: 2px;
      margin-bottom: 4px;
    }

    .sport-chip {
      height: 20px;
      font-size: 10px;
      margin: 0;
      --padding-start: 6px;
      --padding-end: 6px;
    }

    .card-stats {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 14px;
      }
    }

    .globe-filters {
      padding: 0 8px;
    }

    .globe-container {
      width: 100%;
      height: calc(100% - 52px);
    }
  `,
})
export class ExplorePage implements OnInit, OnDestroy, ViewWillLeave, ViewDidEnter {
  exploreService = inject(ExploreService);
  private router = inject(Router);

  readonly sports = SPORT_FILTERS;
  activeSort = signal<ExploreSortBy>('recent');
  activeSport = signal<string | null>(null);
  activeView = signal<'list' | 'globe'>('list');
  showGlobe = signal(true);
  selectedGlobeUser = signal<GlobePoint | null>(null);

  @ViewChild('previewModal') previewModal!: IonModal;

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    addIcons({
      heartOutline,
      personCircleOutline,
      starOutline,
      searchOutline,
      listOutline,
      globeOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit(): void {
    this.exploreService.loadRooms({ reset: true });
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
  }

  ionViewWillLeave(): void {
    this.showGlobe.set(false);
  }

  ionViewDidEnter(): void {
    this.showGlobe.set(true);
  }

  switchView(view: 'list' | 'globe'): void {
    this.activeView.set(view);
    if (view === 'globe' && this.exploreService.globePoints().length === 0) {
      this.exploreService.loadGlobePoints(this.activeSport());
    }
  }

  onSearch(event: CustomEvent): void {
    const value = (event.detail.value as string)?.trim() || null;
    this.exploreService.loadRooms({ search: value, reset: true });
  }

  onSportFilter(sport: string): void {
    const current = this.activeSport();
    const next = current === sport ? null : sport;
    this.activeSport.set(next);
    this.exploreService.loadRooms({ sport: next, reset: true });
    if (this.activeView() === 'globe') {
      this.exploreService.loadGlobePoints(next);
    }
  }

  onSortChange(event: CustomEvent): void {
    const sort = event.detail.value as ExploreSortBy;
    this.activeSort.set(sort);
    this.exploreService.loadRooms({ sort, reset: true });
  }

  async onInfiniteScroll(event: CustomEvent): Promise<void> {
    await this.exploreService.loadMore();
    (event.target as HTMLIonInfiniteScrollElement).complete();
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await this.exploreService.refresh();
    (event.target as HTMLIonRefresherElement).complete();
  }

  openRoom(room: ExploreRoom): void {
    this.router.navigate(['/room', room.userId]);
  }

  onGlobePointTapped(point: GlobePoint): void {
    this.selectedGlobeUser.set(point);
  }

  async onEnterCave(userId: string): Promise<void> {
    this.selectedGlobeUser.set(null);
    await this.previewModal?.dismiss();
    this.router.navigate(['/room', userId]);
  }

  getGradient(index: number): string {
    const palette = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
    return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
  }
}
