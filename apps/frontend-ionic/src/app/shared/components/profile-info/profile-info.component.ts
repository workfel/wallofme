import { Component, computed, inject, input } from "@angular/core";
import { IonChip } from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";

import { ProBadgeComponent } from "@app/shared/components/pro-badge/pro-badge.component";
import { countryFlag, COUNTRIES } from "@app/shared/data/countries";
import { I18nService } from "@app/core/services/i18n.service";

@Component({
  selector: "app-profile-info",
  standalone: true,
  imports: [TranslateModule, IonChip, ProBadgeComponent],
  template: `
    <div class="profile-info">
      <h2 class="display-name">
        {{ displayName() }}
        @if (isPro()) {
          <app-pro-badge size="medium" />
        }
      </h2>

      @if (countryDisplay(); as cd) {
        <p class="subtitle-label">{{ cd }}</p>
      }

      @if (sportsList().length > 0) {
        <div class="sport-chips">
          @for (sport of sportsList(); track sport) {
            <ion-chip outline color="primary" class="sport-chip">
              {{ "sports." + sport | translate }}
            </ion-chip>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .profile-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 24px 0;
    }

    .display-name {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 4px;
      text-align: center;
      letter-spacing: -0.02em;
      color: var(--ion-text-color);
    }

    .subtitle-label {
      font-size: 15px;
      color: var(--ion-color-step-600);
      margin: 2px 0 0;
      font-weight: 500;
    }

    .sport-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
    }

    .sport-chip {
      height: 28px;
      font-size: 12px;
      margin: 0;
      background: rgba(var(--ion-color-primary-rgb), 0.1);
      color: var(--ion-color-primary);
      border: 1px solid rgba(var(--ion-color-primary-rgb), 0.2);
      font-weight: 600;
      --padding-start: 12px;
      --padding-end: 12px;
    }
  `,
})
export class ProfileInfoComponent {
  displayName = input.required<string>();
  isPro = input(false);
  country = input<string | null>(null);
  sports = input<string[]>([]);

  private i18n = inject(I18nService);

  /** Normalize sports input — handles both string[] and JSON-encoded string */
  sportsList = computed<string[]>(() => {
    const raw = this.sports();
    if (!raw || raw.length === 0) return [];
    if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].length > 1) return raw;
    // If the API returned a JSON string instead of an array, parse it
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw as string);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return raw;
  });

  countryDisplay(): string | null {
    const code = this.country();
    if (!code) return null;
    const flag = countryFlag(code);
    const entry = COUNTRIES.find((c) => c.code === code.toUpperCase());
    if (entry) {
      const name = this.i18n.currentLang === "fr" ? entry.nameFr : entry.name;
      return `${flag} ${name}`;
    }
    return `${flag} ${code}`;
  }
}
