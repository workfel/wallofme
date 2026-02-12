import { Component, output } from '@angular/core';
import {
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  eyeOutline,
  colorPaletteOutline,
  shareOutline,
} from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-editor-toolbar',
  standalone: true,
  imports: [
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonBackButton,
    IonTitle,
    TranslateModule,
  ],
  template: `
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button defaultHref="/tabs/home" />
      </ion-buttons>
      <ion-title>{{ 'room.edit' | translate }}</ion-title>
      <ion-buttons slot="end">
        <ion-button (click)="preview.emit()" title="Preview">
          <ion-icon slot="icon-only" name="eye-outline" />
        </ion-button>
        <ion-button (click)="openThemes.emit()" title="Themes">
          <ion-icon slot="icon-only" name="color-palette-outline" />
        </ion-button>
        <ion-button (click)="share.emit()" title="Share">
          <ion-icon slot="icon-only" name="share-outline" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  `,
})
export class EditorToolbarComponent {
  preview = output<void>();
  openThemes = output<void>();
  share = output<void>();

  constructor() {
    addIcons({ eyeOutline, colorPaletteOutline, shareOutline });
  }
}
