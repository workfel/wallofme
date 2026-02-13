import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { user, tokenTransaction } from "../db/schema";
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

/** Pro subscription bonus tokens credited on initial purchase and renewal */
const PRO_MONTHLY_BONUS = 100;

/** Pro product IDs */
const PRO_PRODUCT_IDS = ["wallofme_pro_monthly", "wallofme_pro_annual"];

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  product_id: string;
  transaction_id?: string;
  expiration_at_ms?: number;
  store?: string;
  environment?: string;
}

interface RevenueCatWebhookPayload {
  api_version: string;
  event: RevenueCatEvent;
}

function isProProduct(productId: string): boolean {
  return PRO_PRODUCT_IDS.some((id) => productId.startsWith(id));
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

    const {
      app_user_id: userId,
      product_id: productId,
      transaction_id: transactionId,
    } = event;

    // ─── Pro Subscription Events ─────────────────────────
    if (productId && isProProduct(productId)) {
      if (!userId) {
        return c.json({ error: "Missing user ID" }, 400);
      }

      switch (event.type) {
        case "INITIAL_PURCHASE":
        case "RENEWAL": {
          // Idempotency: check if this transaction was already processed
          if (transactionId) {
            const existing = await db.query.tokenTransaction.findFirst({
              where: and(
                eq(tokenTransaction.referenceId, transactionId),
                eq(tokenTransaction.type, "bonus"),
              ),
            });
            if (existing) {
              return c.json({ status: "already_processed", transactionId });
            }
          }

          // Activate Pro + set expiration
          const proExpiresAt = event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : null;

          await db
            .update(user)
            .set({
              isPro: true,
              proExpiresAt,
              updatedAt: new Date(),
            })
            .where(eq(user.id, userId));

          // Credit bonus tokens
          const referenceId =
            transactionId || `rc_pro_${event.type.toLowerCase()}_${Date.now()}`;
          const balance = await creditTokens(
            userId,
            PRO_MONTHLY_BONUS,
            "bonus",
            referenceId,
            "pro_subscription",
          );

          return c.json({
            status: "pro_activated",
            tokens: PRO_MONTHLY_BONUS,
            balance,
            transactionId: referenceId,
          });
        }

        case "CANCELLATION": {
          // User cancelled auto-renew — stays Pro until expiration
          const proExpiresAt = event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : null;

          await db
            .update(user)
            .set({
              isPro: true,
              proExpiresAt,
              updatedAt: new Date(),
            })
            .where(eq(user.id, userId));

          return c.json({ status: "pro_cancelled" });
        }

        case "EXPIRATION": {
          // Subscription fully expired
          await db
            .update(user)
            .set({
              isPro: false,
              proExpiresAt: null,
              updatedAt: new Date(),
            })
            .where(eq(user.id, userId));

          return c.json({ status: "pro_expired" });
        }

        case "BILLING_ISSUE_DETECTED": {
          console.warn(
            `[RevenueCat] Billing issue for user ${userId}, product ${productId}`,
          );
          return c.json({ status: "billing_issue_logged" });
        }

        default:
          return c.json({ status: "ignored", type: event.type });
      }
    }

    // ─── Token Pack Purchase Events ──────────────────────
    if (event.type !== "NON_RENEWING_PURCHASE") {
      // Acknowledge other event types without processing
      return c.json({ status: "ignored", type: event.type });
    }

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
