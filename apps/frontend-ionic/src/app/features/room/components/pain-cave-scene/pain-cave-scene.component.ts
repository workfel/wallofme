import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  EventEmitter,
} from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import {
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  PointLight,
} from 'three';

import { TrophyFrameComponent } from '../trophy-frame/trophy-frame.component';
import { DecorationModelComponent } from '../decoration-model/decoration-model.component';
import { CameraControlsComponent } from '../camera-controls/camera-controls.component';

// Register THREE.js elements
extend({
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  PointLight,
});

// Room dimensions — must match room-placement.ts
const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;
const WALL_THICKNESS = 0.15;

// Diorama palette
const FLOOR_COLOR = '#c9a87c';
const LEFT_WALL_COLOR = '#faedcd';
const BACK_WALL_COLOR = '#fefae0';

export type RoomItem3D = {
  id: string;
  trophyId: string | null;
  decorationId: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  wall: 'left' | 'right' | null;
  trophy?: {
    id: string;
    type: 'medal' | 'bib';
    textureUrl: string | null;
    thumbnailUrl: string | null;
  } | null;
  decoration?: {
    id: string;
    name: string;
    modelUrl: string | null;
  } | null;
};

@Component({
  selector: 'app-pain-cave-scene',
  standalone: true,
  imports: [NgtArgs, TrophyFrameComponent, DecorationModelComponent, CameraControlsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Camera controls (orbit/zoom/pan) -->
    <app-camera-controls />

    <!-- Lighting -->
    <ngt-ambient-light [intensity]="1.0" />
    <ngt-directional-light
      [position]="[5, 8, 5]"
      [intensity]="1.5"
      [castShadow]="true"
    />
    <ngt-point-light [position]="[0, 2.5, 0]" [intensity]="0.5" color="#fff5e6" />

    <!-- Floor -->
    <ngt-mesh
      [rotation]="[-Math.PI / 2, 0, 0]"
      [position]="[0, 0, 0]"
      [receiveShadow]="true"
    >
      <ngt-box-geometry *args="[ROOM_WIDTH, ROOM_DEPTH, WALL_THICKNESS]" />
      <ngt-mesh-standard-material [color]="FLOOR_COLOR" [roughness]="0.9" />
    </ngt-mesh>

    <!-- Left Wall -->
    <ngt-mesh
      [position]="[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]"
      [receiveShadow]="true"
    >
      <ngt-box-geometry *args="[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]" />
      <ngt-mesh-standard-material [color]="LEFT_WALL_COLOR" [roughness]="0.95" />
    </ngt-mesh>

    <!-- Back Wall -->
    <ngt-mesh
      [position]="[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]"
      [receiveShadow]="true"
    >
      <ngt-box-geometry *args="[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]" />
      <ngt-mesh-standard-material [color]="BACK_WALL_COLOR" [roughness]="0.95" />
    </ngt-mesh>

    <!-- Trophy items on walls -->
    @for (item of trophyItems(); track item.id) {
      <app-trophy-frame
        [textureUrl]="item.trophy!.textureUrl!"
        [trophyType]="item.trophy!.type"
        [position]="getWallPosition(item).position"
        [rotation]="getWallPosition(item).rotation"
        [editable]="editable()"
        (pressed)="itemPressed.emit(item.id)"
      />
    }

    <!-- Decoration items on floor -->
    @for (item of decorationItems(); track item.id) {
      <app-decoration-model
        [modelUrl]="item.decoration!.modelUrl!"
        [position]="[item.positionX, 0, item.positionZ]"
        [rotationY]="item.rotationY"
      />
    }
  `,
})
export class PainCaveSceneComponent {
  items = input<RoomItem3D[]>([]);
  editable = input(false);
  itemPressed = output<string>();

  // Expose constants to template
  readonly Math = Math;
  readonly ROOM_WIDTH = ROOM_WIDTH;
  readonly ROOM_DEPTH = ROOM_DEPTH;
  readonly ROOM_HEIGHT = ROOM_HEIGHT;
  readonly WALL_THICKNESS = WALL_THICKNESS;
  readonly FLOOR_COLOR = FLOOR_COLOR;
  readonly LEFT_WALL_COLOR = LEFT_WALL_COLOR;
  readonly BACK_WALL_COLOR = BACK_WALL_COLOR;

  trophyItems(): RoomItem3D[] {
    return this.items().filter(
      (item) => item.trophyId && item.trophy?.textureUrl
    );
  }

  decorationItems(): RoomItem3D[] {
    return this.items().filter(
      (item) => item.decorationId && item.decoration?.modelUrl
    );
  }

  getWallPosition(item: RoomItem3D): {
    position: [number, number, number];
    rotation: [number, number, number];
  } {
    const y = item.positionY || 1.5;
    const offset = WALL_THICKNESS / 2 + 0.01;

    if (item.wall === 'left') {
      return {
        position: [-ROOM_WIDTH / 2 + offset, y, item.positionZ || 0],
        rotation: [0, Math.PI / 2, 0],
      };
    }

    // "right" in DB → back wall in 3D
    return {
      position: [item.positionX || 0, y, -ROOM_DEPTH / 2 + offset],
      rotation: [0, 0, 0],
    };
  }
}
