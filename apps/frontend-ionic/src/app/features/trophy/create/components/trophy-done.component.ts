import { Component, input, output } from "@angular/core";
import { IonButton, IonIcon, IonSpinner } from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { trophyOutline } from "ionicons/icons";

@Component({
  selector: "app-trophy-done",
  standalone: true,
  imports: [TranslateModule, IonButton, IonIcon, IonSpinner],
  template: `
    <div class="done-section animate-scale-in">
      <ion-button expand="block" (click)="done.emit()" [disabled]="saving()">
        @if (saving()) {
          <ion-spinner slot="start" name="crescent" />
        } @else {
          <ion-icon slot="start" name="trophy-outline" />
        }
        {{ "review.addMyTrophy" | translate }}
      </ion-button>
    </div>
  `,
  styles: `
    .done-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 0 0;
      gap: 16px;

      ion-button {
        width: 100%;
      }
    }
  `,
})
export class TrophyDoneComponent {
  saving = input(false);
  done = output<void>();

  constructor() {
    addIcons({ trophyOutline });
  }
}
