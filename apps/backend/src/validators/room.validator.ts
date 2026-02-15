import { z } from "zod";

const customThemeSchema = z.object({
  leftWallColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backWallColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  floorColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  materials: z.object({
    floorMaterialId: z.string().optional(),
    wallMaterialId: z.string().optional(),
    backgroundId: z.string().optional(),
  }).optional(),
}).nullable();

export const updateRoomSchema = z.object({
  themeId: z.string().nullable().optional(),
  floor: z.string().optional(),
  customTheme: customThemeSchema.optional(),
  thumbnailKey: z.string().min(1).optional(),
});

export const placeItemSchema = z.object({
  trophyId: z.string().uuid().nullable().optional(),
  decorationId: z.string().uuid().nullable().optional(),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  positionZ: z.number().default(0),
  rotationY: z.number().default(0),
  wall: z.enum(["left", "right"]).nullable().optional(),
  scaleX: z.number().default(1),
  scaleY: z.number().default(1),
  scaleZ: z.number().default(1),
  customImageUrl: z.string().url().nullable().optional(),
});

export const moveItemSchema = z.object({
  positionX: z.number(),
  positionY: z.number(),
  positionZ: z.number(),
  rotationY: z.number().optional(),
  wall: z.enum(["left", "right"]).nullable().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  scaleZ: z.number().optional(),
  customImageUrl: z.string().url().nullable().optional(),
});

export const updateFrameImageSchema = z.object({
  imageKey: z.string().min(1),
});
