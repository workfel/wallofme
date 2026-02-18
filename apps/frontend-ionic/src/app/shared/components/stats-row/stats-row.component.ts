import { Component, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { formatCount } from "@app/shared/lib/format-utils";

export interface StatItem {
  value: number;
  label: string;
}

@Component({
  selector: "app-stats-row",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="stats-row" [class.card]="variant() === 'card'">
      @for (stat of stats(); track stat.label; let last = $last) {
        <div class="stat-item">
          <span class="stat-value">{{ format(stat.value) }}</span>
          <span class="stat-label">{{ stat.label | translate }}</span>
        </div>
        @if (!last) {
          <div class="stat-divider"></div>
        }
      }
    </div>
  `,
  styles: `
    .stats-row {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0;
      border-top: 1px solid var(--wom-divider-subtle);
      border-bottom: 1px solid var(--wom-divider-subtle);
      margin: 24px 16px 0;
    }

    .stats-row.card {
      border: 1px solid var(--wom-glass-border);
      border-radius: 24px;
      background: var(--wom-glass-bg-medium);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.08),
        0 2px 4px rgba(0, 0, 0, 0.04);
      margin: 0;
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ion-text-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--ion-color-step-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
    }

    .stat-divider {
      width: 1px;
      height: 28px;
      background: var(--wom-divider);
    }
  `,
})
export class StatsRowComponent {
  stats = input.required<StatItem[]>();
  variant = input<"inline" | "card">("inline");

  format = formatCount;
}
