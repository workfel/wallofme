import { Component, inject, output } from "@angular/core";
import { DatePipe } from "@angular/common";
import {
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { addCircleOutline, peopleOutline } from "ionicons/icons";

import { ScanService } from "@app/core/services/scan.service";

@Component({
  selector: "app-trophy-matching",
  standalone: true,
  imports: [
    DatePipe,
    TranslateModule,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
  ],
  template: `
    <div class="matching-section animate-fade-in-up">
      <h3>{{ "review.matchingTitle" | translate }}</h3>
      <p class="matching-subtitle">
        {{ "review.matchingSubtitle" | translate }}
      </p>

      @for (r of scan.matchedRaces(); track r.id) {
        <ion-card button (click)="raceSelected.emit(r.id)" class="match-card">
          <ion-card-content>
            <div class="match-name">{{ r.name }}</div>
            <div class="match-meta">
              @if (r.location) {
                <span>{{ r.location }}</span>
              }
              @if (r.date) {
                <span>{{ r.date | date: "mediumDate" }}</span>
              }
              @if (r.distance) {
                <span>{{ r.distance }}</span>
              }
            </div>
            <div class="match-finishers">
              <ion-icon name="people-outline" />
              {{
                "review.finishersCount" | translate: { count: r.finisherCount }
              }}
            </div>
          </ion-card-content>
        </ion-card>
      }

      <ion-button expand="block" fill="outline" (click)="createNew.emit()">
        <ion-icon slot="start" name="add-circle-outline" />
        {{ "review.createNewRace" | translate }}
      </ion-button>
    </div>
  `,
  styles: `
    .matching-section {
      padding: 20px;
      border-radius: 24px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.55);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);

      h3 {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 4px;
      }

      .matching-subtitle {
        color: var(--ion-color-medium);
        font-size: 14px;
        margin: 0 0 16px;
      }

      .match-card {
        margin: 0 0 8px;
        --background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.5);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.04);
      }

      .match-name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .match-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 13px;
        color: var(--ion-color-medium);
        margin-bottom: 6px;
      }

      .match-finishers {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ion-color-primary);

        ion-icon {
          font-size: 16px;
        }
      }

      ion-button {
        margin-top: 16px;
      }
    }
  `,
})
export class TrophyMatchingComponent {
  scan = inject(ScanService);

  raceSelected = output<string>();
  createNew = output<void>();

  constructor() {
    addIcons({ addCircleOutline, peopleOutline });
  }
}
