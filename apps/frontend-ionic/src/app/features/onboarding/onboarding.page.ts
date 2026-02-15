import { Component, inject, signal, computed, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  IonContent,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonSpinner,
  IonChip,
  IonLabel,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonSearchbar,
  IonIcon,
} from "@ionic/angular/standalone";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { chevronDown, closeOutline } from "ionicons/icons";

import { AuthService } from "@app/core/services/auth.service";
import { ApiService } from "@app/core/services/api.service";
import { GeolocationService } from "@app/core/services/geolocation.service";
import { I18nService } from "@app/core/services/i18n.service";
import {
  COUNTRIES,
  countryFlag,
  type Country,
} from "@app/shared/data/countries";

const SPORTS = [
  "running",
  "trail",
  "triathlon",
  "cycling",
  "crossfit",
  "swimming",
  "ocr",
  "duathlon",
  "hyrox",
  "ironman",
  "marathon",
  "ultra",
  "other",
] as const;

const SPORT_EMOJIS: Record<string, string> = {
  running: "\u{1F3C3}",
  trail: "\u{26F0}\u{FE0F}",
  triathlon: "\u{1F3CA}",
  cycling: "\u{1F6B4}",
  crossfit: "\u{1F3CB}\u{FE0F}",
  swimming: "\u{1F3CA}",
  ocr: "\u{1F9D7}",
  duathlon: "\u{1F3C3}",
  hyrox: "\u{1F4AA}",
  ironman: "\u{1F94C}",
  marathon: "\u{1F3C5}",
  ultra: "\u{1F30D}",
  other: "\u{2B50}",
};

