import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  effect,
} from '@angular/core';
import { extend, NgtArgs, injectStore } from 'angular-three';
import {
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  PointLight,
  Color,
} from 'three';

import { TrophyFrameComponent } from '../trophy-frame/trophy-frame.component';
import { DecorationModelComponent } from '../decoration-model/decoration-model.component';
import { CameraControlsComponent } from '../camera-controls/camera-controls.component';
import { RoomTheme, DEFAULT_THEME } from '@app/types/room-theme';

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

export interface RoomItem3D {
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
    raceResult?: {
      time: string | null;
      ranking: number | null;
      categoryRanking: number | null;
      race: {
        name: string;
        date: string | null;
        city: string | null;
        country: string | null;
        sport: string | null;
      };
    } | null;
  } | null;
  decoration?: {
    id: string;
    name: string;
    modelUrl: string | null;
  } | null;
}

@Component({
  selector: 'app-pain-cave-scene',
  standalone: true,
  imports: [NgtArgs, TrophyFrameComponent, DecorationModelComponent, CameraControlsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Camera controls (orbit/zoom/pan) -->
    <app-camera-controls
      [inspectedItemId]="inspectedItemId()"
      [items]="items()"
    />

    <!-- Lighting -->
    <ngt-ambient-light [intensity]="theme().ambientLight.intensity" />
    <ngt-directional-light
      [position]="theme().mainLight.position"
      [intensity]="theme().mainLight.intensity"
      [castShadow]="true"
    />
    <ngt-point-light [position]="[0, 2.5, 0]" [intensity]="theme().accentLight.intensity" [color]="theme().accentLight.color" />

    <!-- Floor -->
    <ngt-mesh
      [rotation]="[-Math.PI / 2, 0, 0]"
      [position]="[0, 0, 0]"
      [receiveShadow]="true"
    >
      <ngt-box-geometry *args="[ROOM_WIDTH, ROOM_DEPTH, WALL_THICKNESS]" />
      <ngt-mesh-standard-material [color]="theme().floor.color" [roughness]="theme().floor.roughness" />
    </ngt-mesh>

    <!-- Left Wall -->
    <ngt-mesh
      [position]="[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]"
      [receiveShadow]="true"
    >
      <ngt-box-geometry *args="[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]" />
      <ngt-mesh-standard-material [color]="theme().leftWall.color" [roughness]="theme().leftWall.roughness" />
    </ngt-mesh>

    <!-- Back Wall -->
    <ngt-mesh
      [position]="[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]"
      [receiveShadow]="true"
    >
      <ngt-box-geometry *args="[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]" />
      <ngt-mesh-standard-material [color]="theme().backWall.color" [roughness]="theme().backWall.roughness" />
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
  inspectedItemId = input<string | null>(null);
  dimOthers = input(false);
  theme = input<RoomTheme>(DEFAULT_THEME);
  itemPressed = output<string>();

  private store = injectStore();

  constructor() {
    // Update scene background when theme changes
    effect(() => {
      const bg = this.theme().background;
      const scene = this.store.snapshot.scene;
      if (scene) {
        scene.background = new Color(bg);
      }
    });
  }

  // Expose constants to template
  readonly Math = Math;
  readonly ROOM_WIDTH = ROOM_WIDTH;
  readonly ROOM_DEPTH = ROOM_DEPTH;
  readonly ROOM_HEIGHT = ROOM_HEIGHT;
  readonly WALL_THICKNESS = WALL_THICKNESS;

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
