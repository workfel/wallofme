import { Component, signal, output } from "@angular/core";
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { camera, images, refreshOutline, arrowForward } from "ionicons/icons";
import { Capacitor } from "@capacitor/core";

@Component({
  selector: "app-trophy-capture",
  standalone: true,
  imports: [
    TranslateModule,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    @if (imagePreview()) {
      <div class="preview-container">
        <!-- Loading spinner while image decodes -->
        @if (!imageLoaded()) {
          <div class="image-loading animate-fade-in">
            <ion-spinner name="crescent" />
          </div>
        }

        <img
          [src]="imagePreview()"
          alt="preview"
          class="preview-image"
          [class.loaded]="imageLoaded()"
          (load)="imageLoaded.set(true)"
        />

        @if (imageLoaded()) {
          <ion-segment
            [value]="trophyType()"
            (ionChange)="trophyType.set($any($event).detail.value)"
            class="type-segment animate-fade-in"
          >
            <ion-segment-button value="medal">
              <ion-label>{{ "trophies.medal" | translate }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="bib">
              <ion-label>{{ "trophies.bib" | translate }}</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div class="actions animate-fade-in-up">
            <ion-button fill="outline" (click)="retake()">
              <ion-icon slot="start" name="refresh-outline" />
              {{ "scan.retake" | translate }}
            </ion-button>
            <ion-button (click)="onContinue()">
              {{ "scan.continue" | translate }}
              <ion-icon slot="end" name="arrow-forward" />
            </ion-button>
          </div>
        }
      </div>
    } @else {
      <div class="capture-container animate-fade-in-up">
        <div
          class="capture-area"
          role="button"
          tabindex="0"
          (click)="capturePhoto()"
          (keydown.enter)="capturePhoto()"
        >
          <ion-icon name="camera" class="capture-icon" />
          <ion-text>
            <p>{{ "scan.tapToPhoto" | translate }}</p>
          </ion-text>
        </div>

        <ion-button expand="block" fill="outline" (click)="pickFromGallery()">
          <ion-icon slot="start" name="images" />
          {{ "scan.pickFromGallery" | translate }}
        </ion-button>
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .capture-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 16px;
      padding-top: 8px;
    }

    .capture-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 24px;
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.55);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);

      &:active {
        transform: scale(0.98);
      }
    }

    .capture-icon {
      font-size: 64px;
      color: var(--ion-color-primary);
      margin-bottom: 16px;
      filter: drop-shadow(0 2px 8px rgba(var(--ion-color-primary-rgb), 0.3));
    }

    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      border-radius: 24px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.55);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .image-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 300px;
    }

    .preview-image {
      width: 100%;
      max-height: 400px;
      object-fit: contain;
      border-radius: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;

      &.loaded {
        opacity: 1;
      }
    }

    .type-segment {
      margin: 8px 0;
      --background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.4);
      border-radius: 12px;
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
export class TrophyCaptureComponent {
  imagePreview = signal<string | null>(null);
  imageBlob = signal<Blob | null>(null);
  imageLoaded = signal(false);
  trophyType = signal<"medal" | "bib">("medal");

  captured = output<{
    blob: Blob;
    previewUrl: string;
    type: "medal" | "bib";
  }>();

  constructor() {
    addIcons({ camera, images, refreshOutline, arrowForward });
  }

  async capturePhoto(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { Camera, CameraResultType, CameraSource } =
        await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
        width: 1024,
        height: 1024,
      });
      if (photo.webPath) {
        this.imageLoaded.set(false);
        this.imagePreview.set(photo.webPath);
        const response = await fetch(photo.webPath);
        this.imageBlob.set(await response.blob());
      }
    } else {
      this.pickFileInput("camera");
    }
  }

  async pickFromGallery(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { Camera, CameraResultType, CameraSource } =
        await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
        width: 1024,
        height: 1024,
      });
      if (photo.webPath) {
        this.imageLoaded.set(false);
        this.imagePreview.set(photo.webPath);
        const response = await fetch(photo.webPath);
        this.imageBlob.set(await response.blob());
      }
    } else {
      this.pickFileInput("gallery");
    }
  }

  retake(): void {
    this.imagePreview.set(null);
    this.imageBlob.set(null);
    this.imageLoaded.set(false);
  }

  onContinue(): void {
    const blob = this.imageBlob();
    const previewUrl = this.imagePreview();
    if (!blob || !previewUrl) return;
    this.captured.emit({ blob, previewUrl, type: this.trophyType() });
  }

  private pickFileInput(source: "camera" | "gallery"): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (source === "camera") {
      input.capture = "environment";
    }
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      this.imageLoaded.set(false);
      this.imageBlob.set(file);
      this.imagePreview.set(URL.createObjectURL(file));
    };
    input.click();
  }
}
