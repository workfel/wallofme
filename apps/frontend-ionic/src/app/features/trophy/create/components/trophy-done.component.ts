import { Component, output } from "@angular/core";
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { checkmarkCircle, trophyOutline } from "ionicons/icons";

@Component({
  selector: "app-trophy-done",
  standalone: true,
  imports: [TranslateModule, IonButton, IonIcon],
  template: `
    <div class="done-section animate-scale-in">
      <ion-icon name="checkmark-circle" class="done-icon" color="success" />
      <h2>{{ "review.done" | translate }}</h2>

      <ion-button expand="block" (click)="done.emit()">
        <ion-icon slot="start" name="trophy-outline" />
        {{ "review.finish" | translate }}
      </ion-button>
    </div>
  `,
  styles: `
    .done-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 24px;
      gap: 16px;
      border-radius: 24px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.55);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);

      .done-icon {
        font-size: 64px;
        filter: drop-shadow(0 4px 12px rgba(var(--ion-color-success-rgb), 0.4));
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
  done = output<void>();

  constructor() {
    addIcons({ checkmarkCircle, trophyOutline });
  }
}
