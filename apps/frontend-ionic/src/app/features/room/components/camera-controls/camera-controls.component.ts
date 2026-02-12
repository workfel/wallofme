import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  effect,
  signal,
} from '@angular/core';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectStore, injectBeforeRender } from 'angular-three';
import { Vector3 } from 'three';
import type { RoomItem3D } from '../pain-cave-scene/pain-cave-scene.component';

// Default isometric camera position
const DEFAULT_POSITION = new Vector3(5, 5, 5);
const DEFAULT_TARGET = new Vector3(0, 1, 0);

// Offset from item position for inspection framing
const INSPECT_DISTANCE = 2.0;
const INSPECT_Y_OFFSET = 0.3;

// Animation speed (higher = faster lerp)
const LERP_SPEED = 3;

@Component({
  selector: 'app-camera-controls',
  standalone: true,
  imports: [NgtsOrbitControls],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngts-orbit-controls
      [options]="{
        minDistance: 2,
        maxDistance: 15,
        minPolarAngle: 0.2,
        maxPolarAngle: 1.42,
        enableDamping: true,
        makeDefault: true
      }"
    />
  `,
})
export class CameraControlsComponent {
  inspectedItemId = input<string | null>(null);
  items = input<RoomItem3D[]>([]);

  private store = injectStore();

  // Animation targets
  private targetCamPos = new Vector3().copy(DEFAULT_POSITION);
  private targetLookAt = new Vector3().copy(DEFAULT_TARGET);
  private isAnimating = signal(false);
  private wasInspecting = false;

  constructor() {
    // Only animate when inspection state actually changes
    effect(() => {
      const itemId = this.inspectedItemId();

      if (itemId) {
        // Zoom into item
        const item = this.items().find((i) => i.id === itemId);
        if (!item) return;

        const itemPos = this.getItemWorldPosition(item);
        this.targetLookAt.set(itemPos[0], itemPos[1], itemPos[2]);
        this.targetCamPos.set(
          itemPos[0] + INSPECT_DISTANCE,
          itemPos[1] + INSPECT_Y_OFFSET + INSPECT_DISTANCE * 0.6,
          itemPos[2] + INSPECT_DISTANCE,
        );
        this.wasInspecting = true;
        this.isAnimating.set(true);
      } else if (this.wasInspecting) {
        // Only animate back if we were previously inspecting
        this.targetCamPos.copy(DEFAULT_POSITION);
        this.targetLookAt.copy(DEFAULT_TARGET);
        this.wasInspecting = false;
        this.isAnimating.set(true);
      }
      // On first load (null and never inspected), do nothing — let the user freely orbit
    });

    // Smooth camera animation
    injectBeforeRender(({ camera, delta }) => {
      if (!this.isAnimating()) return;

      const controls = this.store.snapshot.controls as unknown as { target?: Vector3; update?: () => void };
      if (!controls) return;

      // Lerp camera position
      camera.position.lerp(this.targetCamPos, LERP_SPEED * delta);

      // Lerp orbit controls target
      if (controls.target) {
        controls.target.lerp(this.targetLookAt, LERP_SPEED * delta);
        controls.update?.();
      }

      // Stop animating when close enough
      const posDist = camera.position.distanceTo(this.targetCamPos);
      const targetDist = controls.target
        ? controls.target.distanceTo(this.targetLookAt)
        : 0;
      if (posDist < 0.01 && targetDist < 0.01) {
        this.isAnimating.set(false);
      }
    });
  }

  private getItemWorldPosition(item: RoomItem3D): [number, number, number] {
    if (item.wall === 'left') {
      return [-3 + 0.08, item.positionY || 1.5, item.positionZ || 0];
    }
    if (item.wall === 'right') {
      return [item.positionX || 0, item.positionY || 1.5, -3 + 0.08];
    }
    return [item.positionX, 0.5, item.positionZ];
  }
}