@Component({
  selector: "app-onboarding",
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonSpinner,
    IonChip,
    IonLabel,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonSearchbar,
    IonIcon,
  ],
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <div class="onboarding-container animate-fade-in-up">
        <!-- Step indicator -->
        <div class="step-indicator">
          <div
            class="step"
            [class.active]="step() === 1"
            [class.done]="step() > 1"
          >
            1
          </div>
          <div class="step-line" [class.done]="step() > 1"></div>
          <div class="step" [class.active]="step() === 2">2</div>
        </div>

        @if (step() === 1) {
        <!-- Step 1: Name & Country -->
        <div class="header-section">
          <h1>{{ "onboarding.title" | translate }}</h1>
          <p>
            <ion-text color="danger">{{
              "onboarding.subtitle" | translate
            }}</ion-text>
          </p>
        </div>

        <div class="form-section">
          <ion-list lines="none">
            <ion-item>
              <ion-input
                type="text"
                [label]="'onboarding.firstName' | translate"
                labelPlacement="floating"
                [(ngModel)]="firstName"
                [clearInput]="true"
              />
            </ion-item>
            <ion-item>
              <ion-input
                type="text"
                [label]="'onboarding.lastName' | translate"
                labelPlacement="floating"
                [(ngModel)]="lastName"
                [clearInput]="true"
              />
            </ion-item>
          </ion-list>

          <!-- Country picker -->
          <button class="country-picker" (click)="showCountryModal.set(true)">
            @if (selectedCountry()) {
            <span class="country-flag">{{
              getFlag(selectedCountry()!.code)
            }}</span>
            <span class="country-name">{{
              getCountryName(selectedCountry()!)
            }}</span>
            } @else {
            <span class="country-placeholder">{{
              "onboarding.countryPlaceholder" | translate
            }}</span>
            }
            <ion-icon name="chevron-down" class="country-chevron" />
          </button>

          @if (errorMessage()) {
          <ion-text color="danger">
            <p class="error-text">{{ errorMessage() }}</p>
          </ion-text>
          }

          <ion-button
            expand="block"
            (click)="onNextStep()"
            [disabled]="!canProceedStep1"
            class="continue-btn"
          >
            {{ "onboarding.continue" | translate }}
          </ion-button>
        </div>
        } @else {
        <!-- Step 2: Sport Selection -->
        <div class="header-section">
          <h1>{{ "onboarding.sportsTitle" | translate }}</h1>
          <p>{{ "onboarding.sportsSubtitle" | translate }}</p>
        </div>

        <div class="sports-section">
          <div class="sport-chips">
            @for (sport of sports; track sport) {
            <ion-chip
              [color]="isSelected(sport) ? 'primary' : 'medium'"
              [outline]="!isSelected(sport)"
              (click)="toggleSport(sport)"
            >
              <ion-label
                >{{ getSportEmoji(sport) }}
                {{ "sports." + sport | translate }}</ion-label
              >
            </ion-chip>
            }
          </div>

          @if (errorMessage()) {
          <ion-text color="danger">
            <p class="error-text">{{ errorMessage() }}</p>
          </ion-text>
          }

          <ion-button
            expand="block"
            (click)="onContinue()"
            [disabled]="isLoading() || selectedSports().length === 0"
            class="continue-btn"
          >
            @if (isLoading()) {
            <ion-spinner name="crescent" />
            } @else {
            {{ "onboarding.continue" | translate }}
            }
          </ion-button>

          <ion-button
            expand="block"
            fill="clear"
            (click)="step.set(1)"
            class="back-btn"
          >
            {{ "onboarding.back" | translate }}
          </ion-button>
        </div>
        }
      </div>
    </ion-content>

    <!-- Country selection modal -->
    <ion-modal
      [isOpen]="showCountryModal()"
      (didDismiss)="showCountryModal.set(false)"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ "onboarding.country" | translate }}</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="showCountryModal.set(false)">
                <ion-icon name="close-outline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              [placeholder]="'onboarding.searchCountry' | translate"
              (ionInput)="onCountrySearch($event)"
              [debounce]="150"
            />
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list lines="full">
            @for (c of filteredCountries(); track c.code) {
            <ion-item
              button
              [detail]="false"
              (click)="selectCountry(c)"
              [class.selected]="selectedCountry()?.code === c.code"
            >
              <span class="modal-flag" slot="start">{{ getFlag(c.code) }}</span>
              <ion-label>{{ getCountryName(c) }}</ion-label>
            </ion-item>
            }
          </ion-list>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: `
    .onboarding-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      max-width: 400px;
      margin: 0 auto;
      padding: 24px 0;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 32px;
    }

    .step {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      background: var(--ion-color-step-200);
      color: var(--ion-color-step-600);
      transition: all 0.3s;

      &.active {
        background: var(--ion-color-primary);
        color: #fff;
      }

      &.done {
        background: var(--ion-color-success);
        color: #fff;
      }
    }

    .step-line {
      width: 40px;
      height: 2px;
      background: var(--ion-color-step-200);
      transition: background 0.3s;

      &.done {
        background: var(--ion-color-success);
      }
    }

    .header-section {
      text-align: center;
      margin-bottom: 40px;

      h1 {
        font-size: 28px;
        font-weight: 800;
        margin: 0 0 12px;
      }

      p {
        font-size: 15px;
        opacity: 0.6;
        margin: 0;
        line-height: 1.5;
      }
    }

    .form-section ion-item {
      --background: transparent;
      --padding-start: 0;
      margin-bottom: 8px;
    }

    .country-picker {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 14px 4px;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--ion-color-step-200);
      cursor: pointer;
      font-size: 16px;
      color: var(--ion-text-color);
      text-align: left;
      margin-top: 4px;
    }

    .country-flag {
      font-size: 24px;
      line-height: 1;
    }

    .country-name {
      flex: 1;
    }

    .country-placeholder {
      flex: 1;
      opacity: 0.5;
    }

    .country-chevron {
      font-size: 18px;
      opacity: 0.4;
    }

    .modal-flag {
      font-size: 24px;
      margin-right: 8px;
    }

    ion-modal ion-item.selected {
      --background: rgba(var(--ion-color-primary-rgb), 0.08);
      font-weight: 600;
    }

    .sports-section {
      display: flex;
      flex-direction: column;
    }

    .sport-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 24px;
    }

    .continue-btn {
      margin-top: 24px;
    }

    .back-btn {
      margin-top: 8px;
    }

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
    }
  `,
})
export class OnboardingPage implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private geoService = inject(GeolocationService);
  private i18n = inject(I18nService);

  firstName = "";
  lastName = "";
  step = signal(1);
  selectedCountry = signal<Country | null>(null);
  selectedSports = signal<string[]>([]);
  isLoading = signal(false);
  errorMessage = signal("");
  showCountryModal = signal(false);
  countrySearch = signal("");

  readonly sports = SPORTS;

  filteredCountries = computed(() => {
    const query = this.countrySearch().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.nameFr.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  });

  get canProceedStep1(): boolean {
    return this.firstName.trim().length > 0 && this.lastName.trim().length > 0;
  }

  constructor() {
    addIcons({ chevronDown, closeOutline });
  }

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user) return;

    if (user.firstName) this.firstName = user.firstName;
    if (user.lastName) this.lastName = user.lastName;
    if (user.country) {
      const found = COUNTRIES.find(
        (c) => c.code === user.country?.toUpperCase()
      );
      if (found) this.selectedCountry.set(found);
    }

    // Fallback: parse from name (e.g. Google OAuth sets "Johan Pujol")
    if (!this.firstName && !this.lastName && user.name) {
      const parts = user.name.trim().split(/\s+/);
      this.firstName = parts[0] ?? "";
      this.lastName = parts.slice(1).join(" ");
    }
  }

  getFlag(code: string): string {
    return countryFlag(code);
  }

  getCountryName(c: Country): string {
    return this.i18n.currentLang === "fr" ? c.nameFr : c.name;
  }

  onCountrySearch(event: CustomEvent): void {
    this.countrySearch.set((event.detail.value ?? "") as string);
  }

  selectCountry(c: Country): void {
    this.selectedCountry.set(c);
    this.showCountryModal.set(false);
    this.countrySearch.set("");
  }

  onNextStep(): void {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.errorMessage.set(
        this.translate.instant("onboarding.fieldsRequired")
      );
      return;
    }
    this.errorMessage.set("");
    this.step.set(2);
  }

  isSelected(sport: string): boolean {
    return this.selectedSports().includes(sport);
  }

  toggleSport(sport: string): void {
    const current = this.selectedSports();
    if (current.includes(sport)) {
      this.selectedSports.set(current.filter((s) => s !== sport));
    } else {
      this.selectedSports.set([...current, sport]);
    }
  }

  getSportEmoji(sport: string): string {
    return SPORT_EMOJIS[sport] ?? "";
  }

  async onContinue(): Promise<void> {
    if (this.selectedSports().length === 0) {
      this.errorMessage.set(
        this.translate.instant("onboarding.sportsRequired")
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set("");

    try {
      // Request geolocation (non-blocking — null on failure)
      const position = await this.geoService.getCurrentPosition();

      // Use the onboarding endpoint with sports
      const res = await this.apiService.client.api.users.onboarding.$post({
        json: {
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          country: this.selectedCountry()?.code || undefined,
          sports: this.selectedSports(),
          latitude: position?.latitude,
          longitude: position?.longitude,
        } as any,
      });

      if (!res.ok) throw new Error("Onboarding failed");

      // Refresh auth session to get updated user data
      await this.authService.refreshSession();
      this.router.navigate(["/trophy/first"]);
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error
          ? e.message
          : this.translate.instant("common.updateFailed")
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
