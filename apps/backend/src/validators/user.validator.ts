import { z } from "zod";

const allowedSports = [
  "running",
  "trail",
  "triathlon",
  "cycling",
  "crossfit",
  "swimming",
  "ocr",
  "duathlon",
  "hyrox",
  "ironman",
  "marathon",
  "ultra",
  "other",
] as const;

const sportsSchema = z.array(z.enum(allowedSports)).min(1).max(13);

export const onboardingSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  country: z.string().length(2).optional(),
  sports: sportsSchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(200).optional(),
  country: z.string().length(2).optional().nullable(),
  locale: z.enum(["en", "fr"]).optional(),
  sports: sportsSchema.optional(),
  image: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});
