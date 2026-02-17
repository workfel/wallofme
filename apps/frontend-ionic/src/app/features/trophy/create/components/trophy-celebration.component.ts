import { Component, EventEmitter, Output } from '@angular/core';
import { NgFor } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { trophyOutline, shareOutline } from 'ionicons/icons';

const CONFETTI_COLORS = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF6FC8', '#FF9A3C', '#A8DADC', '#E63946',
];

interface ConfettiPiece {
  left: string;
  background: string;
  animationDelay: string;
  animationDuration: string;
  width: string;
  height: string;
  borderRadius: string;
}

@Component({
  selector: 'app-trophy-celebration',
  standalone: true,
  imports: [NgFor, TranslateModule, IonButton, IonIcon],
  template: `
    <div class="celebration-backdrop">
      <!-- Confetti -->
      <div
        *ngFor="let piece of confettiPieces"
        class="confetti-piece"
        [style.left]="piece.left"
        [style.background]="piece.background"
        [style.animation-delay]="piece.animationDelay"
        [style.animation-duration]="piece.animationDuration"
        [style.width]="piece.width"
        [style.height]="piece.height"
        [style.border-radius]="piece.borderRadius"
      ></div>

      <div class="celebration-content">
        <div class="trophy-icon-wrapper">
          <ion-icon name="trophy-outline" class="trophy-icon" />
        </div>

        <h1>{{ 'celebration.title' | translate }}</h1>
        <p class="subtitle">{{ 'celebration.subtitle' | translate }}</p>

        <div class="actions">
          <ion-button expand="block" (click)="done.emit()">
            {{ 'celebration.viewRoom' | translate }}
          </ion-button>
          <ion-button expand="block" fill="clear" (click)="share.emit()">
            <ion-icon slot="start" name="share-outline" />
            {{ 'share.shareTrophy' | translate }} — +50 🔥
          </ion-button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 9999;
    }

    .celebration-backdrop {
      position: relative;
      width: 100%;
      height: 100%;
      background: var(--ion-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .confetti-piece {
      position: absolute;
      top: -20px;
      animation: confetti-fall linear infinite;
      opacity: 0.85;
    }

    @keyframes confetti-fall {
      0% {
        transform: translateY(-20px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(110vh) rotate(720deg);
        opacity: 0;
      }
    }

    .celebration-content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 24px;
      max-width: 400px;
      width: 100%;
      gap: 16px;
    }

    .trophy-icon-wrapper {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(
        135deg,
        var(--ion-color-warning) 0%,
        var(--ion-color-primary) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes bounce-in {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      60% {
        transform: scale(1.12);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .trophy-icon {
      font-size: 60px;
      color: #fff;
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      margin: 8px 0 0;
      line-height: 1.2;
      animation: fade-up 0.5s 0.3s ease both;
    }

    .subtitle {
      font-size: 16px;
      color: var(--ion-color-medium);
      margin: 0;
      line-height: 1.5;
      max-width: 280px;
      animation: fade-up 0.5s 0.45s ease both;
    }

    @keyframes fade-up {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .actions {
      width: 100%;
      margin-top: 16px;
      animation: fade-up 0.5s 0.6s ease both;

      ion-button {
        margin-bottom: 4px;
      }
    }
  `,
})
export class TrophyCelebrationComponent {
  @Output() done = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();

  readonly confettiPieces: ConfettiPiece[] = Array.from({ length: 20 }, (_, i) => ({
    left: `${(i * 5 + Math.random() * 5).toFixed(1)}%`,
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDelay: `${(Math.random() * 2).toFixed(2)}s`,
    animationDuration: `${(2.5 + Math.random() * 2).toFixed(2)}s`,
    width: `${6 + Math.floor(Math.random() * 8)}px`,
    height: `${10 + Math.floor(Math.random() * 8)}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
  }));

  constructor() {
    addIcons({ trophyOutline, shareOutline });
  }
}
