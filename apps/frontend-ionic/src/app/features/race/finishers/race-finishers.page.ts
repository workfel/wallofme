import { Component, inject, signal, OnInit, input } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonText,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { peopleOutline, trophyOutline, timerOutline, starOutline } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';

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
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge,
    IonText,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" />
        </ion-buttons>
        <ion-title>{{ 'finishers.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [fullscreen]="true">
      @if (loading() && finishers().length === 0) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (race()) {
        <div class="race-header animate-fade-in">
          <h2 class="race-name">{{ race()!.name }}</h2>
          <div class="race-meta">
            @if (race()!.location) {
              <span>{{ race()!.location }}</span>
            }
            @if (race()!.date) {
              <span>{{ race()!.date | date:'mediumDate' }}</span>
            }
            @if (race()!.distance) {
              <span>{{ race()!.distance }}</span>
            }
          </div>
          <div class="finisher-total">
            <ion-icon name="people-outline" />
            {{ 'finishers.totalCount' | translate:{ count: totalFinishers() } }}
          </div>
        </div>

        @if (finishers().length === 0) {
          <div class="empty-state">
            <ion-icon name="trophy-outline" class="empty-icon" />
            <ion-text color="medium">
              <p>{{ 'finishers.empty' | translate }}</p>
            </ion-text>
          </div>
        } @else {
          <ion-list lines="full" class="finisher-list animate-fade-in-up">
            @for (f of finishers(); track f.id; let i = $index) {
              <ion-item button (click)="onUserClick(f.user.id)" detail="false">
                <div class="rank-number" slot="start">
                  #{{ i + 1 }}
                </div>
                <ion-avatar slot="start">
                  @if (f.user.image) {
                    <img [src]="f.user.image" [alt]="getUserName(f)" />
                  } @else {
                    <div class="avatar-placeholder">
                      {{ getInitials(f) }}
                    </div>
                  }
                </ion-avatar>
                <ion-label>
                  <h3>
                    {{ getUserName(f) }}
                    @if (f.user.isPro) {
                      <ion-badge color="warning" class="pro-badge">PRO</ion-badge>
                    }
                  </h3>
                  <p>
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
                  </p>
                </ion-label>
              </ion-item>
            }
          </ion-list>

          <ion-infinite-scroll (ionInfinite)="onInfiniteScroll($event)">
            <ion-infinite-scroll-content />
          </ion-infinite-scroll>
        }
      }
    </ion-content>
  `,
  styles: `
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .race-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .race-name {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 8px;
    }

    .race-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      font-size: 14px;
      color: var(--ion-color-medium);
      margin-bottom: 12px;
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

      ion-icon {
        font-size: 18px;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      gap: 12px;

      .empty-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
      }
    }

    .finisher-list {
      ion-item {
        --padding-start: 0;
      }
    }

    .rank-number {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-color-medium);
      min-width: 32px;
      text-align: center;
    }

    ion-avatar {
      width: 40px;
      height: 40px;
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

    h3 {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pro-badge {
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 4px;
    }

    p {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 2px;
    }

    .finisher-time,
    .finisher-ranking {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 13px;

      ion-icon {
        font-size: 14px;
      }
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
  `,
})
export class RaceFinishersPage implements OnInit {
  raceId = input.required<string>();

  private api = inject(ApiService);
  private router = inject(Router);

  race = signal<RaceInfo | null>(null);
  finishers = signal<Finisher[]>([]);
  totalFinishers = signal(0);
  loading = signal(true);
  page = 1;

  constructor() {
    addIcons({ peopleOutline, trophyOutline, timerOutline, starOutline });
  }

  ngOnInit(): void {
    this.fetchFinishers();
  }

  async fetchFinishers(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.races[':id'].finishers.$get({
        param: { id: this.raceId() },
        query: { page: String(this.page), limit: '20' },
      });

      if (res.ok) {
        const json = (await res.json()) as {
          data: {
            race: RaceInfo;
            finishers: Finisher[];
            totalFinishers: number;
          };
        };
        this.race.set(json.data.race);
        this.finishers.update((prev) => [...prev, ...json.data.finishers]);
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

  onUserClick(userId: string): void {
    this.router.navigate(['/room', userId]);
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
}
