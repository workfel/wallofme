import { eq, and, gte, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { tokenTransaction, deviceToken, user } from "../db/schema";
import { calculateStreak } from "./streak-service";
import { sendStreakReminderNotification } from "./notification-service";

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const REMINDER_HOUR_UTC = 20; // 8 PM UTC

let lastFiredDate: string | null = null;

async function checkAndSendReminders(): Promise<void> {
  const now = new Date();
  if (now.getUTCHours() !== REMINDER_HOUR_UTC) return;

  // Only fire once per day
  const todayStr = now.toISOString().slice(0, 10);
  if (lastFiredDate === todayStr) return;
  lastFiredDate = todayStr;

  console.log("[streak-cron] Running streak reminder check...");

  try {
    const todayStart = new Date(todayStr + "T00:00:00.000Z");
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

    // Find users who claimed yesterday but NOT today, and have device tokens
    const usersWithYesterdayClaim = await db
      .selectDistinct({ userId: tokenTransaction.userId })
      .from(tokenTransaction)
      .where(
        and(
          eq(tokenTransaction.type, "bonus"),
          eq(tokenTransaction.referenceType, "daily_login"),
          gte(tokenTransaction.createdAt, yesterdayStart),
          lt(tokenTransaction.createdAt, todayStart)
        )
      );

    for (const { userId } of usersWithYesterdayClaim) {
      // Check they haven't claimed today
      const todayClaim = await db.query.tokenTransaction.findFirst({
        where: and(
          eq(tokenTransaction.userId, userId),
          eq(tokenTransaction.type, "bonus"),
          eq(tokenTransaction.referenceType, "daily_login"),
          gte(tokenTransaction.createdAt, todayStart)
        ),
      });

      if (todayClaim) continue;

      // Check they have device tokens
      const hasToken = await db.query.deviceToken.findFirst({
        where: eq(deviceToken.userId, userId),
      });

      if (!hasToken) continue;

      const streakDays = await calculateStreak(userId);
      if (streakDays === 0) continue;

      // Get user locale
      const dbUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { locale: true },
      });

      await sendStreakReminderNotification(
        userId,
        streakDays,
        dbUser?.locale ?? null
      );
    }

    console.log(
      `[streak-cron] Checked ${usersWithYesterdayClaim.length} users for streak reminders`
    );
  } catch (err) {
    console.error("[streak-cron] Error:", err);
  }
}

export function startStreakReminderCron(): void {
  console.log(
    `[streak-cron] Started — checking every ${CHECK_INTERVAL_MS / 60000} min, fires at ${REMINDER_HOUR_UTC}:00 UTC`
  );
  setInterval(checkAndSendReminders, CHECK_INTERVAL_MS);
  // Also run immediately in case server starts at the right hour
  checkAndSendReminders();
}
