import { Component, input } from '@angular/core';

@Component({
  selector: 'app-image-reveal',
  standalone: true,
  template: `
    <div class="reveal-container">
      <div class="image-pair">
        <div class="image-box">
          <img [src]="originalUrl()" alt="original" />
          <span class="label">Original</span>
        </div>
        <div class="image-box">
          <img [src]="processedUrl()" alt="processed" />
          <span class="label">Processed</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .reveal-container {
      padding: 8px 0;
    }

    .image-pair {
      display: flex;
      gap: 12px;
    }

    .image-box {
      flex: 1;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
      }

      .label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 11px;
        font-weight: 600;
        text-align: center;
      }
    }
  `,
})
export class ImageRevealComponent {
  originalUrl = input.required<string>();
  processedUrl = input.required<string>();
}
