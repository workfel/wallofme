import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  effect,
  signal,
  computed,
} from '@angular/core';
import { extend, NgtArgs, injectStore } from 'angular-three';
import {
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
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
  MeshBasicMaterial,
  AmbientLight,
  DirectionalLight,
  PointLight,
});

// Room dimensions — must match room-placement.ts
const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;
const WALL_THICKNESS = 0.15;

// Floor bounds for drag clamping
const FLOOR_HALF_X = ROOM_WIDTH / 2 - 0.3;
const FLOOR_HALF_Z = ROOM_DEPTH / 2 - 0.3;

export interface RoomItem3D {
  id: string;
  trophyId: string | null;
  decorationId: string | null;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationY: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
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

export interface ItemDragEvent {
  itemId: string;
  positionX: number;
  positionY?: number;
  positionZ: number;
  rotationY?: number;
}

@Component({
  selector: 'app-pain-cave-scene',
  standalone: true,
  imports: [NgtArgs, TrophyFrameComponent, DecorationModelComponent, CameraControlsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Camera controls — disabled only during active drag -->
    <app-camera-controls
      [inspectedItemId]="inspectedItemId()"
      [items]="items()"
      [enabled]="!isDragging()"
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

    <!-- Invisible floor drag plane — captures XZ drag events -->
    <ngt-mesh
      [rotation]="[-Math.PI / 2, 0, 0]"
      [position]="[0, 0.02, 0]"
      [visible]="false"
      (pointermove)="onDragMove($event)"
      (pointerup)="onDragEnd($event)"
    >
      <ngt-plane-geometry *args="[20, 20]" />
      <ngt-mesh-basic-material />
    </ngt-mesh>

    <!-- Invisible vertical drag plane — captures Y drag events (faces camera at 45°) -->
    <ngt-mesh
      [position]="[0, ROOM_HEIGHT / 2, 0]"
      [rotation]="[0, Math.PI / 4, 0]"
      [visible]="false"
      (pointermove)="onVerticalDragMove($event)"
      (pointerup)="onDragEnd($event)"
    >
      <ngt-plane-geometry *args="[20, 20]" />
      <ngt-mesh-basic-material />
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
        [position]="[item.positionX, item.positionY, item.positionZ]"
        [rotationY]="item.rotationY"
        [scale]="item.scaleX ?? 0.5"
        [editable]="editable()"
        [selected]="item.id === selectedItemId()"
        (pressed)="onDecorationTapped(item.id)"
        (dragStart)="onLongPressStart(item.id, $event)"
        (heightDragStart)="onHeightDragStart(item.id, $event)"
        (rotationDragStart)="onRotationDragStart(item.id, $event)"
      />
    }
  `,
})
export class PainCaveSceneComponent {
  items = input<RoomItem3D[]>([]);
  editable = input(false);
  inspectedItemId = input<string | null>(null);
  selectedItemId = input<string | null>(null);
  dimOthers = input(false);
  theme = input<RoomTheme>(DEFAULT_THEME);

  itemPressed = output<string>();
  itemDragged = output<ItemDragEvent>();
  itemDragEnd = output<ItemDragEvent>();

  isDragging = signal(false);
  private dragMode: 'none' | 'floor' | 'height' | 'rotation' = 'none';
  private dragItemId: string | null = null;
  private lastDragPosition = { x: 0, y: 0, z: 0 };
  private lastDragRotationY = 0;
  private rotationDragStartAngle = 0;
  private rotationDragItemStartAngle = 0;

  private store = injectStore();

  constructor() {
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

    return {
      position: [item.positionX || 0, y, -ROOM_DEPTH / 2 + offset],
      rotation: [0, 0, 0],
    };
  }

  // ─── Tap: select item and show bottom sheet ─────
  onDecorationTapped(itemId: string): void {
    this.itemPressed.emit(itemId);
  }

  // ─── Long press: enter floor drag mode ──────────
  onLongPressStart(itemId: string, _event: any): void {
    this.dragItemId = itemId;
    this.dragMode = 'floor';
    this.isDragging.set(true);
    this.itemPressed.emit(itemId);

    const item = this.items().find((i) => i.id === itemId);
    if (item) {
      this.lastDragPosition = { x: item.positionX, y: item.positionY, z: item.positionZ };
      this.lastDragRotationY = item.rotationY;
    }
  }

  // ─── Height gizmo: enter height drag mode ─────
  onHeightDragStart(itemId: string, _event: any): void {
    this.dragItemId = itemId;
    this.dragMode = 'height';
    this.isDragging.set(true);

    const item = this.items().find((i) => i.id === itemId);
    if (item) {
      this.lastDragPosition = { x: item.positionX, y: item.positionY, z: item.positionZ };
      this.lastDragRotationY = item.rotationY;
    }
  }

  // ─── Rotation gizmo: enter rotation drag mode ──
  onRotationDragStart(itemId: string, event: any): void {
    this.dragItemId = itemId;
    this.dragMode = 'rotation';
    this.isDragging.set(true);

    const item = this.items().find((i) => i.id === itemId);
    if (item) {
      this.lastDragPosition = { x: item.positionX, y: item.positionY, z: item.positionZ };
      this.lastDragRotationY = item.rotationY;
      this.rotationDragItemStartAngle = item.rotationY;

      // Compute initial angle from item center to pointer on the floor plane
      const point = event?.point;
      if (point) {
        this.rotationDragStartAngle = Math.atan2(
          point.x - item.positionX,
          point.z - item.positionZ,
        );
      }
    }
  }

  // ─── Floor drag plane: XZ movement ─────────────
  onDragMove(event: any): void {
    if (!this.isDragging() || !this.dragItemId) return;
    if (this.dragMode === 'height') return; // ignore floor plane for height drag
    event?.stopPropagation?.();

    const point = event.point;
    if (!point) return;

    if (this.dragMode === 'floor') {
      const x = Math.max(-FLOOR_HALF_X, Math.min(FLOOR_HALF_X, point.x));
      const z = Math.max(-FLOOR_HALF_Z, Math.min(FLOOR_HALF_Z, point.z));
      const rx = Math.round(x * 10) / 10;
      const rz = Math.round(z * 10) / 10;

      if (rx !== this.lastDragPosition.x || rz !== this.lastDragPosition.z) {
        this.lastDragPosition = { ...this.lastDragPosition, x: rx, z: rz };
        this.itemDragged.emit({
          itemId: this.dragItemId,
          positionX: rx,
          positionZ: rz,
        });
      }
    } else if (this.dragMode === 'rotation') {
      const item = this.items().find((i) => i.id === this.dragItemId);
      if (!item) return;
      const currentAngle = Math.atan2(
        point.x - item.positionX,
        point.z - item.positionZ,
      );
      const deltaAngle = currentAngle - this.rotationDragStartAngle;
      const newRotation = this.rotationDragItemStartAngle + deltaAngle;
      const rounded = Math.round(newRotation * 100) / 100;

      if (rounded !== this.lastDragRotationY) {
        this.lastDragRotationY = rounded;
        this.itemDragged.emit({
          itemId: this.dragItemId,
          positionX: this.lastDragPosition.x,
          positionZ: this.lastDragPosition.z,
          rotationY: rounded,
        });
      }
    }
  }

  // ─── Vertical drag plane: Y movement ───────────
  onVerticalDragMove(event: any): void {
    if (!this.isDragging() || !this.dragItemId) return;
    if (this.dragMode !== 'height') return;
    event?.stopPropagation?.();

    const point = event.point;
    if (!point) return;

    const y = Math.max(0, Math.min(ROOM_HEIGHT, point.y));
    const ry = Math.round(y * 10) / 10;

    if (ry !== this.lastDragPosition.y) {
      this.lastDragPosition = { ...this.lastDragPosition, y: ry };
      this.itemDragged.emit({
        itemId: this.dragItemId,
        positionX: this.lastDragPosition.x,
        positionY: ry,
        positionZ: this.lastDragPosition.z,
      });
    }
  }

  onDragEnd(event: any): void {
    if (!this.isDragging() || !this.dragItemId) return;
    event?.stopPropagation?.();

    this.itemDragEnd.emit({
      itemId: this.dragItemId,
      positionX: this.lastDragPosition.x,
      positionY: this.lastDragPosition.y,
      positionZ: this.lastDragPosition.z,
      rotationY: this.lastDragRotationY,
    });

    this.isDragging.set(false);
    this.dragMode = 'none';
    this.dragItemId = null;
  }
}
