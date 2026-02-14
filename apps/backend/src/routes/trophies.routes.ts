import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { trophy, raceResult } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema, paginationSchema } from "../validators/common.validator";
import {
  createTrophySchema,
  updateTrophySchema,
} from "../validators/trophy.validator";
import { FREE_SCAN_LIMIT, getMonthlyScansUsed } from "../lib/scan-limit";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const trophies = new Hono<{ Variables: Variables }>()
  // List user's trophies
  .get("/", requireAuth, zValidator("query", paginationSchema), async (c) => {
    const user = c.get("user")!;
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;

    const items = await db.query.trophy.findMany({
      where: eq(trophy.userId, user.id),
      orderBy: desc(trophy.createdAt),
      limit,
      offset,
      with: { raceResult: { with: { race: true } } },
    });

    return c.json({ data: items, page, limit });
  })

  // Get single trophy
  .get("/:id", requireAuth, zValidator("param", idParamSchema), async (c) => {
    const user = c.get("user")!;
    const { id } = c.req.valid("param");

    const item = await db.query.trophy.findFirst({
      where: eq(trophy.id, id),
      with: { raceResult: { with: { race: true } } },
    });

    if (!item || item.userId !== user.id) {
      return c.json({ error: "Not found" }, 404);
    }

    // Count finishers for the associated race
    let finisherCount = 0;
    const raceId = item.raceResult?.race?.id;
    if (raceId) {
      const [countResult] = await db
        .select({
          count: sql<number>`count(distinct ${raceResult.userId})`,
        })
        .from(raceResult)
        .where(eq(raceResult.raceId, raceId));
      finisherCount = Number(countResult.count);
    }

    return c.json({ data: { ...item, finisherCount } });
  })

  // Create trophy
  .post("/", requireAuth, zValidator("json", createTrophySchema), async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    // Check scan limit for free users BEFORE creating the trophy
    if (!user.isPro) {
      const used = await getMonthlyScansUsed(user.id);
      if (used >= FREE_SCAN_LIMIT) {
        return c.json(
          { error: "scan_limit_reached", scansRemaining: 0 },
          403,
        );
      }
    }

    const [item] = await db
      .insert(trophy)
      .values({ ...body, userId: user.id })
      .returning();

    return c.json({ data: item }, 201);
  })

  // Update trophy
  .patch(
    "/:id",
    requireAuth,
    zValidator("param", idParamSchema),
    zValidator("json", updateTrophySchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const existing = await db.query.trophy.findFirst({
        where: eq(trophy.id, id),
      });

      if (!existing || existing.userId !== user.id) {
        return c.json({ error: "Not found" }, 404);
      }

      const [updated] = await db
        .update(trophy)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(trophy.id, id))
        .returning();

      return c.json({ data: updated });
    }
  )

  // Delete trophy
  .delete(
    "/:id",
    requireAuth,
    zValidator("param", idParamSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");

      const existing = await db.query.trophy.findFirst({
        where: eq(trophy.id, id),
      });

      if (!existing || existing.userId !== user.id) {
        return c.json({ error: "Not found" }, 404);
      }

      await db.delete(trophy).where(eq(trophy.id, id));
      return c.json({ success: true });
    }
  );
