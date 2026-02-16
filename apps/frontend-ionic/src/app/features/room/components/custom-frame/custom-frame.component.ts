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

// Frame dimensions — 16:9 ratio
const FRAME_WIDTH = 0.8;
const FRAME_HEIGHT = 0.45;
const FRAME_BORDER = 0.04;
const FRAME_DEPTH = 0.06;

const GIZMO_GREEN = new Color(0x44cc44);
const HIGHLIGHT_COLOR = new Color(0x4fc3f7);
const LONG_PRESS_MS = 400;

// Placeholder pixel — 1x1 transparent PNG to avoid loading errors
const NO_TEX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

type FrameStyle = "classic" | "gold" | "neon" | "wood";

interface FrameStyleConfig {
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

const FRAME_STYLES: Record<FrameStyle, FrameStyleConfig> = {
  classic: { color: "#1a1a1a", roughness: 0.4, metalness: 0.1 },
  gold: { color: "#d4a537", roughness: 0.3, metalness: 0.8 },
  neon: {
    color: "#111111",
    roughness: 0.3,
    metalness: 0.2,
    emissive: "#00ff88",
    emissiveIntensity: 0.8,
  },
  wood: { color: "#8B6914", roughness: 0.8, metalness: 0.0 },
};

@Component({
  selector: "app-custom-frame",
  standalone: true,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-group [position]="position()" [rotation]="rotation()" [scale]="uniformScale()">
      <!-- Inner group for animation (sway) -->
      <ngt-group #animGroup>
        <!-- FRAME BORDER -->
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
              FRAME_WIDTH + FRAME_BORDER * 2,
              FRAME_HEIGHT + FRAME_BORDER * 2,
              FRAME_DEPTH,
            ]"
          />
          <ngt-mesh-standard-material
            [color]="styleConfig().color"
            [roughness]="styleConfig().roughness"
            [metalness]="styleConfig().metalness"
            [emissive]="styleConfig().emissive ?? '#000000'"
            [emissiveIntensity]="styleConfig().emissiveIntensity ?? 0"
          />
        </ngt-mesh>

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
          <ngt-plane-geometry *args="[FRAME_WIDTH, FRAME_HEIGHT]" />
          <ngt-mesh-basic-material
            [color]="'#e0e0e0'"
            [transparent]="true"
            [opacity]="0.4"
            [side]="DoubleSide"
          />
        </ngt-mesh>

        <!-- Custom image (fades in when texture loads) -->
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
            <ngt-plane-geometry *args="[FRAME_WIDTH, FRAME_HEIGHT]" />
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
                FRAME_WIDTH + FRAME_BORDER * 2 + 0.04,
                FRAME_HEIGHT + FRAME_BORDER * 2 + 0.04,
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
                FRAME_WIDTH + FRAME_BORDER * 2 + 0.04,
                FRAME_HEIGHT + FRAME_BORDER * 2 + 0.04,
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
export class CustomFrameComponent implements OnDestroy {
  imageUrl = input<string | null>(null);
  frameStyle = input<string>("classic");
  position = input<[number, number, number]>([0, 1.5, 0]);
  rotation = input<[number, number, number]>([0, 0, 0]);
  scale = input(1);
  editable = input(false);
  selected = input(false);

  uniformScale = computed((): [number, number, number] => {
    const s = this.scale();
    return [s, s, s];
  });

  pressed = output<void>();
  dragStart = output<any>();

  hovered = signal(false);
  readonly DoubleSide = DoubleSide;
  readonly FRAME_WIDTH = FRAME_WIDTH;
  readonly FRAME_HEIGHT = FRAME_HEIGHT;
  readonly FRAME_BORDER = FRAME_BORDER;
  readonly FRAME_DEPTH = FRAME_DEPTH;
  readonly gizmoGreen = GIZMO_GREEN;
  readonly highlightColor = HIGHLIGHT_COLOR;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;

  animGroup = viewChild<ElementRef<Group>>("animGroup");
  placeholderMeshRef = viewChild<ElementRef<Mesh>>("placeholderMesh");
  textureMeshRef = viewChild<ElementRef<Mesh>>("textureMesh");

  styleConfig = computed((): FrameStyleConfig => {
    const style = this.frameStyle() as FrameStyle;
    return FRAME_STYLES[style] ?? FRAME_STYLES.classic;
  });

  // Load texture — use NO_TEX placeholder when no image to avoid errors
  texture = textureResource(() => this.imageUrl() || NO_TEX, {
    onLoad: (tex) => {
      tex.colorSpace = SRGBColorSpace;
    },
  });

  loadedTexture = computed(() => {
    // Only show texture if there's a real image URL
    if (!this.imageUrl()) return null;
    if (this.texture.status() !== "resolved") return null;
    try {
      return this.texture.value();
    } catch {
      return null;
    }
  });

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
        const target = this.loadedTexture() ? 0 : 0.4;
        mat.opacity = MathUtils.lerp(mat.opacity, target, Math.min(delta * 8, 1));
      }
    });
  }

  onClick(event: any): void {
    event?.stopPropagation?.();
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (!this.didLongPress) {
      this.pressed.emit();
    }
  }

  onPointerDown(event: any): void {
    event?.stopPropagation?.();
    if (!this.editable()) return;

    this.didLongPress = false;
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
