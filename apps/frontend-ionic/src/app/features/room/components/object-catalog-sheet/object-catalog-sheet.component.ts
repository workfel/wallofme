import { Component, inject, signal, output, effect, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, cartOutline, cubeOutline, bicycleOutline, barbellOutline, fitnessOutline, homeOutline, gridOutline } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';
import { RoomService, type RoomItem } from '@app/core/services/room.service';
import { TrophyService, type Trophy } from '@app/core/services/trophy.service';
import { DecorationService, type Decoration } from '@app/core/services/decoration.service';
import { TokenBalanceComponent } from '@app/shared/components/token-balance/token-balance.component';
import { TokenService } from '@app/core/services/token.service';
import { ThumbnailGeneratorService } from '@app/core/services/thumbnail-generator.service';

@Component({
  selector: 'app-object-catalog-sheet',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    IonSpinner,
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
                <ion-badge color="success">{{ 'room.place' | translate }}</ion-badge>
              </button>
            }
          </div>
        } @else {
          @if (decorationService.loading()) {
            <div class="loading-container">
              <ion-spinner name="crescent" />
            </div>
          } @else if (decorationService.decorations().length === 0) {
            <p class="empty-text">{{ 'room.noDecorations' | translate }}</p>
          } @else {
            <div class="catalog-grid">
              @for (deco of decorationService.decorations(); track deco.id) {
                <button class="catalog-card" (click)="placeDecoration.emit(deco.id)">
                  <div class="card-thumb-wrapper">
                    @if (thumbnails().get(deco.id); as thumb) {
                      <img [src]="thumb" [alt]="deco.name" class="card-image" />
                    } @else {
                      <div class="card-icon">
                        <ion-icon [name]="getDecorationIcon(deco.name)" />
                      </div>
                    }
                  </div>
                  <div class="card-info">
                    <span class="card-name">{{ deco.name }}</span>
                    @if (deco.description) {
                      <span class="card-description">{{ deco.description }}</span>
                    }
                    @if (deco.priceTokens > 0) {
                      <ion-badge color="warning">{{ deco.priceTokens }} {{ 'tokens.flames' | translate }}</ion-badge>
                    } @else {
                      <ion-badge color="success">{{ 'room.free' | translate }}</ion-badge>
                    }
                  </div>
                </button>
              }
            </div>
          }
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
      border: 1px solid var(--ion-color-step-100);
      border-radius: 14px;
      padding: 0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      overflow: hidden;
      transition: transform 0.15s, box-shadow 0.15s;

      &:active {
        transform: scale(0.96);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }

    .card-thumb-wrapper {
      width: 100%;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-50);
      border-bottom: 1px solid var(--ion-color-step-100);
    }

    .card-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
    }

    .card-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-step-100);
      border-radius: 16px;

      ion-icon {
        font-size: 40px;
        color: var(--ion-color-primary);
      }
    }

    .card-info {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .card-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .card-description {
      font-size: 11px;
      color: var(--ion-color-medium);
      text-align: center;
      line-height: 1.3;
    }

    .empty-text {
      text-align: center;
      color: var(--ion-color-medium);
      font-size: 14px;
      margin: 32px 0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      margin: 32px 0;
    }
  `,
})
export class ObjectCatalogSheetComponent implements OnInit, OnDestroy {
  private roomService = inject(RoomService);
  private trophyService = inject(TrophyService);
  private thumbnailGeneratorService = inject(ThumbnailGeneratorService);
  decorationService = inject(DecorationService);
  tokenService = inject(TokenService);

  activeSegment = signal<'trophies' | 'objects'>('trophies');
  thumbnails = signal<Map<string, string>>(new Map());

  placeTrophy = output<string>();
  placeDecoration = output<string>();
  getTokens = output<void>();

  ngOnInit() {
    this.trophyService.fetchTrophies();
    this.decorationService.fetchDecorations();
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
    addIcons({ addCircleOutline, cartOutline, cubeOutline, bicycleOutline, barbellOutline, fitnessOutline, homeOutline, gridOutline });

    effect(() => {
      const decorations = this.decorationService.decorations();
      if (decorations.length === 0) return;
      this.generateThumbnails(decorations);
    });
  }

  private async generateThumbnails(decorations: Decoration[]): Promise<void> {
    for (const deco of decorations) {
      if (!deco.modelUrl || this.thumbnails().has(deco.id)) continue;
      try {
        const thumb = await this.thumbnailGeneratorService.generateThumbnail(deco.modelUrl);
        this.thumbnails.update((map) => {
          const next = new Map(map);
          next.set(deco.id, thumb);
          return next;
        });
      } catch {
        // Skip failed thumbnails
      }
      // Stagger to avoid jank
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  ngOnDestroy(): void {
    this.thumbnailGeneratorService.dispose();
  }

  private readonly iconMap: Record<string, string> = {
    bicycle: 'bicycle-outline',
    kettlebell: 'barbell-outline',
    treadmill: 'fitness-outline',
    chair: 'home-outline',
    window: 'grid-outline',
  };

  getDecorationIcon(name: string): string {
    return this.iconMap[name.toLowerCase()] ?? 'cube-outline';
  }
}
