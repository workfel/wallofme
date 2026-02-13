import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { extend, injectBeforeRender, NgtArgs } from 'angular-three';
import { textureResource } from 'angular-three-soba/loaders';
import {
  Mesh,
  Group,
  PlaneGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
  DoubleSide,
  Color,
  SRGBColorSpace,
} from 'three';

extend({ Mesh, Group, PlaneGeometry, BoxGeometry, MeshStandardMaterial, MeshBasicMaterial });

// Trophy aspect ratios: medals ~1:1, bibs ~1.3:1 (landscape)
const FRAME_HEIGHT = 0.38;
const MEDAL_ASPECT = 1;
const BIB_ASPECT = 1.3;

const GIZMO_GREEN = new Color(0x44cc44);
const HIGHLIGHT_COLOR = new Color(0x4fc3f7);
const LONG_PRESS_MS = 400;

@Component({
  selector: 'app-trophy-frame',
  standalone: true,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-group
      [position]="position()"
      [rotation]="rotation()"
    >
      @if (loadedTexture(); as tex) {
        <ngt-mesh
          #meshRef
          [castShadow]="true"
          (click)="onClick($event)"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerUp($event)"
          (pointerleave)="onPointerCancel()"
          (pointerover)="onHover(true)"
          (pointerout)="onHover(false)"
        >
          <ngt-plane-geometry *args="[width(), FRAME_HEIGHT]" />
          <ngt-mesh-standard-material
            [map]="tex"
            [transparent]="true"
            [side]="DoubleSide"
            [emissive]="hovered() && editable() && !selected() ? hoverColor : undefined"
            [emissiveIntensity]="hovered() && editable() && !selected() ? 0.3 : 0"
          />
        </ngt-mesh>
      } @else {
        <ngt-mesh
          #meshRef
          [castShadow]="true"
          (click)="onClick($event)"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerUp($event)"
          (pointerleave)="onPointerCancel()"
          (pointerover)="onHover(true)"
          (pointerout)="onHover(false)"
        >
          <ngt-plane-geometry *args="[width(), FRAME_HEIGHT]" />
          <ngt-mesh-standard-material
            [color]="'#cccccc'"
            [transparent]="true"
            [opacity]="0.5"
            [side]="DoubleSide"
          />
        </ngt-mesh>
      }

      <!-- Hover overlay (visible when hovered, not selected, in edit mode) -->
      @if (hovered() && editable() && !selected()) {
        <ngt-mesh [position]="[0, 0, 0.01]">
          <ngt-plane-geometry *args="[width() + 0.08, FRAME_HEIGHT + 0.08]" />
          <ngt-mesh-basic-material
            [color]="highlightColor"
            [transparent]="true"
            [opacity]="0.15"
            [depthWrite]="false"
            [side]="DoubleSide"
          />
        </ngt-mesh>
      }

      <!-- Selection gizmo: green wireframe box -->
      @if (selected()) {
        <ngt-mesh [position]="[0, 0, 0.005]">
          <ngt-box-geometry *args="[width() + 0.1, FRAME_HEIGHT + 0.1, 0.02]" />
          <ngt-mesh-basic-material
            [color]="gizmoGreen"
            [wireframe]="true"
            [transparent]="true"
            [opacity]="0.6"
          />
        </ngt-mesh>
      }
    </ngt-group>
  `,
})
export class TrophyFrameComponent implements OnDestroy {
  textureUrl = input.required<string>();
  trophyType = input<'medal' | 'bib'>('medal');
  position = input<[number, number, number]>([0, 1.5, 0]);
  rotation = input<[number, number, number]>([0, 0, 0]);
  editable = input(false);
  selected = input(false);

  pressed = output<void>();
  dragStart = output<any>();

  hovered = signal(false);
  readonly DoubleSide = DoubleSide;
  readonly FRAME_HEIGHT = FRAME_HEIGHT;
  readonly hoverColor = new Color(0xffcc66);
  readonly gizmoGreen = GIZMO_GREEN;
  readonly highlightColor = HIGHLIGHT_COLOR;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;

  meshRef = viewChild<ElementRef<Mesh>>('meshRef');

  // Load texture via angular-three-soba resource
  texture = textureResource(() => this.textureUrl(), {
    onLoad: (tex) => {
      tex.colorSpace = SRGBColorSpace;
    },
  });

  /** Safely access texture value — returns null if loading or errored */
  loadedTexture = computed(() => {
    if (this.texture.status() !== 'resolved') return null;
    try {
      return this.texture.value();
    } catch {
      return null;
    }
  });

  width(): number {
    const aspect = this.trophyType() === 'bib' ? BIB_ASPECT : MEDAL_ASPECT;
    return FRAME_HEIGHT * aspect;
  }

  constructor() {
    // Subtle idle sway animation
    injectBeforeRender(({ clock }) => {
      const mesh = this.meshRef()?.nativeElement;
      if (mesh) {
        mesh.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.01;
      }
    });
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
    event?.stopPropagation?.();
    if (!this.editable()) return;

    this.didLongPress = false;

    // Long-press starts wall drag (only on already-selected items)
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

  onHover(state: boolean): void {
    if (this.editable()) {
      this.hovered.set(state);
    }
  }

  ngOnDestroy(): void {
    this.onPointerCancel();
  }
}
