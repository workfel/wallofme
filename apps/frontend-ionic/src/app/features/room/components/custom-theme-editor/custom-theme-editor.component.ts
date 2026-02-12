import { Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonInput,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import type { CustomThemeColors } from '@app/types/room-theme';

const DEFAULT_CUSTOM_COLORS: CustomThemeColors = {
  leftWallColor: '#faedcd',
  backWallColor: '#fefae0',
  floorColor: '#c9a87c',
  background: '#f5f0e8',
};

@Component({
  selector: 'app-custom-theme-editor',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonInput,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'room.customTheme' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onApply()" [strong]="true">
            {{ 'common.apply' | translate }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-accordion-group [multiple]="true" [value]="accordionValues">
        <!-- Left Wall -->
        <ion-accordion value="leftWall">
          <ion-item slot="header">
            <div class="swatch" [style.background]="colors().leftWallColor"></div>
            <ion-label>{{ 'room.leftWall' | translate }}</ion-label>
          </ion-item>
          <div slot="content" class="picker-row">
            <input
              type="color"
              class="color-picker"
              [value]="colors().leftWallColor"
              (input)="onColorInput('leftWallColor', $event)"
            />
            <ion-input
              [value]="colors().leftWallColor"
              (ionInput)="onHexInput('leftWallColor', $event)"
              maxlength="7"
              class="hex-input"
            />
          </div>
        </ion-accordion>

        <!-- Back Wall -->
        <ion-accordion value="backWall">
          <ion-item slot="header">
            <div class="swatch" [style.background]="colors().backWallColor"></div>
            <ion-label>{{ 'room.backWall' | translate }}</ion-label>
          </ion-item>
          <div slot="content" class="picker-row">
            <input
              type="color"
              class="color-picker"
              [value]="colors().backWallColor"
              (input)="onColorInput('backWallColor', $event)"
            />
            <ion-input
              [value]="colors().backWallColor"
              (ionInput)="onHexInput('backWallColor', $event)"
              maxlength="7"
              class="hex-input"
            />
          </div>
        </ion-accordion>

        <!-- Floor -->
        <ion-accordion value="floor">
          <ion-item slot="header">
            <div class="swatch" [style.background]="colors().floorColor"></div>
            <ion-label>{{ 'room.floor' | translate }}</ion-label>
          </ion-item>
          <div slot="content" class="picker-row">
            <input
              type="color"
              class="color-picker"
              [value]="colors().floorColor"
              (input)="onColorInput('floorColor', $event)"
            />
            <ion-input
              [value]="colors().floorColor"
              (ionInput)="onHexInput('floorColor', $event)"
              maxlength="7"
              class="hex-input"
            />
          </div>
        </ion-accordion>

        <!-- Background -->
        <ion-accordion value="background">
          <ion-item slot="header">
            <div class="swatch" [style.background]="colors().background"></div>
            <ion-label>{{ 'room.background' | translate }}</ion-label>
          </ion-item>
          <div slot="content" class="picker-row">
            <input
              type="color"
              class="color-picker"
              [value]="colors().background"
              (input)="onColorInput('background', $event)"
            />
            <ion-input
              [value]="colors().background"
              (ionInput)="onHexInput('background', $event)"
              maxlength="7"
              class="hex-input"
            />
          </div>
        </ion-accordion>
      </ion-accordion-group>
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .swatch {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid var(--ion-color-medium);
      margin-right: 12px;
      flex-shrink: 0;
    }

    .picker-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }

    .color-picker {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      padding: 0;
      background: none;
      flex-shrink: 0;

      &::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      &::-webkit-color-swatch {
        border: 2px solid var(--ion-color-medium);
        border-radius: 10px;
      }
    }

    .hex-input {
      flex: 1;
      --padding-start: 8px;
      font-family: monospace;
    }
  `,
})
export class CustomThemeEditorComponent implements OnInit {
  initialColors = input<CustomThemeColors | null>();

  preview = output<CustomThemeColors>();
  apply = output<CustomThemeColors>();

  colors = signal<CustomThemeColors>(DEFAULT_CUSTOM_COLORS);
  accordionValues = ['leftWall', 'backWall', 'floor', 'background'];

  private hexRegex = /^#[0-9a-fA-F]{6}$/;

  ngOnInit(): void {
    const init = this.initialColors();
    if (init) {
      this.colors.set({ ...init });
    }
  }

  onColorInput(key: keyof CustomThemeColors, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateColor(key, value);
  }

  onHexInput(key: keyof CustomThemeColors, event: CustomEvent): void {
    const value = (event.detail.value ?? '') as string;
    if (this.hexRegex.test(value)) {
      this.updateColor(key, value);
    }
  }

  onApply(): void {
    this.apply.emit(this.colors());
  }

  private updateColor(key: keyof CustomThemeColors, value: string): void {
    this.colors.update((c) => ({ ...c, [key]: value }));
    this.preview.emit(this.colors());
  }
}
