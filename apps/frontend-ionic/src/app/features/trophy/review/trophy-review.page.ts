import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
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
import { checkmarkCircle, searchOutline, trophyOutline, addCircleOutline, peopleOutline, closeOutline, refreshOutline, calendarOutline } from 'ionicons/icons';

import { ScanService } from '@app/core/services/scan.service';
import { TokenService } from '@app/core/services/token.service';

@Component({
  selector: 'app-trophy-review',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
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
          <ion-back-button defaultHref="/tabs/home" />
        </ion-buttons>
        <ion-title>{{ 'review.title' | translate }}</ion-title>
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
            @if (!raceDate) {
              <div class="field-search-row">
                @if (scan.dateSearchLoading()) {
                  <ion-spinner name="dots" />
                  <ion-text color="medium"><small>{{ 'review.searchingDate' | translate }}</small></ion-text>
                } @else if (dateSearchMaxed()) {
                  <ion-text color="medium"><small class="search-hint">{{ 'review.dateSearchMaxAttempts' | translate }}</small></ion-text>
                } @else if (scan.dateSearchCooldownRemaining() > 0) {
                  <ion-button size="small" fill="outline" disabled="true">
                    {{ 'review.searchDateCooldown' | translate:{ seconds: scan.dateSearchCooldownRemaining() } }}
                  </ion-button>
                } @else {
                  <ion-button size="small" fill="outline" (click)="onSearchDate()" [disabled]="!raceName.trim()">
                    <ion-icon slot="start" name="calendar-outline" />
                    {{ 'review.searchDate' | translate }}
                  </ion-button>
                }
              </div>
            }
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

      <!-- Step 2: Matching -->
      @if (scan.step() === 'matching') {
        <div class="matching-section animate-fade-in-up">
          <h3>{{ 'review.matchingTitle' | translate }}</h3>
          <p class="matching-subtitle">{{ 'review.matchingSubtitle' | translate }}</p>

          @for (r of scan.matchedRaces(); track r.id) {
            <ion-card
              button
              (click)="onSelectRace(r.id)"
              class="match-card"
            >
              <ion-card-content>
                <div class="match-name">{{ r.name }}</div>
                <div class="match-meta">
                  @if (r.location) {
                    <span>{{ r.location }}</span>
                  }
                  @if (r.date) {
                    <span>{{ r.date | date:'mediumDate' }}</span>
                  }
                  @if (r.distance) {
                    <span>{{ r.distance }}</span>
                  }
                </div>
                <div class="match-finishers">
                  <ion-icon name="people-outline" />
                  {{ 'review.finishersCount' | translate:{ count: r.finisherCount } }}
                </div>
              </ion-card-content>
            </ion-card>
          }

          <ion-button expand="block" fill="outline" (click)="onCreateNewRace()">
            <ion-icon slot="start" name="add-circle-outline" />
            {{ 'review.createNewRace' | translate }}
          </ion-button>
        </div>
      }

      <!-- Step 3: Searching -->
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
            <div class="field-search-row centered-row">
              @if (scan.resultsRetryLoading()) {
                <ion-spinner name="dots" />
                <ion-text color="medium"><small>{{ 'review.retryingResults' | translate }}</small></ion-text>
              } @else if (resultsRetryMaxed()) {
                <ion-text color="medium"><small class="search-hint">{{ 'review.resultsRetryMaxAttempts' | translate }}</small></ion-text>
              } @else if (scan.resultsRetryCooldownRemaining() > 0) {
                <ion-button size="small" fill="outline" disabled="true">
                  {{ 'review.retryResultsCooldown' | translate:{ seconds: scan.resultsRetryCooldownRemaining() } }}
                </ion-button>
              } @else {
                <ion-button size="small" fill="outline" (click)="onRetryResults()">
                  <ion-icon slot="start" name="refresh-outline" />
                  {{ 'review.retryResults' | translate }}
                </ion-button>
              }
            </div>
          }

          @if (showUpsell()) {
            <div class="upsell-banner" (click)="onUpsellTap()">
              <span>{{ 'review.upsellFrame' | translate }}</span>
              <ion-button fill="clear" size="small" (click)="showUpsell.set(false); $event.stopPropagation()">
                <ion-icon name="close-outline" slot="icon-only" />
              </ion-button>
            </div>
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

    .matching-section {
      padding-bottom: 24px;

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
        --background: var(--ion-color-step-50);
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

    .upsell-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      margin: 12px 0;
      background: linear-gradient(135deg, rgba(245, 166, 35, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%);
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .field-search-row {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-end;
      padding: 4px 0 8px;

      ion-spinner {
        width: 18px;
        height: 18px;
      }

      ion-button {
        margin: 0;
        --padding-top: 4px;
        --padding-bottom: 4px;
      }

      &.centered-row {
        justify-content: center;
        padding: 8px 0;
      }
    }

    .search-hint {
      font-style: italic;
      font-size: 12px;
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
  private tokenService = inject(TokenService);

  showUpsell = signal(false);

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
    { key: 'matching', label: 'review.step3' },
    { key: 'search', label: 'review.step4' },
    { key: 'done', label: 'review.step5' },
  ];

  stepIndex = computed(() => {
    const map: Record<string, number> = {
      processing: 0,
      details: 1,
      matching: 2,
      search: 3,
      done: 4,
    };
    return map[this.scan.step()] ?? 0;
  });

  dateSearchMaxed = computed(() => this.scan.dateSearchAttempts() >= 2);
  resultsRetryMaxed = computed(() => this.scan.resultsRetryAttempts() >= 2);

  constructor() {
    addIcons({ checkmarkCircle, searchOutline, trophyOutline, addCircleOutline, peopleOutline, closeOutline, refreshOutline, calendarOutline });

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

    // Search for matching races first
    const matches = await this.scan.searchMatchingRaces(
      this.raceName.trim(),
      this.raceDate || undefined,
      this.sport || undefined,
    );

    if (matches.length > 0) {
      this.scan.matchedRaces.set(matches);
      this.scan.step.set('matching');
    } else {
      await this.doValidateAndSearch();
    }
  }

  async onSelectRace(raceId: string): Promise<void> {
    this.scan.selectedRaceId.set(raceId);
    await this.doValidateAndSearch(raceId);
  }

  async onCreateNewRace(): Promise<void> {
    this.scan.selectedRaceId.set(null);
    await this.doValidateAndSearch();
  }

  private async doValidateAndSearch(raceId?: string): Promise<void> {
    await this.scan.validateAndSearch({
      type: this.formType(),
      raceName: this.raceName.trim(),
      date: this.raceDate || undefined,
      city: this.city.trim() || undefined,
      country: this.country.trim().toUpperCase() || undefined,
      distance: this.distance.trim() || undefined,
      sport: (this.sport as 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other') || undefined,
      raceId,
    });

    // Show upsell banner if user has low token balance
    if (this.scan.step() === 'done' && this.tokenService.balance() < 200) {
      this.showUpsell.set(true);
    }
  }

  async onSearchDate(): Promise<void> {
    if (!this.raceName.trim()) return;
    const year = this.raceDate
      ? this.raceDate.substring(0, 4)
      : new Date().getFullYear().toString();
    const date = await this.scan.searchDateForField({
      raceName: this.raceName.trim(),
      year,
      sportKind: this.sport || null,
      city: this.city.trim() || null,
      country: this.country.trim().toUpperCase() || null,
    });
    if (date) {
      this.raceDate = date;
    }
  }

  async onRetryResults(): Promise<void> {
    await this.scan.retrySearchResults();
  }

  onUpsellTap(): void {
    this.router.navigate(['/tokens']);
  }

  async onFinish(): Promise<void> {
    // Auto-place trophy on wall
    await this.scan.autoPlaceTrophy();
    this.scan.reset();
    this.router.navigate(['/tabs/home']);
  }
}
