import { Component, input, output, signal, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import {
  FLOOR_MATERIALS,
  WALL_MATERIALS,
  BACKGROUND_OPTIONS,
  type MaterialOption,
  type BackgroundOption,
  type MaterialOverrides,
} from '@app/types/material-catalog';

type TabId = 'floors' | 'walls' | 'backgrounds';

@Component({
  selector: 'app-material-customizer-sheet',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="onCancel()">
            <ion-icon name="close-outline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ 'room.designer' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onSave()" [strong]="true">
            <ion-icon name="checkmark-outline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="activeTab()" (ionChange)="onTabChange($event)">
          <ion-segment-button value="floors">
            <ion-label>{{ 'room.floor' | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="walls">
            <ion-label>{{ 'room.walls' | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="backgrounds">
            <ion-label>{{ 'room.background' | translate }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="material-grid">
        <!-- None option -->
        <button
          class="material-item"
          [class.selected]="isNoneSelected()"
          (click)="selectNone()"
        >
          <div class="material-thumb none-thumb">
            <span class="none-label">--</span>
          </div>
          <span class="material-name">{{ 'materials.none' | translate }}</span>
        </button>

        @if (activeTab() === 'floors') {
          @for (mat of floorMaterials; track mat.id) {
            <button
              class="material-item"
              [class.selected]="localOverrides().floorMaterialId === mat.id"
              (click)="selectFloor(mat)"
            >
              <div
                class="material-thumb"
                [style.background-image]="'url(' + mat.thumbnail + ')'"
                [style.background-color]="mat.color"
              ></div>
              <span class="material-name">{{ mat.nameKey | translate }}</span>
            </button>
          }
        }

        @if (activeTab() === 'walls') {
          @for (mat of wallMaterials; track mat.id) {
            <button
              class="material-item"
              [class.selected]="localOverrides().wallMaterialId === mat.id"
              (click)="selectWall(mat)"
            >
              <div
                class="material-thumb"
                [style.background-image]="'url(' + mat.thumbnail + ')'"
                [style.background-color]="mat.color"
              ></div>
              <span class="material-name">{{ mat.nameKey | translate }}</span>
            </button>
          }
        }

        @if (activeTab() === 'backgrounds') {
          @for (bg of backgroundOptions; track bg.id) {
            <button
              class="material-item"
              [class.selected]="localOverrides().backgroundId === bg.id"
              (click)="selectBackground(bg)"
            >
              @if (bg.type === 'solid') {
                <div
                  class="material-thumb"
                  [style.background-color]="bg.color"
                ></div>
              } @else {
                <div
                  class="material-thumb env-thumb"
                >
                  <span class="env-label">HDR</span>
                </div>
              }
              <span class="material-name">{{ bg.nameKey | translate }}</span>
            </button>
          }
        }
      </div>
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .material-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .material-item {
      background: none;
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transition: border-color 0.2s, transform 0.15s;

      &.selected {
        border-color: var(--ion-color-primary);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }
    }

    .material-thumb {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.1);
    }

    .none-thumb {
      background: var(--ion-background-color, #fff);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.2);
    }

    .none-label {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-medium);
    }

    .env-thumb {
      background: linear-gradient(135deg, #4a90d9, #87ceeb, #ffd700);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .env-label {
      font-size: 10px;
      font-weight: 700;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .material-name {
      font-size: 10px;
      font-weight: 500;
      color: var(--ion-text-color);
      text-align: center;
      line-height: 1.2;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class MaterialCustomizerSheetComponent implements OnInit {
  initialOverrides = input<MaterialOverrides | null>(null);

  preview = output<MaterialOverrides>();
  save = output<MaterialOverrides>();
  cancel = output<void>();

  activeTab = signal<TabId>('floors');
  localOverrides = signal<MaterialOverrides>({});

  floorMaterials = FLOOR_MATERIALS;
  wallMaterials = WALL_MATERIALS;
  backgroundOptions = BACKGROUND_OPTIONS;

  constructor() {
    addIcons({ closeOutline, checkmarkOutline });
  }

  ngOnInit(): void {
    const initial = this.initialOverrides();
    if (initial) {
      this.localOverrides.set({ ...initial });
    }
  }

  onTabChange(event: CustomEvent): void {
    this.activeTab.set(event.detail.value as TabId);
  }

  isNoneSelected(): boolean {
    const tab = this.activeTab();
    const ov = this.localOverrides();
    if (tab === 'floors') return !ov.floorMaterialId;
    if (tab === 'walls') return !ov.wallMaterialId;
    return !ov.backgroundId;
  }

  selectNone(): void {
    const tab = this.activeTab();
    const current = this.localOverrides();
    let next: MaterialOverrides;
    if (tab === 'floors') {
      next = { ...current, floorMaterialId: undefined };
    } else if (tab === 'walls') {
      next = { ...current, wallMaterialId: undefined };
    } else {
      next = { ...current, backgroundId: undefined };
    }
    this.localOverrides.set(next);
    this.preview.emit(next);
    this.hapticLight();
  }

  selectFloor(mat: MaterialOption): void {
    const next = { ...this.localOverrides(), floorMaterialId: mat.id };
    this.localOverrides.set(next);
    this.preview.emit(next);
    this.hapticLight();
  }

  selectWall(mat: MaterialOption): void {
    const next = { ...this.localOverrides(), wallMaterialId: mat.id };
    this.localOverrides.set(next);
    this.preview.emit(next);
    this.hapticLight();
  }

  selectBackground(bg: BackgroundOption): void {
    const next = { ...this.localOverrides(), backgroundId: bg.id };
    this.localOverrides.set(next);
    this.preview.emit(next);
    this.hapticLight();
  }

  onSave(): void {
    this.save.emit(this.localOverrides());
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private async hapticLight(): Promise<void> {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      /* not available */
    }
  }
}
