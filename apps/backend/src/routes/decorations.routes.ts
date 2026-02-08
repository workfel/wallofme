import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { decoration, userDecoration } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema, paginationSchema } from "../validators/common.validator";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const decorations = new Hono<{ Variables: Variables }>()
  // List all decorations (catalogue)
  .get("/", zValidator("query", paginationSchema), async (c) => {
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;

    const items = await db.query.decoration.findMany({
      orderBy: desc(decoration.createdAt),
      limit,
      offset,
    });

    return c.json({ data: items, page, limit });
  })

  // Get single decoration
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    const item = await db.query.decoration.findFirst({
      where: eq(decoration.id, id),
    });

    if (!item) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({ data: item });
  })

  // List user's inventory
  .get("/inventory/me", requireAuth, zValidator("query", paginationSchema), async (c) => {
    const user = c.get("user")!;
    const { page, limit } = c.req.valid("query");
    const offset = (page - 1) * limit;

    const items = await db.query.userDecoration.findMany({
      where: eq(userDecoration.userId, user.id),
      orderBy: desc(userDecoration.acquiredAt),
      limit,
      offset,
      with: { decoration: true },
    });

    return c.json({ data: items, page, limit });
  })

  // Acquire decoration
  .post(
    "/:id/acquire",
    requireAuth,
    zValidator("param", idParamSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");

      const item = await db.query.decoration.findFirst({
        where: eq(decoration.id, id),
      });

      if (!item) {
        return c.json({ error: "Not found" }, 404);
      }

      const [acquired] = await db
        .insert(userDecoration)
        .values({ userId: user.id, decorationId: id })
        .returning();

      return c.json({ data: acquired }, 201);
    }
  );
