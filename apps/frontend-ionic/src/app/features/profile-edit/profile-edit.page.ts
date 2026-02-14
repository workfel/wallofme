import { Component, inject, signal, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
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
  IonText,
  IonSpinner,
  IonIcon,
  IonAvatar,
  IonSelect,
  IonSelectOption,
  IonChip,
  IonLabel,
  ToastController,
} from "@ionic/angular/standalone";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  cameraOutline,
  personCircleOutline,
  checkmarkOutline,
  locationOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { Capacitor } from "@capacitor/core";

import { AuthService } from "@app/core/services/auth.service";
import { UserService } from "@app/core/services/user.service";
import { UploadService } from "@app/core/services/upload.service";
import { GeolocationService } from "@app/core/services/geolocation.service";

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
    IonBackButton,
    IonButton,
    IonInput,
    IonItem,
    IonList,
    IonText,
    IonSpinner,
    IonIcon,
    IonAvatar,
    IonSelect,
    IonSelectOption,
    IonChip,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" />
        </ion-buttons>
        <ion-title>{{ "profileEdit.title" | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSave()" [disabled]="saving()">
            @if (saving()) {
              <ion-spinner name="crescent" />
            } @else {
              <ion-icon name="checkmark-outline" />
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [fullscreen]="true">
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
          <ion-item>
            <ion-input
              type="text"
              [label]="'profileEdit.displayName' | translate"
              labelPlacement="floating"
              [(ngModel)]="displayName"
              [clearInput]="true"
            />
          </ion-item>
          <ion-item>
            <ion-input
              type="text"
              [label]="'onboarding.country' | translate"
              labelPlacement="floating"
              [(ngModel)]="country"
              [clearInput]="true"
              maxlength="2"
            />
          </ion-item>
          <ion-item>
            <ion-select
              [label]="'profile.language' | translate"
              labelPlacement="floating"
              [(ngModel)]="locale"
              interface="action-sheet"
            >
              <ion-select-option value="en">English</ion-select-option>
              <ion-select-option value="fr">Français</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

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

        <ion-button
          expand="block"
          (click)="onSave()"
          [disabled]="saving()"
          class="save-btn"
        >
          @if (saving()) {
            <ion-spinner name="crescent" />
          } @else {
            {{ "common.save" | translate }}
          }
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: `
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

    .save-btn {
      margin-top: 32px;
    }

    .error-text {
      font-size: 13px;
      padding: 8px 0 0;
      margin: 0;
    }
  `,
})
export class ProfileEditPage implements OnInit {
  authService = inject(AuthService);
  private userService = inject(UserService);
  private uploadService = inject(UploadService);
  private geoService = inject(GeolocationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private toastController = inject(ToastController);

  firstName = "";
  lastName = "";
  displayName = "";
  country = "";
  locale = "en";
  selectedSports = signal<string[]>([]);
  avatarPreview = signal<string | null>(null);
  private avatarBlob = signal<Blob | null>(null);
  saving = signal(false);
  errorMessage = signal("");
  updatingLocation = signal(false);
  hasLocation = signal(false);
  private pendingLatitude: number | null = null;
  private pendingLongitude: number | null = null;

  readonly sports = SPORTS;

  constructor() {
    addIcons({ cameraOutline, personCircleOutline, checkmarkOutline, locationOutline, checkmarkCircleOutline });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    const profile =
      this.userService.profile() ?? (await this.userService.fetchProfile());
    if (!profile) return;

    this.firstName = profile.firstName ?? "";
    this.lastName = profile.lastName ?? "";
    this.displayName = profile.displayName ?? "";
    this.country = profile.country ?? "";
    this.locale = profile.locale ?? this.translate.currentLang ?? "en";
    this.selectedSports.set(profile.sports ?? []);
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
      } else {
        this.errorMessage.set(
          this.translate.instant("profileEdit.locationFailed"),
        );
      }
    } finally {
      this.updatingLocation.set(false);
    }
  }

  async onSave(): Promise<void> {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.errorMessage.set(
        this.translate.instant("onboarding.fieldsRequired"),
      );
      return;
    }

    this.saving.set(true);
    this.errorMessage.set("");

    try {
      let avatarKey: string | undefined;

      // Upload avatar if changed
      if (this.avatarBlob()) {
        const result = await this.uploadService.uploadFile(
          this.avatarBlob()!,
          "avatar",
          "image/webp",
        );
        if (result?.key) {
          avatarKey = result.key;
        }
      }

      // Update language if changed
      const currentLang = this.translate.currentLang;
      if (this.locale !== currentLang) {
        this.translate.use(this.locale);
      }

      // Update profile
      const profileData: Record<string, unknown> = {
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        displayName:
          this.displayName.trim() ||
          `${this.firstName.trim()} ${this.lastName.trim()}`,
        country: this.country.trim().toUpperCase() || null,
        locale: this.locale,
        sports: this.selectedSports(),
        image: avatarKey,
      };

      if (this.pendingLatitude !== null && this.pendingLongitude !== null) {
        profileData.latitude = this.pendingLatitude;
        profileData.longitude = this.pendingLongitude;
      }

      const success = await this.userService.updateProfile(profileData as any);

      if (success) {
        // Refresh auth session to keep user data in sync
        await this.authService.refreshSession();

        const toast = await this.toastController.create({
          message: this.translate.instant("profileEdit.saved"),
          duration: 2000,
          position: "bottom",
          color: "success",
        });
        await toast.present();
        this.router.navigate(["/tabs/profile"]);
      } else {
        this.errorMessage.set(this.translate.instant("common.error"));
      }
    } catch (e: unknown) {
      this.errorMessage.set(
        e instanceof Error ? e.message : this.translate.instant("common.error"),
      );
    } finally {
      this.saving.set(false);
    }
  }
}
