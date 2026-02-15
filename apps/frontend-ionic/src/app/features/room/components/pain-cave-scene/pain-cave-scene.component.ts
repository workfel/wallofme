import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  effect,
  signal,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { extend, NgtArgs, injectStore } from 'angular-three';
import { textureResource } from 'angular-three-soba/loaders';
import { ScreenshotService } from '@app/core/services/screenshot.service';
import {
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  HemisphereLight,
  DirectionalLight,
  SpotLight,
  PointLight,
  Color,
  RepeatWrapping,
  SRGBColorSpace,
  EquirectangularReflectionMapping,
} from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { RoundedBoxGeometry } from 'three-stdlib';

import { TrophyFrameComponent } from '../trophy-frame/trophy-frame.component';
import { DecorationModelComponent } from '../decoration-model/decoration-model.component';
import { CameraControlsComponent } from '../camera-controls/camera-controls.component';
import { RoomTheme, DEFAULT_THEME } from '@app/types/room-theme';

// Register THREE.js elements
extend({
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  RoundedBoxGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  HemisphereLight,
  DirectionalLight,
  SpotLight,
  PointLight,
});

// Room dimensions — must match room-placement.ts
const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;
const WALL_THICKNESS = 0.55;

// Floor bounds for drag clamping
const FLOOR_HALF_X = ROOM_WIDTH / 2 - 0.45;
const FLOOR_HALF_Z = ROOM_DEPTH / 2 - 0.45;

