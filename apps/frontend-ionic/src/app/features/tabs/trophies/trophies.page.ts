import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonText,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonBadge,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { camera, ribbonOutline, documentTextOutline } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';

interface Trophy {
  id: string;
  type: 'medal' | 'bib';
  status: 'pending' | 'processing' | 'ready' | 'error';
  thumbnailUrl: string | null;
  textureUrl: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-trophies',
  standalone: true,
  imports: [
    DatePipe,
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonText,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonBadge,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'trophies.title' | translate }}</ion-title>
        <ion-button slot="end" fill="clear" (click)="goToScan()">
          <ion-icon slot="icon-only" name="camera" />
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ 'trophies.title' | translate }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (trophies().length === 0) {
        <div class="centered animate-fade-in">
          <ion-text color="medium">
            <p>{{ 'trophies.empty' | translate }}</p>
          </ion-text>
          <ion-button (click)="goToScan()">
            {{ 'trophies.scan' | translate }}
          </ion-button>
        </div>
      } @else {
        <ion-list class="animate-fade-in">
          @for (trophy of trophies(); track trophy.id) {
            <ion-item
              button
              [detail]="true"
              (click)="goToTrophy(trophy.id)"
            >
              <ion-thumbnail slot="start">
                @if (trophy.thumbnailUrl) {
                  <img [src]="trophy.thumbnailUrl" [alt]="trophy.type" />
                } @else {
                  <ion-icon
                    [name]="trophy.type === 'medal' ? 'ribbon-outline' : 'document-text-outline'"
                    class="placeholder-icon"
                  />
                }
              </ion-thumbnail>
              <ion-label>
                <h2>
                  {{
                    (trophy.type === 'medal'
                      ? 'trophies.medal'
                      : 'trophies.bib'
                    ) | translate
                  }}
                </h2>
                <p>{{ trophy.createdAt | date: 'mediumDate' }}</p>
              </ion-label>
              <ion-badge
                slot="end"
                [color]="trophy.status === 'ready' ? 'success' : 'warning'"
              >
                {{
                  (trophy.status === 'ready'
                    ? 'trophies.ready'
                    : 'trophies.processing'
                  ) | translate
                }}
              </ion-badge>
            </ion-item>
          }
        </ion-list>
      }
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
    }

    .placeholder-icon {
      font-size: 32px;
      color: var(--ion-color-step-400);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    ion-thumbnail {
      --border-radius: 12px;
      width: 56px;
      height: 56px;
    }
  `,
})
export class TrophiesPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  trophies = signal<Trophy[]>([]);
  loading = signal(true);

  constructor() {
    addIcons({ camera, ribbonOutline, documentTextOutline });
  }

  ngOnInit(): void {
    this.fetchTrophies();
  }

  async fetchTrophies(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.trophies.$get({ query: {} });
      if (res.ok) {
        const json = (await res.json()) as { data: Trophy[] };
        this.trophies.set(json.data);
      }
    } catch {
      // silently fail, show empty state
    } finally {
      this.loading.set(false);
    }
  }

  async doRefresh(event: CustomEvent): Promise<void> {
    await this.fetchTrophies();
    (event.target as HTMLIonRefresherElement).complete();
  }

  goToScan(): void {
    this.router.navigate(['/trophy/create']);
  }

  goToTrophy(id: string): void {
    this.router.navigate(['/trophy', id]);
  }
}
