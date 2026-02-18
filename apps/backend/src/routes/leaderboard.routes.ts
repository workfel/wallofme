import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { user, trophy, room } from "../db/schema";
import { paginationSchema } from "../validators/common.validator";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const leaderboardQuerySchema = paginationSchema.extend({
  sort: z.enum(["trophies", "likes"]).default("trophies"),
});

export const leaderboard = new Hono<{ Variables: Variables }>()

  // GET /api/leaderboard?sort=trophies|likes&page=1&limit=20
  .get("/", zValidator("query", leaderboardQuerySchema), async (c) => {
    const { page, limit, sort } = c.req.valid("query");
    const offset = (page - 1) * limit;

    const trophyCount = sql<number>`count(distinct ${trophy.id})`.as("trophyCount");
    const roomLikeCount = sql<number>`coalesce(max(${room.likeCount}), 0)`.as("roomLikeCount");

    const orderBy =
      sort === "likes"
        ? desc(sql`coalesce(max(${room.likeCount}), 0)`)
        : desc(sql`count(distinct ${trophy.id})`);

    const results = await db
      .select({
        id: user.id,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        isPro: user.isPro,
        trophyCount,
        roomLikeCount,
      })
      .from(user)
      .leftJoin(trophy, eq(trophy.userId, user.id))
      .leftJoin(room, eq(room.userId, user.id))
      .groupBy(user.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Compute current user's rank when authenticated
    const authUser = c.get("user");
    let currentUser = null;

    if (authUser) {
      const rankOrder =
        sort === "likes"
          ? sql`coalesce(max(${room.likeCount}), 0) DESC`
          : sql`count(distinct ${trophy.id}) DESC`;

      const ranked = db
        .select({
          id: user.id,
          displayName: user.displayName,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          isPro: user.isPro,
          trophyCount:
            sql<number>`count(distinct ${trophy.id})::int`.as("tc"),
          roomLikeCount:
            sql<number>`coalesce(max(${room.likeCount}), 0)::int`.as("rlc"),
          rank: sql<number>`(ROW_NUMBER() OVER (ORDER BY ${rankOrder}))::int`.as(
            "rank",
          ),
        })
        .from(user)
        .leftJoin(trophy, eq(trophy.userId, user.id))
        .leftJoin(room, eq(room.userId, user.id))
        .groupBy(user.id)
        .as("ranked");

      const [myRow] = await db
        .select()
        .from(ranked)
        .where(eq(ranked.id, authUser.id));

      currentUser = myRow ?? null;
    }

    return c.json({ data: results, page, limit, sort, currentUser });
  });
