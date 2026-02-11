import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { gltfResource } from 'angular-three-soba/loaders';

@Component({
  selector: 'app-decoration-model',
  standalone: true,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (gltf.value(); as gltf) {
      <ngt-primitive
        *args="[gltf.scene]"
        [position]="position()"
        [rotation]="[0, rotationY(), 0]"
        [scale]="0.5"
      />
    }
  `,
})
export class DecorationModelComponent {
  modelUrl = input.required<string>();
  position = input<[number, number, number]>([0, 0, 0]);
  rotationY = input(0);

  gltf = gltfResource(() => this.modelUrl());
}
