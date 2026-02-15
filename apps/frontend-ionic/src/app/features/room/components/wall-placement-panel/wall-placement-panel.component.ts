import { Component, computed, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonButton, IonIcon, IonRange, IonToggle } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trashOutline, chevronUpOutline, chevronDownOutline, swapHorizontalOutline } from 'ionicons/icons';

export interface WallPlacementValues {
  positionX: number;
  positionY: number;
  positionZ: number;
  wall?: 'left' | 'right';
  scale?: number;
}

@Component({
  selector: 'app-wall-placement-panel',
  standalone: true,
  imports: [DecimalPipe, IonButton, IonIcon, IonRange, IonToggle, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wall-panel">
      <!-- Header with name + switch wall + free movement toggle + delete -->
      <div class="panel-header">
        <span class="panel-title">{{ name() || ('room.wallPlacement' | translate) }}</span>
        <div class="header-actions">
          <ion-button fill="clear" size="small" (click)="switchWall()">
            <ion-icon slot="icon-only" name="swap-horizontal-outline" />
          </ion-button>
          <div class="free-move-toggle">
            <span class="toggle-label">{{ 'room.freeMovement' | translate }}</span>
            <ion-toggle [checked]="freeMovement()" (ionChange)="onFreeMovementToggle($event)" size="small" />
          </div>
          <ion-button fill="clear" color="danger" size="small" (click)="delete.emit()">
            <ion-icon slot="icon-only" name="trash-outline" />
          </ion-button>
        </div>
      </div>

      <!-- Position row: Horizontal + Height -->
      <div class="control-row">
        <span class="row-label">{{ 'room.position' | translate }}</span>
        <div class="stepper-group">
          <div class="stepper">
            <button class="stepper-btn" (click)="stepHorizontal(0.3)">
              <ion-icon name="chevron-up-outline" />
            </button>
            <div class="stepper-value">
              <span class="axis">{{ wall() === 'left' ? 'z' : 'x' }}</span>
              <span class="val">{{ horizontalValue() | number:'1.1-1' }}</span>
            </div>
            <button class="stepper-btn" (click)="stepHorizontal(-0.3)">
              <ion-icon name="chevron-down-outline" />
            </button>
          </div>
          <div class="stepper">
            <button class="stepper-btn" (click)="stepHeight(0.3)">
              <ion-icon name="chevron-up-outline" />
            </button>
            <div class="stepper-value">
              <span class="axis">y</span>
              <span class="val">{{ positionY() | number:'1.1-1' }}</span>
            </div>
            <button class="stepper-btn" (click)="stepHeight(-0.3)">
              <ion-icon name="chevron-down-outline" />
            </button>
          </div>
        </div>
      </div>

      <!-- Scale row -->
      <div class="control-row scale-row">
        <span class="row-label">{{ 'room.scale' | translate }}</span>
        <div class="scale-value">{{ scale() | number:'1.1-1' }}</div>
        <ion-range
          class="scale-slider"
          [min]="0.1"
          [max]="4"
          [step]="0.1"
          [value]="scale()"
          [pin]="true"
          [pinFormatter]="formatScale"
          (ionInput)="onScaleChange($event)"
        />
      </div>

      <ng-content />

      <p class="drag-hint">{{ 'room.wallDragHint' | translate }}</p>
    </div>
  `,
  styles: `
    .wall-panel {
      padding: 10px 16px 16px;
      margin: 0 16px 16px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border-radius: 20px;
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.10),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .panel-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .free-move-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toggle-label {
      font-size: 12px;
      color: var(--ion-color-medium);
    }

    .free-move-toggle ion-toggle {
      --handle-width: 16px;
      --handle-height: 16px;
      --handle-spacing: 2px;
      height: 20px;
      width: 36px;
      min-width: 36px;
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .row-label {
      min-width: 72px;
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .stepper-group {
      display: flex;
      gap: 8px;
      flex: 1;
    }

    .stepper {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      border-radius: 10px;
      min-width: 64px;
      overflow: hidden;
      flex: 1;
    }

    .stepper-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 4px 0;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 14px;
      }

      &:active {
        background: rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.10);
      }
    }

    .stepper-value {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 2px 8px;

      .axis {
        font-size: 11px;
        font-weight: 500;
        color: var(--ion-color-medium);
      }

      .val {
        font-size: 15px;
        font-weight: 700;
        color: var(--ion-text-color);
        font-variant-numeric: tabular-nums;
      }
    }

    .scale-row {
      align-items: center;
    }

    .scale-value {
      font-size: 14px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      min-width: 32px;
      text-align: center;
      color: var(--ion-text-color);
    }

    .scale-slider {
      flex: 1;
      --bar-height: 4px;
      --knob-size: 20px;
      padding: 0;
    }

    .drag-hint {
      margin: 4px 0 0;
      font-size: 12px;
      color: var(--ion-color-medium);
      text-align: center;
    }
  `,
})
export class WallPlacementPanelComponent {
  wall = input<'left' | 'right'>('left');
  positionX = input(0);
  positionY = input(1.5);
  positionZ = input(0);
  scale = input(0.5);
  name = input<string | null>(null);
  freeMovement = input(false);

  changed = output<WallPlacementValues>();
  freeMovementChange = output<boolean>();
  delete = output<void>();

  horizontalValue = computed(() => {
    return this.wall() === 'left' ? this.positionZ() : this.positionX();
  });

  constructor() {
    addIcons({ trashOutline, chevronUpOutline, chevronDownOutline, swapHorizontalOutline });
  }

  formatScale = (value: number) => value.toFixed(1);

  onScaleChange(event: CustomEvent): void {
    this.emitChange({ scale: event.detail.value });
  }

  onFreeMovementToggle(event: CustomEvent): void {
    this.freeMovementChange.emit(event.detail.checked);
  }

  stepHorizontal(delta: number): void {
    const hLimit = this.freeMovement() ? 3 : 2.7;
    if (this.wall() === 'left') {
      const v = Math.round((this.positionZ() + delta) * 10) / 10;
      const clamped = Math.max(-hLimit, Math.min(hLimit, v));
      this.emitChange({ positionZ: clamped });
    } else {
      const v = Math.round((this.positionX() + delta) * 10) / 10;
      const clamped = Math.max(-hLimit, Math.min(hLimit, v));
      this.emitChange({ positionX: clamped });
    }
  }

  stepHeight(delta: number): void {
    const minY = this.freeMovement() ? 0 : 0.3;
    const maxY = this.freeMovement() ? 3 : 2.7;
    const v = Math.round((this.positionY() + delta) * 10) / 10;
    const clamped = Math.max(minY, Math.min(maxY, v));
    this.emitChange({ positionY: clamped });
  }

  switchWall(): void {
    const currentWall = this.wall();
    const newWall = currentWall === 'left' ? 'right' : 'left';

    // Transfer the horizontal coordinate to the other axis.
    // Left wall uses Z for horizontal, right wall uses X.
    const horizontalVal = currentWall === 'left' ? this.positionZ() : this.positionX();
    const y = this.positionY();

    if (newWall === 'left') {
      this.changed.emit({ positionX: 0, positionY: y, positionZ: horizontalVal, wall: newWall });
    } else {
      this.changed.emit({ positionX: horizontalVal, positionY: y, positionZ: 0, wall: newWall });
    }
  }

  private emitChange(partial: Partial<WallPlacementValues>): void {
    this.changed.emit({
      positionX: partial.positionX ?? this.positionX(),
      positionY: partial.positionY ?? this.positionY(),
      positionZ: partial.positionZ ?? this.positionZ(),
      scale: partial.scale ?? this.scale(),
    });
  }
}
