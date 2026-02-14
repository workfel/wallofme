import {
  Component,
  ElementRef,
  NgZone,
  ViewChild,
  afterNextRender,
  inject,
  input,
  output,
  OnDestroy,
  effect,
} from '@angular/core';
import type { GlobePoint } from '@app/core/services/explore.service';

@Component({
  selector: 'app-explore-globe',
  standalone: true,
  template: `<div #globeContainer class="globe-wrapper"></div>`,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .globe-wrapper {
      width: 100%;
      height: 100%;
    }
  `,
})
export class ExploreGlobeComponent implements OnDestroy {
  @ViewChild('globeContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  readonly points = input<GlobePoint[]>([]);
  readonly pointTapped = output<GlobePoint>();

  private zone = inject(NgZone);
  private globe: any = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => this.initGlobe());

    effect(() => {
      const pts = this.points();
      if (this.globe && pts.length > 0) {
        this.updateMarkers(pts);
      }
    });
  }

  private async initGlobe(): Promise<void> {
    const container = this.containerRef.nativeElement;
    const GlobeGl = (await import('globe.gl')).default;

    this.zone.runOutsideAngular(() => {
      this.globe = new GlobeGl(container)
        // .globeImageUrl(
        //   '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        // )
        // .bumpImageUrl(
        //   '//unpkg.com/three-globe/example/img/earth-topology.png',
        // )
        // .backgroundImageUrl(
        //   '//unpkg.com/three-globe/example/img/night-sky.png',
        // )
        .globeTileEngineUrl((x, y, l) => `https://tile.openstreetmap.org/${l}/${x}/${y}.png`)
        .showAtmosphere(true)
        .atmosphereColor('#3a228a')
        .atmosphereAltitude(0.25)
        .width(container.clientWidth)
        .height(container.clientHeight);

      // Initial camera position
      this.globe.pointOfView({ lat: 30, lng: 10, altitude: 2.5 });

      // Setup markers once points arrive
      const pts = this.points();
      if (pts.length > 0) {
        this.updateMarkers(pts);
      }

      // Responsive sizing
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (this.globe && width > 0 && height > 0) {
            this.globe.width(width).height(height);
          }
        }
      });
      this.resizeObserver.observe(container);
    });
  }

  private updateMarkers(pts: GlobePoint[]): void {
    if (!this.globe) return;

    this.globe
      .htmlElementsData(pts)
      .htmlLat((d: GlobePoint) => d.lat)
      .htmlLng((d: GlobePoint) => d.lng)
      .htmlAltitude(0.01)
      .htmlElement((d: GlobePoint) => {
        const el = document.createElement('div');
        el.style.pointerEvents = 'auto';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #fff';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.style.overflow = 'hidden';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.background = d.isPro
          ? 'linear-gradient(135deg, #667eea, #764ba2)'
          : '#4facfe';

        if (d.image) {
          const img = document.createElement('img');
          img.src = d.image;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.alt = '';
          el.appendChild(img);
        } else {
          const initial = (d.firstName?.[0] || d.displayName?.[0] || '?').toUpperCase();
          el.style.color = '#fff';
          el.style.fontSize = '14px';
          el.style.fontWeight = '700';
          el.textContent = initial;
        }

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.zone.run(() => this.pointTapped.emit(d));
        });

        return el;
      });
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.globe) {
      this.globe._destructor?.();
      this.globe = null;
    }
    const container = this.containerRef?.nativeElement;
    if (container) container.innerHTML = '';
  }
}
