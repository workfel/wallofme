import { Injectable, signal } from '@angular/core';
import type { WebGLRenderer, Scene, Camera } from 'three';

@Injectable({ providedIn: 'root' })
export class ScreenshotService {
  readonly capturing = signal(false);

  // Registered by PainCaveSceneComponent (inside canvas context)
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: Camera | null = null;

  /**
   * Called from inside the canvas context to provide access to Three.js internals.
   */
  registerThreeContext(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
  }

  unregisterThreeContext(): void {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  /**
   * Captures the Three.js scene by forcing a render with the current camera,
   * overlays branding, and returns a PNG Blob.
   */
  async captureRoom(): Promise<Blob> {
    this.capturing.set(true);
    try {
      if (!this.renderer || !this.scene || !this.camera) {
        throw new Error('Three.js context not registered');
      }

      // Force a fresh render so the buffer contains the current scene state
      this.renderer.render(this.scene, this.camera);

      const canvas = this.renderer.domElement;
      const width = canvas.width;
      const height = canvas.height;

      // Create offscreen canvas for compositing
      const offscreen = new OffscreenCanvas(width, height);
      const ctx = offscreen.getContext('2d')!;

      // Draw the freshly rendered 3D scene
      ctx.drawImage(canvas, 0, 0);

      // Overlay branding in bottom-right corner
      const fontSize = Math.max(14, Math.round(height * 0.028));
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      const text = 'WallOfMe';
      const padding = Math.round(fontSize * 0.8);
      const x = width - padding;
      const y = height - padding;

      // Text shadow for readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(text, x + 1, y + 1);

      // White text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(text, x, y);

      const blob = await offscreen.convertToBlob({ type: 'image/png' });
      return blob;
    } finally {
      this.capturing.set(false);
    }
  }
}
