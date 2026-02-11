import { Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="steps">
      @for (step of steps(); track step.key; let i = $index) {
        <div
          class="step"
          [class.active]="currentIndex() >= i"
          [class.current]="currentIndex() === i"
        >
          <div class="step-dot">{{ i + 1 }}</div>
          <span class="step-label">{{ step.label | translate }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .steps {
      display: flex;
      justify-content: space-between;
      padding: 0 8px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      opacity: 0.4;
      transition: opacity 0.3s;

      &.active {
        opacity: 1;
      }

      &.current .step-dot {
        background: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast);
        transform: scale(1.1);
      }
    }

    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--ion-color-step-200);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.3s;
    }

    .step-label {
      font-size: 11px;
      font-weight: 600;
    }
  `,
})
export class StepIndicatorComponent {
  steps = input.required<{ key: string; label: string }[]>();
  currentIndex = input.required<number>();
}
