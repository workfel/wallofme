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
} from "@angular/core";
import { extend, injectBeforeRender, NgtArgs } from "angular-three";
import { textureResource } from "angular-three-soba/loaders";
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
  MathUtils,
} from "three";

extend({
  Mesh,
  Group,
  PlaneGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  MeshBasicMaterial,
});

// Trophy aspect ratios: medals ~1:1, bibs ~1.3:1 (landscape)
const FRAME_HEIGHT = 0.38;
const MEDAL_ASPECT = 1;
const BIB_ASPECT = 1.3;
const FRAME_MARGIN = 0.02; // Total extra width/height for the frame
const FRAME_DEPTH = 0.06; // Thickness of the frame
const FRAME_COLOR = "#fff"; // Dark frame color

const GIZMO_GREEN = new Color(0x44cc44);
const HIGHLIGHT_COLOR = new Color(0x4fc3f7);
const LONG_PRESS_MS = 400;

@Component({
  selector: "app-trophy-frame",
  standalone: true,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-group [position]="position()" [rotation]="rotation()">
      <!-- Inner group for animation (sway) -->
      <ngt-group #animGroup>
        <!-- FRAME / BACKING -->
        <ngt-mesh
          [castShadow]="true"
          [receiveShadow]="true"
          [position]="[0, 0, -FRAME_DEPTH / 2]"
          (click)="onClick($event)"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerUp($event)"
          (pointerleave)="onPointerCancel()"
          (pointerover)="onHover(true)"
          (pointerout)="onHover(false)"
        >
          <ngt-box-geometry
            *args="[
              width() + FRAME_MARGIN,
              FRAME_HEIGHT + FRAME_MARGIN,
              FRAME_DEPTH,
            ]"
          />
          <ngt-mesh-standard-material [color]="frameColor" [roughness]="0.6" />
        </ngt-mesh>

        <!-- TROPHY IMAGE / TEXTURE -->
        <!-- Placeholder (fades out when texture loads) -->
        <ngt-mesh
          #placeholderMesh
          [position]="[0, 0, 0.001]"
          (click)="onClick($event)"
          (pointerdown)="onPointerDown($event)"
          (pointerup)="onPointerUp($event)"
          (pointerleave)="onPointerCancel()"
          (pointerover)="onHover(true)"
          (pointerout)="onHover(false)"
        >
          <ngt-plane-geometry *args="[width(), FRAME_HEIGHT]" />
          <ngt-mesh-basic-material
            [color]="'#cccccc'"
            [transparent]="true"
            [opacity]="0.5"
            [side]="DoubleSide"
          />
        </ngt-mesh>

        <!-- Trophy image (fades in when texture loads) -->
        @if (loadedTexture(); as tex) {
          <ngt-mesh
            #textureMesh
            [position]="[0, 0, 0.002]"
            (click)="onClick($event)"
            (pointerdown)="onPointerDown($event)"
            (pointerup)="onPointerUp($event)"
            (pointerleave)="onPointerCancel()"
            (pointerover)="onHover(true)"
            (pointerout)="onHover(false)"
          >
            <ngt-plane-geometry *args="[width(), FRAME_HEIGHT]" />
            <ngt-mesh-basic-material
              [map]="tex"
              [transparent]="true"
              [opacity]="0"
              [side]="DoubleSide"
            />
          </ngt-mesh>
        }

        <!-- Hover overlay -->
        @if (hovered() && editable() && !selected()) {
          <ngt-mesh [position]="[0, 0, 0.02]">
            <ngt-plane-geometry
              *args="[
                width() + FRAME_MARGIN + 0.04,
                FRAME_HEIGHT + FRAME_MARGIN + 0.04,
              ]"
            />
            <ngt-mesh-basic-material
              [color]="highlightColor"
              [transparent]="true"
              [opacity]="0.15"
              [depthWrite]="false"
              [side]="DoubleSide"
            />
          </ngt-mesh>
        }

        <!-- Selection gizmo -->
        @if (selected()) {
          <ngt-mesh [position]="[0, 0, 0.015]">
            <ngt-box-geometry
              *args="[
                width() + FRAME_MARGIN + 0.04,
                FRAME_HEIGHT + FRAME_MARGIN + 0.04,
                FRAME_DEPTH + 0.02,
              ]"
            />
            <ngt-mesh-basic-material
              [color]="gizmoGreen"
              [wireframe]="true"
              [transparent]="true"
              [opacity]="0.6"
            />
          </ngt-mesh>
        }
      </ngt-group>
    </ngt-group>
  `,
})
export class TrophyFrameComponent implements OnDestroy {
  textureUrl = input.required<string>();
  trophyType = input<"medal" | "bib">("medal");
  position = input<[number, number, number]>([0, 1.5, 0]);
  rotation = input<[number, number, number]>([0, 0, 0]);
  editable = input(false);
  selected = input(false);

  pressed = output<void>();
  dragStart = output<any>();

  hovered = signal(false);
  readonly DoubleSide = DoubleSide;
  readonly FRAME_HEIGHT = FRAME_HEIGHT;
  readonly FRAME_MARGIN = FRAME_MARGIN;
  readonly FRAME_DEPTH = FRAME_DEPTH;
  readonly frameColor = FRAME_COLOR;
  readonly hoverColor = new Color(0xffcc66);
  readonly gizmoGreen = GIZMO_GREEN;
  readonly highlightColor = HIGHLIGHT_COLOR;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;

  // We rotate the inner group now
  animGroup = viewChild<ElementRef<Group>>("animGroup");
  placeholderMeshRef = viewChild<ElementRef<Mesh>>("placeholderMesh");
  textureMeshRef = viewChild<ElementRef<Mesh>>("textureMesh");

  // Load texture via angular-three-soba resource
  texture = textureResource(() => this.textureUrl(), {
    onLoad: (tex) => {
      tex.colorSpace = SRGBColorSpace;
    },
  });

  /** Safely access texture value — returns null if loading or errored */
  loadedTexture = computed(() => {
    if (this.texture.status() !== "resolved") return null;
    try {
      return this.texture.value();
    } catch {
      return null;
    }
  });

  width(): number {
    const aspect = this.trophyType() === "bib" ? BIB_ASPECT : MEDAL_ASPECT;
    return FRAME_HEIGHT * aspect;
  }

  constructor() {
    injectBeforeRender(({ clock, delta }) => {
      const group = this.animGroup()?.nativeElement;
      if (group) {
        group.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.01;
      }

      // Fade-in texture, fade-out placeholder
      const texMesh = this.textureMeshRef()?.nativeElement;
      if (texMesh) {
        const mat = texMesh.material as MeshBasicMaterial;
        if (mat.opacity < 0.999) {
          mat.opacity = MathUtils.lerp(mat.opacity, 1, Math.min(delta * 8, 1));
        }
      }

      const phMesh = this.placeholderMeshRef()?.nativeElement;
      if (phMesh) {
        const mat = phMesh.material as MeshBasicMaterial;
        const target = this.loadedTexture() ? 0 : 0.5;
        mat.opacity = MathUtils.lerp(mat.opacity, target, Math.min(delta * 8, 1));
      }
    });
  }

  /** Click = selection (or no-op if long-press drag occurred). */
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
