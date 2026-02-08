import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { race, raceResult } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema, paginationSchema } from "../validators/common.validator";
import {
  createRaceSchema,
  createRaceResultSchema,
} from "../validators/race.validator";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const races = new Hono<{ Variables: Variables }>()
  // List races
  .get("/", zValidator("query", paginationSchema), async (c) => {
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;

    const items = await db.query.race.findMany({
      orderBy: desc(race.createdAt),
      limit,
      offset,
    });

    return c.json({ data: items, page, limit });
  })

  // Get single race
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    const item = await db.query.race.findFirst({
      where: eq(race.id, id),
      with: { results: true },
    });

    if (!item) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({ data: item });
  })

  // Create race
  .post("/", requireAuth, zValidator("json", createRaceSchema), async (c) => {
    const body = c.req.valid("json");

    const [item] = await db
      .insert(race)
      .values({
        ...body,
        date: body.date ? new Date(body.date) : undefined,
      })
      .returning();

    return c.json({ data: item }, 201);
  })

  // Add race result for current user
  .post(
    "/results",
    requireAuth,
    zValidator("json", createRaceResultSchema),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      const [item] = await db
        .insert(raceResult)
        .values({ ...body, userId: user.id })
        .returning();

      return c.json({ data: item }, 201);
    }
  )

  // List user's race results
  .get("/results/me", requireAuth, zValidator("query", paginationSchema), async (c) => {
    const user = c.get("user")!;
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;

    const items = await db.query.raceResult.findMany({
      where: eq(raceResult.userId, user.id),
      orderBy: desc(raceResult.createdAt),
      limit,
      offset,
      with: { race: true },
    });

    return c.json({ data: items, page, limit });
  });
