import {
  Component,
  inject,
  signal,
  computed,
  OnDestroy,
  afterNextRender,
} from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { TutorialService } from "@app/core/services/tutorial.service";

@Component({
  selector: "app-tutorial-overlay",
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (tutorialService.active()) {
      @if (tutorialService.subStep() === 'main') {
        <!-- Spotlight (visual only — clicks pass through to real elements) -->
        @if (currentStep().target && spotlightRect()) {
          <div
            class="spotlight"
            [style.top.px]="spotlightRect()!.top - 8"
            [style.left.px]="spotlightRect()!.left - 8"
            [style.width.px]="spotlightRect()!.width + 16"
            [style.height.px]="spotlightRect()!.height + 16"
          ></div>
        } @else if (!currentStep().target) {
          <!-- Full backdrop for center-tooltip steps (no target) -->
          <div class="tutorial-backdrop"></div>
        }

        <!-- Tooltip (only interactive element) -->
        <div
          class="tutorial-tooltip"
          [class.tooltip-center]="!currentStep().target"
          [style]="tooltipPositionStyle()"
        >
          @if (isComplete()) {
            <p class="tooltip-text">{{ 'tutorial.complete' | translate }}</p>
            <div class="tooltip-footer">
              <span class="step-counter">{{ stepIndex() + 1 }}/{{ totalSteps }}</span>
              <button class="tooltip-btn" (click)="onComplete()">
                {{ 'tutorial.completeBtn' | translate }}
              </button>
            </div>
          } @else {
            <p class="tooltip-text">{{ tooltipKey() | translate }}</p>
            <div class="tooltip-footer">
              <span class="step-counter">{{ stepIndex() + 1 }}/{{ totalSteps }}</span>
              @if (currentStep().action === 'next') {
                <button class="tooltip-btn" (click)="onNext()">
                  @if (stepIndex() === 0) {
                    {{ 'tutorial.welcomeBtn' | translate }}
                  } @else {
                    {{ 'tutorial.next' | translate }}
                  }
                </button>
              }
            </div>
            <button class="skip-link" (click)="onSkip()">
              {{ 'tutorial.skip' | translate }}
            </button>
          }
        </div>
      }

      <!-- Waiting hint (when modal is open) -->
      @if (tutorialService.subStep() === 'waiting') {
        <div class="waiting-hint">
          <p>{{ waitingHintKey() | translate }}</p>
        </div>
      }
    }
  `,
  styles: `
    .tutorial-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.6);
      pointer-events: none;
    }

    .spotlight {
      position: fixed;
      border-radius: 12px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
      pointer-events: none;
      transition:
        top 0.3s ease,
        left 0.3s ease,
        width 0.3s ease,
        height 0.3s ease;
      z-index: 10000;
    }

    .tutorial-tooltip {
      position: fixed;
      z-index: 10002;
      max-width: 300px;
      padding: 16px 20px;
      border-radius: 16px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.88);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.1);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.08);
      transition:
        top 0.3s ease,
        left 0.3s ease;
    }

    .tooltip-center {
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%);
    }

    .tooltip-text {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.5;
      color: var(--ion-text-color, #1a1a1a);
    }

    .tooltip-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .step-counter {
      font-size: 12px;
      font-weight: 700;
      color: var(--ion-color-step-500, #808080);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .tooltip-btn {
      padding: 8px 20px;
      border: none;
      border-radius: 100px;
      background: var(--ion-color-primary, #3880ff);
      color: var(--ion-color-primary-contrast);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.15s ease;

      &:active {
        transform: scale(0.95);
      }
    }

    .skip-link {
      display: block;
      width: 100%;
      margin-top: 10px;
      padding: 0;
      border: none;
      background: none;
      font-size: 13px;
      font-weight: 500;
      color: var(--ion-color-step-500, #808080);
      text-align: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      &:active {
        opacity: 0.6;
      }
    }

    .waiting-hint {
      position: fixed;
      top: calc(var(--ion-safe-area-top, 0px) + 60px);
      left: 16px;
      right: 16px;
      z-index: 9000;
      padding: 12px 20px;
      border-radius: 100px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.88);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.1);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.06);
      text-align: center;
      animation: slideDown 0.3s ease;

      p {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--ion-text-color, #1a1a1a);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class TutorialOverlayComponent implements OnDestroy {
  tutorialService = inject(TutorialService);

  spotlightRect = signal<DOMRect | null>(null);
  private rafId: number | null = null;

  readonly totalSteps = this.tutorialService.steps.length;

  stepIndex = computed(() => this.tutorialService.currentStepIndex());
  currentStep = computed(() => this.tutorialService.currentStep());
  isComplete = computed(() => this.stepIndex() >= this.totalSteps);

  tooltipKey = computed(() => {
    const step = this.currentStep();
    if (!step) return "";
    const map: Record<string, string> = {
      welcome: "tutorial.welcome",
      theme: "tutorial.theme",
      "add-object": "tutorial.addObject",
      move: "tutorial.move",
      share: "tutorial.share",
    };
    return map[step.id] ?? "";
  });

  waitingHintKey = computed(() => {
    const step = this.currentStep();
    if (!step) return "";
    const map: Record<string, string> = {
      theme: "tutorial.themeWaiting",
      "add-object": "tutorial.addObjectWaiting",
      share: "tutorial.shareWaiting",
    };
    return map[step.id] ?? "";
  });

  tooltipPositionStyle = computed(() => {
    const step = this.currentStep();
    const rect = this.spotlightRect();

    if (!step?.target || !rect) {
      return "";
    }

    const pos = step.tooltipPosition;

    if (pos === "bottom") {
      return `top: ${rect.bottom + 24}px; left: 50%; transform: translateX(-50%);`;
    }
    if (pos === "top") {
      return `bottom: ${window.innerHeight - rect.top + 24}px; left: 50%; transform: translateX(-50%);`;
    }
    return "";
  });

  constructor() {
    afterNextRender(() => {
      this.startTracking();
    });
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }

  onNext(): void {
    this.tutorialService.nextStep();
  }

  onSkip(): void {
    this.tutorialService.skipTutorial();
  }

  onComplete(): void {
    this.tutorialService.completeTutorial();
  }

  private startTracking(): void {
    const tick = () => {
      this.updateSpotlight();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopTracking(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private updateSpotlight(): void {
    if (!this.tutorialService.active()) return;

    const step = this.tutorialService.currentStep();
    if (!step?.target) {
      this.spotlightRect.set(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      this.spotlightRect.set(el.getBoundingClientRect());
    } else {
      this.spotlightRect.set(null);
    }
  }
}
