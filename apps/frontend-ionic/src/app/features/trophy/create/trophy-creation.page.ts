import {
  Component,
  inject,
  signal,
  effect,
  computed,
  viewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import {
  IonContent,
  IonIcon,
  IonModal,
  NavController,
  ToastController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowBackOutline, checkmarkCircle } from "ionicons/icons";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { ScanService } from "@app/core/services/scan.service";
import { UserService } from "@app/core/services/user.service";
import { RoomService } from "@app/core/services/room.service";
import { TutorialService } from "@app/core/services/tutorial.service";
import { UpgradePromptComponent } from "@app/shared/components/upgrade-prompt/upgrade-prompt.component";
import { TrophyCaptureComponent } from "./components/trophy-capture.component";
import { TrophyProcessingComponent } from "./components/trophy-processing.component";
import { TrophyDetailsFormComponent } from "./components/trophy-details-form.component";
import { TrophyMatchingComponent } from "./components/trophy-matching.component";
import { TrophyResultsSearchComponent } from "./components/trophy-results-search.component";
import { TrophyDoneComponent } from "./components/trophy-done.component";
import { TrophyRefinementComponent } from "./components/trophy-refinement.component";

type CreationPhase =
  | "capture"
  | "processing"
  | "refining"
  | "details"
  | "matching"
  | "search"
  | "done";

@Component({
  selector: "app-trophy-creation",
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonIcon,
    IonModal,
    UpgradePromptComponent,
    TrophyCaptureComponent,
    TrophyProcessingComponent,
    TrophyRefinementComponent,
    TrophyDetailsFormComponent,
    TrophyMatchingComponent,
    TrophyResultsSearchComponent,
    TrophyDoneComponent,
  ],
  template: `
    <ion-content class="ion-padding" [fullscreen]="true">
      <!-- Floating glass header -->
      <div class="floating-header">
        <button class="back-pill" (click)="goBack()">
          <ion-icon name="arrow-back-outline" />
        </button>
        <div class="header-title-pill">
          <span>{{ headerTitle() | translate }}</span>
        </div>
        <div class="header-spacer"></div>
      </div>

      @switch (phase()) {
        @case ("capture") {
          <app-trophy-capture (captured)="onCaptured($event)" />
        }
        @case ("processing") {
          <app-trophy-processing />
        }
        @case ("refining") {
          <app-trophy-refinement (completed)="onRefinementComplete()" />
        }
        @case ("details") {
          <app-trophy-details-form (submitted)="onDetailsSubmitted($event)" />
        }
        @case ("matching") {
          <app-trophy-matching
            (raceSelected)="onRaceSelected($event)"
            (createNew)="onCreateNewRace()"
          />
        }
        @case ("search") {
          <app-trophy-results-search />
        }
        @case ("done") {
          <app-trophy-results-search />
          <app-trophy-done [saving]="scanService.savingResults()" (done)="onFinish()" />
        }
      }

      <!-- Upgrade modal when scan limit exceeded -->
      <ion-modal
        [isOpen]="showUpgradeModal()"
        (didDismiss)="showUpgradeModal.set(false)"
      >
        <ng-template>
          <app-upgrade-prompt
            [feature]="'pro.featureScans' | translate"
            (dismiss)="showUpgradeModal.set(false)"
          />
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    ion-content {
      --padding-bottom: 24px;
    }

    /* Floating glass header */
    .floating-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.72);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.1),
        0 0 0 1px rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease;
      flex-shrink: 0;

      &:active {
        transform: scale(0.92);
      }

      ion-icon {
        font-size: 22px;
        color: var(--ion-text-color);
      }
    }

    .header-title-pill {
      padding: 10px 20px;
      border-radius: 100px;
      background: rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.65);
      backdrop-filter: blur(16px) saturate(1.8);
      -webkit-backdrop-filter: blur(16px) saturate(1.8);
      border: 1px solid rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.06);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      span {
        font-size: 15px;
        font-weight: 700;
        color: var(--ion-text-color);
        letter-spacing: -0.01em;
      }
    }

    .header-spacer {
      flex: 1;
    }
  `,
})
export class TrophyCreationPage {
  private router = inject(Router);
  private navCtrl = inject(NavController);
  readonly scanService = inject(ScanService);
  private userService = inject(UserService);
  private roomService = inject(RoomService);
  private tutorialService = inject(TutorialService);
  private toastController = inject(ToastController);
  private translate = inject(TranslateService);

  private resultsSearchComponent = viewChild(TrophyResultsSearchComponent);

  phase = signal<CreationPhase>("capture");
  showUpgradeModal = signal(false);

