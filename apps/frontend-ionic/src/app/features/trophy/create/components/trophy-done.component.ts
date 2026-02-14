import { Component, output } from '@angular/core';
import {
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle, trophyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-trophy-done',
  standalone: true,
  imports: [
    TranslateModule,
    IonButton,
    IonIcon,
  ],
  template: `
    <div class="done-section animate-scale-in">
      <ion-icon
        name="checkmark-circle"
        class="done-icon"
        color="success"
      />
      <h2>{{ 'review.done' | translate }}</h2>

      <ion-button expand="block" (click)="finish.emit()">
        <ion-icon slot="start" name="trophy-outline" />
        {{ 'review.finish' | translate }}
      </ion-button>
    </div>
  `,
  styles: `
    .done-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 0;
      gap: 16px;

      .done-icon {
        font-size: 64px;
      }

      h2 {
        font-size: 24px;
        font-weight: 800;
        margin: 0;
      }

      ion-button {
        width: 100%;
        margin-top: 16px;
      }
    }
  `,
})
export class TrophyDoneComponent {
  finish = output<void>();

  constructor() {
    addIcons({ checkmarkCircle, trophyOutline });
  }
}
