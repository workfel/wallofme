import { Component, inject, signal, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NgtCanvas } from 'angular-three/dom';
import { addIcons } from 'ionicons';
import { add, camera, create } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';
import { PainCaveSceneComponent, type RoomItem3D } from '../../room/components/pain-cave-scene/pain-cave-scene.component';

type RoomData = {
  id: string;
  userId: string;
  themeId: string | null;
  floor: string | null;
  items: RoomItem3D[];
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TranslateModule,
    NgtCanvas,
    PainCaveSceneComponent,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonFabList,
    IonIcon,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'home.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'home.title' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (error()) {
        <div class="centered">
          <ion-text>{{ 'common.error' | translate }}</ion-text>
          <ion-button fill="clear" (click)="fetchRoom()">
            {{ 'common.retry' | translate }}
          </ion-button>
        </div>
      } @else if (!hasItems()) {
        <div class="centered animate-fade-in">
          <h2>{{ 'home.title' | translate }}</h2>
          <ion-text color="medium">
            <p>{{ 'room.empty' | translate }}</p>
          </ion-text>
          <ion-button (click)="goToScan()">
            {{ 'trophies.scan' | translate }}
          </ion-button>
        </div>
      } @else {
        <div class="canvas-container animate-fade-in">
          <ngt-canvas
            [shadows]="true"
            [camera]="{ position: [5, 5, 5], fov: 45 }"
          >
            <app-pain-cave-scene *canvasContent [items]="room()!.items" />
          </ngt-canvas>
        </div>
      }

      <!-- Floating action buttons -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon name="add" />
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-fab-button (click)="goToScan()" color="primary">
            <ion-icon name="camera" />
          </ion-fab-button>
          <ion-fab-button (click)="goToEdit()" color="secondary">
            <ion-icon name="create" />
          </ion-fab-button>
        </ion-fab-list>
      </ion-fab>
    </ion-content>
  `,
  styles: `
    .centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      text-align: center;

      h2 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 8px;
      }

      p {
        margin: 0 0 24px;
      }
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
export class HomePage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  room = signal<RoomData | null>(null);
  loading = signal(true);
  error = signal(false);
  hasItems = signal(false);

  constructor() {
    addIcons({ add, camera, create });
  }

  ngOnInit(): void {
    this.fetchRoom();
  }

  async fetchRoom(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const res = await this.api.client.api.rooms.me.$get();
      if (res.ok) {
        const json = (await res.json()) as { data: RoomData };
        this.room.set(json.data);
        this.hasItems.set(json.data.items.length > 0);
      } else {
        this.error.set(true);
      }
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  goToScan(): void {
    this.router.navigate(['/trophy/scan']);
  }

  goToEdit(): void {
    this.router.navigate(['/room/edit']);
  }
}
