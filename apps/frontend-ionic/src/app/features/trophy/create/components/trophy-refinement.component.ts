import { Component, inject, signal, computed, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
  IonText,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { searchOutline, arrowForwardOutline, arrowBackOutline, checkmarkCircleOutline } from 'ionicons/icons';

import { ScanService, type RefineSearchResult } from '@app/core/services/scan.service';
import { I18nService } from '@app/core/services/i18n.service';
import { COUNTRIES, countryFlag, type Country } from '@app/shared/data/countries';

type RefinementSubStep = 'raceName' | 'location' | 'year' | 'searching' | 'manualDate';

@Component({
  selector: 'app-trophy-refinement',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonSpinner,
    IonText,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    IonSearchbar,
  ],
  template: `
    <div class="refinement-container animate-fade-in-up">
      <!-- Race Name sub-step -->
      @if (currentStep() === 'raceName') {
        <div class="step-card animate-fade-in-up">
          <h2 class="step-title">{{ 'refinement.raceNameTitle' | translate }}</h2>
          <p class="step-hint">{{ 'refinement.raceNameHint' | translate }}</p>

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
          </ion-list>

          <div class="step-actions">
            <ion-button expand="block" (click)="onNext()" [disabled]="!raceName().trim()">
              {{ 'refinement.next' | translate }}
              <ion-icon slot="end" name="arrow-forward-outline" />
            </ion-button>
          </div>
        </div>
      }

      <!-- Location sub-step -->
      @if (currentStep() === 'location') {
        <div class="step-card animate-fade-in-up">
          <h2 class="step-title">{{ 'refinement.locationTitle' | translate }}</h2>
          <p class="step-hint">{{ 'refinement.locationHint' | translate }}</p>

          <ion-list lines="none">
            <ion-item button (click)="showCountryModal.set(true)">
              <ion-input
                [label]="'onboarding.country' | translate"
                labelPlacement="floating"
                [value]="selectedCountry() ? countryFlag(selectedCountry()!.code) + ' ' + countryDisplayName(selectedCountry()!) : ''"
                readonly
              />
            </ion-item>
            <ion-item>
              <ion-input
                [label]="'review.city' | translate"
                labelPlacement="floating"
                [value]="city()"
                (ionInput)="city.set($any($event).detail.value ?? '')"
                [clearInput]="true"
              />
            </ion-item>
          </ion-list>

          <div class="step-actions two-buttons">
            @if (canGoBack()) {
              <ion-button fill="outline" (click)="onBack()">
                <ion-icon slot="start" name="arrow-back-outline" />
                {{ 'refinement.back' | translate }}
              </ion-button>
            }
            <ion-button expand="block" (click)="onNext()">
              {{ 'refinement.next' | translate }}
              <ion-icon slot="end" name="arrow-forward-outline" />
            </ion-button>
          </div>
        </div>

        <!-- Country picker modal -->
        <ion-modal [isOpen]="showCountryModal()" (didDismiss)="showCountryModal.set(false)">
          <ng-template>
            <ion-header>
              <ion-toolbar>
                <ion-title>{{ 'onboarding.country' | translate }}</ion-title>
                <ion-buttons slot="end">
                  <ion-button (click)="showCountryModal.set(false)">
                    {{ 'common.cancel' | translate }}
                  </ion-button>
                </ion-buttons>
              </ion-toolbar>
              <ion-toolbar>
                <ion-searchbar
                  [placeholder]="'onboarding.searchCountry' | translate"
                  (ionInput)="countrySearch.set($any($event).detail.value ?? '')"
                  [debounce]="150"
                />
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-list>
                @for (c of filteredCountries(); track c.code) {
                  <ion-item button (click)="onSelectCountry(c)">
                    {{ countryFlag(c.code) }} {{ countryDisplayName(c) }}
                  </ion-item>
                }
              </ion-list>
            </ion-content>
          </ng-template>
        </ion-modal>
      }

      <!-- Year sub-step -->
      @if (currentStep() === 'year') {
        <div class="step-card animate-fade-in-up">
          <h2 class="step-title">{{ 'refinement.yearTitle' | translate }}</h2>
          <p class="step-hint">{{ 'refinement.yearHint' | translate }}</p>

          <ion-list lines="none">
            <ion-item>
              <ion-input
                [label]="'refinement.yearLabel' | translate"
                labelPlacement="floating"
                [value]="year()"
                (ionInput)="onYearInput($any($event).detail.value ?? '')"
                type="number"
                min="1970"
                [max]="currentYear"
                inputmode="numeric"
              />
            </ion-item>
            <ion-item>
              <ion-input
                [label]="'refinement.manualDateLabel' | translate"
                labelPlacement="floating"
                [value]="exactDate()"
                (ionInput)="onExactDateInput($any($event).detail.value ?? '')"
                type="date"
              />
            </ion-item>
          </ion-list>

          <p class="or-year-hint">{{ 'refinement.orJustYear' | translate }}</p>

          <div class="step-actions two-buttons">
            @if (canGoBack()) {
              <ion-button fill="outline" (click)="onBack()">
                <ion-icon slot="start" name="arrow-back-outline" />
                {{ 'refinement.back' | translate }}
              </ion-button>
            }
            @if (exactDate()) {
              <ion-button expand="block" (click)="onConfirmExactDate()">
                <ion-icon slot="start" name="checkmark-circle-outline" />
                {{ 'common.confirm' | translate }}
              </ion-button>
            } @else {
              <ion-button expand="block" (click)="onSearch()" [disabled]="!isValidYear()">
                <ion-icon slot="start" name="search-outline" />
                {{ 'refinement.searchNow' | translate }}
              </ion-button>
            }
          </div>
        </div>
      }

      <!-- Searching sub-step -->
      @if (currentStep() === 'searching') {
        <div class="step-card centered animate-fade-in">
          <ion-spinner name="crescent" />
          <ion-text color="medium">
            <p>{{ 'refinement.searchingDate' | translate }}</p>
          </ion-text>
        </div>
      }

      <!-- Manual date sub-step (search failed) -->
      @if (currentStep() === 'manualDate') {
        <div class="step-card animate-fade-in-up">
          <div class="search-failed">
            <h2 class="step-title">{{ 'refinement.searchFailedTitle' | translate }}</h2>
            <p class="step-hint">{{ 'refinement.searchFailedHint' | translate }}</p>
          </div>

          <ion-list lines="none">
            <ion-item>
              <ion-input
                [label]="'refinement.manualDateLabel' | translate"
                labelPlacement="floating"
                [value]="manualDate()"
                (ionInput)="manualDate.set($any($event).detail.value ?? '')"
                type="date"
              />
            </ion-item>
          </ion-list>

          <p class="or-year-hint">{{ 'refinement.orJustYear' | translate }}</p>

          <div class="step-actions">
            @if (manualDate()) {
              <ion-button expand="block" (click)="onConfirmManualDate()">
                <ion-icon slot="start" name="checkmark-circle-outline" />
                {{ 'common.confirm' | translate }}
              </ion-button>
            } @else {
              <ion-button expand="block" fill="outline" (click)="onConfirmYearOnly()">
                {{ 'refinement.confirmYear' | translate }}
              </ion-button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .refinement-container {
      padding-bottom: 24px;
    }

    .step-card {
      padding: 8px 0;

      &.centered {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 40vh;
        gap: 16px;
      }
    }

    .step-title {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 4px;
    }

    .step-hint {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0 0 16px;
    }

    ion-item {
      --background: transparent;
      --padding-start: 0;
      margin-bottom: 4px;
    }

    .step-actions {
      margin-top: 24px;

      &.two-buttons {
        display: flex;
        gap: 8px;

        ion-button:last-child {
          flex: 1;
        }
      }
    }

    .search-failed {
      margin-bottom: 8px;
    }

    .or-year-hint {
      font-size: 13px;
      font-style: italic;
      color: var(--ion-color-medium);
      text-align: center;
      margin: 12px 0;
    }
  `,
})
export class TrophyRefinementComponent implements OnInit {
  scan = inject(ScanService);
  private i18n = inject(I18nService);

