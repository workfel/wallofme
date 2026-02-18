import { Component, inject, signal, computed, OnInit, OnDestroy, input, effect, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  IonContent,
  IonSpinner,
  IonAvatar,
  IonBadge,
  IonText,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSegment,
  IonSegmentButton,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBackOutline, peopleOutline, trophyOutline, timerOutline, starOutline, personOutline, heartOutline, locationOutline, calendarOutline } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';
import { AuthService } from '@app/core/services/auth.service';

interface Finisher {
  id: string;
  time: string | null;
  ranking: number | null;
  categoryRanking: number | null;
  totalParticipants: number | null;
  user: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    isPro: boolean;
  };
  roomLikeCount: number | null;
  trophyCount: number | null;
  isMe: boolean;
}

interface RaceInfo {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  distance: string | null;
  sport: string | null;
}

@Component({
  selector: 'app-race-finishers',
  standalone: true,
  imports: [
    DatePipe,
    TranslateModule,
    IonContent,
    IonSpinner,
    IonAvatar,
    IonBadge,
    IonText,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSegment,
    IonSegmentButton,
  ],
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <!-- Floating glass header -->
      <div class="floating-header">
        <button class="back-pill" (click)="goBack()">
          <ion-icon name="arrow-back-outline" />
        </button>
        <div class="header-title-pill">
          <span>{{ 'finishers.title' | translate }}</span>
        </div>
        <div class="header-spacer"></div>
      </div>

      @if (loading() && finishers().length === 0) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (race()) {
        <!-- Race hero card -->
        <div class="race-hero-card animate-fade-in">
          <h2 class="race-name">{{ race()!.name }}</h2>
          <div class="meta-pills">
            @if (race()!.location) {
              <span class="meta-pill">
                <ion-icon name="location-outline" />
                {{ race()!.location }}
              </span>
            }
            @if (race()!.date) {
              <span class="meta-pill">
                <ion-icon name="calendar-outline" />
                {{ race()!.date | date:'mediumDate' }}
              </span>
            }
            @if (race()!.distance) {
              <span class="meta-pill">{{ race()!.distance }}</span>
            }
          </div>
          <div class="finisher-total">
            <ion-icon name="people-outline" />
            {{ 'finishers.totalCount' | translate:{ count: totalFinishers() } }}
          </div>
        </div>

        <!-- Sort segment -->
        <ion-segment [value]="sort()" (ionChange)="onSortChange($event)" mode="ios" class="sort-segment">
          <ion-segment-button value="time">
            <span>{{ 'finishers.sortTime' | translate }}</span>
          </ion-segment-button>
          <ion-segment-button value="trophies">
            <span>{{ 'finishers.sortTrophies' | translate }}</span>
          </ion-segment-button>
          <ion-segment-button value="likes">
            <span>{{ 'finishers.sortLikes' | translate }}</span>
          </ion-segment-button>
        </ion-segment>

        @if (sort() === 'trophies' || sort() === 'likes') {
          <div class="sort-context-hint">
            {{ (sort() === 'trophies' ? 'finishers.sortTrophiesSubtitle' : 'finishers.sortLikesSubtitle') | translate }}
          </div>
        }

        @if (isCurrentUserInRace()) {
          <div class="you-ran-banner">
            &#127942; {{ 'finishers.youRanThisBanner' | translate }}
          </div>
        }

        @if (finishers().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-circle">
              <ion-icon name="trophy-outline" />
            </div>
            <ion-text color="medium">
              <p>{{ 'finishers.empty' | translate }}</p>
            </ion-text>
          </div>
        } @else {
          <div class="finisher-list-card animate-fade-in-up">
            @for (f of finishers(); track f.id; let i = $index) {
              <div
                [id]="'finisher-row-' + f.id"
                class="finisher-row"
                [class.finisher-row-me]="f.isMe"
                (click)="onUserClick(f.user.id)"
              >
                <span class="rank-number">#{{ i + 1 }}</span>
                <ion-avatar>
                  @if (f.user.image) {
                    <img [src]="f.user.image" [alt]="getUserName(f)" />
                  } @else {
                    <div class="avatar-placeholder">{{ getInitials(f) }}</div>
                  }
                </ion-avatar>
                <div class="finisher-info">
                  <span class="finisher-name">
                    {{ getUserName(f) }}
                    @if (f.user.isPro) {
                      <ion-badge color="warning" class="pro-badge">PRO</ion-badge>
                    }
                  </span>
                  <span class="finisher-sub">
                    @if (f.time) {
                      <span class="finisher-time">
                        <ion-icon name="timer-outline" />
                        {{ f.time }}
                      </span>
                    } @else {
                      <span class="no-time">{{ 'finishers.noTime' | translate }}</span>
                    }
                    @if (f.ranking) {
                      <span class="finisher-ranking">
                        <ion-icon name="star-outline" />
                        #{{ f.ranking }}@if (f.totalParticipants) {/{{ f.totalParticipants }}}
                      </span>
                    }
                  </span>
                </div>
                @if (sort() === 'trophies' && f.trophyCount != null) {
                  <div class="metric-chip trophy-chip">
                    <ion-icon name="trophy-outline" />
                    {{ f.trophyCount }}
                  </div>
                }
                @if (sort() === 'likes' && f.roomLikeCount != null) {
                  <div class="metric-chip like-chip">
                    <ion-icon name="heart-outline" />
                    {{ f.roomLikeCount }}
                  </div>
                }
              </div>
            }
          </div>

          <ion-infinite-scroll (ionInfinite)="onInfiniteScroll($event)">
            <ion-infinite-scroll-content />
          </ion-infinite-scroll>

          @if (showFloatingBar()) {
            <div class="floating-bar-spacer"></div>
          }
        }

        @if (!isAuthenticated()) {
          <div class="visitor-cta" (click)="router.navigate(['/auth'])">
            <p>{{ 'finishers.wallOfFame' | translate }}</p>
            <span>Cr\u00e9e ta Pain Cave &rarr;</span>
          </div>
        }
      }

      <!-- ═══ Floating user bar ═══ -->
      @if (showFloatingBar()) {
        <div class="floating-user-bar" (click)="scrollToMyRank()">
          <span class="floating-rank">#{{ myFinisherRank() }}</span>
          <ion-avatar class="floating-avatar">
            @if (myFinisher()!.user.image) {
              <img [src]="myFinisher()!.user.image" alt="You" />
            } @else {
              <div class="avatar-placeholder floating-placeholder">{{ getInitials(myFinisher()!) }}</div>
            }
          </ion-avatar>
          <span class="floating-name">{{ getUserName(myFinisher()!) }}</span>
          @if (myFinisher()!.time) {
            <span class="floating-time">
              <ion-icon name="timer-outline" />
              {{ myFinisher()!.time }}
            </span>
          }
        </div>
      }
    </ion-content>
  `,
  styles: `
    /* ── Floating glass header ────────────────── */
    .floating-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      flex-shrink: 0;

      &:active { transform: scale(0.92); }
      ion-icon { font-size: 22px; color: var(--ion-text-color); }
    }

    .header-title-pill {
      padding: 10px 20px;
      border-radius: 100px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.65);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      span {
        font-size: 15px;
        font-weight: 700;
        color: var(--ion-text-color);
        letter-spacing: -0.01em;
      }
    }

    .header-spacer { flex: 1; }

    /* ── Centered / Loading ───────────────────── */
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    /* ── Race hero card ───────────────────────── */
    .race-hero-card {
      text-align: center;
      padding: 24px 20px;
      margin-bottom: 20px;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .race-name {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 12px;
      color: var(--ion-text-color);
    }

    .meta-pills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border-radius: 100px;
      background: var(--wom-glass-bg-subtle);
      border: 1px solid var(--wom-glass-border-subtle);
      font-size: 13px;
      color: var(--ion-color-medium);

      ion-icon { font-size: 14px; }
    }

    .finisher-total {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;

      ion-icon { font-size: 18px; }
    }

    /* ── Sort segment ─────────────────────────── */
    .sort-segment {
      margin-bottom: 8px;
      --background: var(--wom-glass-bg-subtle);
      border-radius: 12px;
    }

    .sort-context-hint {
      text-align: center;
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-bottom: 12px;
      font-style: italic;
    }

    /* ── You ran banner ───────────────────────── */
    .you-ran-banner {
      text-align: center;
      padding: 14px 16px;
      background: var(--wom-glass-bg-medium);
      border: 2px solid rgba(var(--ion-color-primary-rgb), 0.3);
      border-radius: 16px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 700;
      color: var(--ion-color-primary);
      backdrop-filter: blur(12px) saturate(1.8);
      -webkit-backdrop-filter: blur(12px) saturate(1.8);
    }

    /* ── Empty state ──────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      gap: 16px;

      p { margin: 0; font-size: 15px; font-weight: 500; }
    }

    .empty-icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);

      ion-icon { font-size: 36px; color: var(--ion-color-medium); }
    }

    /* ═══ Finisher list card ══════════════════════ */
    .finisher-list-card {
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 20px;
      padding: 6px;
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
    }

    .finisher-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: transform 0.18s ease, background 0.18s ease;

      &:active { transform: scale(0.98); }
    }

    .finisher-row-me {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
    }

    .rank-number {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-color-medium);
      min-width: 32px;
      text-align: center;
      flex-shrink: 0;
    }

    ion-avatar {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-200);
      border-radius: 50%;
      font-size: 14px;
      font-weight: 700;
      color: var(--ion-color-step-600);
    }

    .finisher-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .finisher-name {
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--ion-text-color);
    }

    .pro-badge {
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 4px;
    }

    .finisher-sub {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .finisher-time,
    .finisher-ranking {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 13px;

      ion-icon { font-size: 14px; }
    }

    .finisher-time {
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    .no-time {
      font-size: 13px;
      color: var(--ion-color-medium);
      font-style: italic;
    }

    /* ── Metric chips ─────────────────────────── */
    .metric-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      white-space: nowrap;
      flex-shrink: 0;

      ion-icon { font-size: 14px; }
    }

    .trophy-chip {
      background: rgba(var(--ion-color-warning-rgb), 0.15);
      color: var(--ion-color-warning-shade);
    }

    .like-chip {
      background: rgba(var(--ion-color-danger-rgb), 0.12);
      color: var(--ion-color-danger);
    }

    /* ── Visitor CTA ──────────────────────────── */
    .visitor-cta {
      text-align: center;
      margin: 24px 0;
      padding: 24px 20px;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: transform 0.18s ease;

      &:active { transform: scale(0.98); }
      p { font-size: 16px; font-weight: 800; margin: 0 0 4px; color: var(--ion-text-color); }
      span { font-size: 14px; color: var(--ion-color-primary); font-weight: 600; }
    }

    /* ═══ Floating user bar ═══════════════════════ */
    .floating-user-bar {
      position: fixed;
      bottom: calc(var(--ion-safe-area-bottom, 0px) + 16px);
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(var(--ion-color-primary-rgb), 0.4);
      z-index: 1000;
      cursor: pointer;
      animation: slideUp 0.3s ease;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.18s ease;

      &:active { transform: scale(0.98); }
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .floating-rank {
      font-size: 14px;
      font-weight: 800;
      min-width: 32px;
      text-align: center;
    }

    .floating-avatar {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .floating-placeholder {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.2);
      color: var(--ion-color-primary-contrast);
    }

    .floating-name {
      flex: 1;
      font-size: 15px;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .floating-time {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;

      ion-icon { font-size: 14px; color: var(--ion-color-primary-contrast); }
    }

    .floating-bar-spacer { height: 80px; }
  `,
})
export class RaceFinishersPage implements OnInit, OnDestroy {
  raceId = input.required<string>();

  private api = inject(ApiService);
  router = inject(Router);
  private authService = inject(AuthService);
  private navCtrl = inject(NavController);
  private zone = inject(NgZone);
  race = signal<RaceInfo | null>(null);
  finishers = signal<Finisher[]>([]);
  totalFinishers = signal(0);
  loading = signal(true);
  sort = signal<'time' | 'trophies' | 'likes'>('time');
  isCurrentUserInRace = signal(false);
  isAuthenticated = signal(false);
  page = 1;

  // Floating bar signals — server-provided, with fallback to searching loaded entries
  private serverMyFinisher = signal<(Finisher & { rank: number }) | null>(null);

  myFinisher = computed<(Finisher & { rank: number }) | null>(() => {
    const server = this.serverMyFinisher();
    if (server) return server;
    // Fallback: find in loaded finishers
    const all = this.finishers();
    const idx = all.findIndex((f) => f.isMe);
    if (idx < 0) return null;
    return { ...all[idx], rank: idx + 1 };
  });

  myFinisherRank = computed(() => this.myFinisher()?.rank ?? 0);
  isCurrentUserRowVisible = signal(false);
  showFloatingBar = computed(() => {
    const finisher = this.myFinisher();
    return finisher != null && !this.isCurrentUserRowVisible();
  });

  private observer: IntersectionObserver | null = null;
  private observedElement: HTMLElement | null = null;

  constructor() {
    addIcons({ arrowBackOutline, peopleOutline, trophyOutline, timerOutline, starOutline, personOutline, heartOutline, locationOutline, calendarOutline });

    // Watch for current user finisher to setup IntersectionObserver
    effect(() => {
      const mine = this.myFinisher();
      if (!mine) return;
      // Check if the user's row is in the loaded finisher list
      const isLoaded = this.finishers().some((f) => f.id === mine.id);
      if (isLoaded) {
        setTimeout(() => this.setupUserRowObserver(), 150);
      }
    });
  }

  ngOnInit(): void {
    this.isAuthenticated.set(!!this.authService.user());
    this.fetchFinishers();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  goBack(): void {
    this.navCtrl.back();
  }

  async fetchFinishers(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.races[':id'].finishers.$get({
        param: { id: this.raceId() },
        query: { page: String(this.page), limit: '20', sort: this.sort() },
      });

      if (res.ok) {
        const json = (await res.json()) as {
          data: {
            race: RaceInfo;
            finishers: Finisher[];
            totalFinishers: number;
            currentUser: (Finisher & { rank: number }) | null;
          };
        };
        this.race.set(json.data.race);
        const finishersData = json.data.finishers;
        if (!this.isCurrentUserInRace() && (finishersData.some((f: any) => f.isMe) || json.data.currentUser)) {
          this.isCurrentUserInRace.set(true);
        }
        if (this.page === 1 && json.data.currentUser) {
          this.serverMyFinisher.set(json.data.currentUser);
        }
        this.finishers.update((prev) => [...prev, ...finishersData]);
        this.totalFinishers.set(json.data.totalFinishers);
      }
    } catch {
      // handle error silently
    } finally {
      this.loading.set(false);
    }
  }

  async onInfiniteScroll(event: CustomEvent): Promise<void> {
    const target = event.target as HTMLIonInfiniteScrollElement;
    if (this.finishers().length >= this.totalFinishers()) {
      target.disabled = true;
      return;
    }
    this.page++;
    await this.fetchFinishers();
    target.complete();
  }

  onSortChange(event: CustomEvent): void {
    this.sort.set(event.detail.value);
    this.page = 1;
    this.finishers.set([]);
    this.serverMyFinisher.set(null);
    this.observer?.disconnect();
    this.observedElement = null;
    this.isCurrentUserRowVisible.set(false);
    this.fetchFinishers();
  }

  onUserClick(userId: string): void {
    this.router.navigate(['/room', userId]);
  }

  scrollToMyRank(): void {
    const mine = this.myFinisher();
    if (!mine) return;
    const el = document.getElementById(`finisher-row-${mine.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  getUserName(f: Finisher): string {
    if (f.user.displayName) return f.user.displayName;
    if (f.user.firstName && f.user.lastName) {
      return `${f.user.firstName} ${f.user.lastName}`;
    }
    return f.user.firstName ?? 'Athlete';
  }

  getInitials(f: Finisher): string {
    const name = this.getUserName(f);
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private setupUserRowObserver(): void {
    const mine = this.myFinisher();
    if (!mine) return;

    const el = document.getElementById(`finisher-row-${mine.id}`);
    if (!el || el === this.observedElement) return;

    this.observer?.disconnect();
    this.observedElement = el;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          this.zone.run(() => this.isCurrentUserRowVisible.set(e.isIntersecting));
        }
      },
      { threshold: 0.5 },
    );

    this.observer.observe(el);
  }
}
