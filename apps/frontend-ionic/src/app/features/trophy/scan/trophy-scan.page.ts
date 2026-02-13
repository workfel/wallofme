import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { camera, images, refreshOutline, arrowForward } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';

import { ScanService } from '@app/core/services/scan.service';
import { UserService } from '@app/core/services/user.service';

@Component({
  selector: 'app-trophy-scan',
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/trophies" />
        </ion-buttons>
        <ion-title>{{ 'trophies.scan' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [fullscreen]="true">
      @if (uploading()) {
        <div class="centered animate-fade-in">
          <ion-spinner name="crescent" />
          <ion-text color="medium">
            <p>{{ 'scan.uploading' | translate }}</p>
          </ion-text>
        </div>
      } @else if (imagePreview()) {
        <!-- Preview captured image -->
        <div class="preview-container animate-scale-in">
          <img [src]="imagePreview()" alt="preview" class="preview-image" />

          <ion-segment
            [value]="trophyType()"
            (ionChange)="trophyType.set($any($event).detail.value)"
            class="type-segment"
          >
            <ion-segment-button value="medal">
              <ion-label>{{ 'trophies.medal' | translate }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="bib">
              <ion-label>{{ 'trophies.bib' | translate }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div class="actions">
            <ion-button fill="outline" (click)="retake()">
              <ion-icon slot="start" name="refresh-outline" />
              {{ 'scan.retake' | translate }}
            </ion-button>
            <ion-button (click)="proceed()">
              {{ 'scan.continue' | translate }}
              <ion-icon slot="end" name="arrow-forward" />
            </ion-button>
          </div>
        </div>
      } @else {
        <!-- Capture options -->
        <div class="capture-container animate-fade-in-up">
          <div class="capture-area" role="button" tabindex="0" (click)="capturePhoto()" (keydown.enter)="capturePhoto()">
            <ion-icon name="camera" class="capture-icon" />
            <ion-text>
              <p>{{ 'scan.tapToPhoto' | translate }}</p>
            </ion-text>
          </div>

          <ion-button
            expand="block"
            fill="outline"
            (click)="pickFromGallery()"
          >
            <ion-icon slot="start" name="images" />
            {{ 'scan.pickFromGallery' | translate }}
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: `
    .centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
    }

    .capture-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 16px;
      padding-top: 24px;
    }

    .capture-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--ion-color-step-300);
      border-radius: 16px;
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover {
        border-color: var(--ion-color-primary);
      }
    }

    .capture-icon {
      font-size: 64px;
      color: var(--ion-color-step-400);
      margin-bottom: 16px;
    }

    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .preview-image {
      width: 100%;
      max-height: 400px;
      object-fit: contain;
      border-radius: 16px;
    }

    .type-segment {
      margin: 8px 0;
    }

    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;

      ion-button {
        flex: 1;
      }
    }
  `,
})
export class TrophyScanPage {
  private router = inject(Router);
  private scanService = inject(ScanService);
  private userService = inject(UserService);

  imagePreview = signal<string | null>(null);
  imageBlob = signal<Blob | null>(null);
  trophyType = signal<'medal' | 'bib'>('medal');
  uploading = signal(false);

  constructor() {
    addIcons({ camera, images, refreshOutline, arrowForward });
    this.scanService.reset();
  }

  async capturePhoto(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { Camera, CameraResultType, CameraSource } = await import(
        '@capacitor/camera'
      );
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        width: 1024,
        height: 1024,
      });
      if (photo.webPath) {
        this.imagePreview.set(photo.webPath);
        const response = await fetch(photo.webPath);
        this.imageBlob.set(await response.blob());
      }
    } else {
      // Web fallback: use file input
      this.pickFileInput('camera');
    }
  }

  async pickFromGallery(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { Camera, CameraResultType, CameraSource } = await import(
        '@capacitor/camera'
      );
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        width: 1024,
        height: 1024,
      });
      if (photo.webPath) {
        this.imagePreview.set(photo.webPath);
        const response = await fetch(photo.webPath);
        this.imageBlob.set(await response.blob());
      }
    } else {
      this.pickFileInput('gallery');
    }
  }

  retake(): void {
    this.imagePreview.set(null);
    this.imageBlob.set(null);
  }

  async proceed(): Promise<void> {
    const blob = this.imageBlob();
    if (!blob) return;

    // Check scan limit before proceeding
    const remaining = this.userService.scansRemaining();
    if (remaining !== null && remaining <= 0 && !this.userService.isPro()) {
      this.router.navigate(['/tabs/home']);
      return;
    }

    this.uploading.set(true);
    try {
      await this.scanService.uploadAndProcess(blob, this.trophyType());
      if (this.scanService.error()) {
        // Error occurred (e.g. scan limit reached server-side) — stay on page
        this.uploading.set(false);
        return;
      }
      this.router.navigate(['/trophy/review']);
    } catch {
      this.uploading.set(false);
    }
  }

  private pickFileInput(source: 'camera' | 'gallery'): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') {
      input.capture = 'environment';
    }
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      this.imageBlob.set(file);
      this.imagePreview.set(URL.createObjectURL(file));
    };
    input.click();
  }
}
