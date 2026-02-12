import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import { Mesh, PlaneGeometry, MeshStandardMaterial, Color } from 'three';
import { getAllSlots, type SlotPosition } from '@app/shared/lib/room-placement';

extend({ Mesh, PlaneGeometry, MeshStandardMaterial });

const SLOT_WIDTH = 0.5;
const SLOT_HEIGHT = 0.3;

@Component({
  selector: 'app-slot-indicator',
  standalone: true,
  imports: [NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (slot of emptySlots(); track slotKey(slot)) {
      <ngt-mesh
        [position]="slotPosition(slot)"
        [rotation]="slotRotation(slot)"
        (click)="slotClicked.emit(slot)"
        (pointerover)="hoveredSlot.set(slotKey(slot))"
        (pointerout)="hoveredSlot.set(null)"
      >
        <ngt-plane-geometry *args="[SLOT_WIDTH, SLOT_HEIGHT]" />
        <ngt-mesh-standard-material
          [color]="'#ffffff'"
          [transparent]="true"
          [opacity]="hoveredSlot() === slotKey(slot) ? 0.4 : 0.15"
          [emissive]="emissiveColor"
          [emissiveIntensity]="hoveredSlot() === slotKey(slot) ? 0.5 : 0.1"
        />
      </ngt-mesh>
    }
  `,
})
export class SlotIndicatorComponent {
  occupiedPositions = input<SlotPosition[]>([]);
  slotClicked = output<SlotPosition>();

  hoveredSlot = signal<string | null>(null);

  readonly SLOT_WIDTH = SLOT_WIDTH;
  readonly SLOT_HEIGHT = SLOT_HEIGHT;
  readonly emissiveColor = new Color(0x4488ff);

  emptySlots = computed(() => {
    const occupied = this.occupiedPositions();
    const allSlots = getAllSlots();
    return allSlots.filter(
      (slot) =>
        !occupied.some(
          (o) =>
            o.wall === slot.wall &&
            Math.abs(o.positionX - slot.positionX) < 0.2 &&
            Math.abs(o.positionY - slot.positionY) < 0.2 &&
            Math.abs(o.positionZ - slot.positionZ) < 0.2
        )
    );
  });

  slotKey(slot: SlotPosition): string {
    return `${slot.wall}-${slot.positionX.toFixed(2)}-${slot.positionY.toFixed(2)}-${slot.positionZ.toFixed(2)}`;
  }

  slotPosition(slot: SlotPosition): [number, number, number] {
    const offset = 0.02;
    if (slot.wall === 'left') {
      return [slot.positionX + offset, slot.positionY, slot.positionZ];
    }
    return [slot.positionX, slot.positionY, slot.positionZ + offset];
  }

  slotRotation(slot: SlotPosition): [number, number, number] {
    if (slot.wall === 'left') {
      return [0, Math.PI / 2, 0];
    }
    return [0, 0, 0];
  }
}
