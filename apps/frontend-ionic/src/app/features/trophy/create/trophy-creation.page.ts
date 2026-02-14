import { Component, inject, signal, effect, computed } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonModal,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

import { ScanService } from '@app/core/services/scan.service';
import { UserService } from '@app/core/services/user.service';
import { UpgradePromptComponent } from '@app/shared/components/upgrade-prompt/upgrade-prompt.component';
import { TrophyCaptureComponent } from './components/trophy-capture.component';
import { TrophyProcessingComponent } from './components/trophy-processing.component';
import { TrophyDetailsFormComponent } from './components/trophy-details-form.component';
import { TrophyMatchingComponent } from './components/trophy-matching.component';
import { TrophyResultsSearchComponent } from './components/trophy-results-search.component';
import { TrophyDoneComponent } from './components/trophy-done.component';

type CreationPhase = 'capture' | 'processing' | 'details' | 'matching' | 'search' | 'done';

@Component({
  selector: 'app-trophy-creation',
  standalone: true,
  imports: [
    TranslateModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonModal,
    UpgradePromptComponent,
    TrophyCaptureComponent,
    TrophyProcessingComponent,
    TrophyDetailsFormComponent,
    TrophyMatchingComponent,
    TrophyResultsSearchComponent,
    TrophyDoneComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" />
        </ion-buttons>
        <ion-title>{{ headerTitle() | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [fullscreen]="true">
      @switch (phase()) {
        @case ('capture') {
          <app-trophy-capture (captured)="onCaptured($event)" />
        }
        @case ('processing') {
          <app-trophy-processing />
        }
        @case ('details') {
          <app-trophy-details-form (submitted)="onDetailsSubmitted($event)" />
        }
        @case ('matching') {
          <app-trophy-matching
            (raceSelected)="onRaceSelected($event)"
            (createNew)="onCreateNewRace()"
          />
        }
        @case ('search') {
          <app-trophy-results-search />
        }
        @case ('done') {
          <app-trophy-results-search />
          <app-trophy-done (finish)="onFinish()" />
        }
      }

      <!-- Upgrade modal when scan limit exceeded -->
      <ion-modal [isOpen]="showUpgradeModal()" (didDismiss)="showUpgradeModal.set(false)">
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
  `,
})
export class TrophyCreationPage {
  private router = inject(Router);
  private scanService = inject(ScanService);
  private userService = inject(UserService);

  phase = signal<CreationPhase>('capture');
  showUpgradeModal = signal(false);

  // Form details stored for validate & search
  private pendingDetails: {
    type: 'medal' | 'bib';
    raceName: string;
    date?: string;
    city?: string;
    country?: string;
    distance?: string;
    sport?: 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other';
  } | null = null;

  headerTitle = computed(() => {
    const p = this.phase();
    switch (p) {
      case 'capture': return 'trophies.scan';
      case 'processing': return 'review.step1';
      case 'details': return 'review.step2';
      case 'matching': return 'review.step3';
      case 'search': return 'review.step4';
      case 'done': return 'review.step5';
    }
  });

  constructor() {
    this.scanService.reset();

    // Watch scanService.step to auto-transition phases
    effect(() => {
      const step = this.scanService.step();
      if (step === 'details') this.phase.set('details');
      if (step === 'matching') this.phase.set('matching');
      if (step === 'search') this.phase.set('search');
      if (step === 'done') this.phase.set('done');
    });

    // Watch for scan limit error
    effect(() => {
      const error = this.scanService.error();
      if (error === 'scan_limit_reached') {
        this.showUpgradeModal.set(true);
        this.phase.set('capture');
      }
    });
  }

  async onCaptured(event: { blob: Blob; previewUrl: string; type: 'medal' | 'bib' }): Promise<void> {
    // Pre-flight scan limit check
    const remaining = this.userService.scansRemaining();
    if (remaining !== null && remaining <= 0 && !this.userService.isPro()) {
      this.showUpgradeModal.set(true);
      return;
    }

    this.phase.set('processing');
    await this.scanService.uploadAndProcess(event.blob, event.type, event.previewUrl);

    // If error occurred, go back to capture
    if (this.scanService.error() && this.scanService.error() !== 'scan_limit_reached') {
      this.phase.set('capture');
    }
  }

  async onDetailsSubmitted(details: {
    type: 'medal' | 'bib';
    raceName: string;
    date?: string;
    city?: string;
    country?: string;
    distance?: string;
    sport?: 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other';
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
      this.scanService.step.set('matching');
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

  async onFinish(): Promise<void> {
    await this.scanService.autoPlaceTrophy();
    this.scanService.reset();
    this.router.navigate(['/tabs/home']);
  }

  private async doValidateAndSearch(raceId?: string): Promise<void> {
    if (!this.pendingDetails) return;

    await this.scanService.validateAndSearch({
      ...this.pendingDetails,
      raceId,
    });
  }
}
