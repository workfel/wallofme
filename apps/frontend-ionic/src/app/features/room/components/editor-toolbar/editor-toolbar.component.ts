import { Component, output } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackOutline, colorPaletteOutline } from "ionicons/icons";
import { NavController } from "@ionic/angular/standalone";
import { inject } from "@angular/core";

@Component({
  selector: "app-editor-toolbar",
  standalone: true,
  imports: [IonIcon],
  template: `
    <div class="floating-toolbar">
      <button class="toolbar-pill" (click)="goBack()">
        <ion-icon name="arrow-back-outline" />
      </button>

      <button class="toolbar-pill" (click)="openThemes.emit()">
        <ion-icon name="color-palette-outline" />
      </button>
    </div>
  `,
  styles: `
    .floating-toolbar {
      position: absolute;
      top: calc(var(--ion-safe-area-top, 0px) + 8px);
      left: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 100;
      pointer-events: none;
    }

    .toolbar-pill {
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 100px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.10),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-family: inherit;
      transition: transform 0.18s ease, box-shadow 0.18s ease;

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 20px;
        color: var(--ion-text-color);
      }
    }
  `,
})
export class EditorToolbarComponent {
  private navCtrl = inject(NavController);

  openThemes = output<void>();

  constructor() {
    addIcons({ arrowBackOutline, colorPaletteOutline });
  }

  goBack(): void {
    this.navCtrl.back();
  }
}
