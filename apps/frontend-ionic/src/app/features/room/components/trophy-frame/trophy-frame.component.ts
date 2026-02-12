import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { extend, injectBeforeRender, NgtArgs } from 'angular-three';
import { textureResource } from 'angular-three-soba/loaders';
import {
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  DoubleSide,
  Color,
  SRGBColorSpace,
} from 'three';

extend({ Mesh, PlaneGeometry, MeshStandardMaterial });

// Trophy aspect ratios: medals ~1:1, bibs ~1.3:1 (landscape)
const FRAME_HEIGHT = 0.38;
const MEDAL_ASPECT = 1;
const BIB_ASPECT = 1.3;

@Component({
  selector: 'app-trophy-frame',
  standalone: true,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (loadedTexture(); as tex) {
      <ngt-mesh
        #meshRef
        [position]="position()"
        [rotation]="rotation()"
        [castShadow]="true"
        (click)="onPress()"
        (pointerover)="onHover(true)"
        (pointerout)="onHover(false)"
      >
        <ngt-plane-geometry *args="[width(), FRAME_HEIGHT]" />
        <ngt-mesh-standard-material
          [map]="tex"
          [transparent]="true"
          [side]="DoubleSide"
          [emissive]="hovered() && editable() ? hoverColor : undefined"
          [emissiveIntensity]="hovered() && editable() ? 0.3 : 0"
        />
      </ngt-mesh>
    } @else {
      <!-- Fallback: plain colored plane while texture loads or if it fails -->
      <ngt-mesh
        #meshRef
        [position]="position()"
        [rotation]="rotation()"
        [castShadow]="true"
        (click)="onPress()"
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
  `,
})
export class TrophyFrameComponent {
  textureUrl = input.required<string>();
  trophyType = input<'medal' | 'bib'>('medal');
  position = input<[number, number, number]>([0, 1.5, 0]);
  rotation = input<[number, number, number]>([0, 0, 0]);
  editable = input(false);
  pressed = output<void>();

  hovered = signal(false);
  readonly DoubleSide = DoubleSide;
  readonly FRAME_HEIGHT = FRAME_HEIGHT;
  readonly hoverColor = new Color(0xffcc66);

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

  onPress(): void {
    this.pressed.emit();
  }

  onHover(state: boolean): void {
    if (this.editable()) {
      this.hovered.set(state);
    }
  }
}
