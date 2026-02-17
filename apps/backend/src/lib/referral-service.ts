import { eq, and, count } from "drizzle-orm";
import { db } from "../db";
import { user, trophy, tokenTransaction } from "../db/schema";
import { creditTokens } from "./token-service";
import { sendReferralRewardNotification } from "./notification-service";

const REFERRAL_REWARD_AMOUNT = 500;
const MAX_REFERRALS_PER_USER = 10;

/**
 * Generate a referral code from the user's first name + random digits.
 * Format: UPPERCASED_FIRST_NAME + 2 digits (retry with 3 digits on collision).
 */
export async function generateReferralCode(firstName: string): Promise<string> {
  const base = firstName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10);

  for (let digits = 2; digits <= 4; digits++) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = String(
        Math.floor(Math.random() * Math.pow(10, digits))
      ).padStart(digits, "0");
      const code = `${base}${suffix}`;

      const existing = await db.query.user.findFirst({
        where: eq(user.referralCode, code),
        columns: { id: true },
      });

      if (!existing) return code;
    }
  }

  // Ultimate fallback with nanoid-style suffix
  const fallback = `${base}${Date.now().toString(36).toUpperCase().slice(-5)}`;
  return fallback;
}

/**
 * Process referrer reward when a referred user validates their first trophy.
 * Called from scan/validate after linking trophy to a race result.
 */
export async function processReferrerReward(
  referredUserId: string
): Promise<void> {
  // 1. Check user has a referrer
  const referredUser = await db.query.user.findFirst({
    where: eq(user.id, referredUserId),
    columns: { id: true, referredBy: true, firstName: true },
  });

  if (!referredUser?.referredBy) return;

  // 2. Count user's validated trophies (with raceResultId set)
  const [trophyCount] = await db
    .select({ count: count() })
    .from(trophy)
    .where(
      and(
        eq(trophy.userId, referredUserId),
        // raceResultId IS NOT NULL — use a raw check via count on linked trophies
      )
    );

  // We need to count trophies that have a raceResultId. Since we're called
  // right after setting raceResultId, the count should be >= 1.
  // Only reward on the first validated trophy.
  const validatedTrophies = await db.query.trophy.findMany({
    where: eq(trophy.userId, referredUserId),
    columns: { id: true, raceResultId: true },
  });
  const validatedCount = validatedTrophies.filter(
    (t) => t.raceResultId !== null
  ).length;

  if (validatedCount > 1) return; // Not the first validated trophy

  // 3. Idempotency: check no existing referral_reward transaction for this referred user
  const existingReward = await db.query.tokenTransaction.findFirst({
    where: and(
      eq(tokenTransaction.referenceId, referredUserId),
      eq(tokenTransaction.referenceType, "referral_reward")
    ),
  });

  if (existingReward) return; // Already rewarded

  // 4. Check referrer hasn't exceeded max referrals
  const [referrerRewardCount] = await db
    .select({ count: count() })
    .from(tokenTransaction)
    .where(
      and(
        eq(tokenTransaction.userId, referredUser.referredBy),
        eq(tokenTransaction.referenceType, "referral_reward")
      )
    );

  if (referrerRewardCount.count >= MAX_REFERRALS_PER_USER) return;

  // 5. Credit tokens to referrer
  await creditTokens(
    referredUser.referredBy,
    REFERRAL_REWARD_AMOUNT,
    "bonus",
    referredUserId,
    "referral_reward"
  );

  // 6. Send push notification to referrer
  await sendReferralRewardNotification(
    referredUser.referredBy,
    referredUser.firstName ?? "Someone"
  );
}
