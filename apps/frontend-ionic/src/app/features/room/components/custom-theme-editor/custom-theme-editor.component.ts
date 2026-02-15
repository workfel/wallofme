import {
  Component,
  ViewChild,
  ElementRef,
  input,
  output,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, eyedropOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import type { CustomThemeColors } from '@app/types/room-theme';

type SurfaceKey = keyof CustomThemeColors;

const DEFAULT_CUSTOM_COLORS: CustomThemeColors = {
  leftWallColor: '#faedcd',
  backWallColor: '#fefae0',
  floorColor: '#c9a87c',
  background: '#f5f0e8',
};

const WALL_PALETTE = [
  // Warm neutrals
  '#fefae0', '#faedcd', '#f5e6d3', '#e8d5b7', '#f0e6d2',
  '#fdf6ec', '#f8f0e3', '#ede0d0', '#dfd3c3', '#d5c4a1',
  // Cool neutrals
  '#e8e2d8', '#ddd6ca', '#d8cfc2', '#e0dcd5', '#eae6e1',
  '#f0eded', '#e5e1e8', '#d8dce5', '#cdd5de', '#c8d0d8',
  // Grays & darks
  '#b0b0b0', '#8a8a8a', '#6b6b6b', '#4a4a4a', '#2d2d2d',
  // Accent colors
  '#c9b99a', '#a08060', '#b5c4b1', '#8fa5a0', '#a09cb0',
];

const FLOOR_PALETTE = [
  // Wood tones
  '#c9a87c', '#b8956a', '#a67c52', '#8b6914', '#6b4c3b',
  '#d4b896', '#c4a882', '#a08060', '#8b7355', '#745840',
  // Stones & concrete
  '#d8cfc2', '#c5beb2', '#b0a898', '#9a9080', '#807870',
  '#e0dcd5', '#ccc5b8', '#b8b0a0', '#a09890', '#8a8078',
  // Darks & accents
  '#3d3d3d', '#2a2a2a', '#1e1e28', '#14142a', '#0a0a14',
  '#556b5a', '#4a6060', '#5a4a60', '#604a4a', '#4a5060',
];

const BACKGROUND_PALETTE = [
  // Light pastels
  '#f5f0e8', '#f0ece4', '#eae6de', '#f5f2ed', '#faf8f5',
  '#e8ecf0', '#edf0f5', '#f0f2f5', '#f5f0f5', '#f5f0ed',
  // Mid-tones
  '#dce4ec', '#d0d8e0', '#c8d0d8', '#e0d8d0', '#d8d0c8',
  '#c5ccd5', '#b8c0c8', '#ccc0b5', '#c0b8b0', '#b5b0a8',
  // Darks & deep
  '#2a2a3a', '#1a1a2e', '#08081a', '#1e1e28', '#14142a',
  '#3a2a2a', '#2e1a2a', '#1a2a1e',
];

const SURFACE_CONFIG: Record<SurfaceKey, { labelKey: string; palette: string[] }> = {
  leftWallColor: { labelKey: 'room.leftWall', palette: WALL_PALETTE },
  backWallColor: { labelKey: 'room.backWall', palette: WALL_PALETTE },
  floorColor: { labelKey: 'room.floor', palette: FLOOR_PALETTE },
  background: { labelKey: 'room.background', palette: BACKGROUND_PALETTE },
};

const SURFACE_KEYS: SurfaceKey[] = ['leftWallColor', 'backWallColor', 'floorColor', 'background'];

@Component({
  selector: 'app-custom-theme-editor',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'room.customTheme' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onApply()" [strong]="true">
            <ion-icon name="checkmark-outline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- 1. Mini-Room Preview -->
      <div class="preview-card">
        <div class="mini-room-container" [style.background]="colors().background">
          <div
            class="surface wall-left"
            [class.active]="activeSurface() === 'leftWallColor'"
            [style.background]="colors().leftWallColor"
            (click)="selectSurface('leftWallColor')"
          ></div>
          <div
            class="surface wall-back"
            [class.active]="activeSurface() === 'backWallColor'"
            [style.background]="colors().backWallColor"
            (click)="selectSurface('backWallColor')"
          ></div>
          <div
            class="surface floor-area"
            [class.active]="activeSurface() === 'floorColor'"
            [style.background]="colors().floorColor"
            (click)="selectSurface('floorColor')"
          ></div>
          <div
            class="bg-tap-zone"
            (click)="selectSurface('background')"
          ></div>
          @if (activeSurface() === 'background') {
            <div class="bg-active-indicator"></div>
          }
        </div>
      </div>

      <!-- 2. Surface Selector Pills -->
      <div class="surface-pills">
        @for (key of surfaceKeys; track key) {
          <button
            class="surface-pill"
            [class.selected]="activeSurface() === key"
            (click)="selectSurface(key)"
          >
            <span class="pill-swatch" [style.background]="colors()[key]"></span>
            <span class="pill-label">{{ surfaceConfig[key].labelKey | translate }}</span>
          </button>
        }
      </div>

      <!-- 3. Color Palette Grid -->
      <div class="palette-grid">
        <!-- Custom color swatch (first) -->
        <button class="color-swatch custom-swatch" (click)="openCustomPicker()">
          <ion-icon name="eyedrop-outline" />
          <span class="custom-label">{{ 'room.customHex' | translate }}</span>
        </button>
        @for (color of activePalette(); track color) {
          <button
            class="color-swatch"
            [class.selected]="colors()[activeSurface()] === color"
            [style.background]="color"
            (click)="pickColor(color)"
          ></button>
        }
      </div>

      <!-- Hidden native color picker -->
      <input
        #nativePicker
        type="color"
        class="native-picker"
        [value]="colors()[activeSurface()]"
        (input)="onNativeColorInput($event)"
      />
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    /* 1. Mini-Room Preview */
    .preview-card {
      background: var(--ion-card-background, var(--ion-background-color));
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      padding: 12px;
      margin-bottom: 16px;
    }

    .mini-room-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 10;
      border-radius: 10px;
      overflow: hidden;
      transition: background-color 0.2s;
    }

    .bg-tap-zone {
      position: absolute;
      inset: 0;
      z-index: 0;
      cursor: pointer;
    }

    .bg-active-indicator {
      position: absolute;
      inset: 0;
      border-radius: 10px;
      border: 2px solid var(--ion-color-primary);
      box-shadow: inset 0 0 12px rgba(var(--ion-color-primary-rgb), 0.15);
      pointer-events: none;
      z-index: 3;
    }

    .surface {
      position: absolute;
      z-index: 1;
      cursor: pointer;
      border-radius: 2px;
      outline: 2px solid transparent;
      outline-offset: -2px;
      transition: outline-color 0.2s, box-shadow 0.2s, background-color 0.2s;

      &.active {
        outline-color: var(--ion-color-primary);
        box-shadow: 0 0 8px rgba(var(--ion-color-primary-rgb), 0.3);
        z-index: 2;
      }
    }

    .wall-left {
      left: 10%;
      top: 15%;
      bottom: 30%;
      width: 28%;
    }

    .wall-back {
      left: 35%;
      top: 15%;
      right: 10%;
      height: 52%;
    }

    .floor-area {
      bottom: 8%;
      left: 10%;
      right: 10%;
      height: 28%;
    }

    /* 2. Surface Selector Pills */
    .surface-pills {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 16px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .surface-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 32px;
      border: 2px solid var(--ion-color-light-shade, #d7d8da);
      background: var(--ion-card-background, var(--ion-background-color));
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: border-color 0.2s, background-color 0.2s;

      &.selected {
        border-color: var(--ion-color-primary);
        background: rgba(var(--ion-color-primary-rgb), 0.06);
      }

      &:active {
        transform: scale(0.97);
      }
    }

    .pill-swatch {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.15);
      flex-shrink: 0;
    }

    .pill-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--ion-text-color);
    }

    /* 3. Color Palette Grid */
    .palette-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      padding-bottom: 24px;
    }

    .color-swatch {
      aspect-ratio: 1;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
      transition: transform 0.15s, border-color 0.2s, box-shadow 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      &.selected {
        border-color: var(--ion-color-primary);
        transform: scale(1.08);
        box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.25);
      }

      &:active {
        transform: scale(0.92);
      }
    }

    .custom-swatch {
      background: var(--ion-card-background, var(--ion-background-color)) !important;
      border: 2px dashed var(--ion-color-medium);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;

      ion-icon {
        font-size: 16px;
        color: var(--ion-color-medium);
      }
    }

    .custom-label {
      font-size: 8px;
      font-weight: 600;
      color: var(--ion-color-medium);
      line-height: 1;
    }

    /* Hidden native picker */
    .native-picker {
      position: fixed;
      top: -9999px;
      left: -9999px;
      opacity: 0;
      pointer-events: none;
      width: 0;
      height: 0;
      visibility: hidden;
    }
  `,
})
export class CustomThemeEditorComponent implements OnInit {
  @ViewChild('nativePicker') nativePickerRef!: ElementRef<HTMLInputElement>;

  initialColors = input<CustomThemeColors | null>();

  preview = output<CustomThemeColors>();
  apply = output<CustomThemeColors>();

  colors = signal<CustomThemeColors>(DEFAULT_CUSTOM_COLORS);
  activeSurface = signal<SurfaceKey>('leftWallColor');

  surfaceKeys = SURFACE_KEYS;
  surfaceConfig = SURFACE_CONFIG;

  activePalette = computed(() => SURFACE_CONFIG[this.activeSurface()].palette);

  constructor() {
    addIcons({ checkmarkOutline, eyedropOutline });
  }

  ngOnInit(): void {
    const init = this.initialColors();
    if (init) {
      this.colors.set({ ...init });
    }
  }

  selectSurface(key: SurfaceKey): void {
    this.activeSurface.set(key);
    this.hapticLight();
  }

  pickColor(color: string): void {
    this.updateColor(this.activeSurface(), color);
    this.hapticLight();
  }

  openCustomPicker(): void {
    this.nativePickerRef.nativeElement.click();
  }

  onNativeColorInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateColor(this.activeSurface(), value);
  }

  onApply(): void {
    this.apply.emit(this.colors());
  }

  private updateColor(key: SurfaceKey, value: string): void {
    this.colors.update((c) => ({ ...c, [key]: value }));
    this.preview.emit(this.colors());
  }

  private async hapticLight(): Promise<void> {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available
    }
  }
}
