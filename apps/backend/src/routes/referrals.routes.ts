import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, count } from "drizzle-orm";
import { db } from "../db";
import { user, tokenTransaction } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import {
  referralCodeParamSchema,
  applyReferralSchema,
} from "../validators/referral.validator";
import { generateReferralCode } from "../lib/referral-service";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const MAX_REFERRALS = 10;
const REWARD_PER_REFERRAL = 500;

export const referrals = new Hono<{ Variables: Variables }>()
  // GET /me — current user's referral info
  .get("/me", requireAuth, async (c) => {
    const currentUser = c.get("user")!;

    const profile = await db.query.user.findFirst({
      where: eq(user.id, currentUser.id),
      columns: { referralCode: true, firstName: true, name: true, displayName: true },
    });

    let referralCode = profile?.referralCode ?? null;

    // Lazy-generate referral code for users who don't have one yet
    if (!referralCode) {
      const nameBase = profile?.firstName || profile?.displayName || profile?.name;
      if (nameBase) {
        referralCode = await generateReferralCode(nameBase);
        await db
          .update(user)
          .set({ referralCode, updatedAt: new Date() })
          .where(eq(user.id, currentUser.id));
      }
    }

    if (!referralCode) {
      return c.json({
        data: {
          referralCode: null,
          referralCount: 0,
          maxReferrals: MAX_REFERRALS,
          totalEarned: 0,
          referrals: [],
        },
      });
    }

    // Count successful referral rewards
    const [rewardCount] = await db
      .select({ count: count() })
      .from(tokenTransaction)
      .where(
        and(
          eq(tokenTransaction.userId, currentUser.id),
          eq(tokenTransaction.referenceType, "referral_reward")
        )
      );

    // Get referred users
    const referredUsers = await db.query.user.findMany({
      where: eq(user.referredBy, currentUser.id),
      columns: {
        id: true,
        firstName: true,
        image: true,
        createdAt: true,
      },
    });

    // Check which referred users have earned the referrer a reward
    const rewardedUserIds = new Set<string>();
    if (referredUsers.length > 0) {
      const rewards = await db.query.tokenTransaction.findMany({
        where: and(
          eq(tokenTransaction.userId, currentUser.id),
          eq(tokenTransaction.referenceType, "referral_reward")
        ),
        columns: { referenceId: true },
      });
      for (const r of rewards) {
        if (r.referenceId) rewardedUserIds.add(r.referenceId);
      }
    }

    const referralList = referredUsers.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      image: u.image,
      status: rewardedUserIds.has(u.id)
        ? ("rewarded" as const)
        : ("pending" as const),
      joinedAt: u.createdAt,
    }));

    return c.json({
      data: {
        referralCode,
        referralCount: rewardCount.count,
        maxReferrals: MAX_REFERRALS,
        totalEarned: rewardCount.count * REWARD_PER_REFERRAL,
        referrals: referralList,
      },
    });
  })

  // GET /code/:code — validate referral code (public)
  .get(
    "/code/:code",
    zValidator("param", referralCodeParamSchema),
    async (c) => {
      const { code } = c.req.valid("param");

      const referrer = await db.query.user.findFirst({
        where: eq(user.referralCode, code),
        columns: { id: true, firstName: true },
      });

      if (!referrer) {
        return c.json({ data: { valid: false, referrerFirstName: null } });
      }

      return c.json({
        data: { valid: true, referrerFirstName: referrer.firstName },
      });
    }
  )

  // POST /apply — apply referral code to current user
  .post(
    "/apply",
    requireAuth,
    zValidator("json", applyReferralSchema),
    async (c) => {
      const currentUser = c.get("user")!;
      const { code } = c.req.valid("json");

      // Check user not already referred
      const profile = await db.query.user.findFirst({
        where: eq(user.id, currentUser.id),
        columns: { referredBy: true },
      });

      if (profile?.referredBy) {
        return c.json({ error: "Already referred" }, 409);
      }

      // Find referrer by code
      const referrer = await db.query.user.findFirst({
        where: eq(user.referralCode, code),
        columns: { id: true },
      });

      if (!referrer) {
        return c.json({ error: "Invalid referral code" }, 404);
      }

      // Can't refer yourself
      if (referrer.id === currentUser.id) {
        return c.json({ error: "Cannot refer yourself" }, 400);
      }

      // Check referrer hasn't exceeded max referrals
      const [referralCount] = await db
        .select({ count: count() })
        .from(user)
        .where(eq(user.referredBy, referrer.id));

      if (referralCount.count >= MAX_REFERRALS) {
        return c.json({ error: "Referrer has reached maximum referrals" }, 400);
      }

      // Apply referral
      await db
        .update(user)
        .set({ referredBy: referrer.id, updatedAt: new Date() })
        .where(eq(user.id, currentUser.id));

      return c.json({ data: { applied: true } });
    }
  );
