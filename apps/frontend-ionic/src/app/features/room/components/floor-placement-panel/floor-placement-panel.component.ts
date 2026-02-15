import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonButton, IonIcon, IonRange } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trashOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons';

export interface FloorPlacementValues {
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  scale?: number;
}

@Component({
  selector: 'app-floor-placement-panel',
  standalone: true,
  imports: [DecimalPipe, IonButton, IonIcon, IonRange, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="floor-panel">
      <!-- Header with name + delete -->
      <div class="panel-header">
        <span class="panel-title">{{ name() || ('room.floorPlacement' | translate) }}</span>
        <ion-button fill="clear" color="danger" size="small" (click)="delete.emit()">
          <ion-icon slot="icon-only" name="trash-outline" />
        </ion-button>
      </div>

      <!-- Position row: X, Y, Z -->
      <div class="control-row">
        <span class="row-label">{{ 'room.position' | translate }}</span>
        <div class="stepper-group">
          <div class="stepper">
            <button class="stepper-btn" (click)="step('positionX', 0.5)">
              <ion-icon name="chevron-up-outline" />
            </button>
            <div class="stepper-value">
              <span class="axis">x</span>
              <span class="val">{{ positionX() | number:'1.1-1' }}</span>
            </div>
            <button class="stepper-btn" (click)="step('positionX', -0.5)">
              <ion-icon name="chevron-down-outline" />
            </button>
          </div>
          <div class="stepper">
            <button class="stepper-btn" (click)="step('positionY', 0.5)">
              <ion-icon name="chevron-up-outline" />
            </button>
            <div class="stepper-value">
              <span class="axis">y</span>
              <span class="val">{{ positionY() | number:'1.1-1' }}</span>
            </div>
            <button class="stepper-btn" (click)="step('positionY', -0.5)">
              <ion-icon name="chevron-down-outline" />
            </button>
          </div>
          <div class="stepper">
            <button class="stepper-btn" (click)="step('positionZ', 0.5)">
              <ion-icon name="chevron-up-outline" />
            </button>
            <div class="stepper-value">
              <span class="axis">z</span>
              <span class="val">{{ positionZ() | number:'1.1-1' }}</span>
            </div>
            <button class="stepper-btn" (click)="step('positionZ', -0.5)">
              <ion-icon name="chevron-down-outline" />
            </button>
          </div>
        </div>
      </div>

      <!-- Rotation row: Y -->
      <div class="control-row">
        <span class="row-label">{{ 'room.rotationAngle' | translate }}</span>
        <div class="stepper-group">
          <div class="stepper">
            <button class="stepper-btn" (click)="step('rotation', 15)">
              <ion-icon name="chevron-up-outline" />
            </button>
            <div class="stepper-value">
              <span class="axis">y</span>
              <span class="val">{{ rotationDegrees() }}</span>
            </div>
            <button class="stepper-btn" (click)="step('rotation', -15)">
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
          [max]="2"
          [step]="0.1"
          [value]="scale()"
          [pin]="true"
          [pinFormatter]="formatScale"
          (ionInput)="onScaleChange($event)"
        />
      </div>
    </div>
  `,
  styles: `
    .floor-panel {
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
  `,
})
export class FloorPlacementPanelComponent {
  positionX = input(0);
  positionY = input(0);
  positionZ = input(0);
  rotationDegrees = input(0);
  scale = input(0.5);
  name = input<string | null>(null);

  changed = output<FloorPlacementValues>();
  delete = output<void>();

  constructor() {
    addIcons({ trashOutline, chevronUpOutline, chevronDownOutline });
  }

  formatScale = (value: number) => value.toFixed(1);

  step(field: 'positionX' | 'positionY' | 'positionZ' | 'rotation', delta: number): void {
    if (field === 'positionX') {
      const v = Math.round((this.positionX() + delta) * 10) / 10;
      this.emitChange({ positionX: Math.max(-2.5, Math.min(2.5, v)) });
    } else if (field === 'positionY') {
      const v = Math.round((this.positionY() + delta) * 10) / 10;
      this.emitChange({ positionY: Math.max(0, Math.min(3, v)) });
    } else if (field === 'positionZ') {
      const v = Math.round((this.positionZ() + delta) * 10) / 10;
      this.emitChange({ positionZ: Math.max(-2.5, Math.min(2.5, v)) });
    } else if (field === 'rotation') {
      const newDeg = ((this.rotationDegrees() + delta) % 360 + 360) % 360;
      this.emitChange({ rotationY: (newDeg * Math.PI) / 180 });
    }
  }

  onScaleChange(event: CustomEvent): void {
    this.emitChange({ scale: event.detail.value });
  }

  private emitChange(partial: Partial<FloorPlacementValues>): void {
    this.changed.emit({
      positionX: partial.positionX ?? this.positionX(),
      positionY: partial.positionY ?? this.positionY(),
      positionZ: partial.positionZ ?? this.positionZ(),
      rotationY: partial.rotationY ?? (this.rotationDegrees() * Math.PI) / 180,
      scale: partial.scale ?? this.scale(),
    });
  }
}
