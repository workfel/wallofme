import { Component, inject, signal, computed, OnInit, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonText,
  IonModal,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NgtCanvas } from 'angular-three/dom';

import { ApiService } from '@app/core/services/api.service';
import { PainCaveSceneComponent, type RoomItem3D } from '../components/pain-cave-scene/pain-cave-scene.component';
import { TrophyInfoSheetComponent, type TrophyInfoData } from '../components/trophy-info-sheet/trophy-info-sheet.component';

interface RoomData {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: RoomItem3D[];
}

@Component({
  selector: 'app-room-view',
  standalone: true,
  imports: [
    TranslateModule,
    NgtCanvas,
    PainCaveSceneComponent,
    TrophyInfoSheetComponent,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonText,
    IonModal,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" />
        </ion-buttons>
        <ion-title>{{ 'home.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (room()) {
        <div class="canvas-container animate-fade-in">
          <ngt-canvas
            [shadows]="true"
            [dpr]="[1, 2]"
            [camera]="{ position: [5, 5, 5], fov: 45 }"
          >
            <app-pain-cave-scene
              *canvasContent
              [items]="room()!.items"
              [inspectedItemId]="inspectedItemId()"
              (itemPressed)="onItemPressed($event)"
            />
          </ngt-canvas>
        </div>
      } @else {
        <div class="centered">
          <ion-text color="medium">
            <p>{{ 'room.empty' | translate }}</p>
          </ion-text>
        </div>
      }
    </ion-content>

    <!-- Trophy Info Bottom Sheet -->
    <ion-modal
      [isOpen]="inspectedItemId() !== null"
      [initialBreakpoint]="0.45"
      [breakpoints]="[0, 0.45, 0.75]"
      (didDismiss)="clearInspection()"
    >
      <ng-template>
        <app-trophy-info-sheet
          [trophy]="inspectedTrophyData()"
          (dismiss)="clearInspection()"
          (viewDetails)="onViewDetails($event)"
        />
      </ng-template>
    </ion-modal>
  `,
  styles: `
    .centered {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .canvas-container {
      width: 100%;
      height: 100%;
    }

    ngt-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class RoomViewPage implements OnInit {
  userId = input.required<string>();

  private api = inject(ApiService);
  private router = inject(Router);

  room = signal<RoomData | null>(null);
  loading = signal(true);
  inspectedItemId = signal<string | null>(null);

  inspectedTrophyData = computed<TrophyInfoData | null>(() => {
    const itemId = this.inspectedItemId();
    if (!itemId) return null;
    const item = this.room()?.items.find((i) => i.id === itemId);
    if (!item?.trophy) return null;
    return {
      id: item.trophy.id,
      type: item.trophy.type,
      thumbnailUrl: item.trophy.thumbnailUrl,
      race: item.trophy.raceResult?.race ?? null,
      result: item.trophy.raceResult
        ? {
            time: item.trophy.raceResult.time,
            ranking: item.trophy.raceResult.ranking,
            categoryRanking: item.trophy.raceResult.categoryRanking,
          }
        : null,
    };
  });

  ngOnInit(): void {
    this.fetchRoom();
  }

  async fetchRoom(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.rooms.user[':id'].$get({
        param: { id: this.userId() },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: RoomData };
        this.room.set(json.data);
      }
    } catch {
      // silently fail
    } finally {
      this.loading.set(false);
    }
  }

  onItemPressed(itemId: string): void {
    const item = this.room()?.items.find((i) => i.id === itemId);
    if (item?.trophy) {
      this.inspectedItemId.set(itemId);
    }
  }

  clearInspection(): void {
    this.inspectedItemId.set(null);
  }

  onViewDetails(trophyId: string): void {
    this.inspectedItemId.set(null);
    this.router.navigate(['/trophy', trophyId]);
  }
}
