import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, asc, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { theme, userTheme, user, tokenTransaction } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema } from "../validators/common.validator";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const themes = new Hono<{ Variables: Variables }>()
  // GET / — list all active themes
  .get("/", async (c) => {
    const items = await db.query.theme.findMany({
      where: eq(theme.isActive, true),
      orderBy: asc(theme.sortOrder),
    });
    return c.json({ data: items });
  })

  // GET /inventory/me — user's unlocked themes (MUST be before /:id)
  .get("/inventory/me", requireAuth, async (c) => {
    const userId = c.get("user")!.id;
    const items = await db.query.userTheme.findMany({
      where: eq(userTheme.userId, userId),
      with: { theme: true },
    });
    return c.json({ data: items });
  })

  // GET /:id — single theme
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    const item = await db.query.theme.findFirst({
      where: and(eq(theme.id, id), eq(theme.isActive, true)),
    });
    if (!item) {
      return c.json({ error: "Theme not found" }, 404);
    }
    return c.json({ data: item });
  })

  // POST /:id/acquire — acquire a theme
  .post(
    "/:id/acquire",
    requireAuth,
    zValidator("param", idParamSchema),
    async (c) => {
      const userId = c.get("user")!.id;
      const { id: themeId } = c.req.valid("param");

      // Check theme exists and is active
      const themeItem = await db.query.theme.findFirst({
        where: and(eq(theme.id, themeId), eq(theme.isActive, true)),
      });
      if (!themeItem) {
        return c.json({ error: "Theme not found" }, 404);
      }

      // Check if already owned
      const existing = await db.query.userTheme.findFirst({
        where: and(
          eq(userTheme.userId, userId),
          eq(userTheme.themeId, themeId)
        ),
      });
      if (existing) {
        return c.json({ error: "Already owned" }, 409);
      }

      // Free theme
      if (themeItem.isFree || themeItem.priceTokens === 0) {
        const [acquired] = await db
          .insert(userTheme)
          .values({ userId, themeId })
          .returning();
        return c.json({ data: acquired }, 201);
      }

      // Paid theme — check balance and debit in transaction
      const currentUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });
      if (
        !currentUser ||
        (currentUser.tokenBalance ?? 0) < themeItem.priceTokens
      ) {
        return c.json({ error: "Insufficient tokens" }, 403);
      }

      const result = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(user)
          .set({
            tokenBalance: sql`token_balance - ${themeItem.priceTokens}`,
          })
          .where(
            and(
              eq(user.id, userId),
              gte(user.tokenBalance, themeItem.priceTokens)
            )
          )
          .returning({ tokenBalance: user.tokenBalance });

        if (!updated) throw new Error("Insufficient tokens");

        await tx.insert(tokenTransaction).values({
          userId,
          type: "spend_theme",
          amount: -themeItem.priceTokens,
          balance: updated.tokenBalance,
          referenceId: themeId,
          referenceType: "theme",
        });

        const [acquired] = await tx
          .insert(userTheme)
          .values({ userId, themeId })
          .returning();

        return acquired;
      });

      return c.json({ data: result }, 201);
    }
  );
