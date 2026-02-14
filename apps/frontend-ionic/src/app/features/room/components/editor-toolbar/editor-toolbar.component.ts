import { Component, input, output } from "@angular/core";
import {
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonBackButton,
  IonTitle,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  eyeOutline,
  colorPaletteOutline,
  shareOutline,
  heartOutline,
} from "ionicons/icons";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-editor-toolbar",
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
      <ion-title>{{ "room.edit" | translate }}</ion-title>
      <ion-buttons slot="end">
        @if (viewCount() > 0 || likeCount() > 0) {
          <div class="stats-badges">
            @if (viewCount() > 0) {
              <span class="stat-badge">
                <ion-icon name="eye-outline" />
                {{ viewCount() }}
              </span>
            }
            @if (likeCount() > 0) {
              <span class="stat-badge">
                <ion-icon name="heart-outline" />
                {{ likeCount() }}
              </span>
            }
          </div>
        }
        <ion-button (click)="openThemes.emit()" title="Themes">
          <ion-icon slot="icon-only" name="color-palette-outline" />
        </ion-button>
        <ion-button (click)="share.emit()" title="Share">
          <ion-icon slot="icon-only" name="share-outline" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  `,
  styles: `
    .stats-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 4px;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 14px;
      }
    }
  `,
})
export class EditorToolbarComponent {
  viewCount = input(0);
  likeCount = input(0);

  openThemes = output<void>();
  share = output<void>();

  constructor() {
    addIcons({ eyeOutline, colorPaletteOutline, shareOutline, heartOutline });
  }
}
