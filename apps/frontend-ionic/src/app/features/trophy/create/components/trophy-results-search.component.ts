import { Component, inject, computed, effect, output } from "@angular/core";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import {
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonInput,
  IonList,
} from "@ionic/angular/standalone";
import { TranslateModule } from "@ngx-translate/core";
import { addIcons } from "ionicons";
import {
  searchOutline,
  trophyOutline,
  refreshOutline,
  informationCircleOutline,
} from "ionicons/icons";

import { AuthService } from "@app/core/services/auth.service";
import { ScanService } from "@app/core/services/scan.service";
import { StatsPreviewCardComponent } from "@app/shared/components/stats-preview-card/stats-preview-card.component";
import { hasValidStats } from "@app/shared/lib/stats-utils";

export interface ResultsEdit {
  time: string | null;
  ranking: number | null;
  categoryRanking: number | null;
  totalParticipants: number | null;
}

@Component({
  selector: "app-trophy-results-search",
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    StatsPreviewCardComponent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonInput,
    IonList,
  ],
  template: `
    @if (scan.step() === "search") {
      <!-- Searching state -->
      <div class="searching-container animate-fade-in">
        <div class="search-ring">
          <ion-icon name="search-outline" class="search-icon" />
        </div>
        <ion-text>
          <p class="searching-hint">{{ "scan.searchingHint" | translate }}</p>
        </ion-text>
      </div>
    }

    @if (scan.step() === "done") {
      @if (showStatsPreview()) {
        <!-- Stats preview card (paywall) -->
        <app-stats-preview-card
          [time]="scan.searchResult()!.time ?? null"
          [ranking]="scan.searchResult()!.ranking ?? null"
          [categoryRanking]="scan.searchResult()!.categoryRanking ?? null"
          [totalParticipants]="scan.searchResult()!.totalParticipants ?? null"
          [isPro]="isPro()"
          (unlock)="onUnlock()"
        />
      } @else {
        @if (scan.searchResult()?.found) {
          <!-- Results found: trophy bounce + disclaimer -->
          <div class="results-reveal animate-fade-in">
            <div class="trophy-bounce">
              <ion-icon name="trophy-outline" class="trophy-icon" />
            </div>

            <div class="ai-disclaimer">
              <ion-icon
                name="information-circle-outline"
                class="disclaimer-icon"
              />
              <ion-text color="medium">
                <small>{{ "review.aiDisclaimer" | translate }}</small>
              </ion-text>
            </div>
          </div>
        }

        @if (!scan.searchResult()?.found) {
          <div class="no-results-reveal animate-fade-in">
            <div class="no-results-icon-wrap">
              <ion-icon name="search-outline" class="no-results-icon" />
            </div>
            <ion-text color="medium">
              <p class="no-results-hint">{{ "review.noResultsMessage" | translate }}</p>
            </ion-text>
          </div>
        }

        <!-- Editable results card -->
        <ion-card class="result-card">
          <ion-card-header>
            <ion-card-title>
              @if (scan.searchResult()?.found) {
                {{ "review.resultsFound" | translate }}
              } @else {
                {{ "review.enterResults" | translate }}
              }
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-input
                  [label]="'review.time' | translate"
                  labelPlacement="floating"
                  [(ngModel)]="editTime"
                  placeholder="01:23:45"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  [label]="'review.ranking' | translate"
                  labelPlacement="floating"
                  type="number"
                  [(ngModel)]="editRanking"
                  placeholder="42"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  [label]="'review.categoryRanking' | translate"
                  labelPlacement="floating"
                  type="number"
                  [(ngModel)]="editCategoryRanking"
                  placeholder="12"
                />
              </ion-item>
              <ion-item>
                <ion-input
                  [label]="'review.totalParticipants' | translate"
                  labelPlacement="floating"
                  type="number"
                  [(ngModel)]="editTotalParticipants"
                  placeholder="500"
                />
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      }

      <div class="retry-row">
        @if (scan.resultsRetryLoading()) {
          <ion-spinner name="dots" />
          <ion-text color="medium"
            ><small>{{
              "review.retryingResults" | translate
            }}</small></ion-text
          >
        } @else if (resultsRetryMaxed()) {
          <ion-text color="medium"
            ><small class="search-hint">{{
              "review.resultsRetryMaxAttempts" | translate
            }}</small></ion-text
          >
        } @else if (scan.resultsRetryCooldownRemaining() > 0) {
          <ion-button size="small" fill="outline" disabled="true">
            {{
              "review.retryResultsCooldown"
                | translate: { seconds: scan.resultsRetryCooldownRemaining() }
            }}
          </ion-button>
        } @else {
          <ion-button size="small" fill="outline" (click)="onRetryResults()">
            <ion-icon slot="start" name="refresh-outline" />
            @if (scan.searchResult()?.found) {
              {{ "review.wrongResults" | translate }}
            } @else {
              {{ "review.retryResults" | translate }}
            }
          </ion-button>
        }
      </div>
    }
  `,
  styles: `
    /* Searching state — glass card */
    .searching-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      gap: 24px;
      border-radius: 24px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.55);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .search-ring {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid var(--ion-color-step-200);
      border-top-color: var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: spin 1.2s linear infinite;
    }

    .search-icon {
      font-size: 32px;
      color: var(--ion-color-primary);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .searching-hint {
      font-size: 15px;
      text-align: center;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* Results reveal */
    .results-reveal {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px 0 8px;
    }

    .trophy-bounce {
      animation: bounceIn 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    .trophy-icon {
      font-size: 56px;
      color: var(--ion-color-warning);
      filter: drop-shadow(0 4px 12px rgba(var(--ion-color-warning-rgb), 0.4));
    }

    /* AI disclaimer — glass pill */
    .ai-disclaimer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.5);
      backdrop-filter: blur(12px) saturate(1.6);
      -webkit-backdrop-filter: blur(12px) saturate(1.6);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      border-radius: 16px;
      width: 100%;

      .disclaimer-icon {
        font-size: 20px;
        color: var(--ion-color-medium);
        flex-shrink: 0;
      }

      small {
        font-size: 12px;
        line-height: 1.4;
      }
    }

    /* No results reveal */
    .no-results-reveal {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px 0 8px;
    }

    .no-results-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(var(--ion-color-medium-rgb), 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .no-results-icon {
      font-size: 32px;
      color: var(--ion-color-medium);
    }

    .no-results-hint {
      font-size: 14px;
      text-align: center;
      color: var(--ion-color-medium);
      margin: 0;
      padding: 0 16px;
    }

    /* Result card — glass */
    .result-card {
      width: 100%;
      margin-top: 8px;
      --background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.55);
      backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.06),
        0 1px 2px rgba(0, 0, 0, 0.03);

      ion-item {
        --background: transparent;
        --padding-start: 0;
      }
    }

    /* Retry row */
    .retry-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 0 0;

      ion-spinner {
        width: 18px;
        height: 18px;
      }

      ion-button {
        margin: 0;
      }
    }

    .search-hint {
      font-style: italic;
      font-size: 12px;
    }

    /* Keyframes */
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes pulse {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.15);
      }
    }

    @keyframes bounceIn {
      0% {
        transform: scale(0.3);
        opacity: 0;
      }
      50% {
        transform: scale(1.05);
      }
      70% {
        transform: scale(0.95);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
})
export class TrophyResultsSearchComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  scan = inject(ScanService);

  isPro = computed(() => this.authService.user()?.isPro ?? false);

  showStatsPreview = computed(() => {
    const result = this.scan.searchResult();
    return (
      result?.found === true &&
      hasValidStats(result.ranking, result.totalParticipants)
    );
  });

  resultsRetryMaxed = computed(() => this.scan.resultsRetryAttempts() >= 3);

  // Editable fields
  editTime = "";
  editRanking = "";
  editCategoryRanking = "";
  editTotalParticipants = "";

  // Output for parent to read edited values
  resultsEdited = output<ResultsEdit>();

  private initialized = false;

  constructor() {
    addIcons({
      searchOutline,
      trophyOutline,
      refreshOutline,
      informationCircleOutline,
    });

    // Pre-fill from search results when entering done step
    effect(() => {
      const step = this.scan.step();
      const result = this.scan.searchResult();
      if (step === "done" && !this.initialized) {
        this.initialized = true;
        if (result) {
          this.editTime = result.time ?? "";
          this.editRanking = result.ranking?.toString() ?? "";
          this.editCategoryRanking = result.categoryRanking?.toString() ?? "";
          this.editTotalParticipants =
            result.totalParticipants?.toString() ?? "";
        }
      }
    });
  }

  getEditedResults(): ResultsEdit {
    // When stats preview is shown, return values from search directly (no user editing)
    if (this.showStatsPreview()) {
      const result = this.scan.searchResult()!;
      return {
        time: result.time ?? null,
        ranking: result.ranking ?? null,
        categoryRanking: result.categoryRanking ?? null,
        totalParticipants: result.totalParticipants ?? null,
      };
    }
    return {
      time: this.editTime.trim() || null,
      ranking: this.editRanking ? parseInt(this.editRanking, 10) || null : null,
      categoryRanking: this.editCategoryRanking
        ? parseInt(this.editCategoryRanking, 10) || null
        : null,
      totalParticipants: this.editTotalParticipants
        ? parseInt(this.editTotalParticipants, 10) || null
        : null,
    };
  }

  onUnlock(): void {
    this.router.navigate(['/pro']);
  }

  async onRetryResults(): Promise<void> {
    await this.scan.retrySearchResults();
    // Update fields if retry found results
    const result = this.scan.searchResult();
    if (result?.found) {
      this.editTime = result.time ?? "";
      this.editRanking = result.ranking?.toString() ?? "";
      this.editCategoryRanking = result.categoryRanking?.toString() ?? "";
      this.editTotalParticipants = result.totalParticipants?.toString() ?? "";
    }
  }
}
