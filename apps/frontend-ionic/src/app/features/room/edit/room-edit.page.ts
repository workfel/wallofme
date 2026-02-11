import { Component, inject, signal, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonText,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonIcon,
  IonBadge,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NgtCanvas } from 'angular-three/dom';
import { addIcons } from 'ionicons';
import { trashOutline, addCircleOutline, swapHorizontalOutline } from 'ionicons/icons';

import { RoomService, type RoomItem } from '@app/core/services/room.service';
import { TrophyService, type Trophy } from '@app/core/services/trophy.service';
import { PainCaveSceneComponent } from '../components/pain-cave-scene/pain-cave-scene.component';

@Component({
  selector: 'app-room-edit',
  standalone: true,
  imports: [
    TranslateModule,
    NgtCanvas,
    PainCaveSceneComponent,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonText,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonIcon,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" />
        </ion-buttons>
        <ion-title>{{ 'room.edit' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (roomService.loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else {
        <div class="edit-layout">
          <!-- 3D Canvas (55%) -->
          <div class="canvas-section">
            <ngt-canvas
              [shadows]="true"
              [camera]="{ position: [5, 5, 5], fov: 45 }"
            >
              <app-pain-cave-scene
                *canvasContent
                [items]="roomService.room()?.items ?? []"
                [editable]="true"
                (itemPressed)="onItemPressed($event)"
              />
            </ngt-canvas>
          </div>

          <!-- Edit Panel (45%) -->
          <div class="panel-section">
            <!-- Selected item actions -->
            @if (selectedItemId()) {
              <div class="selected-actions animate-fade-in">
                <ion-button
                  expand="block"
                  fill="outline"
                  color="danger"
                  (click)="removeItem()"
                >
                  <ion-icon slot="start" name="trash-outline" />
                  {{ 'room.removeTrophy' | translate }}
                </ion-button>
                <ion-button
                  expand="block"
                  fill="outline"
                  (click)="moveItem()"
                >
                  <ion-icon slot="start" name="swap-horizontal-outline" />
                  {{ 'room.moveTo' | translate }}
                </ion-button>
              </div>
            }

            <!-- Unplaced trophies -->
            <h4>{{ 'room.available' | translate }}</h4>
            @if (availableTrophies().length === 0) {
              <ion-text color="medium">
                <p class="empty-hint">{{ 'room.noTrophies' | translate }}</p>
              </ion-text>
            }
            <ion-list lines="inset">
              @for (trophy of availableTrophies(); track trophy.id) {
                <ion-item>
                  <ion-thumbnail slot="start">
                    @if (trophy.thumbnailUrl) {
                      <img [src]="trophy.thumbnailUrl" [alt]="trophy.type" />
                    }
                  </ion-thumbnail>
                  <ion-label>
                    {{ trophy.type === 'medal' ? ('trophies.medal' | translate) : ('trophies.bib' | translate) }}
                  </ion-label>
                  <ion-button
                    slot="end"
                    fill="clear"
                    (click)="addToRoom(trophy.id)"
                  >
                    <ion-icon slot="icon-only" name="add-circle-outline" />
                  </ion-button>
                </ion-item>
              }
            </ion-list>
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: `
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .edit-layout {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .canvas-section {
      flex: 0 0 55%;
      min-height: 0;

      ngt-canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    }

    .panel-section {
      flex: 0 0 45%;
      overflow-y: auto;
      padding: 16px;
      border-top: 1px solid var(--ion-color-step-200);

      h4 {
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--ion-color-step-500);
        margin: 16px 0 8px;
      }
    }

    .selected-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      ion-button {
        flex: 1;
      }
    }

    .empty-hint {
      font-size: 13px;
      text-align: center;
      margin: 24px 0;
    }

    ion-thumbnail {
      --border-radius: 8px;
      width: 48px;
      height: 48px;
    }
  `,
})
export class RoomEditPage implements OnInit {
  roomService = inject(RoomService);
  private trophyService = inject(TrophyService);
  private router = inject(Router);

  selectedItemId = signal<string | null>(null);

  constructor() {
    addIcons({ trashOutline, addCircleOutline, swapHorizontalOutline });
  }

  ngOnInit(): void {
    this.roomService.fetchMyRoom();
    this.trophyService.fetchTrophies();
  }

  /**
   * Trophies not already placed in the room
   */
  availableTrophies(): Trophy[] {
    const placedTrophyIds = new Set(
      (this.roomService.room()?.items ?? [])
        .filter((i) => i.trophyId)
        .map((i) => i.trophyId)
    );
    return this.trophyService
      .trophies()
      .filter(
        (t) =>
          t.status === 'ready' &&
          t.textureUrl &&
          !placedTrophyIds.has(t.id)
      );
  }

  onItemPressed(itemId: string): void {
    this.selectedItemId.set(
      this.selectedItemId() === itemId ? null : itemId
    );
  }

  async addToRoom(trophyId: string): Promise<void> {
    await this.roomService.addItemToRoom(trophyId);
  }

  async removeItem(): Promise<void> {
    const id = this.selectedItemId();
    if (!id) return;
    await this.roomService.removeItem(id);
    this.selectedItemId.set(null);
  }

  async moveItem(): Promise<void> {
    const id = this.selectedItemId();
    if (!id) return;

    // Move to next available slot
    const slot = this.roomService.getNextSlot();
    if (!slot) return;

    await this.roomService.updateItem(id, {
      positionX: slot.positionX,
      positionY: slot.positionY,
      positionZ: slot.positionZ,
      wall: slot.wall,
    });
    this.selectedItemId.set(null);
  }
}
