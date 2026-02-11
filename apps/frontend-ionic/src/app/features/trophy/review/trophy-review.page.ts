import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle, searchOutline, trophyOutline } from 'ionicons/icons';

import { ScanService } from '@app/core/services/scan.service';

@Component({
  selector: 'app-trophy-review',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonText,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/trophies" />
        </ion-buttons>
        <ion-title>Review</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [fullscreen]="true">
      <!-- Step indicator -->
      <div class="steps">
        @for (s of steps; track s.key; let i = $index) {
          <div
            class="step"
            [class.active]="stepIndex() >= i"
            [class.current]="stepIndex() === i"
          >
            <div class="step-dot">{{ i + 1 }}</div>
            <span class="step-label">{{ s.label | translate }}</span>
          </div>
        }
      </div>

      <!-- Step 0: Processing -->
      @if (scan.step() === 'processing') {
        <div class="centered animate-fade-in">
          <ion-spinner name="crescent" />
          <ion-text color="medium">
            <p>{{ scan.processingMessage() }}</p>
          </ion-text>
        </div>
      }

      <!-- Step 1: Details form -->
      @if (scan.step() === 'details') {
        <div class="form-section animate-fade-in-up">
          @if (scan.processedUrls()) {
            <div class="image-compare">
              <img
                [src]="scan.processedUrls()!.thumbnailUrl"
                alt="processed"
                class="processed-thumb"
              />
            </div>
          }

          <h3>{{ 'review.trophyType' | translate }}</h3>
          <ion-segment
            [value]="formType()"
            (ionChange)="formType.set($any($event).detail.value)"
          >
            <ion-segment-button value="medal">
              <ion-label>{{ 'trophies.medal' | translate }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="bib">
              <ion-label>{{ 'trophies.bib' | translate }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <h3>{{ 'review.raceInfo' | translate }}</h3>
          <ion-list lines="none">
            <ion-item>
              <ion-input
                [label]="'review.raceName' | translate"
                labelPlacement="floating"
                [(ngModel)]="raceName"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-input
                [label]="'review.date' | translate"
                labelPlacement="floating"
                [(ngModel)]="raceDate"
                type="date"
              />
            </ion-item>
            <ion-item>
              <ion-input
                [label]="'review.city' | translate"
                labelPlacement="floating"
                [(ngModel)]="city"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-input
                [label]="'review.country' | translate"
                labelPlacement="floating"
                [(ngModel)]="country"
                [clearInput]="true"
                maxlength="3"
              />
            </ion-item>
            <ion-item>
              <ion-input
                [label]="'review.distance' | translate"
                labelPlacement="floating"
                [(ngModel)]="distance"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-select
                [label]="'review.sport' | translate"
                labelPlacement="floating"
                [(ngModel)]="sport"
              >
                @for (s of sportOptions; track s) {
                  <ion-select-option [value]="s">
                    {{ 'sports.' + s | translate }}
                  </ion-select-option>
                }
              </ion-select>
            </ion-item>
          </ion-list>

          @if (formError()) {
            <ion-text color="danger">
              <p class="error-text">{{ formError() | translate }}</p>
            </ion-text>
          }

          <ion-button expand="block" (click)="onSubmitDetails()">
            <ion-icon slot="start" name="search-outline" />
            {{ 'review.getMyResults' | translate }}
          </ion-button>
        </div>
      }

      <!-- Step 2: Searching -->
      @if (scan.step() === 'search') {
        <div class="centered animate-fade-in">
          <ion-spinner name="crescent" />
          <ion-text color="medium">
            <p>{{ 'review.searchingResults' | translate }}</p>
          </ion-text>
        </div>
      }

      <!-- Step 3: Done -->
      @if (scan.step() === 'done') {
        <div class="done-section animate-scale-in">
          <ion-icon
            name="checkmark-circle"
            class="done-icon"
            color="success"
          />
          <h2>{{ 'review.done' | translate }}</h2>

          @if (scan.searchResult()?.found) {
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ 'review.resultsFound' | translate }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @if (scan.searchResult()!.time) {
                  <p>
                    <strong>{{ 'review.time' | translate }}:</strong>
                    {{ scan.searchResult()!.time }}
                  </p>
                }
                @if (scan.searchResult()!.ranking) {
                  <p>
                    <strong>{{ 'review.ranking' | translate }}:</strong>
                    {{ scan.searchResult()!.ranking }}
                    @if (scan.searchResult()!.totalParticipants) {
                      / {{ scan.searchResult()!.totalParticipants }}
                    }
                  </p>
                }
                @if (scan.searchResult()!.categoryRanking) {
                  <p>
                    <strong>{{ 'review.categoryRanking' | translate }}:</strong>
                    {{ scan.searchResult()!.categoryRanking }}
                  </p>
                }
              </ion-card-content>
            </ion-card>
          } @else {
            <ion-text color="medium">
              <p>{{ 'review.noResultsMessage' | translate }}</p>
            </ion-text>
          }

          <ion-button expand="block" (click)="onFinish()">
            <ion-icon slot="start" name="trophy-outline" />
            {{ 'review.finish' | translate }}
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: `
    .steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      padding: 0 8px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      opacity: 0.4;
      transition: opacity 0.3s;

      &.active {
        opacity: 1;
      }

      &.current .step-dot {
        background: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast);
        transform: scale(1.1);
      }
    }

    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--ion-color-step-200);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.3s;
    }

    .step-label {
      font-size: 11px;
      font-weight: 600;
    }

    .centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      gap: 16px;
    }

    .form-section {
      padding-bottom: 24px;

      h3 {
        font-size: 16px;
        font-weight: 700;
        margin: 16px 0 8px;
      }

      ion-item {
        --background: transparent;
        --padding-start: 0;
        margin-bottom: 4px;
      }

      ion-button {
        margin-top: 24px;
      }
    }

    .image-compare {
      text-align: center;
      margin-bottom: 16px;
    }

    .processed-thumb {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
    }

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
    }

    .done-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 0;
      gap: 16px;

      .done-icon {
        font-size: 64px;
      }

      h2 {
        font-size: 24px;
        font-weight: 800;
        margin: 0;
      }

      ion-card {
        width: 100%;
        text-align: left;
      }

      ion-button {
        width: 100%;
        margin-top: 16px;
      }
    }
  `,
})
export class TrophyReviewPage {
  scan = inject(ScanService);
  private router = inject(Router);

  // Form fields pre-filled from AI analysis
  formType = signal<'medal' | 'bib'>('medal');
  raceName = '';
  raceDate = '';
  city = '';
  country = '';
  distance = '';
  sport = 'running';
  formError = signal('');

  sportOptions = [
    'running',
    'trail',
    'triathlon',
    'cycling',
    'swimming',
    'obstacle',
    'other',
  ];

  steps = [
    { key: 'processing', label: 'review.step1' },
    { key: 'details', label: 'review.step2' },
    { key: 'search', label: 'review.step3' },
    { key: 'done', label: 'review.step4' },
  ];

  stepIndex = computed(() => {
    const map: Record<string, number> = {
      processing: 0,
      details: 1,
      search: 2,
      done: 3,
    };
    return map[this.scan.step()] ?? 0;
  });

  constructor() {
    addIcons({ checkmarkCircle, searchOutline, trophyOutline });

    // Pre-fill form from AI analysis when available
    const analysis = this.scan.analysis();
    if (analysis) {
      if (analysis.imageKind !== 'unknown') {
        this.formType.set(analysis.imageKind);
      }
      this.raceName = analysis.raceName ?? '';
      this.raceDate = analysis.date ?? '';
      this.city = analysis.city ?? '';
      this.country = analysis.country ?? '';
      this.sport = analysis.sportKind ?? 'running';
      this.distance = analysis.distance ?? '';
    }
  }

  async onSubmitDetails(): Promise<void> {
    if (!this.raceName.trim()) {
      this.formError.set('review.raceNameRequired');
      return;
    }
    this.formError.set('');

    await this.scan.validateAndSearch({
      type: this.formType(),
      raceName: this.raceName.trim(),
      date: this.raceDate || undefined,
      city: this.city.trim() || undefined,
      country: this.country.trim().toUpperCase() || undefined,
      distance: this.distance.trim() || undefined,
      sport: (this.sport as 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other') || undefined,
    });
  }

  async onFinish(): Promise<void> {
    // Auto-place trophy on wall
    await this.scan.autoPlaceTrophy();
    this.scan.reset();
    this.router.navigate(['/tabs/home']);
  }
}
