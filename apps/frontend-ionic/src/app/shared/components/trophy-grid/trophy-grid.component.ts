import { Component, input, output } from "@angular/core";
import { IonIcon, IonSpinner, IonText } from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import { ribbonOutline, documentTextOutline } from "ionicons/icons";

export interface TrophyGridItem {
  id: string;
  type: string;
  thumbnailUrl: string | null;
  status?: string;
}

@Component({
  selector: "app-trophy-grid",
  standalone: true,
  imports: [TranslateModule, IonIcon, IonSpinner, IonText],
  template: `
    @if (loading()) {
      <div class="grid-loading">
        <ion-spinner name="crescent" />
      </div>
    } @else if (trophies().length === 0) {
      <div class="empty-state">
        <ion-icon name="ribbon-outline" class="empty-icon" />
        <ion-text color="medium">
          <p>{{ emptyMessage() | translate }}</p>
        </ion-text>
      </div>
    } @else {
      <div class="trophy-grid">
        @for (t of trophies(); track t.id) {
          <div
            class="trophy-cell"
            [class.clickable]="clickable()"
            (click)="clickable() && trophyClick.emit(t.id)"
          >
            @if (t.thumbnailUrl) {
              <img
                [src]="t.thumbnailUrl"
                [alt]="t.type"
                class="trophy-img"
                loading="lazy"
              />
            } @else {
              <div class="trophy-fallback">
                <ion-icon
                  [name]="
                    t.type === 'medal'
                      ? 'ribbon-outline'
                      : 'document-text-outline'
                  "
                />
              </div>
            }
            @if (t.status === "processing" || t.status === "pending") {
              <div class="trophy-processing-overlay">
                <ion-spinner name="crescent" color="light" />
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: `
    .trophy-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 0 16px 32px;
    }

    .trophy-cell {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 16px;
      background: var(--wom-glass-bg-subtle);
      border: 1px solid var(--wom-glass-border-strong);
    }

    .trophy-cell.clickable {
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

      &:active {
        transform: scale(0.96);
        background: var(--wom-glass-bg-medium);
      }
    }

    .trophy-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .trophy-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--wom-glass-bg-wash);

      ion-icon {
        font-size: 32px;
        color: rgba(var(--ion-color-primary-rgb), 0.5);
      }
    }

    .trophy-processing-overlay {
      position: absolute;
      inset: 0;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .grid-loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 24px;
      text-align: center;

      .empty-icon {
        font-size: 48px;
        color: rgba(var(--ion-color-medium-rgb), 0.5);
        margin-bottom: 12px;
      }

      p {
        margin: 0;
        font-size: 15px;
        color: var(--ion-color-medium);
        font-weight: 500;
      }
    }
  `,
})
export class TrophyGridComponent {
  trophies = input.required<TrophyGridItem[]>();
  loading = input(false);
  clickable = input(true);
  emptyMessage = input("profile.noTrophies");

  trophyClick = output<string>();

  constructor() {
    addIcons({ ribbonOutline, documentTextOutline });
  }
}
