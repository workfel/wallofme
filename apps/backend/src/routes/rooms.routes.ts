import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, sql, desc, ilike, or, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db";
import { room, roomItem, user, trophy, roomView } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema } from "../validators/common.validator";
import {
  updateRoomSchema,
  placeItemSchema,
  moveItemSchema,
} from "../validators/room.validator";
import { exploreQuerySchema } from "../validators/explore.validator";
import { getPublicUrl } from "../lib/storage";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const rooms = new Hono<{ Variables: Variables }>()
  // Explore rooms feed (public, user-aware)
  .get(
    "/explore",
    zValidator("query", exploreQuerySchema),
    async (c) => {
      const { sort, sport, country, search, page, limit } = c.req.valid("query");
      const offset = (page - 1) * limit;

      // Subquery: count trophies with status 'ready' per user
      const trophyCountSq = db
        .select({
          userId: trophy.userId,
          count: sql<number>`count(*)::int`.as("trophy_count"),
        })
        .from(trophy)
        .where(eq(trophy.status, "ready"))
        .groupBy(trophy.userId)
        .as("trophy_count_sq");

      // Build WHERE conditions
      const conditions = [gt(trophyCountSq.count, 0)];

      if (search) {
        conditions.push(
          or(
            ilike(user.displayName, `%${search}%`),
            ilike(user.firstName, `%${search}%`),
            ilike(user.lastName, `%${search}%`),
          )!,
        );
      }

      if (country) {
        conditions.push(eq(user.country, country));
      }

      if (sport) {
        // user.sports is a JSON text column (e.g. '["running","trail"]')
        conditions.push(sql`${user.sports} LIKE ${"%" + sport + "%"}`);
      }

      const whereClause = and(...conditions);

      // Sort order
      const orderBy =
        sort === "popular"
          ? desc(room.viewCount)
          : sort === "liked"
            ? desc(room.likeCount)
            : desc(room.updatedAt);

      // Main query
      const rows = await db
        .select({
          id: room.id,
          userId: room.userId,
          displayName: user.displayName,
          firstName: user.firstName,
          image: user.image,
          sports: user.sports,
          country: user.country,
          thumbnailUrl: room.thumbnailUrl,
          likeCount: room.likeCount,
          viewCount: room.viewCount,
          trophyCount: trophyCountSq.count,
          isPro: user.isPro,
          updatedAt: room.updatedAt,
        })
        .from(room)
        .innerJoin(user, eq(room.userId, user.id))
        .innerJoin(trophyCountSq, eq(user.id, trophyCountSq.userId))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Total count for pagination
      const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(room)
        .innerJoin(user, eq(room.userId, user.id))
        .innerJoin(trophyCountSq, eq(user.id, trophyCountSq.userId))
        .where(whereClause);

      const rooms = rows.map((r) => ({
        ...r,
        sports: r.sports ? JSON.parse(r.sports) : [],
        thumbnailUrl: r.thumbnailUrl,
      }));

      return c.json({
        data: {
          rooms,
          total,
          hasMore: offset + limit < total,
        },
      });
    },
  )

  // Get current user's room (create if not exists)
  .get("/me", requireAuth, async (c) => {
    const user = c.get("user")!;

    let userRoom = await db.query.room.findFirst({
      where: eq(room.userId, user.id),
      with: {
        items: {
          with: {
            trophy: { with: { raceResult: { with: { race: true } } } },
            decoration: true,
          },
        },
      },
    });

    if (!userRoom) {
      const [created] = await db
        .insert(room)
        .values({ userId: user.id })
        .returning();
      userRoom = { ...created, items: [] };
    }

    return c.json({ data: userRoom });
  })

  // Generate share link
  .post("/me/share", requireAuth, async (c) => {
    const user = c.get("user")!;

    const userRoom = await db.query.room.findFirst({
      where: eq(room.userId, user.id),
    });

    if (!userRoom) {
      return c.json({ error: "Room not found" }, 404);
    }

    // Return existing slug if already generated
    if (userRoom.shareSlug) {
      return c.json({ data: { shareSlug: userRoom.shareSlug } });
    }

    // Generate new slug
    const slug = nanoid(8);
    const [updated] = await db
      .update(room)
      .set({ shareSlug: slug, updatedAt: new Date() })
      .where(eq(room.id, userRoom.id))
      .returning();

    return c.json({ data: { shareSlug: updated.shareSlug } });
  })

  // Get room by share slug (public)
  .get("/share/:slug", async (c) => {
    const slug = c.req.param("slug");
    const ua = c.req.header("user-agent") ?? "";

    const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|Discordbot|Googlebot/i.test(ua);

    if (isCrawler) {
      const userRoom = await db.query.room.findFirst({
        where: eq(room.shareSlug, slug),
        with: {
          user: true,
          items: {
            with: { trophy: true },
          },
        },
      });

      if (!userRoom) {
        return c.html("<!DOCTYPE html><html><head><title>Room not found</title></head><body></body></html>", 404);
      }

      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const displayName = esc(userRoom.user?.displayName ?? userRoom.user?.name ?? "An athlete");
      const title = `${displayName}'s Pain Cave`;
      const description = "Check out this Pain Cave on WallOfMe!";
      const ogImage = esc(userRoom.items.find((i) => i.trophy?.thumbnailUrl)?.trophy?.thumbnailUrl ?? "");
      const ogUrl = esc(c.req.url);

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:url" content="${ogUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImage}" />
</head>
<body></body>
</html>`;

      return c.html(html);
    }

    // Normal API response for app clients
    const userRoom = await db.query.room.findFirst({
      where: eq(room.shareSlug, slug),
      with: {
        items: {
          with: {
            trophy: { with: { raceResult: { with: { race: true } } } },
            decoration: true,
          },
        },
      },
    });

    if (!userRoom) {
      return c.json({ error: "Room not found" }, 404);
    }

    return c.json({ data: userRoom });
  })

  // Get another user's room (public visit)
  .get(
    "/user/:id",
    async (c) => {
      const id = c.req.param("id");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, id),
        with: {
          items: {
            with: {
              trophy: { with: { raceResult: { with: { race: true } } } },
              decoration: true,
            },
          },
        },
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      return c.json({ data: userRoom });
    }
  )

  // Update room settings
  .patch(
    "/me",
    requireAuth,
    zValidator("json", updateRoomSchema),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      const { thumbnailKey, ...rest } = body;
      const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (rest.customTheme !== undefined) {
        updateData.customTheme = rest.customTheme ? JSON.stringify(rest.customTheme) : null;
      }
      if (thumbnailKey) {
        updateData.thumbnailUrl = getPublicUrl(thumbnailKey);
      }

      const [updated] = await db
        .update(room)
        .set(updateData)
        .where(eq(room.userId, user.id))
        .returning();

      if (!updated) {
        return c.json({ error: "Room not found" }, 404);
      }

      return c.json({ data: updated });
    }
  )

  // Place item in room
  .post(
    "/items",
    requireAuth,
    zValidator("json", placeItemSchema),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, user.id),
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      const [item] = await db
        .insert(roomItem)
        .values({ ...body, roomId: userRoom.id })
        .returning();

      return c.json({ data: item }, 201);
    }
  )

  // Move item in room
  .patch(
    "/items/:id",
    requireAuth,
    zValidator("param", idParamSchema),
    zValidator("json", moveItemSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, user.id),
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      const existing = await db.query.roomItem.findFirst({
        where: eq(roomItem.id, id),
      });

      if (!existing || existing.roomId !== userRoom.id) {
        return c.json({ error: "Item not found" }, 404);
      }

      const [updated] = await db
        .update(roomItem)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(roomItem.id, id))
        .returning();

      return c.json({ data: updated });
    }
  )

  // Remove item from room
  .delete(
    "/items/:id",
    requireAuth,
    zValidator("param", idParamSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, user.id),
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      const existing = await db.query.roomItem.findFirst({
        where: eq(roomItem.id, id),
      });

      if (!existing || existing.roomId !== userRoom.id) {
        return c.json({ error: "Item not found" }, 404);
      }

      await db.delete(roomItem).where(eq(roomItem.id, id));
      return c.json({ success: true });
    }
  );
