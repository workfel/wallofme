import { Component, computed, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trashOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons';

export interface WallPlacementValues {
  positionX: number;
  positionY: number;
  positionZ: number;
}

@Component({
  selector: 'app-wall-placement-panel',
  standalone: true,
  imports: [DecimalPipe, IonButton, IonIcon, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wall-panel">
      <!-- Header with name + delete -->
      <div class="panel-header">
        <span class="panel-title">{{ name() || ('room.wallPlacement' | translate) }}</span>
        <ion-button fill="clear" color="danger" size="small" (click)="delete.emit()">
          <ion-icon slot="icon-only" name="trash-outline" />
        </ion-button>
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
  name = input<string | null>(null);

  changed = output<WallPlacementValues>();
  delete = output<void>();

  horizontalValue = computed(() => {
    return this.wall() === 'left' ? this.positionZ() : this.positionX();
  });

  constructor() {
    addIcons({ trashOutline, chevronUpOutline, chevronDownOutline });
  }

  stepHorizontal(delta: number): void {
    if (this.wall() === 'left') {
      const v = Math.round((this.positionZ() + delta) * 10) / 10;
      const clamped = Math.max(-2.7, Math.min(2.7, v));
      this.emitChange({ positionZ: clamped });
    } else {
      const v = Math.round((this.positionX() + delta) * 10) / 10;
      const clamped = Math.max(-2.7, Math.min(2.7, v));
      this.emitChange({ positionX: clamped });
    }
  }

  stepHeight(delta: number): void {
    const v = Math.round((this.positionY() + delta) * 10) / 10;
    const clamped = Math.max(0.3, Math.min(2.7, v));
    this.emitChange({ positionY: clamped });
  }

  private emitChange(partial: Partial<WallPlacementValues>): void {
    this.changed.emit({
      positionX: partial.positionX ?? this.positionX(),
      positionY: partial.positionY ?? this.positionY(),
      positionZ: partial.positionZ ?? this.positionZ(),
    });
  }
}
