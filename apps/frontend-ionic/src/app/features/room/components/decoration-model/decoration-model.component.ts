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
const GIZMO_HOVER = new Color(0xffcc44);
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
        (click)="onClick($event)"
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

      <!-- Hover overlay (visible when hovered, not selected, in edit mode) -->
      @if (hovered() && editable() && !selected()) {
        <ngt-mesh [position]="[0, hitboxY(), 0]">
          <ngt-box-geometry *args="[gizmoBoxWidth(), hitboxHeight(), gizmoBoxDepth()]" />
          <ngt-mesh-basic-material
            [color]="highlightColor"
            [transparent]="true"
            [opacity]="0.12"
            [depthWrite]="false"
          />
        </ngt-mesh>
      }

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
            <ngt-mesh-basic-material [color]="(heightGizmoHovered() || activeDragType() === 'height') ? gizmoHover : gizmoGreen" />
          </ngt-mesh>
          <!-- Arrow tip -->
          <ngt-mesh [position]="[0, 0.9, 0]">
            <ngt-cone-geometry *args="[0.1, 0.2, 8]" />
            <ngt-mesh-basic-material [color]="(heightGizmoHovered() || activeDragType() === 'height') ? gizmoHover : gizmoGreen" />
          </ngt-mesh>
          <!-- Invisible hitbox for the whole arrow -->
          <ngt-mesh
            [position]="[0, 0.5, 0]"
            (click)="onClickStop($event)"
            (pointerdown)="onHeightGizmoDown($event)"
            (pointerover)="heightGizmoHovered.set(true)"
            (pointerout)="heightGizmoHovered.set(false)"
          >
            <ngt-cylinder-geometry *args="[0.2, 0.2, 1.2, 8]" />
            <ngt-mesh-basic-material [transparent]="true" [opacity]="0" [depthWrite]="false" />
          </ngt-mesh>
        </ngt-group>

        <!-- Rotation arc (180° with arrow tips on both ends) — clickable hitbox -->
        <ngt-group [position]="[0, -0.15, 0]">
          <!-- 180° arc from +X through +Z to -X -->
          <ngt-mesh [rotation]="[Math.PI / 2, 0, 0]">
            <ngt-torus-geometry *args="[gizmoRingRadius(), 0.03, 8, 24, Math.PI]" />
            <ngt-mesh-basic-material [color]="(rotationGizmoHovered() || activeDragType() === 'rotation') ? gizmoHover : gizmoGreen" [side]="doubleSide" />
          </ngt-mesh>
          <!-- Arrow tip at +X end (pointing toward +Z) -->
          <ngt-mesh
            [position]="[gizmoRingRadius(), 0, 0]"
            [rotation]="[-Math.PI / 2, 0, 0]"
          >
            <ngt-cone-geometry *args="[0.08, 0.16, 8]" />
            <ngt-mesh-basic-material [color]="(rotationGizmoHovered() || activeDragType() === 'rotation') ? gizmoHover : gizmoGreen" />
          </ngt-mesh>
          <!-- Arrow tip at -X end (pointing toward -Z) -->
          <ngt-mesh
            [position]="[-gizmoRingRadius(), 0, 0]"
            [rotation]="[Math.PI / 2, 0, 0]"
          >
            <ngt-cone-geometry *args="[0.08, 0.16, 8]" />
            <ngt-mesh-basic-material [color]="(rotationGizmoHovered() || activeDragType() === 'rotation') ? gizmoHover : gizmoGreen" />
          </ngt-mesh>
          <!-- Invisible hitbox torus (thicker for easier clicking) -->
          <ngt-mesh
            [rotation]="[Math.PI / 2, 0, 0]"
            (click)="onClickStop($event)"
            (pointerdown)="onRotationGizmoDown($event)"
            (pointerover)="rotationGizmoHovered.set(true)"
            (pointerout)="rotationGizmoHovered.set(false)"
          >
            <ngt-torus-geometry *args="[gizmoRingRadius(), 0.18, 8, 24, Math.PI]" />
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
  activeDragType = input<'none' | 'floor' | 'height' | 'rotation'>('none');

  pressed = output<void>();
  dragStart = output<any>();
  heightDragStart = output<any>();
  rotationDragStart = output<any>();

  hovered = signal(false);
  heightGizmoHovered = signal(false);
  rotationGizmoHovered = signal(false);
  readonly gizmoGreen = GIZMO_GREEN;
  readonly gizmoHover = GIZMO_HOVER;
  readonly highlightColor = HIGHLIGHT_COLOR;
  readonly doubleSide = DoubleSide;
  readonly Math = Math;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;

  gltf = gltfResource(() => this.modelUrl());

  scene = computed(() => {
    try {
      const s = this.gltf.value()?.scene;
      // Clone to avoid shared-reference issues: a Three.js Object3D can only
      // have one parent, and gltfResource may cache scenes by URL.
      return s?.clone(true) ?? null;
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

  /** Vertical arrow starts above the bounding box with a small gap */
  gizmoArrowBaseY = computed(() => {
    const b = this.bbox();
    return b ? b.height - b.minY + 0.25 : 1.5;
  });

  /** Rotation ring radius — wider than the model for clear separation */
  gizmoRingRadius = computed(() => {
    const b = this.bbox();
    if (!b) return 1.2;
    return Math.max(b.width, b.depth) / 2 + 0.6;
  });

  /** Stop click from propagating (used on gizmo hitboxes) */
  onClickStop(event: any): void {
    event?.stopPropagation?.();
  }

  /** Click = selection (or no-op if long-press drag occurred).
   *  We use click instead of pointerup because angular-three
   *  does not reliably fire pointerup on meshes. */
  onClick(event: any): void {
    event?.stopPropagation?.();

    // Clear any pending long-press (in case pointerup didn't fire)
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // If it wasn't a long-press, it's a tap → select/deselect
    if (!this.didLongPress) {
      this.pressed.emit();
    }
  }

  onPointerDown(event: any): void {
    if (!this.editable()) return;
    event?.stopPropagation?.();

    this.didLongPress = false;

    // Long-press starts floor drag (only on already-selected items)
    if (this.selected()) {
      this.longPressTimer = setTimeout(() => {
        this.didLongPress = true;
        this.longPressTimer = null;
        this.dragStart.emit(event);
      }, LONG_PRESS_MS);
    }
  }

  onPointerUp(event: any): void {
    event?.stopPropagation?.();

    // Clear any pending long-press
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
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
