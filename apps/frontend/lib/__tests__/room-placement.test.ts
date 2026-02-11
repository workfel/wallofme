import { describe, it, expect } from "vitest";
import {
  getNextSlotPosition,
  getWallSlots,
  isWallFull,
} from "../room-placement";

describe("getWallSlots", () => {
  it("returns 6 slots per wall", () => {
    expect(getWallSlots("left")).toHaveLength(6);
    expect(getWallSlots("right")).toHaveLength(6);
  });

  it("left wall slots have fixed X at wall position", () => {
    const slots = getWallSlots("left");
    for (const slot of slots) {
      expect(slot.positionX).toBe(-3 + 0.15);
      expect(slot.wall).toBe("left");
    }
  });

  it("right/back wall slots have fixed Z at wall position", () => {
    const slots = getWallSlots("right");
    for (const slot of slots) {
      expect(slot.positionZ).toBe(-3 + 0.15);
      expect(slot.wall).toBe("right");
    }
  });
});

describe("getNextSlotPosition", () => {
  it("returns first left wall slot for empty room", () => {
    const slot = getNextSlotPosition([]);
    expect(slot).not.toBeNull();
    expect(slot!.wall).toBe("left");
    // First slot: top-left (Y=2.0, Z=-1.5)
    expect(slot!.positionY).toBe(2.0);
    expect(slot!.positionZ).toBe(-1.5);
  });

  it("fills left wall slots in order", () => {
    const items: { positionX: number; positionY: number; positionZ: number; wall: "left" | "right" | null }[] = [];

    // Fill all 6 left wall slots one by one
    for (let i = 0; i < 6; i++) {
      const slot = getNextSlotPosition(items);
      expect(slot).not.toBeNull();
      expect(slot!.wall).toBe("left");
      items.push(slot!);
    }

    // 7th slot should go to right (back) wall
    const backSlot = getNextSlotPosition(items);
    expect(backSlot).not.toBeNull();
    expect(backSlot!.wall).toBe("right");
  });

  it("returns null when both walls are full", () => {
    const items: { positionX: number; positionY: number; positionZ: number; wall: "left" | "right" | null }[] = [];

    // Fill all 12 slots
    for (let i = 0; i < 12; i++) {
      const slot = getNextSlotPosition(items);
      expect(slot).not.toBeNull();
      items.push(slot!);
    }

    // 13th slot should be null
    const overflow = getNextSlotPosition(items);
    expect(overflow).toBeNull();
  });

  it("does not produce overlapping positions", () => {
    const items: { positionX: number; positionY: number; positionZ: number; wall: "left" | "right" | null }[] = [];
    const positions = new Set<string>();

    for (let i = 0; i < 12; i++) {
      const slot = getNextSlotPosition(items);
      expect(slot).not.toBeNull();
      const key = `${slot!.wall}:${slot!.positionX}:${slot!.positionY}:${slot!.positionZ}`;
      expect(positions.has(key)).toBe(false);
      positions.add(key);
      items.push(slot!);
    }
  });
});

describe("isWallFull", () => {
  it("returns false for empty room", () => {
    expect(isWallFull([], "left")).toBe(false);
    expect(isWallFull([], "right")).toBe(false);
  });

  it("returns true when all 6 slots are occupied", () => {
    const leftSlots = getWallSlots("left");
    expect(isWallFull(leftSlots, "left")).toBe(true);
  });

  it("returns false when only some slots are occupied", () => {
    const leftSlots = getWallSlots("left").slice(0, 3);
    expect(isWallFull(leftSlots, "left")).toBe(false);
  });
});
