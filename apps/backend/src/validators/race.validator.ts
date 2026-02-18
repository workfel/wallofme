import { z } from "zod";
import { paginationSchema } from "../validators/common.validator";

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

export const searchRaceSchema = z.object({
  q: z.string().min(3),
  date: z.string().optional(),
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
});

export const createRaceResultSchema = z.object({
  raceId: z.string().uuid(),
  time: z.string().optional(),
  ranking: z.number().int().positive().optional(),
  categoryRanking: z.number().int().positive().optional(),
  totalParticipants: z.number().int().positive().optional(),
  source: z.enum(["manual", "ai", "scraped"]).default("manual"),
});

export const updateRaceResultSchema = z.object({
  time: z.string().nullable().optional(),
  ranking: z.number().int().positive().nullable().optional(),
  categoryRanking: z.number().int().positive().nullable().optional(),
  totalParticipants: z.number().int().positive().nullable().optional(),
});

export const listRaceSchema = paginationSchema.extend({
  sport: z.preprocess(
    (v) => v === undefined ? undefined : Array.isArray(v) ? v : [v],
    z.array(z.enum(["running","trail","triathlon","cycling","swimming","obstacle","other"])).optional()
  ),
  q: z.string().optional(),
});

export const finishersSortSchema = paginationSchema.extend({
  sort: z.enum(["time", "trophies", "likes"]).default("time"),
});
