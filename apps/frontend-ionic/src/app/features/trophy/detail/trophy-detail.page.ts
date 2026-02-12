import { Component, inject, signal, OnInit, input } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

import { ApiService } from '@app/core/services/api.service';

interface TrophyDetail {
  id: string;
  type: 'medal' | 'bib';
  status: 'pending' | 'processing' | 'ready' | 'error';
  textureUrl: string | null;
  thumbnailUrl: string | null;
  originalImageUrl: string | null;
  processedImageUrl: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-trophy-detail',
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/trophies" />
        </ion-buttons>
        <ion-title>Trophy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [fullscreen]="true">
      @if (loading()) {
        <div class="centered">
          <ion-spinner name="crescent" />
        </div>
      } @else if (trophy()) {
        <div class="animate-fade-in">
          @if (trophy()!.textureUrl || trophy()!.thumbnailUrl) {
            <div class="image-container">
              <img
                [src]="trophy()!.textureUrl || trophy()!.thumbnailUrl"
                alt="trophy"
                class="trophy-image"
              />
            </div>
          }
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{
                  (trophy()!.type === 'medal'
                    ? 'trophies.medal'
                    : 'trophies.bib'
                  ) | translate
                }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>Status: {{ trophy()!.status }}</p>
            </ion-card-content>
          </ion-card>
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

    .image-container {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .trophy-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
    }
  `,
})
export class TrophyDetailPage implements OnInit {
  id = input.required<string>();

  private api = inject(ApiService);

  trophy = signal<TrophyDetail | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.fetchTrophy();
  }

  async fetchTrophy(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.client.api.trophies[':id'].$get({
        param: { id: this.id() },
      });
      if (res.ok) {
        const json = (await res.json()) as { data: TrophyDetail };
        this.trophy.set(json.data);
      }
    } catch {
      // handle error
    } finally {
      this.loading.set(false);
    }
  }
}
