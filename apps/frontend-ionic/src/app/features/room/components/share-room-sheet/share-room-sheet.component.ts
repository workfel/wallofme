import { Component, input, output, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, copyOutline, shareSocialOutline, checkmarkCircleOutline, cameraOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-share-room-sheet',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonIcon, IonSpinner, TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'room.share' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss.emit()">
            <ion-icon slot="icon-only" name="close-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!shareLink()) {
        <div class="loading-state">
          <ion-spinner name="crescent" />
          <p>{{ 'room.generatingLink' | translate }}</p>
        </div>
      } @else {
        <!-- Share link display -->
        <div class="link-section">
          <p class="label">{{ 'room.shareMessage' | translate }}</p>
          <div class="link-row" role="button" tabindex="0" (click)="onCopyLink()" (keydown.enter)="onCopyLink()">
            <span class="link-text">{{ shareLink() }}</span>
            <ion-icon
              [name]="copied() ? 'checkmark-circle-outline' : 'copy-outline'"
              [color]="copied() ? 'success' : 'medium'"
            />
          </div>
          @if (copied()) {
            <p class="copied-feedback">{{ 'room.linkCopied' | translate }}</p>
          }
        </div>

        <!-- Main share CTA -->
        <ion-button expand="block" size="large" (click)="onShare()">
          <ion-icon name="share-social-outline" slot="start" />
          {{ 'room.share' | translate }}
        </ion-button>

        <!-- Screenshot share -->
        <ion-button
          expand="block"
          fill="outline"
          (click)="shareScreenshot.emit()"
          [disabled]="capturingScreenshot()"
          class="screenshot-btn"
        >
          @if (capturingScreenshot()) {
            <ion-spinner name="crescent" slot="start" />
            {{ 'room.capturingScreenshot' | translate }}
          } @else {
            <ion-icon name="camera-outline" slot="start" />
            {{ 'room.shareScreenshot' | translate }}
          }
        </ion-button>
      }
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 0;

      p {
        color: var(--ion-color-medium);
        font-size: 14px;
      }
    }

    .link-section {
      margin-bottom: 24px;
    }

    .label {
      font-size: 14px;
      color: var(--ion-color-medium);
      margin: 0 0 8px;
    }

    .link-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--ion-color-step-50);
      border-radius: 10px;
      padding: 14px 16px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s;

      &:active {
        background: var(--ion-color-step-100);
      }
    }

    .link-text {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--ion-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .link-row ion-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .copied-feedback {
      font-size: 12px;
      color: var(--ion-color-success);
      margin: 6px 0 0;
    }

    .screenshot-btn {
      margin-top: 12px;
    }
  `,
})
export class ShareRoomSheetComponent {
  shareLink = input<string | null>(null);
  capturingScreenshot = input(false);
  dismiss = output<void>();
  shareNative = output<void>();
  shareScreenshot = output<void>();

  copied = signal(false);

  constructor() {
    addIcons({ closeOutline, copyOutline, shareSocialOutline, checkmarkCircleOutline, cameraOutline });
  }

  onCopyLink(): void {
    const link = this.shareLink();
    if (link) {
      navigator.clipboard.writeText(link);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  onShare(): void {
    this.shareNative.emit();
  }
}
