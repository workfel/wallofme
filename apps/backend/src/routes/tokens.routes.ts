import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc, gte, count } from "drizzle-orm";
import { db } from "../db";
import { tokenTransaction } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { paginationSchema } from "../validators/common.validator";
import { getBalance, creditTokens } from "../lib/token-service";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const REWARDED_VIDEO_AMOUNT = 5;
const REWARDED_VIDEO_MAX_PER_DAY = 5;
const REWARDED_VIDEO_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes

const DAILY_LOGIN_AMOUNT = 5;

/** Product ID → token amount mapping (must match store products) */
const PRODUCT_TOKEN_MAP: Record<string, number> = {
  wallofme_tokens_100: 100,
  wallofme_tokens_550: 550,
  wallofme_tokens_1200: 1200,
  wallofme_tokens_2600: 2600,
  wallofme_tokens_7000: 7000,
};

const purchaseSchema = z.object({
  productId: z.string().min(1),
  tokens: z.number().int().positive(),
});

export const tokens = new Hono<{ Variables: Variables }>()
  // GET /balance
  .get("/balance", requireAuth, async (c) => {
    const user = c.get("user")!;
    const balance = await getBalance(user.id);
    return c.json({ data: { balance } });
  })

  // GET /transactions
  .get(
    "/transactions",
    requireAuth,
    zValidator("query", paginationSchema),
    async (c) => {
      const userId = c.get("user")!.id;
      const { page, limit } = c.req.valid("query");
      const offset = (page - 1) * limit;

      const [transactions, totalResult] = await Promise.all([
        db.query.tokenTransaction.findMany({
          where: eq(tokenTransaction.userId, userId),
          orderBy: desc(tokenTransaction.createdAt),
          limit,
          offset,
        }),
        db
          .select({ count: count() })
          .from(tokenTransaction)
          .where(eq(tokenTransaction.userId, userId)),
      ]);

      return c.json({
        data: transactions,
        total: totalResult[0].count,
        page,
        limit,
      });
    }
  )

  // POST /earn/rewarded-video
  .post("/earn/rewarded-video", requireAuth, async (c) => {
    const userId = c.get("user")!.id;

    // Check cooldown
    const lastReward = await db.query.tokenTransaction.findFirst({
      where: and(
        eq(tokenTransaction.userId, userId),
        eq(tokenTransaction.type, "rewarded_video")
      ),
      orderBy: desc(tokenTransaction.createdAt),
    });

    if (lastReward) {
      const elapsed = Date.now() - lastReward.createdAt.getTime();
      if (elapsed < REWARDED_VIDEO_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil(
          (REWARDED_VIDEO_COOLDOWN_MS - elapsed) / 1000
        );
        return c.json(
          { error: "Cooldown active", retryAfterSeconds },
          429
        );
      }
    }

    // Check daily cap
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [dailyCount] = await db
      .select({ count: count() })
      .from(tokenTransaction)
      .where(
        and(
          eq(tokenTransaction.userId, userId),
          eq(tokenTransaction.type, "rewarded_video"),
          gte(tokenTransaction.createdAt, todayStart)
        )
      );

    if (dailyCount.count >= REWARDED_VIDEO_MAX_PER_DAY) {
      return c.json(
        { error: "Daily limit reached", maxPerDay: REWARDED_VIDEO_MAX_PER_DAY },
        429
      );
    }

    const balance = await creditTokens(
      userId,
      REWARDED_VIDEO_AMOUNT,
      "rewarded_video"
    );

    return c.json({
      data: {
        balance,
        earned: REWARDED_VIDEO_AMOUNT,
        remaining: REWARDED_VIDEO_MAX_PER_DAY - dailyCount.count - 1,
      },
    });
  })

  // POST /earn/daily-login
  .post("/earn/daily-login", requireAuth, async (c) => {
    const userId = c.get("user")!.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Check if already claimed today
    const todayClaim = await db.query.tokenTransaction.findFirst({
      where: and(
        eq(tokenTransaction.userId, userId),
        eq(tokenTransaction.type, "bonus"),
        gte(tokenTransaction.createdAt, todayStart)
      ),
    });

    if (todayClaim) {
      return c.json({ error: "Already claimed today" }, 429);
    }

    const balance = await creditTokens(
      userId,
      DAILY_LOGIN_AMOUNT,
      "bonus",
      "daily-login",
      "daily_login"
    );

    return c.json({
      data: {
        balance,
        earned: DAILY_LOGIN_AMOUNT,
      },
    });
  })

  // POST /earn/purchase — credit tokens from an in-app purchase
  .post(
    "/earn/purchase",
    requireAuth,
    zValidator("json", purchaseSchema),
    async (c) => {
      const userId = c.get("user")!.id;
      const { productId, tokens } = c.req.valid("json");

      // Validate that the product ID and token amount match our expectations
      const expectedTokens = PRODUCT_TOKEN_MAP[productId];
      if (!expectedTokens || expectedTokens !== tokens) {
        return c.json({ error: "Invalid product" }, 400);
      }

      const balance = await creditTokens(
        userId,
        tokens,
        "purchase",
        productId,
        "iap"
      );

      return c.json({
        data: {
          balance,
          earned: tokens,
        },
      });
    }
  )

  // GET /starter-pack/status
  .get("/starter-pack/status", requireAuth, async (c) => {
    const userId = c.get("user")!.id;

    const existing = await db.query.tokenTransaction.findFirst({
      where: and(
        eq(tokenTransaction.userId, userId),
        eq(tokenTransaction.referenceId, "starter_pack")
      ),
    });

    return c.json({ data: { available: !existing } });
  })

  // POST /starter-pack/purchase
  .post("/starter-pack/purchase", requireAuth, async (c) => {
    const userId = c.get("user")!.id;

    // Idempotency check
    const existing = await db.query.tokenTransaction.findFirst({
      where: and(
        eq(tokenTransaction.userId, userId),
        eq(tokenTransaction.referenceId, "starter_pack")
      ),
    });

    if (existing) {
      return c.json({ error: "Already purchased" }, 409);
    }

    const balance = await creditTokens(
      userId,
      300,
      "purchase",
      "starter_pack",
      "starter_pack"
    );

    return c.json({
      data: {
        balance,
        earned: 300,
      },
    });
  });
