import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { tokenTransaction } from "../db/schema";
import { creditTokens } from "../lib/token-service";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

/** Product ID → token amount mapping (must match RevenueCat / Stripe products) */
const PRODUCT_TOKEN_MAP: Record<string, number> = {
  wallofme_tokens_100: 100,
  wallofme_tokens_550: 550,
  wallofme_tokens_1200: 1200,
  wallofme_tokens_2600: 2600,
  wallofme_tokens_7000: 7000,
};

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  product_id: string;
  transaction_id?: string;
  store?: string;
  environment?: string;
}

interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

export const webhooks = new Hono<{ Variables: Variables }>()
  // POST /revenuecat — RevenueCat webhook for purchase events
  .post("/revenuecat", async (c) => {
    // Verify webhook secret
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (secret) {
      const authHeader = c.req.header("Authorization");
      if (authHeader !== `Bearer ${secret}`) {
        return c.json({ error: "Unauthorized" }, 401);
      }
    }

    const payload: RevenueCatWebhookPayload = await c.req.json();
    const event = payload.event;

    if (!event) {
      return c.json({ error: "Missing event" }, 400);
    }

    // Only process non-renewing purchases (consumable one-time tokens)
    if (event.type !== "NON_RENEWING_PURCHASE") {
      // Acknowledge other event types without processing
      return c.json({ status: "ignored", type: event.type });
    }

    const { app_user_id: userId, product_id: productId, transaction_id: transactionId } = event;

    if (!userId || !productId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const tokens = PRODUCT_TOKEN_MAP[productId];
    if (!tokens) {
      return c.json({ error: "Unknown product" }, 400);
    }

    // Idempotency check: skip if this transaction was already processed
    if (transactionId) {
      const existing = await db.query.tokenTransaction.findFirst({
        where: and(
          eq(tokenTransaction.referenceId, transactionId),
          eq(tokenTransaction.type, "purchase"),
        ),
      });

      if (existing) {
        return c.json({ status: "already_processed", transactionId });
      }
    }

    // Credit tokens
    const referenceId = transactionId || `rc_${productId}_${Date.now()}`;
    const balance = await creditTokens(
      userId,
      tokens,
      "purchase",
      referenceId,
      "revenuecat_webhook",
    );

    return c.json({
      status: "credited",
      tokens,
      balance,
      transactionId: referenceId,
    });
  });
