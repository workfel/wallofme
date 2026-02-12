import { Component, input, output } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, trophyOutline, calendarOutline, locationOutline, timerOutline, podiumOutline } from 'ionicons/icons';
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

@Component({
  selector: 'app-trophy-info-sheet',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonIcon, IonItem, IonLabel, IonList, TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'room.trophyInfo' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss.emit()">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (trophy(); as t) {
        @if (t.thumbnailUrl) {
          <div class="trophy-preview">
            <img [src]="t.thumbnailUrl" [alt]="t.type" class="trophy-image" />
          </div>
        }

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

    .trophy-preview {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }
    .trophy-image {
      width: 120px;
      height: 120px;
      object-fit: contain;
      border-radius: 12px;
      background: var(--ion-color-step-50);
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
  dismiss = output<void>();
  viewDetails = output<string>();

  constructor() {
    addIcons({ closeOutline, trophyOutline, calendarOutline, locationOutline, timerOutline, podiumOutline });
  }

  formatLocation(city: string | null, country: string | null): string {
    return [city, country].filter((v) => !!v).join(', ');
  }
}
