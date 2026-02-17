import { Component, inject, signal, computed, OnInit, input } from '@angular/core';
import { Router } from '@angular/router';
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
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';

import { ApiService } from '@app/core/services/api.service';
import { AuthService } from '@app/core/services/auth.service';
import { StatsPreviewCardComponent } from '@app/shared/components/stats-preview-card/stats-preview-card.component';

interface TrophyDetail {
  id: string;
  type: 'medal' | 'bib';
  status: 'pending' | 'processing' | 'ready' | 'error';
  textureUrl: string | null;
  thumbnailUrl: string | null;
  originalImageUrl: string | null;
  processedImageUrl: string | null;
  createdAt: string;
  finisherCount?: number;
  raceResult?: {
    id: string;
    time: string | null;
    ranking: number | null;
    categoryRanking: number | null;
    totalParticipants: number | null;
    race: {
      id: string;
      name: string;
      date: string | null;
      location: string | null;
      distance: string | null;
      sport: string | null;
    };
  } | null;
}

@Component({
  selector: 'app-trophy-detail',
  standalone: true,
  imports: [
    TranslateModule,
    StatsPreviewCardComponent,
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
    IonButton,
    IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" />
        </ion-buttons>
        <ion-title>{{ 'trophies.detail' | translate }}</ion-title>
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
              <p>{{ 'trophies.status' | translate }}: {{ trophy()!.status }}</p>
            </ion-card-content>
          </ion-card>

          @if (trophy()!.raceResult?.race; as raceInfo) {
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ raceInfo.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @if (raceInfo.location) {
                  <p>{{ raceInfo.location }}</p>
                }
                @if (raceInfo.distance) {
                  <p>{{ raceInfo.distance }}</p>
                }
              </ion-card-content>
            </ion-card>

            <app-stats-preview-card
              [time]="trophy()!.raceResult!.time"
              [ranking]="trophy()!.raceResult!.ranking"
              [categoryRanking]="trophy()!.raceResult!.categoryRanking"
              [totalParticipants]="trophy()!.raceResult!.totalParticipants"
              [isPro]="isPro()"
              (unlock)="onUnlock()"
            />

            @if (trophy()!.finisherCount && trophy()!.finisherCount! > 0) {
              <ion-button expand="block" (click)="onSeeFinishers(raceInfo.id)">
                <ion-icon slot="start" name="people-outline" />
                {{ 'finishers.seeFinishers' | translate:{ count: trophy()!.finisherCount } }}
              </ion-button>
            }
          }
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
  private authService = inject(AuthService);
  private router = inject(Router);

  trophy = signal<TrophyDetail | null>(null);
  loading = signal(true);

  isPro = computed(() => this.authService.user()?.isPro ?? false);

  constructor() {
    addIcons({ peopleOutline });
  }

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

  onSeeFinishers(raceId: string): void {
    this.router.navigate(['/race', raceId, 'finishers']);
  }

  onUnlock(): void {
    this.router.navigate(['/pro']);
  }
}
