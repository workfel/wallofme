import { Component, inject, signal, computed, output, OnInit, OnDestroy } from '@angular/core';
import {
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
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { searchOutline, calendarOutline } from 'ionicons/icons';

import { ScanService } from '@app/core/services/scan.service';

@Component({
  selector: 'app-trophy-details-form',
  standalone: true,
  imports: [
    TranslateModule,
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
  ],
  template: `
    <div class="form-section animate-fade-in-up">
      @if (scan.processedUrls()) {
        <div class="image-compare">
          <img
            [src]="scan.processedImageUrl() ?? scan.processedUrls()!.thumbnailUrl"
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
            [value]="raceName()"
            (ionInput)="raceName.set($any($event).detail.value ?? '')"
            [clearInput]="true"
          />
        </ion-item>
        <ion-item>
          <ion-input
            [label]="'review.date' | translate"
            labelPlacement="floating"
            [value]="raceDate()"
            (ionInput)="raceDate.set($any($event).detail.value ?? '')"
            type="date"
          />
        </ion-item>
        @if (!raceDate()) {
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
              <ion-button size="small" fill="outline" (click)="onSearchDate()" [disabled]="!raceName().trim()">
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
            [value]="city()"
            (ionInput)="city.set($any($event).detail.value ?? '')"
            [clearInput]="true"
          />
        </ion-item>
        <ion-item>
          <ion-input
            [label]="'review.country' | translate"
            labelPlacement="floating"
            [value]="country()"
            (ionInput)="country.set($any($event).detail.value ?? '')"
            [clearInput]="true"
            maxlength="3"
          />
        </ion-item>
        <ion-item>
          <ion-input
            [label]="'review.distance' | translate"
            labelPlacement="floating"
            [value]="distance()"
            (ionInput)="distance.set($any($event).detail.value ?? '')"
            [clearInput]="true"
          />
        </ion-item>
        <ion-item>
          <ion-select
            [label]="'review.sport' | translate"
            labelPlacement="floating"
            [value]="sport()"
            (ionChange)="sport.set($any($event).detail.value)"
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

      <ion-text color="medium" class="results-teaser">
        <p>{{ 'scan.resultsTeaser' | translate }}</p>
      </ion-text>

      <ion-button expand="block" (click)="onSubmit()">
        <ion-icon slot="start" name="search-outline" />
        {{ 'review.getMyResults' | translate }}
      </ion-button>
    </div>
  `,
  styles: `
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
        margin-top: 8px;
      }
    }

    .image-compare {
      text-align: center;
      margin-bottom: 16px;
    }

    .processed-thumb {
      width: 160px;
      height: 160px;
      object-fit: cover;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
    }

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
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
    }

    .search-hint {
      font-style: italic;
      font-size: 12px;
    }

    .results-teaser {
      display: block;
      text-align: center;
      margin-top: 16px;

      p {
        font-size: 13px;
        font-style: italic;
        margin: 0;
      }
    }
  `,
})
export class TrophyDetailsFormComponent implements OnInit, OnDestroy {
  scan = inject(ScanService);

  formType = signal<'medal' | 'bib'>('medal');
  raceName = signal('');
  raceDate = signal('');
  city = signal('');
  country = signal('');
  distance = signal('');
  sport = signal('running');
  formError = signal('');

  submitted = output<{
    type: 'medal' | 'bib';
    raceName: string;
    date?: string;
    city?: string;
    country?: string;
    distance?: string;
    sport?: 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other';
  }>();

  sportOptions = [
    'running',
    'trail',
    'triathlon',
    'cycling',
    'swimming',
    'obstacle',
    'other',
  ];

  private typewriterTimers: ReturnType<typeof setTimeout>[] = [];

  dateSearchMaxed = computed(() => this.scan.dateSearchAttempts() >= 2);

  constructor() {
    addIcons({ searchOutline, calendarOutline });
  }

  ngOnInit(): void {
    const analysis = this.scan.analysis();
    if (analysis) {
      if (analysis.imageKind !== 'unknown') {
        this.formType.set(analysis.imageKind);
      }
      if (analysis.sportKind) {
        this.sport.set(analysis.sportKind);
      }

      // Typewriter pre-fill for text fields
      const fields: { signal: ReturnType<typeof signal<string>>; value: string }[] = [
        { signal: this.raceName, value: analysis.raceName ?? '' },
        { signal: this.raceDate, value: analysis.date ?? '' },
        { signal: this.city, value: analysis.city ?? '' },
        { signal: this.country, value: analysis.country ?? '' },
        { signal: this.distance, value: analysis.distance ?? '' },
      ];

      let totalDelay = 0;
      for (const field of fields) {
        if (!field.value) continue;
        const startDelay = totalDelay;
        for (let i = 0; i <= field.value.length; i++) {
          const timer = setTimeout(() => {
            field.signal.set(field.value.slice(0, i));
          }, startDelay + i * 35);
          this.typewriterTimers.push(timer);
        }
        totalDelay += field.value.length * 35 + 200;
      }
    }
  }

  ngOnDestroy(): void {
    for (const t of this.typewriterTimers) {
      clearTimeout(t);
    }
  }

  async onSearchDate(): Promise<void> {
    if (!this.raceName().trim()) return;
    const year = this.raceDate()
      ? this.raceDate().substring(0, 4)
      : new Date().getFullYear().toString();
    const date = await this.scan.searchDateForField({
      raceName: this.raceName().trim(),
      year,
      sportKind: this.sport() || null,
      city: this.city().trim() || null,
      country: this.country().trim().toUpperCase() || null,
    });
    if (date) {
      this.raceDate.set(date);
    }
  }

  onSubmit(): void {
    if (!this.raceName().trim()) {
      this.formError.set('review.raceNameRequired');
      return;
    }
    this.formError.set('');

    this.submitted.emit({
      type: this.formType(),
      raceName: this.raceName().trim(),
      date: this.raceDate() || undefined,
      city: this.city().trim() || undefined,
      country: this.country().trim().toUpperCase() || undefined,
      distance: this.distance().trim() || undefined,
      sport: (this.sport() as 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other') || undefined,
    });
  }
}
