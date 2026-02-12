import { Component, input, output } from '@angular/core';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flameOutline, addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-token-balance',
  standalone: true,
  imports: [IonChip, IonIcon, IonLabel],
  template: `
    <ion-chip (click)="getTokens.emit()" [outline]="true">
      <ion-icon name="flame-outline" color="warning" />
      <ion-label>{{ balance() }}</ion-label>
      @if (showAdd()) {
        <ion-icon name="add-outline" />
      }
    </ion-chip>
  `,
  styles: `
    ion-chip {
      --background: var(--ion-color-step-50);
      font-weight: 600;
      cursor: pointer;
    }
  `,
})
export class TokenBalanceComponent {
  balance = input(0);
  showAdd = input(true);
  getTokens = output<void>();

  constructor() {
    addIcons({ flameOutline, addOutline });
  }
}
