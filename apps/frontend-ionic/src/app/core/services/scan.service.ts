import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { UploadService } from './upload.service';
import { RoomService } from './room.service';

export type ScanStep = 'idle' | 'processing' | 'details' | 'search' | 'done';

export type ScanAnalysis = {
  imageKind: 'medal' | 'bib' | 'unknown';
  raceName: string | null;
  date: string | null;
  city: string | null;
  country: string | null;
  sportKind: string | null;
  distance: string | null;
  hasPornContent: boolean;
};

export type ProcessedUrls = {
  processedImageUrl: string;
  textureUrl: string;
  thumbnailUrl: string;
};

export type SearchResult = {
  found: boolean;
  time: string | null;
  ranking: number | null;
  categoryRanking: number | null;
  totalParticipants: number | null;
};

@Injectable({ providedIn: 'root' })
export class ScanService {
  private api = inject(ApiService);
  private uploadService = inject(UploadService);
  private roomService = inject(RoomService);

  readonly step = signal<ScanStep>('idle');
  readonly trophyId = signal<string | null>(null);
  readonly raceResultId = signal<string | null>(null);
  readonly analysis = signal<ScanAnalysis | null>(null);
  readonly processedUrls = signal<ProcessedUrls | null>(null);
  readonly searchResult = signal<SearchResult | null>(null);
  readonly error = signal<string | null>(null);
  readonly processingMessage = signal('');
  readonly isProcessing = computed(() => this.step() === 'processing');

  reset(): void {
    this.step.set('idle');
    this.trophyId.set(null);
    this.raceResultId.set(null);
    this.analysis.set(null);
    this.processedUrls.set(null);
    this.searchResult.set(null);
    this.error.set(null);
    this.processingMessage.set('');
  }

  /**
   * Step 0: Create trophy, upload image, remove background, AI analyze
   */
  async uploadAndProcess(
    imageBlob: Blob,
    type: 'medal' | 'bib'
  ): Promise<void> {
    this.step.set('processing');
    this.error.set(null);

    try {
      // 1. Create trophy
      this.processingMessage.set('Creating trophy...');
      const createRes = await this.api.client.api.trophies.$post({
        json: { type },
      });
      if (!createRes.ok) throw new Error('Failed to create trophy');

      const createJson = (await createRes.json()) as { data: { id: string } };
      const tId = createJson.data.id;
      this.trophyId.set(tId);

      // 2. Upload image via presigned URL
      this.processingMessage.set('Uploading image...');
      const uploaded = await this.uploadService.uploadFile(
        imageBlob,
        'trophy-photo',
        'image/webp',
        tId
      );
      if (!uploaded) throw new Error('Upload failed');

      // 3. Remove background (synchronous endpoint)
      this.processingMessage.set('Removing background...');
      const removeBgRes =
        await this.api.client.api.scan['remove-background'].$post({
          json: { trophyId: tId },
        });
      if (removeBgRes.ok) {
        const bgJson = (await removeBgRes.json()) as { data: ProcessedUrls };
        this.processedUrls.set(bgJson.data);
      }

      // 4. AI analysis
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
          return;
        }
        this.analysis.set(analyzeJson.data);
      }

      // Move to details step
      this.step.set('details');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Processing failed');
      this.step.set('idle');
    }
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
  }): Promise<void> {
    const tId = this.trophyId();
    if (!tId) return;

    this.step.set('search');
    this.error.set(null);
    this.processingMessage.set('Searching for results...');

    try {
      // Validate: creates race + race_result in DB
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
}
