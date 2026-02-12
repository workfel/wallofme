import { Component, input, output } from '@angular/core';
import { IonRange, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';

export interface FloorPlacementValues {
  positionX: number;
  positionZ: number;
  rotationY: number;
}

@Component({
  selector: 'app-floor-placement-panel',
  standalone: true,
  imports: [IonRange, IonLabel, IonButton, IonIcon, TranslateModule],
  template: `
    <div class="floor-panel">
      <div class="panel-header">
        <span class="panel-title">{{ 'room.floorPlacement' | translate }}</span>
        <ion-button fill="clear" color="danger" size="small" (click)="delete.emit()">
          <ion-icon slot="icon-only" name="trash-outline" />
        </ion-button>
      </div>

      <div class="slider-row">
        <ion-label>{{ 'room.positionX' | translate }}</ion-label>
        <ion-range
          [min]="-2.5"
          [max]="2.5"
          [step]="0.1"
          [value]="positionX()"
          [pin]="true"
          [pinFormatter]="formatPosition"
          (ionInput)="onPositionXChange($event)"
        />
      </div>

      <div class="slider-row">
        <ion-label>{{ 'room.positionZ' | translate }}</ion-label>
        <ion-range
          [min]="-2.5"
          [max]="2.5"
          [step]="0.1"
          [value]="positionZ()"
          [pin]="true"
          [pinFormatter]="formatPosition"
          (ionInput)="onPositionZChange($event)"
        />
      </div>

      <div class="slider-row">
        <ion-label>{{ 'room.rotationAngle' | translate }}</ion-label>
        <ion-range
          [min]="0"
          [max]="360"
          [step]="5"
          [value]="rotationDegrees()"
          [pin]="true"
          [pinFormatter]="formatDegrees"
          (ionInput)="onRotationChange($event)"
        />
      </div>
    </div>
  `,
  styles: `
    .floor-panel {
      padding: 8px 16px 12px;
      background: var(--ion-background-color, #fff);
      border-top: 1px solid var(--ion-color-step-100);
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 8px;

      ion-label {
        min-width: 80px;
        font-size: 12px;
        color: var(--ion-color-medium);
      }

      ion-range {
        flex: 1;
        --bar-height: 3px;
        --knob-size: 18px;
        padding: 4px 0;
      }
    }
  `,
})
export class FloorPlacementPanelComponent {
  positionX = input(0);
  positionZ = input(0);
  rotationDegrees = input(0);

  changed = output<FloorPlacementValues>();
  delete = output<void>();

  constructor() {
    addIcons({ trashOutline });
  }

  formatPosition = (value: number) => value.toFixed(1);
  formatDegrees = (value: number) => `${value}°`;

  onPositionXChange(event: CustomEvent): void {
    this.emitChange({ positionX: event.detail.value });
  }

  onPositionZChange(event: CustomEvent): void {
    this.emitChange({ positionZ: event.detail.value });
  }

  onRotationChange(event: CustomEvent): void {
    this.emitChange({ rotationY: (event.detail.value * Math.PI) / 180 });
  }

  private emitChange(partial: Partial<FloorPlacementValues>): void {
    this.changed.emit({
      positionX: partial.positionX ?? this.positionX(),
      positionZ: partial.positionZ ?? this.positionZ(),
      rotationY: partial.rotationY ?? (this.rotationDegrees() * Math.PI) / 180,
    });
  }
}
