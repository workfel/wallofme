import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export type UploadType = 'trophy-photo' | 'avatar' | 'room-thumbnail';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private api = inject(ApiService);

  /**
   * Full upload flow:
   * 1. Get presigned URL from backend
   * 2. Upload file directly to R2
   * 3. Confirm upload with backend
   */
  async uploadFile(
    file: Blob,
    type: UploadType,
    contentType: string,
    trophyId?: string
  ): Promise<{ key: string } | null> {
    try {
      // Step 1: Get presigned URL
      const presignRes = await this.api.client.api.upload['presigned-url'].$post(
        {
          json: { type, contentType },
        }
      );
      if (!presignRes.ok) return null;

      const { url, key } = (await presignRes.json()) as {
        url: string;
        key: string;
      };

      // Step 2: Upload to R2
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': contentType },
      });
      if (!uploadRes.ok) return null;

      // Step 3: Confirm upload
      if (trophyId) {
        const confirmRes = await this.api.client.api.upload.confirm[
          ':id'
        ].$post({
          param: { id: trophyId },
          json: { key },
        });
        if (!confirmRes.ok) return null;
      }

      return { key };
    } catch {
      return null;
    }
  }
}
