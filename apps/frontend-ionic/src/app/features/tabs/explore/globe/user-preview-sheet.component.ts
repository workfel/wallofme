import { Component, input, output } from "@angular/core";
import { SlicePipe } from "@angular/common";
import {
  IonAvatar,
  IonButton,
  IonChip,
  IonIcon,
  IonText,
  IonLabel,
} from "@ionic/angular/standalone";

import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  heartOutline,
  trophyOutline,
  personCircleOutline,
  flaskOutline,
} from "ionicons/icons";

import type { GlobePoint } from "@app/core/services/explore.service";
import { ProBadgeComponent } from "@app/shared/components/pro-badge/pro-badge.component";

@Component({
  selector: "app-user-preview-sheet",
  standalone: true,
  imports: [
    SlicePipe,
    TranslateModule,
    IonAvatar,
    IonButton,
    IonChip,
    IonIcon,
    IonText,
    ProBadgeComponent,
    IonLabel,
  ],
  template: `
    @if (user(); as u) {
    <div class="sheet-content">
      <!-- Handle bar visual spacer -->
      <div class="handle-spacer"></div>

      <!-- User info -->
      <div class="user-header">
        <ion-avatar class="user-avatar">
          @if (u.image) {
          <img [src]="u.image" alt="" />
          } @else {
          <ion-icon name="person-circle-outline" class="avatar-fallback" />
          }
        </ion-avatar>
        <div class="user-info">
          <div class="name-row">
            <span class="user-name">{{
              u.displayName || u.firstName || ("explore.athlete" | translate)
            }}</span>
            @if (u.isPro) {
            <app-pro-badge size="small" />
            } @if (isSeedUser(u.userId)) {
            <ion-chip class="seed-chip" color="warning">
              <ion-icon name="flask-outline"></ion-icon>
              <ion-label>{{ "explore.simulation" | translate }}</ion-label>
            </ion-chip>
            }
          </div>
          @if (u.country) {
          <ion-text color="medium">
            <span class="user-country">{{ u.country }}</span>
          </ion-text>
          }
        </div>
      </div>

      <!-- Sport chips -->
      @if (u.sports && u.sports.length > 0) {
      <div class="sport-chips">
        @for (sport of u.sports | slice:0:3; track sport) {
        <ion-chip color="medium" outline>
          {{ "sports." + sport | translate }}
        </ion-chip>
        }
      </div>
      }

      <!-- Room preview thumbnail -->
      @if (u.thumbnailUrl) {
      <div class="room-preview">
        <img [src]="u.thumbnailUrl" alt="" class="room-thumbnail" />
      </div>
      }

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-item">
          <ion-icon name="trophy-outline" />
          <span>{{ u.trophyCount }}</span>
        </div>
        <div class="stat-item">
          <ion-icon name="heart-outline" />
          <span>{{ u.likeCount }}</span>
        </div>
      </div>

      <!-- Enter button -->
      <ion-button expand="block" (click)="enterCave.emit(u.userId)">
        {{ "globe.enterCave" | translate }}
      </ion-button>
    </div>
    }
  `,
  styles: `
    .sheet-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 20px;
      overflow-y: auto;
    }

    .handle-spacer {
      height: 4px;
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }

    .avatar-fallback {
      font-size: 48px;
      color: var(--ion-color-step-400);
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .name-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .user-name {
      font-size: 18px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-country {
      font-size: 13px;
    }

    .sport-chips {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;

      ion-chip {
        height: 24px;
        font-size: 12px;
        margin: 0;
      }
    }

    .seed-chip {
      height: 20px;
      font-size: 10px;
      margin: 0;
      padding-inline: 6px;
      font-weight: 700;
      --background: rgba(var(--ion-color-warning-rgb), 0.15);
      --color: var(--ion-color-warning-shade);

      ion-icon {
        font-size: 12px;
        margin-right: 2px;
      }

      ion-label {
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .room-preview {
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 16 / 9;
      background: var(--ion-color-step-100);
    }

    .room-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .stats-row {
      display: flex;
      gap: 20px;
      justify-content: center;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 15px;
      font-weight: 600;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 18px;
      }
    }
  `,
})
export class UserPreviewSheetComponent {
  readonly user = input<GlobePoint | null>(null);
  readonly dismiss = output<void>();
  readonly enterCave = output<string>();

  constructor() {
    addIcons({
      heartOutline,
      trophyOutline,
      personCircleOutline,
      flaskOutline,
    });
  }

  isSeedUser(userId: string): boolean {
    return userId.startsWith("seed-");
  }
}
