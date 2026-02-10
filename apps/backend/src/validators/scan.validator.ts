import { z } from "zod";

export const analyzeSchema = z.object({
  trophyId: z.string().uuid(),
});

export const removeBackgroundSchema = z.object({
  trophyId: z.string().uuid(),
});

export const validateSchema = z.object({
  trophyId: z.string().uuid(),
  type: z.enum(["medal", "bib"]),
  raceName: z.string().min(1),
  date: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  sport: z
    .enum([
      "running",
      "trail",
      "triathlon",
      "cycling",
      "swimming",
      "obstacle",
      "other",
    ])
    .nullable()
    .optional(),
  distance: z.string().nullable().optional(),
});

export const searchResultsSchema = z.object({
  raceResultId: z.string().uuid(),
});
