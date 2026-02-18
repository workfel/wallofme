import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { DatePipe, SlicePipe } from "@angular/common";
import { Router } from "@angular/router";
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
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  heartOutline,
  personCircleOutline,
  starOutline,
  searchOutline,
  listOutline,
  globeOutline,
  chevronForwardOutline,
  flaskOutline,
  flagOutline,
  peopleOutline,
  walkOutline,
  trailSignOutline,
  bicycleOutline,
  waterOutline,
  fitnessOutline,
  trophyOutline,
} from "ionicons/icons";

import {
  ExploreService,
  type ExploreRoom,
  type ExploreSortBy,
  type GlobePoint,
} from "@app/core/services/explore.service";
import {
  RaceDiscoveryService,
  type RaceCard,
} from "@app/core/services/race-discovery.service";
import { UserService } from "@app/core/services/user.service";
import { ProBadgeComponent } from "@app/shared/components/pro-badge/pro-badge.component";
import { ExploreGlobeComponent } from "./globe/explore-globe.component";
import { UserPreviewSheetComponent } from "./globe/user-preview-sheet.component";

const SPORT_FILTERS = [
  "running",
  "trail",
  "triathlon",
  "cycling",
  "crossfit",
  "swimming",
  "ocr",
  "duathlon",
  "hyrox",
  "ironman",
  "marathon",
  "ultra",
] as const;

const SPORT_ICONS: Record<string, string> = {
  running: 'walk-outline',
  trail: 'trail-sign-outline',
  triathlon: 'bicycle-outline',
  cycling: 'bicycle-outline',
  swimming: 'water-outline',
  obstacle: 'fitness-outline',
  other: 'trophy-outline',
};

const GRADIENT_PALETTES = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#fccb90", "#d57eeb"],
  ["#e0c3fc", "#8ec5fc"],
];

