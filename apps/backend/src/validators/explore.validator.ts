import { z } from "zod";

export const exploreQuerySchema = z.object({
  sort: z.enum(["recent", "popular", "liked"]).default("recent"),
  sport: z.string().optional(),
  country: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const globeExploreQuerySchema = z.object({
  sport: z.string().optional(),
});
