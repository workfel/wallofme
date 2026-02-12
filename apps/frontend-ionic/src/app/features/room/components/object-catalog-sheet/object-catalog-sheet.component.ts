import { Component, inject, signal, output, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButtons,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, cartOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import { RoomService, type RoomItem } from '@app/core/services/room.service';
import { TrophyService, type Trophy } from '@app/core/services/trophy.service';
import { TokenBalanceComponent } from '@app/shared/components/token-balance/token-balance.component';
import { TokenService } from '@app/core/services/token.service';

@Component({
  selector: 'app-object-catalog-sheet',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButtons,
    IonBadge,
    TranslateModule,
    TokenBalanceComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'room.catalog' | translate }}</ion-title>
        <ion-buttons slot="end">
          <app-token-balance
            [balance]="tokenService.balance()"
            (getTokens)="getTokens.emit()"
          />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-segment [value]="activeSegment()" (ionChange)="onSegmentChange($event)">
        <ion-segment-button value="trophies">
          <ion-label>{{ 'room.myTrophies' | translate }}</ion-label>
        </ion-segment-button>
        <ion-segment-button value="objects">
          <ion-label>{{ 'room.objects' | translate }}</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div class="catalog-content ion-padding">
        @if (activeSegment() === 'trophies') {
          @if (availableTrophies().length === 0) {
            <p class="empty-text">{{ 'room.noTrophies' | translate }}</p>
          }
          <div class="catalog-grid">
            @for (trophy of availableTrophies(); track trophy.id) {
              <button class="catalog-card" (click)="placeTrophy.emit(trophy.id)">
                @if (trophy.thumbnailUrl) {
                  <img [src]="trophy.thumbnailUrl" [alt]="trophy.type" class="card-image" />
                }
                <span class="card-name">
                  {{ trophy.type === 'medal' ? ('trophies.medal' | translate) : ('trophies.bib' | translate) }}
                </span>
                <ion-badge color="success">Place</ion-badge>
              </button>
            }
          </div>
        } @else {
          <p class="empty-text">{{ 'room.comingSoon' | translate }}</p>
        }
      </div>
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    ion-segment {
      padding: 8px 16px 0;
    }

    .catalog-content {
      padding-top: 12px;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .catalog-card {
      background: var(--ion-color-step-50);
      border: none;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: transform 0.15s;

      &:active {
        transform: scale(0.96);
      }
    }

    .card-image {
      width: 64px;
      height: 64px;
      object-fit: contain;
      border-radius: 8px;
    }

    .card-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .empty-text {
      text-align: center;
      color: var(--ion-color-medium);
      font-size: 14px;
      margin: 32px 0;
    }
  `,
})
export class ObjectCatalogSheetComponent implements OnInit {
  private roomService = inject(RoomService);
  private trophyService = inject(TrophyService);
  tokenService = inject(TokenService);

  activeSegment = signal<'trophies' | 'objects'>('trophies');

  placeTrophy = output<string>();
  getTokens = output<void>();

  ngOnInit() {
    this.trophyService.fetchTrophies();
  }

  availableTrophies(): Trophy[] {
    const placedTrophyIds = new Set(
      (this.roomService.room()?.items ?? [])
        .filter((i: RoomItem) => i.trophyId)
        .map((i: RoomItem) => i.trophyId)
    );
    return this.trophyService
      .trophies()
      .filter(
        (t: Trophy) =>
          t.status === 'ready' &&
          t.textureUrl &&
          !placedTrophyIds.has(t.id)
      );
  }

  onSegmentChange(event: CustomEvent): void {
    this.activeSegment.set(event.detail.value);
  }

  constructor() {
    addIcons({ addCircleOutline, cartOutline });
  }
}
