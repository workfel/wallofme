import { Injectable } from '@angular/core';

export interface StoryCardOptions {
  trophyImageUrl: string;
  raceName: string;
  time: string | null;
  percentile: number | null;
  themeColor: string;
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

@Injectable({ providedIn: 'root' })
export class ShareCardService {
  /**
   * Generates a 1080x1920 (9:16) story-optimized PNG image using OffscreenCanvas.
   */
  async generateStoryCard(options: StoryCardOptions): Promise<Blob> {
    const { trophyImageUrl, raceName, time, percentile, themeColor } = options;

    const canvas = new OffscreenCanvas(CARD_WIDTH, CARD_HEIGHT);
    const ctx = canvas.getContext('2d')!;

    // 1. Background gradient from theme color
    const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    gradient.addColorStop(0, this.darkenColor(themeColor, 0.3));
    gradient.addColorStop(0.5, themeColor);
    gradient.addColorStop(1, this.darkenColor(themeColor, 0.5));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Subtle noise overlay for texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * CARD_WIDTH;
      const y = Math.random() * CARD_HEIGHT;
      const size = Math.random() * 3 + 1;
      ctx.fillRect(x, y, size, size);
    }

    // 2. Load and draw trophy image
    let trophyY = 350;
    try {
      const response = await fetch(trophyImageUrl);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      const maxWidth = 600;
      const maxHeight = 700;
      const scale = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height);
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      const drawX = (CARD_WIDTH - drawWidth) / 2;
      const drawY = trophyY;

      // Draw rounded rect with shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 16;

      // Clip to rounded rectangle
      const radius = 24;
      ctx.beginPath();
      ctx.roundRect(drawX, drawY, drawWidth, drawHeight, radius);
      ctx.clip();
      ctx.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      trophyY = drawY + drawHeight + 60;
      bitmap.close();
    } catch {
      // If image fails to load, leave space and continue
      trophyY = 1050 + 60;
    }

    // 3. Race name
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    this.drawWrappedText(ctx, raceName, CARD_WIDTH / 2, trophyY, CARD_WIDTH - 120, 60);

    // Calculate next Y position based on text lines
    const lineCount = this.getLineCount(ctx, raceName, CARD_WIDTH - 120);
    let currentY = trophyY + lineCount * 60 + 20;

    // 4. Time
    if (time) {
      ctx.font = '600 40px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(time, CARD_WIDTH / 2, currentY);
      currentY += 60;
    }

    // 5. Percentile (Pro only)
    if (percentile != null) {
      currentY += 10;
      const percentileText = `🔥 Top ${percentile}%`;
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(percentileText, CARD_WIDTH / 2, currentY);
      currentY += 60;
    }

    // 6. Separator
    currentY += 20;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CARD_WIDTH / 2 - 100, currentY);
    ctx.lineTo(CARD_WIDTH / 2 + 100, currentY);
    ctx.stroke();

    // 7. Branding at bottom
    const brandingY = CARD_HEIGHT - 120;
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('WallOfMe', CARD_WIDTH / 2, brandingY);

    ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('wallofme.app', CARD_WIDTH / 2, brandingY + 45);

    return canvas.convertToBlob({ type: 'image/png' });
  }

  private drawWrappedText(
    ctx: OffscreenCanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ): void {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  private getLineCount(
    ctx: OffscreenCanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): number {
    const words = text.split(' ');
    let line = '';
    let count = 1;

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        line = word;
        count++;
      } else {
        line = testLine;
      }
    }
    return count;
  }

  private darkenColor(hex: string, amount: number): string {
    // Parse hex color
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    const darken = (c: number) => Math.max(0, Math.round(c * (1 - amount)));

    return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
  }
}
