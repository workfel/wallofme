import { Component, CUSTOM_ELEMENTS_SCHEMA, input, computed, output, signal, OnDestroy } from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import { gltfResource } from 'angular-three-soba/loaders';
import {
  Mesh,
  Group,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  EdgesGeometry,
  LineSegments,
  Color,
  Box3,
  Vector3,
  DoubleSide,
} from 'three';

extend({
  Mesh,
  Group,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  TorusGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  LineSegments,
});

const GIZMO_GREEN = new Color(0x44cc44);
const HIGHLIGHT_COLOR = new Color(0x4fc3f7);
const LONG_PRESS_MS = 400;

@Component({
  selector: 'app-decoration-model',
  standalone: true,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-group
      [position]="position()"
      [rotation]="[0, rotationY(), 0]"
      [scale]="scale()"
    >
      @if (scene(); as scene) {
        <ngt-primitive *args="[scene]" [position]="[0, yOffset(), 0]" />
      }

      <!-- Hitbox for tap / long-press detection -->
      <ngt-mesh
        [position]="[0, hitboxY(), 0]"
        (pointerdown)="onPointerDown($event)"
        (pointerup)="onPointerUp($event)"
        (pointerleave)="onPointerCancel()"
        (pointerover)="onHover(true)"
        (pointerout)="onHover(false)"
      >
        <ngt-box-geometry *args="[1.5, hitboxHeight(), 1.5]" />
        <ngt-mesh-standard-material
          [transparent]="true"
          [opacity]="0"
          [depthWrite]="false"
        />
      </ngt-mesh>

      <!-- ═══ Selection gizmos (only when selected) ═══ -->
      @if (selected()) {
        <!-- Green wireframe bounding box -->
        <ngt-mesh [position]="[0, hitboxY(), 0]">
          <ngt-box-geometry *args="[gizmoBoxWidth(), hitboxHeight(), gizmoBoxDepth()]" />
          <ngt-mesh-basic-material
            [color]="gizmoGreen"
            [wireframe]="true"
            [transparent]="true"
            [opacity]="0.6"
          />
        </ngt-mesh>

        <!-- Vertical arrow (height gizmo): shaft + tip — clickable hitbox -->
        <ngt-group [position]="[0, gizmoArrowBaseY(), 0]">
          <!-- Shaft -->
          <ngt-mesh [position]="[0, 0.4, 0]">
            <ngt-cylinder-geometry *args="[0.04, 0.04, 0.8, 8]" />
            <ngt-mesh-basic-material [color]="gizmoGreen" />
          </ngt-mesh>
          <!-- Arrow tip -->
          <ngt-mesh [position]="[0, 0.9, 0]">
            <ngt-cone-geometry *args="[0.1, 0.2, 8]" />
            <ngt-mesh-basic-material [color]="gizmoGreen" />
          </ngt-mesh>
          <!-- Invisible hitbox for the whole arrow -->
          <ngt-mesh
            [position]="[0, 0.5, 0]"
            (pointerdown)="onHeightGizmoDown($event)"
          >
            <ngt-cylinder-geometry *args="[0.2, 0.2, 1.2, 8]" />
            <ngt-mesh-basic-material [transparent]="true" [opacity]="0" [depthWrite]="false" />
          </ngt-mesh>
        </ngt-group>

        <!-- Rotation arc (curved arrow at base) — clickable hitbox -->
        <ngt-group [position]="[0, 0.05, 0]">
          <ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
            <ngt-torus-geometry *args="[gizmoRingRadius(), 0.03, 8, 24, Math.PI * 1.5]" />
            <ngt-mesh-basic-material [color]="gizmoGreen" [side]="doubleSide" />
          </ngt-mesh>
          <!-- Arrow tip on the rotation arc -->
          <ngt-mesh
            [position]="[gizmoRingRadius(), 0, 0]"
            [rotation]="[0, 0, -Math.PI / 2]"
          >
            <ngt-cone-geometry *args="[0.08, 0.16, 8]" />
            <ngt-mesh-basic-material [color]="gizmoGreen" />
          </ngt-mesh>
          <!-- Invisible hitbox torus (thicker for easier clicking) -->
          <ngt-mesh
            [rotation]="[Math.PI / 2, 0, 0]"
            (pointerdown)="onRotationGizmoDown($event)"
          >
            <ngt-torus-geometry *args="[gizmoRingRadius(), 0.15, 8, 24, Math.PI * 2]" />
            <ngt-mesh-basic-material [transparent]="true" [opacity]="0" [depthWrite]="false" />
          </ngt-mesh>
        </ngt-group>
      }
    </ngt-group>
  `,
})
export class DecorationModelComponent implements OnDestroy {
  modelUrl = input.required<string>();
  position = input<[number, number, number]>([0, 0, 0]);
  rotationY = input(0);
  scale = input(0.5);
  editable = input(false);
  selected = input(false);

  pressed = output<void>();
  dragStart = output<any>();
  heightDragStart = output<any>();
  rotationDragStart = output<any>();

  hovered = signal(false);
  readonly gizmoGreen = GIZMO_GREEN;
  readonly highlightColor = HIGHLIGHT_COLOR;
  readonly doubleSide = DoubleSide;
  readonly Math = Math;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;

  gltf = gltfResource(() => this.modelUrl());

  scene = computed(() => {
    try {
      return this.gltf.value()?.scene ?? null;
    } catch {
      return null;
    }
  });

  private bbox = computed(() => {
    const s = this.scene();
    if (!s) return null;
    const box = new Box3().setFromObject(s);
    const size = new Vector3();
    box.getSize(size);
    return { minY: box.min.y, height: size.y, width: size.x, depth: size.z };
  });

  yOffset = computed(() => {
    const b = this.bbox();
    return b ? -b.minY : 0;
  });

  hitboxHeight = computed(() => {
    const b = this.bbox();
    return b ? Math.max(b.height, 1) : 1.5;
  });

  hitboxY = computed(() => {
    const b = this.bbox();
    return b ? b.height / 2 - b.minY : 0.75;
  });

  /** Wireframe box dimensions — slightly larger than the model */
  gizmoBoxWidth = computed(() => {
    const b = this.bbox();
    return b ? b.width + 0.15 : 1.6;
  });

  gizmoBoxDepth = computed(() => {
    const b = this.bbox();
    return b ? b.depth + 0.15 : 1.6;
  });

  /** Vertical arrow starts at top of the bounding box */
  gizmoArrowBaseY = computed(() => {
    const b = this.bbox();
    return b ? b.height - b.minY : 1.5;
  });

  /** Rotation ring radius — slightly wider than the model */
  gizmoRingRadius = computed(() => {
    const b = this.bbox();
    if (!b) return 0.9;
    return Math.max(b.width, b.depth) / 2 + 0.2;
  });

  onPointerDown(event: any): void {
    if (!this.editable()) return;
    event?.stopPropagation?.();

    this.didLongPress = false;
    this.longPressTimer = setTimeout(() => {
      this.didLongPress = true;
      this.longPressTimer = null;
      this.dragStart.emit(event);
    }, LONG_PRESS_MS);
  }

  onPointerUp(event: any): void {
    event?.stopPropagation?.();

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      this.pressed.emit();
    }
  }

  onPointerCancel(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onHeightGizmoDown(event: any): void {
    event?.stopPropagation?.();
    this.heightDragStart.emit(event);
  }

  onRotationGizmoDown(event: any): void {
    event?.stopPropagation?.();
    this.rotationDragStart.emit(event);
  }

  onHover(state: boolean): void {
    if (this.editable()) {
      this.hovered.set(state);
    }
  }

  ngOnDestroy(): void {
    this.onPointerCancel();
  }
}