  // Form details stored for validate & search
  private pendingDetails: {
    type: "medal" | "bib";
    raceName: string;
    date?: string;
    city?: string;
    country?: string;
    distance?: string;
    sport?:
      | "running"
      | "trail"
      | "triathlon"
      | "cycling"
      | "swimming"
      | "obstacle"
      | "other";
  } | null = null;

  headerTitle = computed(() => {
    const p = this.phase();
    switch (p) {
      case "capture":
        return "trophies.scan";
      case "processing":
        return "review.step1";
      case "refining":
        return "review.stepRefine";
      case "details":
        return "review.step2";
      case "matching":
        return "review.step3";
      case "search":
        return "review.step4";
      case "done":
        return "review.step5";
    }
  });

  constructor() {
    addIcons({ arrowBackOutline, checkmarkCircle });
    this.scanService.reset();

    // Watch scanService.step to auto-transition phases
    effect(() => {
      const step = this.scanService.step();
      if (step === "refining") this.phase.set("refining");
      if (step === "details") this.phase.set("details");
      if (step === "matching") this.phase.set("matching");
      if (step === "search") this.phase.set("search");
      if (step === "done") this.phase.set("done");
    });

    // Watch for scan limit error
    effect(() => {
      const error = this.scanService.error();
      if (error === "scan_limit_reached") {
        this.showUpgradeModal.set(true);
        this.phase.set("capture");
      }
    });
  }

  async onCaptured(event: {
    blob: Blob;
    previewUrl: string;
    type: "medal" | "bib";
  }): Promise<void> {
    // Pre-flight scan limit check
    const remaining = this.userService.scansRemaining();
    if (remaining !== null && remaining <= 0 && !this.userService.isPro()) {
      this.showUpgradeModal.set(true);
      return;
    }

    this.phase.set("processing");
    await this.scanService.uploadAndProcess(
      event.blob,
      event.type,
      event.previewUrl,
    );

    // If error occurred, go back to capture
    if (
      this.scanService.error() &&
      this.scanService.error() !== "scan_limit_reached"
    ) {
      this.phase.set("capture");
    }
  }

  async onDetailsSubmitted(details: {
    type: "medal" | "bib";
    raceName: string;
    date?: string;
    city?: string;
    country?: string;
    distance?: string;
    sport?:
      | "running"
      | "trail"
      | "triathlon"
      | "cycling"
      | "swimming"
      | "obstacle"
      | "other";
  }): Promise<void> {
    this.pendingDetails = details;

    // Search for matching races first
    const matches = await this.scanService.searchMatchingRaces(
      details.raceName,
      details.date,
      details.sport,
    );

    if (matches.length > 0) {
      this.scanService.matchedRaces.set(matches);
      this.scanService.step.set("matching");
    } else {
      await this.doValidateAndSearch();
    }
  }

  async onRaceSelected(raceId: string): Promise<void> {
    this.scanService.selectedRaceId.set(raceId);
    await this.doValidateAndSearch(raceId);
  }

  async onCreateNewRace(): Promise<void> {
    this.scanService.selectedRaceId.set(null);
    await this.doValidateAndSearch();
  }

  onRefinementComplete(): void {
    // applyRefinement already sets step to 'details'
  }

  async goBack(): Promise<void> {
    if (this.scanService.savingResults()) return;

    // Clean up trophy if one was created (post-processing steps)
    if (this.scanService.trophyId()) {
      this.scanService.cancelCreation();
    }

    this.navCtrl.back();
  }

  async onFinish(): Promise<void> {
    const comp = this.resultsSearchComponent();
    if (comp) {
      const edits = comp.getEditedResults();
      await this.scanService.updateRaceResult(edits);
    }
    await this.scanService.autoPlaceTrophy();

    // Check if this is the user's first trophy (room had <= 1 items since we just placed one)
    const room = this.roomService.room();
    const isFirstTrophy = (room?.items?.length ?? 0) <= 1;
    const tutorialCompleted = await this.tutorialService.hasCompleted();

    // Show success toast
    const message = this.translate.instant('review.trophyAdded');
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark-circle',
    });
    await toast.present();

    this.scanService.reset();

    if (isFirstTrophy && !tutorialCompleted) {
      this.router.navigate(["/room/edit"], {
        queryParams: { tutorial: "true" },
      });
    } else {
      this.router.navigate(["/tabs/home"]);
    }
  }

  private async doValidateAndSearch(raceId?: string): Promise<void> {
    if (!this.pendingDetails) return;

    await this.scanService.validateAndSearch({
      ...this.pendingDetails,
      raceId,
    });
  }
}
