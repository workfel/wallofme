import { Injectable, inject, signal, computed } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from './api.service';
import { UploadService } from './upload.service';
import { RoomService } from './room.service';
import { UserService } from './user.service';

const MAX_RETRY_ATTEMPTS = 2;
const RETRY_COOLDOWN_MS = 15_000;

export type ScanStep = 'idle' | 'processing' | 'details' | 'matching' | 'search' | 'done';

export type ProcessingPhase =
  | 'idle'
  | 'creating'
  | 'uploading'
  | 'removing-bg'
  | 'bg-done'
  | 'analyzing'
  | 'analyze-done';

export interface MatchedRace {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  distance: string | null;
  sport: string | null;
  finisherCount: number;
}

export interface ScanAnalysis {
  imageKind: 'medal' | 'bib' | 'unknown';
  raceName: string | null;
  date: string | null;
  city: string | null;
  country: string | null;
  sportKind: string | null;
  distance: string | null;
  hasPornContent: boolean;
}

export interface ProcessedUrls {
  processedImageUrl: string;
  textureUrl: string;
  thumbnailUrl: string;
}

export interface SearchResult {
  found: boolean;
  time: string | null;
  ranking: number | null;
  categoryRanking: number | null;
  totalParticipants: number | null;
}

@Injectable({ providedIn: 'root' })
export class ScanService {
  private api = inject(ApiService);
  private uploadService = inject(UploadService);
  private roomService = inject(RoomService);
  private userService = inject(UserService);
  private toastController = inject(ToastController);
  private translate = inject(TranslateService);

  readonly step = signal<ScanStep>('idle');
  readonly processingPhase = signal<ProcessingPhase>('idle');
  readonly trophyId = signal<string | null>(null);
  readonly raceResultId = signal<string | null>(null);
  readonly analysis = signal<ScanAnalysis | null>(null);
  readonly processedUrls = signal<ProcessedUrls | null>(null);
  readonly searchResult = signal<SearchResult | null>(null);
  readonly matchedRaces = signal<MatchedRace[]>([]);
  readonly selectedRaceId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly processingMessage = signal('');
  readonly originalImageUrl = signal<string | null>(null);
  readonly processedImageUrl = signal<string | null>(null);
  readonly isProcessing = computed(() => this.step() === 'processing');

  // Date search retry state
  readonly dateSearchLoading = signal(false);
  readonly dateSearchAttempts = signal(0);
  readonly dateSearchCooldownRemaining = signal(0);

  // Results retry state
  readonly resultsRetryLoading = signal(false);
  readonly resultsRetryAttempts = signal(0);
  readonly resultsRetryCooldownRemaining = signal(0);

  private cooldownTimers = new Map<string, ReturnType<typeof setInterval>>();

  reset(): void {
    this.step.set('idle');
    this.processingPhase.set('idle');
    this.trophyId.set(null);
    this.raceResultId.set(null);
    this.analysis.set(null);
    this.processedUrls.set(null);
    this.searchResult.set(null);
    this.matchedRaces.set([]);
    this.selectedRaceId.set(null);
    this.error.set(null);
    this.processingMessage.set('');
    this.originalImageUrl.set(null);
    this.processedImageUrl.set(null);

    // Clear retry state
    this.dateSearchLoading.set(false);
    this.dateSearchAttempts.set(0);
    this.dateSearchCooldownRemaining.set(0);
    this.resultsRetryLoading.set(false);
    this.resultsRetryAttempts.set(0);
    this.resultsRetryCooldownRemaining.set(0);
    for (const timer of this.cooldownTimers.values()) {
      clearInterval(timer);
    }
    this.cooldownTimers.clear();
  }

