import { Component, inject, input, signal, OnInit } from "@angular/core";
import { Location, DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonText,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  arrowBackOutline,
  cubeOutline,
  personCircleOutline,
  chevronForwardOutline,
} from "ionicons/icons";

import { ApiService } from "@app/core/services/api.service";
import { ProfileInfoComponent } from "@app/shared/components/profile-info/profile-info.component";
import { StatsRowComponent } from "@app/shared/components/stats-row/stats-row.component";
import { TrophyGridComponent } from "@app/shared/components/trophy-grid/trophy-grid.component";

interface UserRace {
  time: string | null;
  ranking: number | null;
  race: {
    id: string;
    name: string;
    date: string | null;
    location: string | null;
    sport: string | null;
    distance: string | null;
  };
}

interface PublicProfile {
  id: string;
  displayName: string | null;
  firstName: string | null;
  image: string | null;
  country: string | null;
  sports: string[];
  isPro: boolean;
  trophyCount: number;
  likeCount: number;
  viewCount: number;
  trophies: { id: string; type: string; thumbnailUrl: string | null }[];
}

@Component({
  selector: "app-public-profile",
  standalone: true,
  imports: [
    TranslateModule,
    DatePipe,
    IonContent,
    IonText,
    IonSpinner,
    IonIcon,
    ProfileInfoComponent,
    StatsRowComponent,
    TrophyGridComponent,
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="true">
      <!-- Banner -->
      <div class="banner">
        <!-- Floating toolbar over banner -->
        <div class="floating-toolbar">
          <button class="toolbar-pill" (click)="goBack()">
            <ion-icon name="arrow-back-outline" />
          </button>
          <div class="toolbar-spacer"></div>
        </div>
      </div>

      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (profile(); as p) {
        <!-- Card body with rounded top corners -->
        <div class="card-body">
          <!-- Avatar overlapping banner / card -->
          <div class="avatar-anchor">
            <div class="avatar-ring">
              @if (p.image) {
                <img [src]="p.image" alt="avatar" class="avatar-img" />
              } @else {
                <div class="avatar-placeholder-wrapper">
                  <ion-icon
                    name="person-circle-outline"
                    class="avatar-placeholder"
                  />
                </div>
              }
            </div>
          </div>

          <app-profile-info
            [displayName]="p.displayName || p.firstName || ''"
            [isPro]="p.isPro"
            [country]="p.country"
            [sports]="p.sports"
          />

          <app-stats-row
            [stats]="[
              { value: p.trophyCount, label: 'profile.statTrophies' },
              { value: p.likeCount, label: 'profile.statLikes' },
              { value: p.viewCount, label: 'profile.statViews' }
            ]"
            variant="inline"
          />

          <!-- Visit Pain Cave button -->
          <div class="action-row">
            <button class="action-btn primary" (click)="visitRoom()">
              <ion-icon name="cube-outline" />
              {{ "publicProfile.visitRoom" | translate }}
            </button>
          </div>

          <app-trophy-grid
            [trophies]="p.trophies"
            [clickable]="false"
            emptyMessage="publicProfile.noTrophies"
          />

          @if (races().length > 0) {
            <div class="races-section">
              <h3 class="section-title">{{ 'publicProfile.racesSection' | translate }}</h3>
              <div class="races-list">
                @for (r of races(); track r.race.id) {
                  <div class="race-row" (click)="openWallOfFame(r.race.id)">
                    <div class="race-details">
                      <span class="race-name">{{ r.race.name }}</span>
                      @if (r.race.date) {
                        <span class="race-date">{{ r.race.date | date:'mediumDate' }}</span>
                      }
                    </div>
                    @if (r.time) {
                      <span class="race-time">{{ r.time }}</span>
                    }
                    <ion-icon name="chevron-forward-outline" />
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="centered">
          <ion-text color="medium">
            <p>{{ "common.error" | translate }}</p>
          </ion-text>
        </div>
      }
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
      width: var(--avatar-size);
      height: var(--avatar-size);
      border-radius: 50%;
      border: 4px solid var(--wom-glass-border-ring);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      background: var(--ion-color-step-100);
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-placeholder-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-100);
    }

    .avatar-placeholder {
      font-size: 72px;
      color: var(--ion-color-step-300);
    }

    /* ── Action button ──────────────────────── */
    .action-row {
      display: flex;
      justify-content: center;
      padding: 24px 24px 28px;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 32px;
      border-radius: 100px;
      font-size: 15px;
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
        font-size: 20px;
      }
    }

    .action-btn.primary {
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      border: none;
      box-shadow: 0 4px 16px rgba(var(--ion-color-primary-rgb), 0.4);
    }

    /* ── Races section ─────────────────────── */
    .races-section {
      margin-top: 24px;
      padding: 0 16px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 800;
      margin: 0 0 12px;
    }

    .races-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .race-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 14px;
      cursor: pointer;

      &:active { transform: scale(0.98); }

      ion-icon { font-size: 18px; color: var(--ion-color-step-400); flex-shrink: 0; }
    }

    .race-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .race-name {
      font-size: 14px;
      font-weight: 700;
    }

    .race-date {
      font-size: 12px;
      color: var(--ion-color-step-500);
    }

    .race-time {
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-primary);
      flex-shrink: 0;
    }

    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  `,
})
export class PublicProfilePage implements OnInit {
  userId = input.required<string>();

  private api = inject(ApiService);
  private router = inject(Router);
  private location = inject(Location);

  profile = signal<PublicProfile | null>(null);
  races = signal<UserRace[]>([]);
  loading = signal(true);

  constructor() {
    addIcons({
      arrowBackOutline,
      cubeOutline,
      personCircleOutline,
      chevronForwardOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.users[":id"].$get({
        param: { id: this.userId() },
      });
      if (res.ok) {
        const json = await res.json();
        this.profile.set(json.data as PublicProfile);
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }

    this.fetchRaces();
  }

  async fetchRaces(): Promise<void> {
    try {
      const userId = this.userId();
      const res = await (this.api.client.api.users as any)[':id'].races.$get({
        param: { id: userId },
        query: { page: '1', limit: '5' },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: UserRace[] };
        this.races.set(json.data);
      }
    } catch {
      // silently fail
    }
  }

  openWallOfFame(raceId: string): void {
    this.router.navigate(['/race', raceId, 'wall-of-fame']);
  }

  goBack(): void {
    this.location.back();
  }

  visitRoom(): void {
    this.router.navigate(["/room", this.userId()]);
  }
}
