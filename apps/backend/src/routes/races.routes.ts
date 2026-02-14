import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "../db";
import { race, raceResult, user, room } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema, paginationSchema } from "../validators/common.validator";
import {
  createRaceSchema,
  createRaceResultSchema,
  searchRaceSchema,
} from "../validators/race.validator";
import { normalizeRaceName, getSearchTerms } from "../lib/race-matcher";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const races = new Hono<{ Variables: Variables }>()
  // Search races (fuzzy match) — must be before /:id
  .get(
    "/search",
    requireAuth,
    zValidator("query", searchRaceSchema),
    async (c) => {
      const { q, date, sport } = c.req.valid("query");

      const normalized = normalizeRaceName(q);
      const terms = getSearchTerms(normalized);

      if (terms.length === 0) {
        return c.json({ data: [] });
      }

      // Build ILIKE conditions for each term
      const conditions = terms.map(
        (term) => sql`lower(${race.name}) LIKE ${"%" + term + "%"}`
      );

      const whereConditions = [sql`(${sql.join(conditions, sql` AND `)})`];

      // Optional year filter from date
      if (date) {
        const year = new Date(date).getFullYear();
        if (!isNaN(year)) {
          whereConditions.push(
            sql`EXTRACT(YEAR FROM ${race.date}) = ${year}`
          );
        }
      }

      // Optional sport filter
      if (sport) {
        whereConditions.push(sql`${race.sport} = ${sport}`);
      }

      const results = await db
        .select({
          id: race.id,
          name: race.name,
          date: race.date,
          location: race.location,
          distance: race.distance,
          sport: race.sport,
          finisherCount: sql<number>`count(distinct ${raceResult.userId})`.as(
            "finisher_count"
          ),
        })
        .from(race)
        .leftJoin(raceResult, eq(raceResult.raceId, race.id))
        .where(and(...whereConditions))
        .groupBy(race.id)
        .orderBy(sql`count(distinct ${raceResult.userId}) DESC`)
        .limit(5);

      return c.json({ data: results });
    }
  )

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

  // Get finishers for a race
  .get(
    "/:id/finishers",
    zValidator("param", idParamSchema),
    zValidator("query", paginationSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { page, limit } = c.req.valid("query");
      const offset = (page - 1) * limit;

      // Verify race exists
      const raceItem = await db.query.race.findFirst({
        where: eq(race.id, id),
      });

      if (!raceItem) {
        return c.json({ error: "Not found" }, 404);
      }

      // Count total finishers
      const [countResult] = await db
        .select({
          count: sql<number>`count(distinct ${raceResult.userId})`,
        })
        .from(raceResult)
        .where(eq(raceResult.raceId, id));

      const totalFinishers = Number(countResult.count);

      // Get finishers with user info and room
      const finishers = await db
        .select({
          id: raceResult.id,
          time: raceResult.time,
          ranking: raceResult.ranking,
          categoryRanking: raceResult.categoryRanking,
          totalParticipants: raceResult.totalParticipants,
          user: {
            id: user.id,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            isPro: user.isPro,
          },
          roomLikeCount: room.likeCount,
        })
        .from(raceResult)
        .innerJoin(user, eq(user.id, raceResult.userId))
        .leftJoin(room, eq(room.userId, raceResult.userId))
        .where(eq(raceResult.raceId, id))
        .orderBy(
          sql`${raceResult.time} IS NULL ASC`,
          sql`${raceResult.time} ASC`,
          sql`COALESCE(${room.likeCount}, 0) DESC`
        )
        .limit(limit)
        .offset(offset);

      return c.json({
        data: {
          race: raceItem,
          finishers,
          totalFinishers,
        },
        page,
        limit,
      });
    }
  )

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
