// Room dimensions (must match pain-cave-scene.component.ts)
const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;

// Wall offset from center
const WALL_OFFSET = 0.30; // wall thickness / 2 + small gap (WALL_THICKNESS=0.55)

// Grid: 9 columns x 6 rows = 54 slots per wall, 108 total
const COLUMNS = 9;
const ROWS = 6;

// Margins and spacing
const MARGIN = 0.3;
const USABLE_WIDTH = ROOM_DEPTH - 2 * MARGIN; // 5.4
const USABLE_HEIGHT = ROOM_HEIGHT - 2 * MARGIN; // 2.4

const COL_SPACING = USABLE_WIDTH / (COLUMNS - 1); // ~0.675
const ROW_SPACING = USABLE_HEIGHT / (ROWS - 1); // ~0.48

// Y positions: top to bottom [2.7, 2.22, 1.74, 1.26, 0.78, 0.3]
const Y_POSITIONS = Array.from({ length: ROWS }, (_, i) =>
  ROOM_HEIGHT - MARGIN - i * ROW_SPACING
);

// Axis positions: left to right [-2.7, -2.025, -1.35, -0.675, 0, 0.675, 1.35, 2.025, 2.7]
const AXIS_POSITIONS = Array.from({ length: COLUMNS }, (_, i) =>
  -USABLE_WIDTH / 2 + i * COL_SPACING
);

// Tolerance for occupied-slot check (tighter for dense grid)
const OCCUPIED_TOLERANCE = 0.2;

export type Wall = "left" | "right";

export interface SlotPosition {
  positionX: number;
  positionY: number;
  positionZ: number;
  wall: Wall;
}

interface ExistingItem {
  positionX: number;
  positionY: number;
  positionZ: number;
  wall: Wall | null;
}

/**
 * Returns all slot positions for a given wall.
 * - "left" wall: X = -ROOM_WIDTH/2, items face +X, slots vary on Z and Y
 * - "right" wall (mapped to back wall in 3D): Z = -ROOM_DEPTH/2, items face +Z, slots vary on X and Y
 *
 * Order: top-left → top-right → bottom-left → bottom-right (row by row)
 */
export function getWallSlots(wall: Wall): SlotPosition[] {
  const slots: SlotPosition[] = [];

  for (const y of Y_POSITIONS) {
    for (const axis of AXIS_POSITIONS) {
      if (wall === "left") {
        slots.push({
          positionX: -ROOM_WIDTH / 2 + WALL_OFFSET,
          positionY: y,
          positionZ: axis,
          wall: "left",
        });
      } else {
        // "right" in DB = back wall in 3D
        slots.push({
          positionX: axis,
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
 */
function isSlotOccupied(slot: SlotPosition, existingItems: ExistingItem[]): boolean {
  return existingItems.some(
    (item) =>
      item.wall === slot.wall &&
      Math.abs(item.positionY - slot.positionY) < OCCUPIED_TOLERANCE &&
      Math.abs(item.positionZ - slot.positionZ) < OCCUPIED_TOLERANCE &&
      Math.abs(item.positionX - slot.positionX) < OCCUPIED_TOLERANCE
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

/**
 * Returns all 108 slot positions across both walls.
 */
export function getAllSlots(): SlotPosition[] {
  return [...getWallSlots("left"), ...getWallSlots("right")];
}