  completed = output<void>();

  // Sub-step state
  currentIndex = signal(0);
  raceName = signal('');
  city = signal('');
  year = signal('');
  exactDate = signal('');
  manualDate = signal('');
  selectedCountry = signal<Country | null>(null);
  showCountryModal = signal(false);
  countrySearch = signal('');
  isSearching = signal(false);
  searchFailed = signal(false);

  currentYear = new Date().getFullYear();
  countryFlag = countryFlag;

  // Build plan from missing fields — year is always last
  plan = computed<RefinementSubStep[]>(() => {
    const missing = this.scan.missingCriticalFields();
    const steps: RefinementSubStep[] = [];
    if (missing.includes('raceName')) steps.push('raceName');
    if (missing.includes('location')) steps.push('location');
    steps.push('year'); // Always ask for year/date confirmation
    return steps;
  });

  currentStep = computed<RefinementSubStep>(() => {
    if (this.isSearching()) return 'searching';
    if (this.searchFailed()) return 'manualDate';
    return this.plan()[this.currentIndex()] ?? 'year';
  });

  canGoBack = computed(() => this.currentIndex() > 0);

  filteredCountries = computed(() => {
    const search = this.countrySearch().toLowerCase();
    if (!search) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.nameFr.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search),
    );
  });

  isValidYear = computed(() => {
    const y = parseInt(this.year(), 10);
    return y >= 1970 && y <= this.currentYear;
  });

  constructor() {
    addIcons({ searchOutline, arrowForwardOutline, arrowBackOutline, checkmarkCircleOutline });
  }

  ngOnInit(): void {
    // Pre-populate from existing analysis
    const analysis = this.scan.analysis();
    if (analysis) {
      if (analysis.raceName) this.raceName.set(analysis.raceName);
      if (analysis.city) this.city.set(analysis.city);
      if (analysis.country) {
        const found = COUNTRIES.find((c) => c.code === analysis.country);
        if (found) this.selectedCountry.set(found);
      }
      if (analysis.date) {
        // Pre-fill year from existing date and exact date field
        this.year.set(analysis.date.substring(0, 4));
        this.exactDate.set(analysis.date);
      }
    }
  }

  countryDisplayName(c: Country): string {
    return this.i18n.currentLang === 'fr' ? c.nameFr : c.name;
  }

  onSelectCountry(c: Country): void {
    this.selectedCountry.set(c);
    this.showCountryModal.set(false);
  }

  onYearInput(value: string): void {
    this.year.set(value);
    // Clear exact date when year is changed manually
    if (this.exactDate()) {
      const existingYear = this.exactDate().substring(0, 4);
      if (existingYear !== value) {
        this.exactDate.set('');
      }
    }
  }

  onExactDateInput(value: string): void {
    this.exactDate.set(value);
    // Sync year from date
    if (value && value.length >= 4) {
      this.year.set(value.substring(0, 4));
    }
  }

  onConfirmExactDate(): void {
    this.scan.applyRefinement({
      raceName: this.raceName().trim() || undefined,
      date: this.exactDate(),
      city: this.city().trim() || undefined,
      country: this.selectedCountry()?.code ?? undefined,
    });
    this.completed.emit();
  }

  onNext(): void {
    if (this.currentIndex() < this.plan().length - 1) {
      this.currentIndex.update((i) => i + 1);
    }
  }

  onBack(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
    }
  }

  async onSearch(): Promise<void> {
    this.isSearching.set(true);
    this.searchFailed.set(false);

    const result = await this.scan.refineSearch({
      raceName: this.raceName().trim() || this.scan.analysis()?.raceName || '',
      year: this.year(),
      sportKind: this.scan.analysis()?.sportKind ?? null,
      city: this.city().trim() || this.scan.analysis()?.city || null,
      country: this.selectedCountry()?.code ?? this.scan.analysis()?.country ?? null,
    });

    this.isSearching.set(false);

    if (result.found) {
      // Apply all enriched data
      this.scan.applyRefinement({
        raceName: result.raceName ?? (this.raceName().trim() || undefined),
        date: result.date ?? undefined,
        city: result.city ?? (this.city().trim() || undefined),
        country: result.country ?? this.selectedCountry()?.code ?? undefined,
        sport: result.sport ?? undefined,
        distance: result.distance ?? undefined,
      });
      this.completed.emit();
    } else {
      this.searchFailed.set(true);
    }
  }

  onConfirmManualDate(): void {
    this.scan.applyRefinement({
      raceName: this.raceName().trim() || undefined,
      date: this.manualDate(),
      city: this.city().trim() || undefined,
      country: this.selectedCountry()?.code ?? undefined,
    });
    this.completed.emit();
  }

  onConfirmYearOnly(): void {
    this.scan.applyRefinement({
      raceName: this.raceName().trim() || undefined,
      date: `${this.year()}-01-01`,
      city: this.city().trim() || undefined,
      country: this.selectedCountry()?.code ?? undefined,
    });
    this.completed.emit();
  }
}
