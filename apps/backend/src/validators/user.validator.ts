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
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(200).optional(),
  country: z.string().length(2).optional().nullable(),
  locale: z.enum(["en", "fr"]).optional(),
  sports: sportsSchema.optional(),
});
