// Room dimensions (must match pain-cave-scene.tsx)
const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;

// Wall offset from center
const WALL_OFFSET = 0.15; // wall thickness / 2 + small gap

// Grid: 3 columns (Z axis) x 2 rows (Y axis) = 6 slots per wall
const COLUMNS = 3;
const ROWS = 2;
const SLOTS_PER_WALL = COLUMNS * ROWS;

// Spacing
const Y_POSITIONS = [2.0, 1.0]; // top row, bottom row
const Z_POSITIONS = [-1.5, 0, 1.5]; // left, center, right along wall

export type Wall = "left" | "right";

export type SlotPosition = {
  positionX: number;
  positionY: number;
  positionZ: number;
  wall: Wall;
};

type ExistingItem = {
  positionX: number;
  positionY: number;
  positionZ: number;
  wall: Wall | null;
};

/**
 * Returns all slot positions for a given wall.
 * - "left" wall: X = -ROOM_WIDTH/2, items face +X, slots vary on Z and Y
 * - "right" wall (mapped to back wall in 3D): Z = -ROOM_DEPTH/2, items face +Z, slots vary on X and Y
 *
 * Order: top-left → top-right → bottom-left → bottom-right
 */
export function getWallSlots(wall: Wall): SlotPosition[] {
  const slots: SlotPosition[] = [];

  for (const y of Y_POSITIONS) {
    for (const z of Z_POSITIONS) {
      if (wall === "left") {
        slots.push({
          positionX: -ROOM_WIDTH / 2 + WALL_OFFSET,
          positionY: y,
          positionZ: z,
          wall: "left",
        });
      } else {
        // "right" in DB = back wall in 3D
        // X varies along the wall, Z is fixed at the back
        slots.push({
          positionX: z, // reuse same spread values along X axis
          positionY: y,
          positionZ: -ROOM_DEPTH / 2 + WALL_OFFSET,
          wall: "right",
        });
      }
    }
  }

  return slots;
}

/**
 * Checks whether a slot is already occupied by an existing item.
 * Uses a tolerance of 0.4 to account for floating point imprecision.
 */
function isSlotOccupied(slot: SlotPosition, existingItems: ExistingItem[]): boolean {
  const TOLERANCE = 0.4;
  return existingItems.some(
    (item) =>
      item.wall === slot.wall &&
      Math.abs(item.positionY - slot.positionY) < TOLERANCE &&
      Math.abs(item.positionZ - slot.positionZ) < TOLERANCE &&
      Math.abs(item.positionX - slot.positionX) < TOLERANCE
  );
}

/**
 * Returns true if all slots on a wall are occupied.
 */
export function isWallFull(existingItems: ExistingItem[], wall: Wall): boolean {
  const slots = getWallSlots(wall);
  return slots.every((slot) => isSlotOccupied(slot, existingItems));
}

/**
 * Returns the next available slot position.
 * Fills left wall first (top-left → bottom-right), then back wall.
 * Returns null if both walls are full.
 */
export function getNextSlotPosition(existingItems: ExistingItem[]): SlotPosition | null {
  // Try left wall first
  const leftSlots = getWallSlots("left");
  for (const slot of leftSlots) {
    if (!isSlotOccupied(slot, existingItems)) {
      return slot;
    }
  }

  // Then back wall (stored as "right" in DB)
  const rightSlots = getWallSlots("right");
  for (const slot of rightSlots) {
    if (!isSlotOccupied(slot, existingItems)) {
      return slot;
    }
  }

  return null;
}
