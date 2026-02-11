import { Component, inject, signal, OnInit, input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NgtCanvas } from 'angular-three/dom';

import { ApiService } from '@app/core/services/api.service';
import { PainCaveSceneComponent, type RoomItem3D } from '../components/pain-cave-scene/pain-cave-scene.component';

type RoomData = {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: RoomItem3D[];
};

@Component({
  selector: 'app-room-view',
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
    IonSpinner,
    IonText,
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
            [camera]="{ position: [5, 5, 5], fov: 45 }"
          >
            <app-pain-cave-scene *canvasContent [items]="room()!.items" />
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

  room = signal<RoomData | null>(null);
  loading = signal(true);

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
}
