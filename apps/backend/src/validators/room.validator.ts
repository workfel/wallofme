import { z } from "zod";

export const updateRoomSchema = z.object({
  themeId: z.string().optional(),
  floor: z.string().optional(),
});

export const placeItemSchema = z.object({
  trophyId: z.string().uuid().nullable().optional(),
  decorationId: z.string().uuid().nullable().optional(),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  positionZ: z.number().default(0),
  rotationY: z.number().default(0),
  wall: z.enum(["left", "right"]).nullable().optional(),
});

export const moveItemSchema = z.object({
  positionX: z.number(),
  positionY: z.number(),
  positionZ: z.number(),
  rotationY: z.number().optional(),
  wall: z.enum(["left", "right"]).nullable().optional(),
});
