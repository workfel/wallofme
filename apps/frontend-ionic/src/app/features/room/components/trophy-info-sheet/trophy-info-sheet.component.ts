import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  chevronBackOutline,
  chevronForwardOutline,
  trophyOutline,
  calendarOutline,
  locationOutline,
  timerOutline,
  podiumOutline,
  walkOutline,
  bicycleOutline,
  fitnessOutline,
  waterOutline,
  trailSignOutline,
  barbellOutline,
  ellipseOutline,
  lockClosedOutline,
  peopleOutline,
} from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

import { StatsPreviewCardComponent } from '@app/shared/components/stats-preview-card/stats-preview-card.component';
import { sportIcon as getSportIcon } from '@app/shared/data/sports';

export interface TrophyInfoData {
  id: string;
  type: 'medal' | 'bib';
  thumbnailUrl: string | null;
  race?: {
    id?: string;
    name: string;
    date: string | null;
    city: string | null;
    country: string | null;
    sport: string | null;
  } | null;
  result?: {
    time: string | null;
    ranking: number | null;
    categoryRanking: number | null;
    totalParticipants: number | null;
  } | null;
}

@Component({
  selector: 'app-trophy-info-sheet',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonIcon, TranslateModule, StatsPreviewCardComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button [disabled]="!hasPrev()" (click)="navigatePrev.emit()">
            <ion-icon slot="icon-only" name="chevron-back-outline" />
          </ion-button>
        </ion-buttons>
        <ion-title>
          @if (totalTrophies() > 1) {
            {{ trophyIndex() + 1 }} / {{ totalTrophies() }}
          } @else {
            {{ 'room.trophyInfo' | translate }}
          }
        </ion-title>
        <ion-buttons slot="end">
          <ion-button [disabled]="!hasNext()" (click)="navigateNext.emit()">
            <ion-icon slot="icon-only" name="chevron-forward-outline" />
          </ion-button>
          <ion-button (click)="dismiss.emit()">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (trophy(); as t) {
        <div class="card">
          <div class="card-inner">
            <!-- Image section -->
            <div class="card-image-section">
              @if (t.thumbnailUrl) {
                <img [src]="t.thumbnailUrl" [alt]="t.type" class="trophy-image" />
              }
              <span class="type-badge" [class.type-bib]="t.type === 'bib'">
                {{ 'trophies.' + t.type | translate }}
              </span>
            </div>

            @if (t.race) {
              <!-- Race name -->
              <h2 class="race-name">{{ t.race.name }}</h2>

              <!-- Sport badge -->
              @if (sportIconName()) {
                <div class="sport-badge">
                  <ion-icon [name]="sportIconName()!" />
                  <span>{{ 'sports.' + t.race!.sport | translate }}</span>
                </div>
              }

              <!-- Date & Location grid -->
              <div class="stats-grid">
                @if (t.race.date) {
                  <div class="stat-cell">
                    <span class="stat-label">{{ 'room.raceDate' | translate }}</span>
                    <span class="stat-value">{{ t.race.date }}</span>
                  </div>
                }
                @if (t.race.city || t.race.country) {
                  <div class="stat-cell">
                    <span class="stat-label">{{ 'room.raceLocation' | translate }}</span>
                    <span class="stat-value">{{ formatLocation(t.race.city, t.race.country) }}</span>
                  </div>
                }
              </div>

              <!-- Stats preview card (paywall) -->
              <app-stats-preview-card
                [time]="t.result?.time ?? null"
                [ranking]="t.result?.ranking ?? null"
                [categoryRanking]="t.result?.categoryRanking ?? null"
                [totalParticipants]="t.result?.totalParticipants ?? null"
                [isPro]="isPro()"
                (unlock)="onUnlock()"
              />
              @if (t.race.id && isAuthenticated()) {
                <ion-button
                  expand="block"
                  fill="outline"
                  class="finishers-btn"
                  (click)="seeFinishers.emit(t.race!.id!)"
                >
                  <ion-icon slot="start" name="people-outline" />
                  {{ 'finishers.club' | translate }}
                </ion-button>
              }
            } @else {
              <p class="no-info">{{ 'room.noRaceInfo' | translate }}</p>
            }

            @if (isAuthenticated()) {
              <ion-button expand="block" (click)="viewDetails.emit(t.id)" class="details-btn">
                {{ 'room.viewDetails' | translate }}
              </ion-button>
            } @else {
              <ion-button expand="block" [disabled]="true" class="details-btn details-btn-locked">
                <ion-icon name="lock-closed-outline" slot="start" />
                {{ 'room.loginToView' | translate }}
              </ion-button>
            }
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card {
      border-radius: 16px;
      padding: 3px;
      background: linear-gradient(
        135deg,
        #bf953f 0%,
        #fcf6ba 25%,
        #b38728 50%,
        #fbf5b7 75%,
        #aa771c 100%
      );
      background-size: 300% 300%;
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 100% 0%; }
      50% { background-position: 0% 100%; }
      100% { background-position: 100% 0%; }
    }

    .card-inner {
      background: var(--ion-background-color, #fff);
      border-radius: 14px;
      padding: 20px 16px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .card-image-section {
      position: relative;
      display: flex;
      justify-content: center;
    }

    .trophy-image {
      width: 140px;
      height: 140px;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(191, 149, 63, 0.3));
    }

    .type-badge {
      position: absolute;
      top: 4px;
      right: -8px;
      background: linear-gradient(135deg, #bf953f, #fcf6ba);
      color: #1a1a2e;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    .type-badge.type-bib {
      background: linear-gradient(135deg, #4a90d9, #74b9ff);
      color: #fff;
    }

    .race-name {
      color: var(--ion-text-color, #000);
      font-size: 18px;
      font-weight: 700;
      text-align: center;
      margin: 0;
      line-height: 1.3;
    }

    .sport-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--ion-color-step-100, rgba(0, 0, 0, 0.06));
      padding: 4px 12px;
      border-radius: 20px;
      color: var(--ion-color-step-700, #555);
      font-size: 13px;
      font-weight: 500;
    }

    .sport-badge ion-icon {
      font-size: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      width: 100%;
    }

    .stat-cell {
      background: var(--ion-color-step-50, rgba(0, 0, 0, 0.04));
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 11px;
      color: var(--ion-color-medium, #999);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-weight: 500;
    }

    .stat-value {
      font-size: 15px;
      font-weight: 600;
      color: var(--ion-text-color, #000);
    }

    .stat-accent .stat-value {
      color: var(--wom-gold-text);
    }

    .no-info {
      text-align: center;
      color: var(--ion-color-medium, #999);
      margin: 24px 0;
    }

    .finishers-btn {
      width: 100%;
      margin-top: 4px;
      --border-radius: 10px;
    }

    .details-btn {
      width: 100%;
      margin-top: 4px;
      --border-radius: 10px;
    }
  `,
})
export class TrophyInfoSheetComponent {
  private router = inject(Router);

  trophy = input<TrophyInfoData | null>(null);
  trophyIndex = input(0);
  totalTrophies = input(0);
  hasPrev = input(false);
  hasNext = input(false);
  isAuthenticated = input(true);
  isPro = input(false);
  dismiss = output<void>();
  viewDetails = output<string>();
  seeFinishers = output<string>();
  navigatePrev = output<void>();
  navigateNext = output<void>();

  sportIconName = computed(() => {
    const sport = this.trophy()?.race?.sport;
    if (!sport) return null;
    return getSportIcon(sport);
  });

  constructor() {
    addIcons({
      closeOutline, chevronBackOutline, chevronForwardOutline,
      trophyOutline, calendarOutline, locationOutline,
      timerOutline, podiumOutline, walkOutline, bicycleOutline,
      fitnessOutline, waterOutline, trailSignOutline, barbellOutline, ellipseOutline,
      lockClosedOutline,
      peopleOutline,
    });
  }

  formatLocation(city: string | null, country: string | null): string {
    return [city, country].filter((v) => !!v).join(', ');
  }

  onUnlock(): void {
    this.dismiss.emit();
    this.router.navigate(['/pro']);
  }
}
