import { z } from "zod";

export const createRaceSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.string().datetime().optional(),
  location: z.string().max(255).optional(),
  distance: z.string().max(50).optional(),
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
    .optional(),
  officialUrl: z.string().url().optional(),
});

export const createRaceResultSchema = z.object({
  raceId: z.string().uuid(),
  time: z.string().optional(),
  ranking: z.number().int().positive().optional(),
  categoryRanking: z.number().int().positive().optional(),
  totalParticipants: z.number().int().positive().optional(),
  source: z.enum(["manual", "ai", "scraped"]).default("manual"),
});
