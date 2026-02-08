import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { trophy } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema, paginationSchema } from "../validators/common.validator";
import {
  createTrophySchema,
  updateTrophySchema,
} from "../validators/trophy.validator";
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

    return c.json({ data: item });
  })

  // Create trophy
  .post("/", requireAuth, zValidator("json", createTrophySchema), async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

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
