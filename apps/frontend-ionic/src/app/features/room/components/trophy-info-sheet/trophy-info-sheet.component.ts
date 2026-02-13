import { Component, computed, input, output } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonChip,
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
} from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

export interface TrophyInfoData {
  id: string;
  type: 'medal' | 'bib';
  thumbnailUrl: string | null;
  race?: {
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
  } | null;
}

const SPORT_ICON_MAP: Record<string, string> = {
  running: 'walk-outline',
  cycling: 'bicycle-outline',
  triathlon: 'fitness-outline',
  swimming: 'water-outline',
  trail: 'trail-sign-outline',
  obstacle: 'barbell-outline',
  other: 'ellipse-outline',
};

@Component({
  selector: 'app-trophy-info-sheet',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonIcon, IonItem, IonLabel, IonList, IonChip, TranslateModule,
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
        <div class="trophy-header">
          @if (t.thumbnailUrl) {
            <div class="trophy-preview">
              <img [src]="t.thumbnailUrl" [alt]="t.type" class="trophy-image" />
            </div>
          }
          @if (sportIcon()) {
            <ion-chip class="sport-chip" color="primary">
              <ion-icon [name]="sportIcon()!" />
              {{ 'sports.' + t.race!.sport | translate }}
            </ion-chip>
          }
        </div>

        @if (t.race) {
          <ion-list lines="none">
            <ion-item>
              <ion-icon name="trophy-outline" slot="start" color="primary" />
              <ion-label>
                <p>{{ 'room.raceName' | translate }}</p>
                <h2>{{ t.race.name }}</h2>
              </ion-label>
            </ion-item>

            @if (t.race.date) {
              <ion-item>
                <ion-icon name="calendar-outline" slot="start" color="medium" />
                <ion-label>
                  <p>{{ 'room.raceDate' | translate }}</p>
                  <h3>{{ t.race.date }}</h3>
                </ion-label>
              </ion-item>
            }

            @if (t.race.city || t.race.country) {
              <ion-item>
                <ion-icon name="location-outline" slot="start" color="medium" />
                <ion-label>
                  <p>{{ 'room.raceLocation' | translate }}</p>
                  <h3>{{ formatLocation(t.race.city, t.race.country) }}</h3>
                </ion-label>
              </ion-item>
            }

            @if (t.result?.time) {
              <ion-item>
                <ion-icon name="timer-outline" slot="start" color="medium" />
                <ion-label>
                  <p>{{ 'room.raceTime' | translate }}</p>
                  <h3>{{ t.result?.time }}</h3>
                </ion-label>
              </ion-item>
            }

            @if (t.result?.ranking) {
              <ion-item>
                <ion-icon name="podium-outline" slot="start" color="medium" />
                <ion-label>
                  <p>{{ 'room.raceRanking' | translate }}</p>
                  <h3>#{{ t.result?.ranking }}</h3>
                </ion-label>
              </ion-item>
            }

            @if (t.result?.categoryRanking) {
              <ion-item>
                <ion-icon name="podium-outline" slot="start" color="tertiary" />
                <ion-label>
                  <p>{{ 'room.raceCategoryRanking' | translate }}</p>
                  <h3>#{{ t.result?.categoryRanking }}</h3>
                </ion-label>
              </ion-item>
            }
          </ion-list>
        } @else {
          <p class="no-info">No race information available</p>
        }

        <ion-button expand="block" (click)="viewDetails.emit(t.id)" class="details-btn">
          {{ 'room.viewDetails' | translate }}
        </ion-button>
      }
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .trophy-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding-bottom: 8px;
    }
    .trophy-preview {
      display: flex;
      justify-content: center;
    }
    .trophy-image {
      width: 120px;
      height: 120px;
      object-fit: contain;
      border-radius: 12px;
      background: var(--ion-color-step-50);
    }
    .sport-chip {
      font-weight: 500;
    }
    ion-item {
      --padding-start: 0;
    }
    ion-item h2 {
      font-weight: 600;
      font-size: 16px;
    }
    ion-item h3 {
      font-size: 15px;
    }
    ion-item p {
      font-size: 12px;
      color: var(--ion-color-medium);
    }
    .no-info {
      text-align: center;
      color: var(--ion-color-medium);
      margin: 32px 0;
    }
    .details-btn {
      margin-top: 24px;
    }
  `,
})
export class TrophyInfoSheetComponent {
  trophy = input<TrophyInfoData | null>(null);
  trophyIndex = input(0);
  totalTrophies = input(0);
  hasPrev = input(false);
  hasNext = input(false);
  dismiss = output<void>();
  viewDetails = output<string>();
  navigatePrev = output<void>();
  navigateNext = output<void>();

  sportIcon = computed(() => {
    const sport = this.trophy()?.race?.sport;
    if (!sport) return null;
    return SPORT_ICON_MAP[sport] ?? SPORT_ICON_MAP['other'];
  });

  constructor() {
    addIcons({
      closeOutline, chevronBackOutline, chevronForwardOutline,
      trophyOutline, calendarOutline, locationOutline,
      timerOutline, podiumOutline, walkOutline, bicycleOutline,
      fitnessOutline, waterOutline, trailSignOutline, barbellOutline, ellipseOutline,
    });
  }

  formatLocation(city: string | null, country: string | null): string {
    return [city, country].filter((v) => !!v).join(', ');
  }
}