// Wall bounds for trophy drag clamping
const WALL_MARGIN = 0.3;
const WALL_MIN_Y = WALL_MARGIN;
const WALL_MAX_Y = ROOM_HEIGHT - WALL_MARGIN;
const WALL_MIN_AXIS = -(ROOM_DEPTH / 2 - WALL_MARGIN);
const WALL_MAX_AXIS = ROOM_DEPTH / 2 - WALL_MARGIN;

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
        id?: string;
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
      [zoomOut]="zoomOut()"
    />

    <!-- Hemisphere fill — sky/ground gradient for natural ambient -->
    <ngt-hemisphere-light
      *args="[theme().hemisphereLight.skyColor, theme().hemisphereLight.groundColor, theme().hemisphereLight.intensity]"
    />

    <!-- Key directional light — offset from camera for visible shadows -->
    <ngt-directional-light
      [position]="theme().mainLight.position"
      [intensity]="theme().mainLight.intensity"
      [color]="theme().mainLight.color ?? '#fff8f0'"
      [castShadow]="true"
      [shadow-mapSize]="[shadowMapSize(), shadowMapSize()]"
      [shadow-camera-left]="-5"
      [shadow-camera-right]="5"
      [shadow-camera-top]="5"
      [shadow-camera-bottom]="-5"
      [shadow-camera-near]="1"
      [shadow-camera-far]="20"
      [shadow-bias]="-0.002"
      [shadow-normalBias]="0.02"
    />

    <!-- Overhead spotlight — diorama showcase effect -->
    <ngt-spot-light
      [position]="theme().spotLight.position"
      [intensity]="theme().spotLight.intensity"
      [color]="theme().spotLight.color"
      [angle]="theme().spotLight.angle"
      [penumbra]="theme().spotLight.penumbra"
      [decay]="1.5"
      [distance]="15"
    />

    <!-- Subtle fill from viewing side -->
    @if (theme().fillLight) {
      <ngt-point-light
        [position]="theme().fillLight!.position"
        [intensity]="theme().fillLight!.intensity"
        [color]="theme().fillLight!.color"
        [distance]="8"
        [decay]="2"
      />
    }

    <!-- Floor -->
    <ngt-mesh
      [rotation]="[-Math.PI / 2, 0, 0]"
      [position]="[0, 0, 0]"
      [receiveShadow]="true"
      (click)="onFloorClicked()"
    >
      <ngt-rounded-box-geometry *args="[ROOM_WIDTH, ROOM_DEPTH, WALL_THICKNESS, 4, 0.05]" />
      <ngt-mesh-standard-material
        [color]="floorTexLoaded() ? '#ffffff' : theme().floor.color"
        [roughness]="theme().floor.roughness"
        [map]="floorTexLoaded()"
      />
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

    <!-- Invisible left wall drag plane — captures YZ drag events for left wall trophies.
         Positioned at the wall SURFACE (not center) so it's in front of the wall mesh
         and reliably receives pointer events. -->
    <ngt-mesh
      [position]="[-ROOM_WIDTH / 2 + WALL_THICKNESS / 2 + 0.005, ROOM_HEIGHT / 2, 0]"
      [rotation]="[0, Math.PI / 2, 0]"
      [visible]="false"
      (pointermove)="onWallDragMove($event, 'left')"
      (pointerup)="onDragEnd($event)"
    >
      <ngt-plane-geometry *args="[20, 20]" />
      <ngt-mesh-basic-material />
    </ngt-mesh>

    <!-- Invisible back wall drag plane — captures XY drag events for back wall trophies.
         Same surface-level positioning. -->
    <ngt-mesh
      [position]="[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2 + WALL_THICKNESS / 2 + 0.005]"
      [rotation]="[0, 0, 0]"
      [visible]="false"
      (pointermove)="onWallDragMove($event, 'right')"
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
      <ngt-rounded-box-geometry *args="[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH, 4, 0.05]" />
      <ngt-mesh-standard-material
        [color]="leftWallTexLoaded() ? '#ffffff' : theme().leftWall.color"
        [roughness]="theme().leftWall.roughness"
        [map]="leftWallTexLoaded()"
      />
    </ngt-mesh>

    <!-- Back Wall -->
    <ngt-mesh
      [position]="[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]"
      [receiveShadow]="true"
    >
      <ngt-rounded-box-geometry *args="[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, 4, 0.05]" />
      <ngt-mesh-standard-material
        [color]="backWallTexLoaded() ? '#ffffff' : theme().backWall.color"
        [roughness]="theme().backWall.roughness"
        [map]="backWallTexLoaded()"
      />
    </ngt-mesh>

    <!-- Trophy items on walls -->
    @for (item of trophyItems(); track item.id) {
      <app-trophy-frame
        [textureUrl]="item.trophy!.textureUrl!"
        [trophyType]="item.trophy!.type"
        [position]="getWallPosition(item).position"
        [rotation]="getWallPosition(item).rotation"
        [editable]="editable()"
        [selected]="item.id === selectedItemId()"
        (pressed)="onTrophyTapped(item.id)"
        (dragStart)="onTrophyDragStart(item.id, $event)"
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
        [activeDragType]="getDecorationDragType(item.id)"
        (pressed)="onDecorationTapped(item.id)"
        (dragStart)="onDecorationDragStart(item.id, $event)"
        (heightDragStart)="onHeightDragStart(item.id, $event)"
        (rotationDragStart)="onRotationDragStart(item.id, $event)"
      />
    }
  `,
})
export class PainCaveSceneComponent implements OnDestroy {
  items = input<RoomItem3D[]>([]);
  editable = input(false);
  inspectedItemId = input<string | null>(null);
  selectedItemId = input<string | null>(null);
  dimOthers = input(false);
  theme = input<RoomTheme>(DEFAULT_THEME);
  shadowMapSize = input(1024);
  zoomOut = input(false);
  freeMovement = input(false);

  itemPressed = output<string>();
  itemDragged = output<ItemDragEvent>();
  itemDragEnd = output<ItemDragEvent>();

  isDragging = signal(false);
  dragModeSignal = signal<'none' | 'floor' | 'height' | 'rotation' | 'wall'>('none');
  dragItemIdSignal = signal<string | null>(null);
  private lastDragPosition = { x: 0, y: 0, z: 0 };
  private lastDragRotationY = 0;
  private rotationDragStartAngle = 0;
  private rotationDragItemStartAngle = 0;
  private dragWall: 'left' | 'right' | null = null;
  private boundFinishDrag = () => this.finishDrag();

  /** Deferred deselection — allows a same-frame item click to cancel it */
  private pendingDeselect: ReturnType<typeof requestAnimationFrame> | null = null;

  private store = injectStore();
  private screenshotService = inject(ScreenshotService);

  // Texture resources for walls and floor (reactive to theme changes).
  // Pass a placeholder transparent pixel when no texture is set to avoid
  // network errors from loading an empty URL.
  private static readonly NO_TEX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  private floorTex = textureResource(
    () => this.theme().floor.texture || PainCaveSceneComponent.NO_TEX,
    {
      onLoad: (tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.wrapS = tex.wrapT = RepeatWrapping;
        const repeat = this.theme().floor.textureRepeat ?? [2, 2];
        tex.repeat.set(repeat[0], repeat[1]);
      },
    },
  );
  private leftWallTex = textureResource(
    () => this.theme().leftWall.texture || PainCaveSceneComponent.NO_TEX,
    {
      onLoad: (tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.wrapS = tex.wrapT = RepeatWrapping;
        const repeat = this.theme().leftWall.textureRepeat ?? [2, 1];
        tex.repeat.set(repeat[0], repeat[1]);
      },
    },
  );
  private backWallTex = textureResource(
    () => this.theme().backWall.texture || PainCaveSceneComponent.NO_TEX,
    {
      onLoad: (tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.wrapS = tex.wrapT = RepeatWrapping;
        const repeat = this.theme().backWall.textureRepeat ?? [2, 1];
        tex.repeat.set(repeat[0], repeat[1]);
      },
    },
  );

  floorTexLoaded = computed(() => {
    if (!this.theme().floor.texture) return null;
    if (this.floorTex.status() !== 'resolved') return null;
    try { return this.floorTex.value(); } catch { return null; }
  });
  leftWallTexLoaded = computed(() => {
    if (!this.theme().leftWall.texture) return null;
    if (this.leftWallTex.status() !== 'resolved') return null;
    try { return this.leftWallTex.value(); } catch { return null; }
  });
  backWallTexLoaded = computed(() => {
    if (!this.theme().backWall.texture) return null;
    if (this.backWallTex.status() !== 'resolved') return null;
    try { return this.backWallTex.value(); } catch { return null; }
  });

  constructor() {
    // Register Three.js context for screenshot capture
    effect(() => {
      const { gl, scene, camera } = this.store.snapshot;
      if (gl && scene && camera) {
        this.screenshotService.registerThreeContext(gl, scene, camera);
      }
    });

    effect(() => {
      const theme = this.theme();
      const scene = this.store.snapshot.scene;
      if (!scene) return;

      if (theme.environmentMap) {
        const loader = new EXRLoader();
        loader.load(theme.environmentMap, (tex) => {
          tex.mapping = EquirectangularReflectionMapping;
          scene.background = tex;
        });
      } else {
        scene.background = new Color(theme.background);
      }
    });
  }

  ngOnDestroy(): void {
    this.screenshotService.unregisterThreeContext();
    document.removeEventListener('pointerup', this.boundFinishDrag);
    this.cancelPendingDeselect();
  }

  // Expose constants to template
  readonly Math = Math;
  readonly ROOM_WIDTH = ROOM_WIDTH;
  readonly ROOM_DEPTH = ROOM_DEPTH;
  readonly ROOM_HEIGHT = ROOM_HEIGHT;
  readonly WALL_THICKNESS = WALL_THICKNESS;

  getDecorationDragType(itemId: string): 'none' | 'floor' | 'height' | 'rotation' {
    if (itemId !== this.dragItemIdSignal()) return 'none';
    const mode = this.dragModeSignal();
    if (mode === 'wall') return 'none';
    return mode;
  }

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

  // ─── Floor click: deselect (deferred to allow item click to cancel) ───
  onFloorClicked(): void {
    if (this.isDragging()) return;
    // Defer deselection to next animation frame so that a same-frame
    // decoration/trophy click can cancel it.  angular-three fires click
    // on ALL raycasted meshes independently — the floor always receives
    // the click even when a decoration was also hit.
    this.pendingDeselect = requestAnimationFrame(() => {
      this.pendingDeselect = null;
      this.itemPressed.emit('__deselect__');
    });
  }

  /** Cancel any pending deselection (called when an item is tapped) */
  private cancelPendingDeselect(): void {
    if (this.pendingDeselect !== null) {
      cancelAnimationFrame(this.pendingDeselect);
      this.pendingDeselect = null;
    }
  }

  // ─── Tap: select item and show bottom sheet ─────
  onDecorationTapped(itemId: string): void {
    this.cancelPendingDeselect();
    this.itemPressed.emit(itemId);
  }

  // ─── Tap: select trophy ──────────────────────────
  onTrophyTapped(itemId: string): void {
    this.cancelPendingDeselect();
    this.itemPressed.emit(itemId);
  }

  // ─── Shared: begin any drag and register document-level pointerup fallback ──
  private beginDrag(itemId: string, mode: 'floor' | 'height' | 'rotation' | 'wall'): void {
    this.dragItemIdSignal.set(itemId);
    this.dragModeSignal.set(mode);
    this.isDragging.set(true);

    const item = this.items().find((i) => i.id === itemId);
    if (item) {
      this.lastDragPosition = { x: item.positionX, y: item.positionY, z: item.positionZ };
      this.lastDragRotationY = item.rotationY;
    }

    // Fallback: end drag on document pointerup.
    // During floor drag the hitbox follows the pointer and intercepts
    // the drag plane's pointerup — this listener guarantees drag end.
    document.addEventListener('pointerup', this.boundFinishDrag, { once: true });
  }

  // ─── Drag start: enter floor drag mode ──────────
  onDecorationDragStart(itemId: string, _event: any): void {
    this.beginDrag(itemId, 'floor');
  }

  // ─── Height gizmo: enter height drag mode ─────
  onHeightDragStart(itemId: string, _event: any): void {
    this.beginDrag(itemId, 'height');
  }

  // ─── Rotation gizmo: enter rotation drag mode ──
  onRotationDragStart(itemId: string, event: any): void {
    this.beginDrag(itemId, 'rotation');

    const item = this.items().find((i) => i.id === itemId);
    if (item) {
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

  // ─── Trophy drag start: enter wall drag mode ───
  onTrophyDragStart(itemId: string, _event: any): void {
    const item = this.items().find((i) => i.id === itemId);
    if (!item) return;
    this.dragWall = item.wall;
    this.beginDrag(itemId, 'wall');
  }

  // ─── Floor drag plane: XZ movement ─────────────
  onDragMove(event: any): void {
    if (!this.isDragging() || !this.dragItemIdSignal()) return;
    if (this.dragModeSignal() === 'height' || this.dragModeSignal() === 'wall') return;
    event?.stopPropagation?.();

    const point = event.point;
    if (!point) return;

    if (this.dragModeSignal() === 'floor') {
      const halfX = this.freeMovement() ? ROOM_WIDTH / 2 : FLOOR_HALF_X;
      const halfZ = this.freeMovement() ? ROOM_DEPTH / 2 : FLOOR_HALF_Z;
      const x = Math.max(-halfX, Math.min(halfX, point.x));
      const z = Math.max(-halfZ, Math.min(halfZ, point.z));
      const rx = Math.round(x * 10) / 10;
      const rz = Math.round(z * 10) / 10;

      if (rx !== this.lastDragPosition.x || rz !== this.lastDragPosition.z) {
        this.lastDragPosition = { ...this.lastDragPosition, x: rx, z: rz };
        this.itemDragged.emit({
          itemId: this.dragItemIdSignal()!,
          positionX: rx,
          positionZ: rz,
        });
      }
    } else if (this.dragModeSignal() === 'rotation') {
      const item = this.items().find((i) => i.id === this.dragItemIdSignal());
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
          itemId: this.dragItemIdSignal()!,
          positionX: this.lastDragPosition.x,
          positionZ: this.lastDragPosition.z,
          rotationY: rounded,
        });
      }
    }
  }

  // ─── Vertical drag plane: Y movement ───────────
  onVerticalDragMove(event: any): void {
    if (!this.isDragging() || !this.dragItemIdSignal()) return;
    if (this.dragModeSignal() !== 'height') return;
    event?.stopPropagation?.();

    const point = event.point;
    if (!point) return;

    const y = Math.max(0, Math.min(ROOM_HEIGHT, point.y));
    const ry = Math.round(y * 10) / 10;

    if (ry !== this.lastDragPosition.y) {
      this.lastDragPosition = { ...this.lastDragPosition, y: ry };
      this.itemDragged.emit({
        itemId: this.dragItemIdSignal()!,
        positionX: this.lastDragPosition.x,
        positionY: ry,
        positionZ: this.lastDragPosition.z,
      });
    }
  }

  // ─── Wall drag planes: YZ or XY movement for trophies ───
  onWallDragMove(event: any, wall: 'left' | 'right'): void {
    if (!this.isDragging() || !this.dragItemIdSignal()) return;
    if (this.dragModeSignal() !== 'wall') return;
    if (this.dragWall !== wall) return;
    event?.stopPropagation?.();

    const point = event.point;
    if (!point) return;

    const minY = this.freeMovement() ? 0 : WALL_MIN_Y;
    const maxY = this.freeMovement() ? ROOM_HEIGHT : WALL_MAX_Y;
    const minAxis = this.freeMovement() ? -ROOM_DEPTH / 2 : WALL_MIN_AXIS;
    const maxAxis = this.freeMovement() ? ROOM_DEPTH / 2 : WALL_MAX_AXIS;

    const y = Math.max(minY, Math.min(maxY, point.y));
    const ry = Math.round(y * 10) / 10;

    if (wall === 'left') {
      const z = Math.max(minAxis, Math.min(maxAxis, point.z));
      const rz = Math.round(z * 10) / 10;

      if (ry !== this.lastDragPosition.y || rz !== this.lastDragPosition.z) {
        this.lastDragPosition = { ...this.lastDragPosition, y: ry, z: rz };
        this.itemDragged.emit({
          itemId: this.dragItemIdSignal()!,
          positionX: this.lastDragPosition.x,
          positionY: ry,
          positionZ: rz,
        });
      }
    } else {
      const x = Math.max(minAxis, Math.min(maxAxis, point.x));
      const rx = Math.round(x * 10) / 10;

      if (ry !== this.lastDragPosition.y || rx !== this.lastDragPosition.x) {
        this.lastDragPosition = { ...this.lastDragPosition, y: ry, x: rx };
        this.itemDragged.emit({
          itemId: this.dragItemIdSignal()!,
          positionX: rx,
          positionY: ry,
          positionZ: this.lastDragPosition.z,
        });
      }
    }
  }

  /** Called by the drag plane's (pointerup) — works for height/rotation gizmos */
  onDragEnd(event: any): void {
    event?.stopPropagation?.();
    this.finishDrag();
  }

  /** Shared drag-end logic — called by drag plane OR document pointerup fallback */
  finishDrag(): void {
    if (!this.isDragging() || !this.dragItemIdSignal()) return;

    // Remove document listener if it hasn't fired yet
    document.removeEventListener('pointerup', this.boundFinishDrag);

    this.itemDragEnd.emit({
      itemId: this.dragItemIdSignal()!,
      positionX: this.lastDragPosition.x,
      positionY: this.lastDragPosition.y,
      positionZ: this.lastDragPosition.z,
      rotationY: this.lastDragRotationY,
    });

    this.isDragging.set(false);
    this.dragModeSignal.set('none');
    this.dragItemIdSignal.set(null);
    this.dragWall = null;
  }
}
