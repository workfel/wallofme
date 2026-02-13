import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
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
  IonBadge,
  IonAvatar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  heartOutline,
  personCircleOutline,
  starOutline,
  searchOutline,
} from 'ionicons/icons';

import {
  ExploreService,
  type ExploreRoom,
  type ExploreSortBy,
} from '@app/core/services/explore.service';

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
    IonBadge,
    IonAvatar,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'explore.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'explore.title' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <div class="explore-container">
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
                    <ion-badge color="warning" class="pro-badge">PRO</ion-badge>
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
    </ion-content>
  `,
  styles: `
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
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
        --padding-start: 6px;
        --padding-end: 6px;
        --padding-top: 2px;
        --padding-bottom: 2px;
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
  `,
})
export class ExplorePage implements OnInit, OnDestroy {
  exploreService = inject(ExploreService);
  private router = inject(Router);

  readonly sports = SPORT_FILTERS;
  activeSort = signal<ExploreSortBy>('recent');
  activeSport = signal<string | null>(null);

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    addIcons({ heartOutline, personCircleOutline, starOutline, searchOutline });
  }

  ngOnInit(): void {
    this.exploreService.loadRooms({ reset: true });
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
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

  getGradient(index: number): string {
    const palette = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
    return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
  }
}
