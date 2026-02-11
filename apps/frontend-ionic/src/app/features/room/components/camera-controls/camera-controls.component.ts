import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtsOrbitControls } from 'angular-three-soba/controls';

@Component({
  selector: 'app-camera-controls',
  standalone: true,
  imports: [NgtsOrbitControls],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngts-orbit-controls
      [options]="controlsOptions"
    />
  `,
})
export class CameraControlsComponent {
  readonly controlsOptions = {
    target: [0, 1, 0] as [number, number, number],
    minDistance: 3,
    maxDistance: 15,
    minPolarAngle: 0.2,
    maxPolarAngle: Math.PI / 2.2,
    enableDamping: true,
    dampingFactor: 0.05,
  };
}
