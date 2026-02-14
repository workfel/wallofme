import { Component, inject, computed } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

import { ScanService } from '@app/core/services/scan.service';

@Component({
  selector: 'app-trophy-processing',
  standalone: true,
  imports: [TranslateModule, IonIcon],
  template: `
    <div class="processing-container animate-fade-in">
      <!-- 3-step progress indicator -->
      <div class="progress-steps">
        @for (step of progressSteps; track step.key; let i = $index) {
          <div
            class="progress-step"
            [class.active]="stepState(i) === 'active'"
            [class.done]="stepState(i) === 'done'"
            [class.pending]="stepState(i) === 'pending'"
          >
            <div class="step-indicator">
              @if (stepState(i) === 'done') {
                <ion-icon name="checkmark-circle" color="success" />
              } @else if (stepState(i) === 'active') {
                <div class="step-spinner"></div>
              } @else {
                <div class="step-number">{{ i + 1 }}</div>
              }
            </div>
            <span class="step-text">{{ step.label | translate }}</span>
          </div>
        }
      </div>

      <!-- Image display area -->
      <div class="image-area">
        <div class="image-card" [class.shrink-in]="currentPhaseIndex() >= 0">
          <!-- Original image -->
          @if (scan.originalImageUrl()) {
            <img
              [src]="scan.originalImageUrl()"
              alt="trophy"
              class="trophy-img"
              [class.fade-out]="showProcessed()"
            />
          }

          <!-- Processed image (crossfade reveal) -->
          @if (scan.processedImageUrl()) {
            <img
              [src]="scan.processedImageUrl()"
              alt="processed"
              class="trophy-img processed-img"
              [class.fade-in]="showProcessed()"
            />
          }

          <!-- Scan line overlay during bg removal -->
          @if (scan.processingPhase() === 'removing-bg') {
            <div class="scan-line-overlay">
              <div class="scan-line"></div>
            </div>
          }

          <!-- Glow overlay during analysis -->
          @if (scan.processingPhase() === 'analyzing') {
            <div class="glow-overlay"></div>
          }
        </div>
      </div>

      <!-- Skeleton fields during analysis -->
      @if (scan.processingPhase() === 'analyzing') {
        <div class="skeleton-fields animate-fade-in-up">
          <div class="skeleton-row">
            <div class="skeleton-label"></div>
            <div class="skeleton-value wide"></div>
          </div>
          <div class="skeleton-row" style="animation-delay: 0.1s">
            <div class="skeleton-label"></div>
            <div class="skeleton-value"></div>
          </div>
          <div class="skeleton-row" style="animation-delay: 0.2s">
            <div class="skeleton-label"></div>
            <div class="skeleton-value narrow"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .processing-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 16px 0;
    }

    /* Progress steps */
    .progress-steps {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      width: 100%;
      justify-content: center;
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      opacity: 0.35;
      transition: opacity 0.3s;

      &.active,
      &.done {
        opacity: 1;
      }
    }

    .step-indicator {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;

      ion-icon {
        font-size: 32px;
      }
    }

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--ion-color-step-200);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
    }

    .step-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--ion-color-step-200);
      border-top-color: var(--ion-color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .step-text {
      font-size: 12px;
      font-weight: 600;
      text-align: center;
      max-width: 80px;
    }

    /* Image area */
    .image-area {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .image-card {
      position: relative;
      width: 280px;
      height: 280px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
      transform: scale(1);
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);

      &.shrink-in {
        animation: shrinkToCard 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
    }

    .trophy-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      top: 0;
      left: 0;
      transition: opacity 0.8s ease;

      &.fade-out {
        opacity: 0;
      }
    }

    .processed-img {
      opacity: 0;

      &.fade-in {
        opacity: 1;
      }
    }

    /* Scan line */
    .scan-line-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .scan-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--ion-color-primary) 20%,
        var(--ion-color-primary) 80%,
        transparent 100%
      );
      box-shadow: 0 0 12px var(--ion-color-primary), 0 0 24px var(--ion-color-primary);
      animation: scanDown 2.5s ease-in-out infinite;
    }

    /* Glow overlay for analysis */
    .glow-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background:
        radial-gradient(ellipse at 30% 20%, rgba(var(--ion-color-primary-rgb, 56, 128, 255), 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 60%, rgba(var(--ion-color-primary-rgb, 56, 128, 255), 0.12) 0%, transparent 40%),
        radial-gradient(ellipse at 50% 80%, rgba(var(--ion-color-primary-rgb, 56, 128, 255), 0.1) 0%, transparent 45%);
      animation: glowPulse 2s ease-in-out infinite;
    }

    /* Skeleton fields */
    .skeleton-fields {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 12px;
      animation: fadeInUp 0.4s ease-out both;
    }

    .skeleton-label {
      width: 80px;
      height: 14px;
      border-radius: 7px;
      background: var(--ion-color-step-150);
      animation: shimmer 1.5s ease-in-out infinite;
    }

    .skeleton-value {
      height: 18px;
      border-radius: 9px;
      background: var(--ion-color-step-100);
      animation: shimmer 1.5s ease-in-out infinite;
      animation-delay: 0.2s;
      width: 140px;

      &.wide {
        width: 180px;
      }

      &.narrow {
        width: 100px;
      }
    }

    /* Keyframes */
    @keyframes shrinkToCard {
      from {
        transform: scale(1.15);
      }
      to {
        transform: scale(1);
      }
    }

    @keyframes scanDown {
      0% {
        top: -3px;
      }
      50% {
        top: 100%;
      }
      100% {
        top: -3px;
      }
    }

    @keyframes glowPulse {
      0%,
      100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }

    @keyframes shimmer {
      0% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.5;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class TrophyProcessingComponent {
  scan = inject(ScanService);

  progressSteps = [
    { key: 'upload', label: 'scan.uploadStep' },
    { key: 'bg', label: 'scan.bgRemovalStep' },
    { key: 'analysis', label: 'scan.analysisStep' },
  ];

  currentPhaseIndex = computed(() => {
    const phase = this.scan.processingPhase();
    const map: Record<string, number> = {
      idle: -1,
      creating: 0,
      uploading: 0,
      'removing-bg': 1,
      'bg-done': 1,
      analyzing: 2,
      'analyze-done': 2,
    };
    return map[phase] ?? -1;
  });

  showProcessed = computed(() => {
    const phase = this.scan.processingPhase();
    return phase === 'bg-done' || phase === 'analyzing' || phase === 'analyze-done';
  });

  constructor() {
    addIcons({ checkmarkCircle });
  }

  stepState(index: number): 'pending' | 'active' | 'done' {
    const phase = this.scan.processingPhase();
    const phaseIndex = this.currentPhaseIndex();

    if (index < phaseIndex) return 'done';
    if (index === phaseIndex) {
      // Check if the current step is actually done
      if (index === 0 && (phase === 'removing-bg' || phase === 'bg-done' || phase === 'analyzing' || phase === 'analyze-done')) return 'done';
      if (index === 1 && (phase === 'bg-done' || phase === 'analyzing' || phase === 'analyze-done')) return 'done';
      if (index === 2 && phase === 'analyze-done') return 'done';
      return 'active';
    }
    return 'pending';
  }
}
