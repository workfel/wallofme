import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  effect,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonText,
  IonSpinner,
  IonIcon,
  IonAvatar,
  IonChip,
  IonLabel,
  IonModal,
  IonSearchbar,
  NavController,
  ToastController,
} from "@ionic/angular/standalone";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  arrowBackOutline,
  cameraOutline,
  personCircleOutline,
  locationOutline,
  checkmarkCircleOutline,
  chevronDown,
  closeOutline,
} from "ionicons/icons";
import { Capacitor } from "@capacitor/core";

import { AuthService } from "@app/core/services/auth.service";
import { UserService } from "@app/core/services/user.service";
import { UploadService } from "@app/core/services/upload.service";
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

const AUTOSAVE_DEBOUNCE_MS = 1200;

@Component({
  selector: "app-profile-edit",
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonSpinner,
    IonIcon,
    IonAvatar,
    IonChip,
    IonLabel,
    IonModal,
    IonSearchbar,
  ],
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <!-- Floating glass header -->
      <div class="floating-header">
        <button class="back-pill" (click)="goBack()">
          <ion-icon name="arrow-back-outline" />
        </button>
        <div class="header-title-pill">
          <span>{{ "profileEdit.title" | translate }}</span>
          @if (saving()) {
            <ion-spinner name="crescent" class="save-spinner" />
          }
        </div>
        <div class="header-spacer"></div>
      </div>

      <div class="form-container animate-fade-in">
        <!-- Avatar -->
        <div
          class="avatar-section"
          role="button"
          tabindex="0"
          (click)="onChangeAvatar()"
          (keydown.enter)="onChangeAvatar()"
        >
          <ion-avatar class="avatar">
            @if (avatarPreview() || authService.user()?.image) {
              <img
                [src]="avatarPreview() || authService.user()!.image!"
                alt="avatar"
              />
            } @else {
              <ion-icon
                name="person-circle-outline"
                class="avatar-placeholder"
              />
            }
          </ion-avatar>
          <ion-text color="primary">
            <p class="change-photo">
              {{ "profileEdit.changePhoto" | translate }}
            </p>
          </ion-text>
        </div>

        <!-- Form fields -->
        <ion-list lines="none">
          <ion-item>
            <ion-input
              type="text"
              [label]="'onboarding.firstName' | translate"
              labelPlacement="floating"
              [(ngModel)]="firstName"
              (ionInput)="scheduleAutosave()"
              [clearInput]="true"
            />
          </ion-item>
          <ion-item>
            <ion-input
              type="text"
              [label]="'onboarding.lastName' | translate"
              labelPlacement="floating"
              [(ngModel)]="lastName"
              (ionInput)="scheduleAutosave()"
              [clearInput]="true"
            />
          </ion-item>
          <ion-item>
            <ion-input
              type="text"
              [label]="'profileEdit.displayName' | translate"
              labelPlacement="floating"
              [(ngModel)]="displayName"
              (ionInput)="scheduleAutosave()"
              [clearInput]="true"
            />
          </ion-item>
        </ion-list>

        <!-- Country picker -->
        <button class="country-picker" (click)="showCountryModal.set(true)">
          @if (selectedCountry()) {
            <span class="country-flag">{{ getFlag(selectedCountry()!.code) }}</span>
            <span class="country-name">{{ getCountryName(selectedCountry()!) }}</span>
          } @else {
            <span class="country-placeholder">{{ "onboarding.countryPlaceholder" | translate }}</span>
          }
          <ion-icon name="chevron-down" class="country-chevron" />
        </button>

        <!-- Sports -->
        <div class="sports-section">
          <ion-text>
            <h3>{{ "profileEdit.sports" | translate }}</h3>
          </ion-text>
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
        </div>

        <!-- Location -->
        <div class="location-section">
          <ion-text>
            <h3>{{ "profileEdit.location" | translate }}</h3>
          </ion-text>
          <p class="location-hint">{{ "profileEdit.locationHint" | translate }}</p>
          <ion-button
            fill="outline"
            expand="block"
            (click)="onUpdateLocation()"
            [disabled]="updatingLocation()"
          >
            @if (updatingLocation()) {
              <ion-spinner name="crescent" />
            } @else if (hasLocation()) {
              <ion-icon name="checkmark-circle-outline" slot="start" />
              {{ "profileEdit.locationUpdated" | translate }}
            } @else {
              <ion-icon name="location-outline" slot="start" />
              {{ "profileEdit.updateLocation" | translate }}
            }
          </ion-button>
        </div>

        @if (errorMessage()) {
          <ion-text color="danger">
            <p class="error-text">{{ errorMessage() }}</p>
          </ion-text>
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
    .floating-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease;
      flex-shrink: 0;

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 22px;
        color: var(--ion-text-color);
      }
    }

    .header-title-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 100px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.65);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      span {
        font-size: 15px;
        font-weight: 700;
        color: var(--ion-text-color);
        letter-spacing: -0.01em;
      }
    }

    .save-spinner {
      width: 16px;
      height: 16px;
      color: var(--ion-color-medium);
    }

    .header-spacer {
      flex: 1;
    }

    .form-container {
      max-width: 500px;
      margin: 0 auto;
    }

    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 0 16px;
      cursor: pointer;
    }

    .avatar {
      width: 88px;
      height: 88px;
      margin-bottom: 8px;
    }

    .avatar-placeholder {
      font-size: 88px;
      color: var(--ion-color-step-300);
    }

    .change-photo {
      font-size: 14px;
      margin: 0;
    }

    ion-list ion-item {
      --background: transparent;
      --padding-start: 0;
      margin-bottom: 8px;
    }

    .sports-section {
      margin-top: 24px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 12px;
      }
    }

    .sport-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .location-section {
      margin-top: 24px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 4px;
      }

      .location-hint {
        font-size: 13px;
        color: var(--ion-color-medium);
        margin: 0 0 12px;
      }
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

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
    }
  `,
})
export class ProfileEditPage implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private userService = inject(UserService);
  private uploadService = inject(UploadService);
  private geoService = inject(GeolocationService);
  private navCtrl = inject(NavController);
  private translate = inject(TranslateService);
  private toastController = inject(ToastController);
  private i18n = inject(I18nService);

  firstName = "";
  lastName = "";
  displayName = "";
  selectedCountry = signal<Country | null>(null);
  showCountryModal = signal(false);
  countrySearch = signal("");
  selectedSports = signal<string[]>([]);
  avatarPreview = signal<string | null>(null);
  private avatarBlob = signal<Blob | null>(null);
  saving = signal(false);
  errorMessage = signal("");
  updatingLocation = signal(false);
  hasLocation = signal(false);
  private pendingLatitude: number | null = null;
  private pendingLongitude: number | null = null;

  private profileLoaded = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly sports = SPORTS;

  filteredCountries = computed(() => {
    const query = this.countrySearch().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.nameFr.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query),
    );
  });

  constructor() {
    addIcons({
      arrowBackOutline,
      cameraOutline,
      personCircleOutline,
      locationOutline,
      checkmarkCircleOutline,
      chevronDown,
      closeOutline,
    });

    // Auto-save when sports or country change
    effect(() => {
      this.selectedSports();
      this.selectedCountry();
      if (this.profileLoaded) {
        this.scheduleAutosave();
      }
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    // Flush any pending autosave immediately
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.persistProfile();
    }
  }

  goBack(): void {
    this.navCtrl.back();
  }

  private async loadProfile(): Promise<void> {
    const profile =
      this.userService.profile() ?? (await this.userService.fetchProfile());
    if (!profile) return;

    this.firstName = profile.firstName ?? "";
    this.lastName = profile.lastName ?? "";
    this.displayName = profile.displayName ?? "";
    if (profile.country) {
      const found = COUNTRIES.find(
        (c) => c.code === profile.country?.toUpperCase(),
      );
      if (found) this.selectedCountry.set(found);
    }
    this.selectedSports.set(profile.sports ?? []);

    // Mark loaded so effects start triggering autosave
    this.profileLoaded = true;
  }

  scheduleAutosave(): void {
    if (!this.profileLoaded) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.persistProfile();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  private async persistProfile(): Promise<void> {
    if (!this.firstName.trim() || !this.lastName.trim()) return;

    this.saving.set(true);
    this.errorMessage.set("");

    try {
      let avatarKey: string | undefined;

      if (this.avatarBlob()) {
        const result = await this.uploadService.uploadFile(
          this.avatarBlob()!,
          "avatar",
          "image/webp",
        );
        if (result?.key) {
          avatarKey = result.key;
        }
        // Clear blob so it's not re-uploaded on next autosave
        this.avatarBlob.set(null);
      }

      const profileData: Record<string, unknown> = {
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        displayName:
          this.displayName.trim() ||
          `${this.firstName.trim()} ${this.lastName.trim()}`,
        country: this.selectedCountry()?.code || null,
        sports: this.selectedSports(),
        image: avatarKey,
      };

      if (this.pendingLatitude !== null && this.pendingLongitude !== null) {
        profileData.latitude = this.pendingLatitude;
        profileData.longitude = this.pendingLongitude;
      }

      const success = await this.userService.updateProfile(
        profileData as any,
      );

      if (success) {
        await this.authService.refreshSession();
      } else {
        this.errorMessage.set(this.translate.instant("common.error"));
      }
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error
          ? e.message
          : this.translate.instant("common.error"),
      );
    } finally {
      this.saving.set(false);
    }
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

  async onChangeAvatar(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { Camera, CameraResultType, CameraSource } =
        await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 80,
        width: 512,
        height: 512,
      });
      if (photo.webPath) {
        this.avatarPreview.set(photo.webPath);
        const response = await fetch(photo.webPath);
        this.avatarBlob.set(await response.blob());
        this.scheduleAutosave();
      }
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        this.avatarBlob.set(file);
        this.avatarPreview.set(URL.createObjectURL(file));
        this.scheduleAutosave();
      };
      input.click();
    }
  }

  async onUpdateLocation(): Promise<void> {
    this.updatingLocation.set(true);
    try {
      const position = await this.geoService.getCurrentPosition();
      if (position) {
        this.pendingLatitude = position.latitude;
        this.pendingLongitude = position.longitude;
        this.hasLocation.set(true);
        this.scheduleAutosave();
      } else {
        this.errorMessage.set(
          this.translate.instant("profileEdit.locationFailed"),
        );
      }
    } finally {
      this.updatingLocation.set(false);
    }
  }
}