  /**
   * Step 0: Create trophy, upload image, remove background, AI analyze
   */
  async uploadAndProcess(
    imageBlob: Blob,
    type: 'medal' | 'bib',
    imagePreviewUrl?: string
  ): Promise<void> {
    this.step.set('processing');
    this.processingPhase.set('creating');
    this.error.set(null);

    if (imagePreviewUrl) {
      this.originalImageUrl.set(imagePreviewUrl);
    }

    try {
      // 1. Create trophy (also checks scan limit for free users)
      this.processingMessage.set('Creating trophy...');
      const createRes = await this.api.client.api.trophies.$post({
        json: { type },
      });

      // Handle scan limit reached (403)
      if (createRes.status === 403) {
        const errJson = (await createRes.json()) as { error?: string };
        if (errJson.error === 'scan_limit_reached') {
          this.error.set('scan_limit_reached');
          this.step.set('idle');
          this.processingPhase.set('idle');
          this.userService.fetchProfile();
          return;
        }
        throw new Error(errJson.error ?? 'Forbidden');
      }

      if (!createRes.ok) throw new Error('Failed to create trophy');

      const createJson = (await createRes.json()) as { data: { id: string } };
      const tId = createJson.data.id;
      this.trophyId.set(tId);

      // 2. Upload image via presigned URL
      this.processingPhase.set('uploading');
      this.processingMessage.set('Uploading image...');
      const uploaded = await this.uploadService.uploadFile(
        imageBlob,
        'trophy-photo',
        'image/webp',
        tId
      );
      if (!uploaded) throw new Error('Upload failed');

      // 3. Remove background (synchronous endpoint)
      this.processingPhase.set('removing-bg');
      this.processingMessage.set('Removing background...');
      const removeBgRes =
        await this.api.client.api.scan['remove-background'].$post({
          json: { trophyId: tId },
        });
      if (removeBgRes.ok) {
        const bgJson = (await removeBgRes.json()) as { data: ProcessedUrls };
        this.processedUrls.set(bgJson.data);
        this.processedImageUrl.set(bgJson.data.processedImageUrl);
      }

      // Pause at bg-done so user appreciates the before/after reveal
      this.processingPhase.set('bg-done');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 4. AI analysis
      this.processingPhase.set('analyzing');
      this.processingMessage.set('Analyzing trophy...');
      const analyzeRes = await this.api.client.api.scan.analyze.$post({
        json: { trophyId: tId },
      });

      if (analyzeRes.ok) {
        const analyzeJson = (await analyzeRes.json()) as {
          data: ScanAnalysis;
        };
        if (analyzeJson.data.hasPornContent) {
          this.error.set('review.inappropriateContent');
          this.step.set('idle');
          this.processingPhase.set('idle');
          return;
        }
        this.analysis.set(analyzeJson.data);
      } else {
        throw new Error('Analysis failed');
      }

      this.processingPhase.set('analyze-done');

      // Move to details step
      this.step.set('details');

      // Update scan count and show toast
      this.userService.decrementScansRemaining();
      const remaining = this.userService.scansRemaining();
      if (remaining !== null) {
        const message = this.translate.instant('scan.remainingToast', { count: remaining });
        const toast = await this.toastController.create({
          message,
          duration: 3000,
          position: 'bottom',
          color: remaining === 0 ? 'warning' : 'success',
        });
        await toast.present();
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Processing failed');
      this.step.set('idle');
      this.processingPhase.set('idle');
    }
  }

  /**
   * Search for matching races in the database
   */
  async searchMatchingRaces(
    raceName: string,
    date?: string,
    sport?: string
  ): Promise<MatchedRace[]> {
    try {
      const res = await this.api.client.api.races.search.$get({
        query: {
          q: raceName,
          date,
          sport: sport as 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other' | undefined,
        },
      });

      if (res.ok) {
        const json = (await res.json()) as { data: MatchedRace[] };
        return json.data;
      }
    } catch {
      // silently fail — matching is optional
    }
    return [];
  }

  /**
   * Step 1 → 2: Validate race details, create race + result, then search
   */
  async validateAndSearch(details: {
    type: 'medal' | 'bib';
    raceName: string;
    date?: string;
    city?: string;
    country?: string;
    distance?: string;
    sport?: 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'other';
    raceId?: string;
  }): Promise<void> {
    const tId = this.trophyId();
    if (!tId) return;

    this.step.set('search');
    this.error.set(null);
    this.processingMessage.set('Searching for results...');

    try {
      // Validate: creates race + race_result in DB (or reuses existing race)
      const validateRes = await this.api.client.api.scan.validate.$post({
        json: {
          trophyId: tId,
          type: details.type,
          raceName: details.raceName,
          date: details.date,
          city: details.city,
          country: details.country,
          distance: details.distance,
          sport: details.sport,
          raceId: details.raceId,
        },
      });

      if (!validateRes.ok) {
        this.step.set('done');
        return;
      }

      const validateJson = (await validateRes.json()) as {
        data: { race: { id: string }; raceResult: { id: string } };
      };
      this.raceResultId.set(validateJson.data.raceResult.id);

      // Search results using AI
      const searchRes = await this.api.client.api.scan['search-results'].$post({
        json: { raceResultId: validateJson.data.raceResult.id },
      });

      if (searchRes.ok) {
        const searchJson = (await searchRes.json()) as {
          data: SearchResult;
        };
        this.searchResult.set(searchJson.data);
      }

      this.step.set('done');
    } catch {
      this.step.set('done');
    }
  }

  /**
   * Step 3: Auto-place trophy on wall
   */
  async autoPlaceTrophy(): Promise<boolean> {
    const tId = this.trophyId();
    if (!tId) return false;

    await this.roomService.fetchMyRoom();
    return this.roomService.addItemToRoom(tId);
  }

  /**
   * Search for race date via AI + Google Search
   */
  async searchDateForField(params: {
    raceName: string;
    year: string;
    sportKind?: string | null;
    city?: string | null;
    country?: string | null;
  }): Promise<string | null> {
    if (this.dateSearchAttempts() >= MAX_RETRY_ATTEMPTS) return null;
    if (this.dateSearchCooldownRemaining() > 0) return null;
    if (this.dateSearchLoading()) return null;

    this.dateSearchLoading.set(true);
    this.dateSearchAttempts.update((n) => n + 1);

    try {
      const res = await this.api.client.api.scan['search-date'].$post({
        json: {
          raceName: params.raceName,
          year: params.year,
          sportKind: (params.sportKind as any) ?? null,
          city: params.city ?? null,
          country: params.country ?? null,
        },
      });

      if (res.ok) {
        const json = (await res.json()) as { data: { found: boolean; date: string | null } };
        return json.data.date;
      }
      return null;
    } catch {
      return null;
    } finally {
      this.dateSearchLoading.set(false);
      this.startCooldownTimer('dateSearch');
    }
  }

  /**
   * Retry searching for race results
   */
  async retrySearchResults(): Promise<void> {
    const rrId = this.raceResultId();
    if (!rrId) return;
    if (this.resultsRetryAttempts() >= MAX_RETRY_ATTEMPTS) return;
    if (this.resultsRetryCooldownRemaining() > 0) return;
    if (this.resultsRetryLoading()) return;

    this.resultsRetryLoading.set(true);
    this.resultsRetryAttempts.update((n) => n + 1);

    try {
      const res = await this.api.client.api.scan['search-results'].$post({
        json: { raceResultId: rrId },
      });

      if (res.ok) {
        const json = (await res.json()) as { data: SearchResult };
        this.searchResult.set(json.data);
      }
    } catch {
      // silently fail
    } finally {
      this.resultsRetryLoading.set(false);
      this.startCooldownTimer('resultsRetry');
    }
  }

  private startCooldownTimer(type: 'dateSearch' | 'resultsRetry'): void {
    const existing = this.cooldownTimers.get(type);
    if (existing) clearInterval(existing);

    const cooldownSignal = type === 'dateSearch'
      ? this.dateSearchCooldownRemaining
      : this.resultsRetryCooldownRemaining;

    cooldownSignal.set(Math.ceil(RETRY_COOLDOWN_MS / 1000));

    const timer = setInterval(() => {
      const remaining = cooldownSignal() - 1;
      if (remaining <= 0) {
        cooldownSignal.set(0);
        clearInterval(timer);
        this.cooldownTimers.delete(type);
      } else {
        cooldownSignal.set(remaining);
      }
    }, 1000);

    this.cooldownTimers.set(type, timer);
  }
}
