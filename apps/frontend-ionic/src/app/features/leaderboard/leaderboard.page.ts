import { Component, inject, signal, computed, OnInit, OnDestroy, effect, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSpinner,
  IonAvatar,
  IonBadge,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSegment,
  IonSegmentButton,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trophyOutline, heartOutline, personOutline, arrowBackOutline } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';
import { AuthService } from '@app/core/services/auth.service';

interface LeaderboardEntry {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  isPro: boolean;
  trophyCount: number;
  roomLikeCount: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonSpinner,
    IonAvatar,
    IonBadge,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSegment,
    IonSegmentButton,
  ],
  template: `
    <ion-content [fullscreen]="true" class="ion-padding">
      <!-- Floating glass header -->
      <div class="floating-header">
        <button class="back-pill" (click)="goBack()">
          <ion-icon name="arrow-back-outline" />
        </button>
        <div class="header-title-pill">
          <span>{{ 'leaderboard.title' | translate }}</span>
        </div>
        <div class="header-spacer"></div>
      </div>

      <!-- Sort segment -->
      <ion-segment [value]="sort()" (ionChange)="onSortChange($event)" mode="ios" class="sort-segment">
        <ion-segment-button value="trophies">
          <ion-icon name="trophy-outline" />
          <span>{{ 'leaderboard.sortTrophies' | translate }}</span>
        </ion-segment-button>
        <ion-segment-button value="likes">
          <ion-icon name="heart-outline" />
          <span>{{ 'leaderboard.sortLikes' | translate }}</span>
        </ion-segment-button>
      </ion-segment>

      @if (loading() && entries().length === 0) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (entries().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-circle">
            <ion-icon name="trophy-outline" />
          </div>
          <p>{{ 'leaderboard.empty' | translate }}</p>
        </div>
      } @else {
        <!-- ═══ Podium card ═══ -->
        <div class="podium-card animate-fade-in">
          <div class="podium-row">
            <!-- Silver (2nd place) — left -->
            @if (topEntries().length > 1) {
              <div class="podium-item silver" (click)="onAthleteClick(topEntries()[1].id)">
                <div class="podium-avatar-wrapper">
                  <ion-avatar class="podium-avatar">
                    @if (topEntries()[1].image) {
                      <img [src]="topEntries()[1].image" [alt]="getName(topEntries()[1])" />
                    } @else {
                      <div class="avatar-placeholder">{{ getInitials(topEntries()[1]) }}</div>
                    }
                  </ion-avatar>
                  <span class="podium-rank-badge silver-badge">2</span>
                </div>
                <span class="podium-name">{{ getName(topEntries()[1]) }}</span>
                <span class="podium-metric">
                  {{ sort() === 'trophies' ? topEntries()[1].trophyCount : topEntries()[1].roomLikeCount }}
                  <ion-icon [name]="sort() === 'trophies' ? 'trophy-outline' : 'heart-outline'" />
                </span>
              </div>
            } @else {
              <div class="podium-item placeholder"></div>
            }

            <!-- Gold (1st place) — center, tallest -->
            @if (topEntries().length > 0) {
              <div class="podium-item gold" (click)="onAthleteClick(topEntries()[0].id)">
                <div class="podium-avatar-wrapper gold-wrapper">
                  <ion-avatar class="podium-avatar podium-avatar-gold">
                    @if (topEntries()[0].image) {
                      <img [src]="topEntries()[0].image" [alt]="getName(topEntries()[0])" />
                    } @else {
                      <div class="avatar-placeholder gold-placeholder">{{ getInitials(topEntries()[0]) }}</div>
                    }
                  </ion-avatar>
                  <span class="podium-rank-badge gold-badge">1</span>
                </div>
                <span class="podium-name gold-name">{{ getName(topEntries()[0]) }}</span>
                <span class="podium-metric gold-metric">
                  {{ sort() === 'trophies' ? topEntries()[0].trophyCount : topEntries()[0].roomLikeCount }}
                  <ion-icon [name]="sort() === 'trophies' ? 'trophy-outline' : 'heart-outline'" />
                </span>
              </div>
            }

            <!-- Bronze (3rd place) — right -->
            @if (topEntries().length > 2) {
              <div class="podium-item bronze" (click)="onAthleteClick(topEntries()[2].id)">
                <div class="podium-avatar-wrapper">
                  <ion-avatar class="podium-avatar">
                    @if (topEntries()[2].image) {
                      <img [src]="topEntries()[2].image" [alt]="getName(topEntries()[2])" />
                    } @else {
                      <div class="avatar-placeholder">{{ getInitials(topEntries()[2]) }}</div>
                    }
                  </ion-avatar>
                  <span class="podium-rank-badge bronze-badge">3</span>
                </div>
                <span class="podium-name">{{ getName(topEntries()[2]) }}</span>
                <span class="podium-metric">
                  {{ sort() === 'trophies' ? topEntries()[2].trophyCount : topEntries()[2].roomLikeCount }}
                  <ion-icon [name]="sort() === 'trophies' ? 'trophy-outline' : 'heart-outline'" />
                </span>
              </div>
            } @else {
              <div class="podium-item placeholder"></div>
            }
          </div>
        </div>

        <!-- ═══ List card (rank 4+) ═══ -->
        @if (restEntries().length > 0) {
          <div class="list-card animate-fade-in-up">
            @for (entry of restEntries(); track entry.id; let i = $index) {
              <div
                [id]="'user-row-' + entry.id"
                class="entry-row"
                [class.entry-row-me]="entry.id === currentUserId()"
                (click)="onAthleteClick(entry.id)"
              >
                <span class="rank-number">{{ i + 4 }}</span>
                <ion-avatar>
                  @if (entry.image) {
                    <img [src]="entry.image" [alt]="getName(entry)" />
                  } @else {
                    <div class="avatar-placeholder">{{ getInitials(entry) }}</div>
                  }
                </ion-avatar>
                <div class="entry-info">
                  <span class="entry-name">
                    {{ getName(entry) }}
                    @if (entry.isPro) {
                      <ion-badge color="warning" class="pro-badge">PRO</ion-badge>
                    }
                  </span>
                </div>
                <span class="entry-score">
                  {{ sort() === 'trophies' ? entry.trophyCount : entry.roomLikeCount }}
                  <ion-icon [name]="sort() === 'trophies' ? 'trophy-outline' : 'heart-outline'" />
                </span>
              </div>
            }
          </div>
        }

        <ion-infinite-scroll (ionInfinite)="onInfiniteScroll($event)">
          <ion-infinite-scroll-content />
        </ion-infinite-scroll>

        <!-- spacer so infinite scroll doesn't overlap floating bar -->
        @if (showFloatingBar()) {
          <div class="floating-bar-spacer"></div>
        }
      }

      <!-- ═══ Floating user bar ═══ -->
      @if (showFloatingBar()) {
        <div class="floating-user-bar" (click)="scrollToMyRank()">
          <span class="floating-rank">#{{ myRank() }}</span>
          <ion-avatar class="floating-avatar">
            @if (myEntry()!.image) {
              <img [src]="myEntry()!.image" alt="You" />
            } @else {
              <div class="avatar-placeholder floating-placeholder">{{ getInitials(myEntry()!) }}</div>
            }
          </ion-avatar>
          <span class="floating-name">{{ getName(myEntry()!) }}</span>
          <span class="floating-score">
            {{ sort() === 'trophies' ? myEntry()!.trophyCount : myEntry()!.roomLikeCount }}
            <ion-icon [name]="sort() === 'trophies' ? 'trophy-outline' : 'heart-outline'" />
          </span>
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

    /* ── Sort segment ─────────────────────────── */
    .sort-segment {
      margin-bottom: 16px;
      --background: var(--wom-glass-bg-subtle);
      border-radius: 12px;
    }

    /* ── Centered / Loading ───────────────────── */
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 60%;
    }

    /* ── Empty state ──────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      gap: 16px;
      color: var(--ion-color-medium);

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

    /* ═══ Podium card ═════════════════════════════ */
    .podium-card {
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 20px;
      padding: 24px 12px 20px;
      margin-bottom: 12px;
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
    }

    .podium-row {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 8px;
    }

    .podium-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.18s ease;
      padding-top: 16px;

      &:active { transform: scale(0.96); }
      &.placeholder { visibility: hidden; }
    }

    .podium-item.gold {
      padding-top: 0;
    }

    /* ── Podium avatars ──────────────── */
    .podium-avatar-wrapper {
      position: relative;
      display: inline-block;
    }

    .podium-avatar {
      width: 60px;
      height: 60px;
      --border-radius: 50%;
      border: 3px solid var(--ion-color-step-300);
      border-radius: 50%;
      overflow: hidden;
    }

    .podium-avatar-gold {
      width: 76px;
      height: 76px;
      border: 3px solid rgba(255, 193, 7, 0.6);
      box-shadow: 0 4px 16px rgba(255, 193, 7, 0.25);
    }

    .podium-rank-badge {
      position: absolute;
      bottom: -4px;
      right: -4px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      border: 2.5px solid var(--ion-background-color, #fff);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .gold-badge { background: #FFB800; color: #fff; }
    .silver-badge { background: #A8B0BC; color: #fff; }
    .bronze-badge { background: #CD7F32; color: #fff; }

    .gold-wrapper .podium-rank-badge {
      width: 28px;
      height: 28px;
      font-size: 14px;
    }

    /* ── Podium text ─────────────────── */
    .podium-name {
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      color: var(--ion-text-color);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gold-name { font-size: 14px; }

    .podium-metric {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 14px;
      font-weight: 700;
      color: var(--ion-color-step-500);

      ion-icon { font-size: 14px; color: var(--ion-color-danger); }
    }

    .gold-metric {
      color: var(--wom-gold-text);
      ion-icon { color: var(--wom-gold-text); }
    }

    /* ═══ List card ═══════════════════════════════ */
    .list-card {
      background: var(--wom-glass-bg-medium);
      border: 1px solid var(--wom-glass-border-strong);
      border-radius: 20px;
      padding: 6px;
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
    }

    .entry-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: transform 0.18s ease, background 0.18s ease;

      &:active { transform: scale(0.98); }
    }

    .entry-row-me {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
    }

    .rank-number {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-color-medium);
      min-width: 28px;
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

    .gold-placeholder {
      background: rgba(255, 193, 7, 0.15);
      color: var(--wom-gold-text);
    }

    .entry-info {
      flex: 1;
      min-width: 0;
    }

    .entry-name {
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--ion-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pro-badge {
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 4px;
    }

    .entry-score {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 700;
      color: var(--ion-color-step-500);
      flex-shrink: 0;

      ion-icon { font-size: 14px; color: var(--ion-color-danger); }
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

    .floating-score {
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
export class LeaderboardPage implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private authService = inject(AuthService);
  private zone = inject(NgZone);
  entries = signal<LeaderboardEntry[]>([]);
  loading = signal(true);
  sort = signal<'trophies' | 'likes'>('trophies');
  total = signal(0);
  page = 1;

  topEntries = computed(() => this.entries().slice(0, 3));
  restEntries = computed(() => this.entries().slice(3));
  currentUserId = computed(() => this.authService.user()?.id ?? null);

  // Server-provided current user data (rank + entry)
  private serverMyEntry = signal<(LeaderboardEntry & { rank: number }) | null>(null);

  // Fallback: search loaded entries if server didn't provide data
  myEntry = computed<(LeaderboardEntry & { rank: number }) | null>(() => {
    const server = this.serverMyEntry();
    if (server) return server;
    // Fallback: find in loaded entries
    const userId = this.currentUserId();
    if (!userId) return null;
    const all = this.entries();
    const idx = all.findIndex((e) => e.id === userId);
    if (idx < 0) return null;
    return { ...all[idx], rank: idx + 1 };
  });

  myRank = computed(() => this.myEntry()?.rank ?? 0);
  isCurrentUserRowVisible = signal(false);

  showFloatingBar = computed(() => {
    const entry = this.myEntry();
    const rank = this.myRank();
    return entry != null && rank > 3 && !this.isCurrentUserRowVisible();
  });

  private observer: IntersectionObserver | null = null;
  private observedElement: HTMLElement | null = null;

  constructor() {
    addIcons({ trophyOutline, heartOutline, personOutline, arrowBackOutline });

    // Watch for current user entry to setup IntersectionObserver
    effect(() => {
      const entry = this.myEntry();
      if (!entry) return;
      if (entry.rank <= 3) { this.isCurrentUserRowVisible.set(true); return; }
      // Re-check whenever entries change (new page loaded via infinite scroll)
      const isLoaded = this.entries().some((e) => e.id === entry.id);
      if (isLoaded) {
        setTimeout(() => this.setupUserRowObserver(), 150);
      }
    });
  }

  ngOnInit(): void {
    this.fetchLeaderboard();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  goBack(): void {
    this.navCtrl.back();
  }

  async fetchLeaderboard(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await (this.api.client as any).api.leaderboard.$get({
        query: { page: String(this.page), limit: '20', sort: this.sort() },
      });
      if (res.ok) {
        const json = await res.json() as {
          data: LeaderboardEntry[];
          currentUser: (LeaderboardEntry & { rank: number }) | null;
        };
        if (this.page === 1) {
          this.entries.set(json.data);
          this.serverMyEntry.set(json.currentUser ?? null);
        } else {
          this.entries.update((prev) => [...prev, ...json.data]);
        }
      }
    } catch {
      // silent
    } finally {
      this.loading.set(false);
    }
  }

  async onInfiniteScroll(event: CustomEvent): Promise<void> {
    const target = event.target as HTMLIonInfiniteScrollElement;
    const current = this.entries();
    if (current.length < this.page * 20) {
      target.disabled = true;
      return;
    }
    this.page++;
    await this.fetchLeaderboard();
    target.complete();
  }

  onSortChange(event: CustomEvent): void {
    this.sort.set(event.detail.value);
    this.page = 1;
    this.entries.set([]);
    this.serverMyEntry.set(null);
    this.observer?.disconnect();
    this.observedElement = null;
    this.isCurrentUserRowVisible.set(false);
    this.fetchLeaderboard();
  }

  onAthleteClick(userId: string): void {
    this.router.navigate(['/room', userId]);
  }

  scrollToMyRank(): void {
    const entry = this.myEntry();
    if (!entry) return;
    const el = document.getElementById(`user-row-${entry.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  getName(entry: LeaderboardEntry): string {
    if (entry.displayName) return entry.displayName;
    if (entry.firstName && entry.lastName) return `${entry.firstName} ${entry.lastName}`;
    return entry.firstName ?? 'Athlete';
  }

  getInitials(entry: LeaderboardEntry): string {
    return this.getName(entry)
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private setupUserRowObserver(): void {
    const entry = this.myEntry();
    if (!entry) return;

    const el = document.getElementById(`user-row-${entry.id}`);
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
