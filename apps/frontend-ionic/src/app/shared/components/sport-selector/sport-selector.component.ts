import { Component, input, output } from "@angular/core";
import { IonChip, IonLabel } from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";

import {
  USER_SPORTS,
  sportEmoji,
  type SportKey,
} from "@app/shared/data/sports";

@Component({
  selector: "app-sport-selector",
  standalone: true,
  imports: [IonChip, IonLabel, TranslateModule],
  template: `
    <div class="sport-chips">
      @for (sport of sports(); track sport) {
      <ion-chip
        [color]="isSelected(sport) ? 'primary' : 'medium'"
        [outline]="!isSelected(sport)"
        (click)="toggle(sport)"
      >
        <ion-label>
          <!-- @if (showEmoji()) { {{ getEmoji(sport) }} } -->
          {{ "sports." + sport | translate }}
        </ion-label>
      </ion-chip>
      }
    </div>
  `,
  styles: `
    .sport-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class SportSelectorComponent {
  sports = input<readonly string[]>(USER_SPORTS);
  selected = input<string[]>([]);
  mode = input<"multi" | "single">("multi");
  showEmoji = input(true);

  selectionChange = output<string[]>();

  isSelected(sport: string): boolean {
    return this.selected().includes(sport);
  }

  getEmoji(sport: string): string {
    return sportEmoji(sport);
  }

  toggle(sport: string): void {
    const current = this.selected();
    if (this.mode() === "single") {
      this.selectionChange.emit(current.includes(sport) ? [] : [sport]);
      return;
    }
    if (current.includes(sport)) {
      this.selectionChange.emit(current.filter((s) => s !== sport));
    } else {
      this.selectionChange.emit([...current, sport]);
    }
  }
}