@Component({
  selector: "app-explore",
  standalone: true,
  imports: [
    DatePipe,
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
        <ion-title>{{ "explore.title" | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <!-- View Toggle -->
      <div class="toggle-container">
        <div class="toggle-track">
          <div
            class="toggle-slider"
            [class.globe]="activeView() === 'globe'"
            [class.races]="activeView() === 'races'"
          ></div>
          <button
            class="toggle-btn"
            [class.active]="activeView() === 'list'"
            (click)="switchView('list')"
          >
            <ion-icon name="list-outline" />
            <span>{{ "explore.listView" | translate }}</span>
          </button>
          <button
            class="toggle-btn"
            [class.active]="activeView() === 'globe'"
            (click)="switchView('globe')"
          >
            <ion-icon name="globe-outline" />
            <span>{{ "explore.globeView" | translate }}</span>
          </button>
          <button
            class="toggle-btn"
            [class.active]="activeView() === 'races'"
            (click)="switchView('races')"
          >
            <ion-icon name="flag-outline" />
            <span>{{ "explore.races" | translate }}</span>
          </button>
        </div>
      </div>

      @if (activeView() === "list") {
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
            <span class="globe-teaser-title">{{
              "explore.globeTeaser" | translate
            }}</span>
            <span class="globe-teaser-sub">{{
              "explore.globeTeaserSub" | translate
            }}</span>
          </div>
          <ion-icon
            name="chevron-forward-outline"
            class="globe-teaser-chevron"
          />
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
            {{ "sports." + sport | translate }}
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
            <ion-label>{{ "explore.recent" | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="popular">
            <ion-label>{{ "explore.popular" | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="liked">
            <ion-label>{{ "explore.mostLiked" | translate }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Loading state (initial) -->
        @if ( exploreService.loading() && exploreService.rooms().length === 0 )
        {
        <div class="centered-state">
          <ion-spinner name="crescent" />
        </div>
        }

        <!-- Empty state -->
        @if (exploreService.isEmpty()) {
        <div class="centered-state empty-state">
          <ion-icon name="search-outline" class="empty-icon" />
          <h3>{{ "explore.noResults" | translate }}</h3>
          <ion-text color="medium">
            <p>{{ "explore.noResultsSubtitle" | translate }}</p>
          </ion-text>
        </div>
        }

        <!-- Room cards grid -->
        @if (exploreService.rooms().length > 0) {
        <div class="rooms-grid">
          @for ( room of exploreService.rooms(); track room.id; let i = $index )
          {
          <ion-card class="room-card" (click)="openRoom(room)" button>
            <div class="card-thumbnail" [style.background]="getGradient(i)">
              @if (room.thumbnailUrl) {
              <img
                [src]="room.thumbnailUrl"
                alt=""
                class="thumbnail-img"
                loading="lazy"
              />
              } @if (room.isPro) {
              <div class="pro-badge">
                <app-pro-badge size="small" />
              </div>
              } @if (isSeedUser(room.userId)) {
              <div class="seed-badge">
                <ion-icon name="flask-outline"></ion-icon>
                <span>{{ "explore.simulation" | translate }}</span>
              </div>
              }
            </div>
            <ion-card-content class="card-body">
              <div class="card-user">
                <ion-avatar class="card-avatar">
                  @if (room.image) {
                  <img [src]="room.image" alt="" />
                  } @else {
                  <ion-icon
                    name="person-circle-outline"
                    class="avatar-fallback"
                  />
                  }
                </ion-avatar>
                <span class="card-name">{{
                  room.displayName || ("explore.athlete" | translate)
                }}</span>
              </div>
              @if (room.sports && room.sports.length > 0) {
              <div class="card-sports">
                @for ( sport of room.sports | slice: 0 : 2; track sport ) {
                <ion-chip class="sport-chip" color="medium" outline>
                  {{ "sports." + sport | translate }}
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
      } @if (activeView() === "globe") {
      <!-- Sport filter for globe -->
      <div class="globe-filters">
        <div class="chip-scroll">
          @for (sport of sports; track sport) {
          <ion-chip
            [outline]="activeSport() !== sport"
            [color]="activeSport() === sport ? 'primary' : undefined"
            (click)="onSportFilter(sport)"
          >
            {{ "sports." + sport | translate }}
          </ion-chip>
          }
        </div>
      </div>

      @if ( exploreService.globeLoading() && exploreService.globePoints().length
      === 0 ) {
      <div class="centered-state">
        <ion-spinner name="crescent" />
        <ion-text color="medium">
          <p>{{ "globe.loading" | translate }}</p>
        </ion-text>
      </div>
      } @else if (showGlobe()) {
      <div class="globe-container">
        <app-explore-globe
          [points]="exploreService.globePoints()"
          (pointTapped)="onGlobePointTapped($event)"
        />
      </div>
      } }

      @if (activeView() === "races") {
      <div class="explore-container">
          <div class="leaderboard-entry-card" (click)="goToLeaderboard()">
            <div class="leaderboard-entry-left">
              <span class="leaderboard-icon">🏆</span>
              <div>
                <p class="leaderboard-title">Top Athlètes</p>
                <p class="leaderboard-subtitle">Classement global · Trophées & Likes</p>
              </div>
            </div>
            <ion-icon name="chevron-forward-outline" class="leaderboard-arrow" />
          </div>

        <!-- Search bar -->
        <ion-searchbar
          [placeholder]="'races.searchPlaceholder' | translate"
          [debounce]="300"
          (ionInput)="onRaceSearch($event)"
          mode="ios"
        />

        <!-- Sport filter toggle -->
        <div class="sport-filter-toggle">
          <button class="sport-toggle-btn" [class.active]="showMySportsOnly()" (click)="toggleSportsFilter()">
            {{ 'races.mySports' | translate }}
          </button>
          <button class="sport-toggle-btn" [class.active]="!showMySportsOnly()" (click)="toggleSportsFilter()">
            {{ 'races.allSports' | translate }}
          </button>
        </div>

        <!-- Trending section -->
        @if (raceDiscovery.trendingRaces().length > 0) {
          <div class="section-header">
            <h3>{{ 'races.trending' | translate }}</h3>
          </div>
          <div class="trending-scroll">
            @for (race of raceDiscovery.trendingRaces(); track race.id) {
              <div class="trending-card" (click)="openWallOfFame(race.id)">
                <div class="trending-icon">
                  <ion-icon [name]="getSportIcon(race.sport)" />
                </div>
                <div class="trending-info">
                  <span class="trending-name">{{ race.name }}</span>
                  <span class="trending-meta">
                    @if (race.location) { {{ race.location }} · }
                    {{ 'races.finishers' | translate:{ count: race.finisherCount } }}
                  </span>
                </div>
                @if (race.userHasRun) {
                  <div class="you-ran-badge">&#10003;</div>
                }
              </div>
            }
          </div>
        }

        <!-- Recent races section -->
        <div class="section-header">
          <h3>{{ 'races.recent' | translate }}</h3>
        </div>

        @if (raceDiscovery.loadingRaces() && raceDiscovery.races().length === 0) {
          <div class="centered-state">
            <ion-spinner name="crescent" />
          </div>
        } @else if (raceDiscovery.races().length === 0) {
          <div class="centered-state empty-state">
            <ion-icon name="trophy-outline" class="empty-icon" />
            <h3>{{ 'races.noResults' | translate }}</h3>
          </div>
        } @else {
          <div class="races-list">
            @for (race of raceDiscovery.races(); track race.id) {
              <div class="race-item" (click)="openWallOfFame(race.id)">
                <div class="race-sport-icon">
                  <ion-icon [name]="getSportIcon(race.sport)" />
                </div>
                <div class="race-info">
                  <span class="race-name">{{ race.name }}</span>
                  <span class="race-meta">
                    @if (race.location) { {{ race.location }} }
                    @if (race.date) { · {{ race.date | date:'mediumDate' }} }
                  </span>
                </div>
                <div class="race-right">
                  <div class="finisher-pill">
                    <ion-icon name="people-outline" />
                    {{ race.finisherCount }}
                  </div>
                  @if (race.userHasRun) {
                    <div class="you-ran-chip">&#10003; {{ 'races.youRanThis' | translate }}</div>
                  }
                </div>
              </div>
            }
          </div>

          <ion-infinite-scroll
            [disabled]="!raceDiscovery.hasMore()"
            (ionInfinite)="onRacesInfiniteScroll($event)"
          >
            <ion-infinite-scroll-content loadingSpinner="crescent" />
          </ion-infinite-scroll>
        }
      </div>
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
    /* Global Background */
    ion-content {
      /*--background: radial-gradient(circle at 50% 0%, #e0f7fa 0%, #f0f4f8 100%);*/
    }

    ion-header ion-toolbar {
      --background: transparent;
      --border-width: 0;
    }

    .toggle-container {
      padding: 8px 16px 4px;
    }

    .toggle-track {
      position: relative;
      display: flex;
      background: var(--wom-glass-bg-subtle);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 16px;
      padding: 4px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }

    .toggle-slider {
      position: absolute;
      top: 4px;
      left: 4px;
      width: calc(33.33% - 2.67px);
      height: calc(100% - 8px);
      /*background: rgba(255, 255, 255, 0.85);*/
      background : #1a1a1a1a;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.globe {
        transform: translateX(100%);
      }

      &.races {
        transform: translateX(200%);
      }
    }

    .toggle-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 0;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 700;
      color: var(--ion-color-step-500);
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
      gap: 14px;
      margin: 8px 0 4px;
      padding: 14px 16px;
      /*background: rgba(255, 255, 255, 0.5);*/
      background : #1a1a1a1a;
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: transform 0.2s ease;

      &:active {
        transform: scale(0.98);
      }
    }

    .globe-teaser-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);

      ion-icon {
        font-size: 22px;
      }
    }

    .globe-teaser-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .globe-teaser-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .globe-teaser-sub {
      font-size: 12px;
      color: var(--ion-color-step-500);
      font-weight: 500;
    }

    .globe-teaser-chevron {
      font-size: 20px;
      color: var(--ion-color-step-400);
      flex-shrink: 0;
    }

    .explore-container {
      padding: 0 12px;
    }

    ion-searchbar {
      --border-radius: 16px;
      --background: var(--wom-glass-bg-medium);
      --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      padding: 8px 0 4px;
    }

    .chip-scroll {
      display: flex;
      overflow-x: auto;
      gap: 6px;
      padding: 4px 0 8px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      ion-chip {
        flex-shrink: 0;
        font-size: 13px;
        font-weight: 600;
        --background: var(--wom-glass-bg-medium);
        backdrop-filter: blur(8px);
        border: 1px solid var(--wom-glass-border);
      }
    }

    ion-segment {
      margin-bottom: 12px;
      --background: var(--wom-glass-bg-subtle);
      border-radius: 12px;
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
        font-size: 56px;
        color: rgba(var(--ion-color-medium-rgb), 0.5);
        margin-bottom: 16px;
      }

      h3 {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 8px;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: var(--ion-color-step-500);
      }
    }

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding-bottom: 24px;
    }

    .room-card {
      margin: 0;
      border-radius: 20px;
      overflow: hidden;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(16px) saturate(1.6);
      -webkit-backdrop-filter: blur(16px) saturate(1.6);
      border: 1px solid var(--wom-glass-border-strong);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);
      transition: transform 0.2s ease;
      --background: transparent;

      &:active {
        transform: scale(0.97);
      }

      .card-thumbnail {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        border-radius: 16px 16px 0 0;
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

      .seed-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 1;
        background: rgba(var(--ion-color-warning-rgb), 0.85);
        color: var(--ion-color-warning-contrast);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 4px;
        backdrop-filter: blur(4px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 1px solid var(--wom-glass-border-subtle);

        ion-icon {
          font-size: 12px;
        }
      }
    }

    .card-body {
      padding: 10px 12px 12px;
    }

    .card-user {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .card-avatar {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      border: 1.5px solid var(--wom-glass-border-ring);
    }

    .avatar-fallback {
      font-size: 24px;
      color: var(--ion-color-step-400);
    }

    .card-name {
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--ion-text-color);
    }

    .card-sports {
      display: flex;
      gap: 4px;
      margin-bottom: 6px;
    }

    .sport-chip {
      height: 22px;
      font-size: 10px;
      margin: 0;
      --padding-start: 8px;
      --padding-end: 8px;
      font-weight: 600;
    }

    .card-stats {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ion-color-step-500);

      ion-icon {
        font-size: 14px;
      }
    }

    .globe-filters {
      padding: 0 12px;
    }

    .globe-container {
      width: 100%;
      height: calc(100% - 52px);
    }

    .section-header {
      h3 {
        font-size: 16px;
        font-weight: 800;
        margin: 16px 0 8px;
        color: var(--ion-text-color);
      }
    }

    .sport-filter-toggle {
      display: flex;
      gap: 8px;
      margin: 8px 0;
    }

    .sport-toggle-btn {
      flex: 1;
      padding: 8px;
      border: 1px solid var(--wom-glass-border);
      border-radius: 12px;
      background: transparent;
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-step-500);
      cursor: pointer;

      &.active {
        background: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast);
        border-color: var(--ion-color-primary);
      }
    }

    .trending-scroll {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .trending-card {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 220px;
      padding: 12px;
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 16px;
      cursor: pointer;
      flex-shrink: 0;

      &:active { transform: scale(0.97); }
    }

    .trending-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      ion-icon { font-size: 18px; }
    }

    .trending-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .trending-name {
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .trending-meta {
      font-size: 11px;
      color: var(--ion-color-step-500);
    }

    .you-ran-badge {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--ion-color-success);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .races-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-bottom: 24px;
    }

    .race-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 16px;
      cursor: pointer;

      &:active { transform: scale(0.98); }
    }

    .race-sport-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      ion-icon { font-size: 20px; color: var(--ion-color-primary); }
    }

    .race-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .race-name {
      font-size: 14px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .race-meta {
      font-size: 12px;
      color: var(--ion-color-step-500);
    }

    .race-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .finisher-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ion-color-step-500);
      ion-icon { font-size: 13px; }
    }

    .you-ran-chip {
      font-size: 10px;
      font-weight: 700;
      color: var(--ion-color-success);
    }

    .leaderboard-entry-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(var(--ion-color-warning-rgb), 0.12), rgba(var(--ion-color-primary-rgb), 0.08));
      border: 1px solid rgba(var(--ion-color-warning-rgb), 0.25);
      border-radius: 16px;
      margin-bottom: 20px;
      cursor: pointer;

      .leaderboard-entry-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .leaderboard-icon {
        font-size: 28px;
      }

      .leaderboard-title {
        font-size: 15px;
        font-weight: 700;
        margin: 0 0 2px;
      }

      .leaderboard-subtitle {
        font-size: 12px;
        color: var(--ion-color-medium);
        margin: 0;
      }

      .leaderboard-arrow {
        font-size: 18px;
        color: var(--ion-color-medium);
      }
    }
  `,
})
export class ExplorePage
  implements OnInit, OnDestroy, ViewWillLeave, ViewDidEnter
{
  exploreService = inject(ExploreService);
  raceDiscovery = inject(RaceDiscoveryService);
  private userService = inject(UserService);
  private router = inject(Router);

  readonly sports = SPORT_FILTERS;
  readonly sportIcons = SPORT_ICONS;
  activeSort = signal<ExploreSortBy>("recent");
  activeSport = signal<string | null>(null);
  activeView = signal<"list" | "globe" | "races">("list");
  showGlobe = signal(true);
  selectedGlobeUser = signal<GlobePoint | null>(null);
  showMySportsOnly = signal(true);
  raceSearch = signal('');

  @ViewChild("previewModal") previewModal!: IonModal;

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private raceSearchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    addIcons({
      heartOutline,
      personCircleOutline,
      starOutline,
      searchOutline,
      listOutline,
      globeOutline,
      chevronForwardOutline,
      flaskOutline,
      flagOutline,
      peopleOutline,
      walkOutline,
      trailSignOutline,
      bicycleOutline,
      waterOutline,
      fitnessOutline,
      trophyOutline,
    });
  }

  ngOnInit(): void {
    this.exploreService.loadRooms({ reset: true });
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    if (this.raceSearchTimer) clearTimeout(this.raceSearchTimer);
  }

  ionViewWillLeave(): void {
    this.showGlobe.set(false);
  }

  ionViewDidEnter(): void {
    this.showGlobe.set(true);
  }

  switchView(view: "list" | "globe" | "races"): void {
    this.activeView.set(view);
    if (view === "globe" && this.exploreService.globePoints().length === 0) {
      this.exploreService.loadGlobePoints(this.activeSport());
    }
    if (view === "races" && this.raceDiscovery.trendingRaces().length === 0) {
      this.raceDiscovery.loadTrending();
      this.loadRacesWithFilters(true);
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
    if (this.activeView() === "globe") {
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
    this.router.navigate(["/room", room.userId]);
  }

  onGlobePointTapped(point: GlobePoint): void {
    this.selectedGlobeUser.set(point);
  }

  async onEnterCave(userId: string): Promise<void> {
    this.selectedGlobeUser.set(null);
    await this.previewModal?.dismiss();
    this.router.navigate(["/room", userId]);
  }

  getGradient(index: number): string {
    const palette = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
    return `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`;
  }

  private getUserSports(): string[] {
    const sports = this.userService.profile()?.sports;
    if (!sports) return [];
    const validSports = ["running", "trail", "triathlon", "cycling", "swimming", "obstacle", "other"];
    return sports.filter((s) => validSports.includes(s));
  }

  private loadRacesWithFilters(reset: boolean = false): void {
    const sports = this.showMySportsOnly() ? this.getUserSports() : [];
    const q = this.raceSearch() || undefined;
    this.raceDiscovery.loadRaces({ q, sports, reset });
  }

  onRaceSearch(event: CustomEvent): void {
    const value = (event.detail.value as string)?.trim() || '';
    this.raceSearch.set(value);
    if (this.raceSearchTimer) clearTimeout(this.raceSearchTimer);
    this.raceSearchTimer = setTimeout(() => this.loadRacesWithFilters(true), 300);
  }

  toggleSportsFilter(): void {
    this.showMySportsOnly.update(v => !v);
    this.loadRacesWithFilters(true);
  }

  async onRacesInfiniteScroll(event: CustomEvent): Promise<void> {
    const sports = this.showMySportsOnly() ? this.getUserSports() : [];
    const q = this.raceSearch() || undefined;
    await this.raceDiscovery.loadMore({ q, sports });
    (event.target as HTMLIonInfiniteScrollElement).complete();
  }

  openWallOfFame(raceId: string): void {
    this.router.navigate(['/race', raceId, 'wall-of-fame']);
  }

  goToLeaderboard(): void {
    this.router.navigate(['/leaderboard']);
  }

  getSportIcon(sport: string | null): string {
    return sport ? (this.sportIcons[sport] ?? 'trophy-outline') : 'trophy-outline';
  }

  isSeedUser(userId: string): boolean {
    return userId.startsWith("seed-");
  }
}
