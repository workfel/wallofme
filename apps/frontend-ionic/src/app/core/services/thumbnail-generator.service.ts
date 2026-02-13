import { Injectable } from '@angular/core';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Box3,
  Vector3,
} from 'three';
import { GLTFLoader } from 'three-stdlib';

@Injectable({ providedIn: 'root' })
export class ThumbnailGeneratorService {
  private renderer: WebGLRenderer | null = null;
  private cache = new Map<string, string>();

  private ensureRenderer(): WebGLRenderer {
    if (!this.renderer) {
      this.renderer = new WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      this.renderer.setSize(256, 256);
      this.renderer.setPixelRatio(1);
    }
    return this.renderer;
  }

  async generateThumbnail(modelUrl: string): Promise<string> {
    const cached = this.cache.get(modelUrl);
    if (cached) return cached;

    const renderer = this.ensureRenderer();
    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);

    // Lighting
    scene.add(new AmbientLight(0xffffff, 0.8));
    const dirLight = new DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);

    // Load model
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(modelUrl, resolve, undefined, reject);
    });

    const model = gltf.scene.clone();

    // Auto-fit model in view
    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 1.2 / maxDim : 1;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));

    scene.add(model);

    // Isometric-ish camera position
    camera.position.set(1.5, 1.2, 1.5);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    // Dispose clone
    model.traverse((child: any) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.cache.set(modelUrl, dataUrl);
    return dataUrl;
  }

  dispose(): void {
    this.renderer?.dispose();
    this.renderer = null;
  }
}
