import { z } from "zod";

export const createTrophySchema = z.object({
  type: z.enum(["medal", "bib"]),
  raceResultId: z.string().uuid().optional(),
});

export const updateTrophySchema = z.object({
  type: z.enum(["medal", "bib"]).optional(),
  raceResultId: z.string().uuid().nullable().optional(),
  aiIdentifiedRace: z.string().optional(),
  aiConfidence: z.number().min(0).max(1).optional(),
});
