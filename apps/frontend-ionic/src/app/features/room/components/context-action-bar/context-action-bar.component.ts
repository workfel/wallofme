import { Component, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  refreshOutline,
  moveOutline,
} from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-context-action-bar',
  standalone: true,
  imports: [IonButton, IonIcon, TranslateModule],
  template: `
    <div class="context-bar">
      <ion-button fill="clear" color="danger" (click)="delete.emit()">
        <ion-icon slot="start" name="trash-outline" />
        {{ 'room.delete' | translate }}
      </ion-button>
      <ion-button fill="clear" (click)="rotate.emit()">
        <ion-icon slot="start" name="refresh-outline" />
        {{ 'room.rotate' | translate }}
      </ion-button>
      <ion-button fill="clear" (click)="move.emit()">
        <ion-icon slot="start" name="move-outline" />
        {{ 'room.move' | translate }}
      </ion-button>
    </div>
  `,
  styles: `
    .context-bar {
      display: flex;
      justify-content: center;
      gap: 4px;
      padding: 8px 16px;
      margin: 0 16px 16px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border-radius: 20px;
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.10),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);

      ion-button {
        --padding-start: 12px;
        --padding-end: 12px;
        font-size: 13px;
        font-weight: 600;
      }
    }
  `,
})
export class ContextActionBarComponent {
  delete = output<void>();
  rotate = output<void>();
  move = output<void>();

  constructor() {
    addIcons({ trashOutline, refreshOutline, moveOutline });
  }
}
