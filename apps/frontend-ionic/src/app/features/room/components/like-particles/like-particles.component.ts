import { Component, ViewChild, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  BufferGeometry,
  PointsMaterial,
  AdditiveBlending,
  BufferAttribute,
} from 'three';
import { injectBeforeRender } from 'angular-three';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  colorIndex: number;
}

@Component({
  selector: 'app-like-particles',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-points>
      <ngt-buffer-geometry #geometry />
      <ngt-points-material
        #material
        [color]="'#ff1744'"
        [size]="0.1"
        [blending]="blending"
        [transparent]="true"
        [sizeAttenuation]="true"
        [depthWrite]="false"
        [vertexColors]="true"
      />
    </ngt-points>
  `,
})
export class LikeParticlesComponent implements AfterViewInit {
  @ViewChild('geometry') geometry?: BufferGeometry;
  @ViewChild('material') material?: PointsMaterial;

  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private maxParticles = 200;
  private positionArray!: Float32Array;
  private colorArray!: Float32Array;
  private sizeArray!: Float32Array;

  private colors = [
    [1.0, 0.1, 0.3], // pink-red
    [1.0, 0.0, 0.2], // pure red
    [1.0, 0.2, 0.4], // light red
    [0.95, 0.05, 0.35], // deeper pink
  ];

  blending = AdditiveBlending;

  spawnParticle(worldX: number, worldY: number, worldZ: number, combo: number = 1): void {
    if (this.particles.length >= this.maxParticles) return;

    let particle =
      this.particlePool.length > 0
        ? this.particlePool.pop()!
        : ({} as Particle);

    const spread = 0.3;
    const angle = Math.random() * Math.PI * 2;
    const vz = 0.8 + Math.random() * 0.6;
    const sizeMultiplier = 1 + (combo - 1) * 0.15;

    particle.x = worldX + (Math.random() - 0.5) * spread;
    particle.y = worldY + (Math.random() - 0.5) * spread;
    particle.z = worldZ + (Math.random() - 0.5) * spread;
    particle.vx = Math.cos(angle) * 0.3;
    particle.vy = Math.sin(angle) * 0.3;
    particle.vz = vz;
    particle.maxLife = 1.0;
    particle.life = 1.0;
    particle.size = 0.08 * sizeMultiplier;
    particle.colorIndex = Math.floor(Math.random() * this.colors.length);

    this.particles.push(particle);
  }

  private updateGeometry(): void {
    if (!this.geometry) return;

    this.positionArray.fill(0);
    this.colorArray.fill(0);
    this.sizeArray.fill(0);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = p.life / p.maxLife;

      this.positionArray[i * 3] = p.x;
      this.positionArray[i * 3 + 1] = p.y;
      this.positionArray[i * 3 + 2] = p.z;

      const color = this.colors[p.colorIndex];
      this.colorArray[i * 3] = color[0] * alpha;
      this.colorArray[i * 3 + 1] = color[1] * alpha;
      this.colorArray[i * 3 + 2] = color[2] * alpha;

      this.sizeArray[i] = p.size * alpha;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  private animateParticles(delta: number): void {
    const aliveParticles: Particle[] = [];

    for (const p of this.particles) {
      p.x += p.vx * delta * 10;
      p.y += p.vy * delta * 10;
      p.z += p.vz * delta * 10;
      p.vy -= 0.5 * delta * 10; // gravity
      p.life -= delta * 2; // lifetime

      if (p.life > 0) {
        aliveParticles.push(p);
      } else {
        this.particlePool.push(p);
      }
    }

    this.particles = aliveParticles;

    if (this.particles.length > 0) {
      this.updateGeometry();
    }
  }

  ngAfterViewInit(): void {
    if (!this.geometry) return;

    this.positionArray = new Float32Array(this.maxParticles * 3);
    this.colorArray = new Float32Array(this.maxParticles * 3);
    this.sizeArray = new Float32Array(this.maxParticles);

    // Initialize with zero
    for (let i = 0; i < this.maxParticles; i++) {
      this.colorArray[i * 3] = 1;
      this.colorArray[i * 3 + 1] = 0.1;
      this.colorArray[i * 3 + 2] = 0.3;
      this.sizeArray[i] = 0;
    }

    this.geometry.setAttribute('position', new BufferAttribute(this.positionArray, 3));
    this.geometry.setAttribute('color', new BufferAttribute(this.colorArray, 3));
    this.geometry.setAttribute('size', new BufferAttribute(this.sizeArray, 1));

    // Set up animation loop
    injectBeforeRender(({ delta }) => {
      this.animateParticles(delta);
    });
  }
}
