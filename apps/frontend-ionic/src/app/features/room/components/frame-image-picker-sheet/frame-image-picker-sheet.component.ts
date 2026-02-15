import {
  Component,
  inject,
  input,
  output,
  signal,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { imageOutline, cameraOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

import { UploadService } from '@app/core/services/upload.service';
import { RoomService } from '@app/core/services/room.service';

@Component({
  selector: 'app-frame-image-picker-sheet',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'room.framePickImage' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (uploading()) {
        <div class="upload-state">
          <ion-spinner name="crescent" />
          <p>{{ 'room.frameUploading' | translate }}</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p class="error-message">{{ error() }}</p>
          <ion-button expand="block" (click)="clearError()">
            {{ 'room.frameTryAnother' | translate }}
          </ion-button>
        </div>
      } @else {
        <p class="hint-text">{{ 'room.frameImageHint' | translate }}</p>

        <div class="picker-actions">
          <ion-button expand="block" (click)="pickFromGallery()">
            <ion-icon slot="start" name="image-outline" />
            {{ 'room.frameFromGallery' | translate }}
          </ion-button>

          <ion-button expand="block" color="medium" (click)="pickFromCamera()">
            <ion-icon slot="start" name="camera-outline" />
            {{ 'room.frameFromCamera' | translate }}
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .upload-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 40px 0;

      p {
        color: var(--ion-color-medium);
        font-size: 14px;
      }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px 0;
    }

    .error-message {
      color: var(--ion-color-danger);
      font-size: 14px;
      text-align: center;
    }

    .hint-text {
      color: var(--ion-color-medium);
      font-size: 14px;
      text-align: center;
      margin-bottom: 24px;
    }

    .picker-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `,
})
export class FrameImagePickerSheetComponent {
  private uploadService = inject(UploadService);
  private roomService = inject(RoomService);

  roomItemId = input.required<string>();

  imagePicked = output<void>();

  uploading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    addIcons({ imageOutline, cameraOutline });
  }

  async pickFromGallery(): Promise<void> {
    await this.pickImage('Photos');
  }

  async pickFromCamera(): Promise<void> {
    await this.pickImage('Camera');
  }

  clearError(): void {
    this.error.set(null);
  }

  private async pickImage(source: 'Camera' | 'Photos'): Promise<void> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import(
        '@capacitor/camera'
      );

      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: source === 'Camera' ? CameraSource.Camera : CameraSource.Photos,
        width: 1024,
        height: 768,
      });

      if (!photo.dataUrl) return;

      this.uploading.set(true);
      this.error.set(null);

      // Convert data URL to blob
      const response = await fetch(photo.dataUrl);
      const blob = await response.blob();

      // Upload to R2
      const result = await this.uploadService.uploadFile(
        blob,
        'frame-image',
        'image/jpeg',
      );

      if (!result) {
        this.error.set('Upload failed');
        this.uploading.set(false);
        return;
      }

      // Update frame image (includes moderation)
      const updateResult = await this.roomService.updateFrameImage(
        this.roomItemId(),
        result.key,
      );

      this.uploading.set(false);

      if (updateResult.success) {
        this.imagePicked.emit();
      } else if (updateResult.error === 'image_rejected') {
        this.error.set('room.frameNsfwRejected');
      } else {
        this.error.set('Upload failed');
      }
    } catch {
      this.uploading.set(false);
      // User cancelled — do nothing
    }
  }
}
