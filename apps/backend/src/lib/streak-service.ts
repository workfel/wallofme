import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { tokenTransaction } from "../db/schema";

/**
 * Calculate the current daily login streak for a user.
 * Returns the number of consecutive days (including today if claimed).
 */
export async function calculateStreak(userId: string): Promise<number> {
  const loginDays = await db
    .select({
      day: sql<string>`DATE(${tokenTransaction.createdAt} AT TIME ZONE 'UTC')`.as(
        "day"
      ),
    })
    .from(tokenTransaction)
    .where(
      and(
        eq(tokenTransaction.userId, userId),
        eq(tokenTransaction.type, "bonus"),
        eq(tokenTransaction.referenceType, "daily_login")
      )
    )
    .groupBy(sql`DATE(${tokenTransaction.createdAt} AT TIME ZONE 'UTC')`)
    .orderBy(
      desc(sql`DATE(${tokenTransaction.createdAt} AT TIME ZONE 'UTC')`)
    );

  let streakDays = 0;
  if (loginDays.length > 0) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const firstDay = loginDays[0].day;
    if (firstDay === todayStr || firstDay === yesterdayStr) {
      streakDays = 1;
      let expectedDate = new Date(firstDay);
      for (let i = 1; i < loginDays.length; i++) {
        expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
        const expectedStr = expectedDate.toISOString().slice(0, 10);
        if (loginDays[i].day === expectedStr) {
          streakDays++;
        } else {
          break;
        }
      }
    }
  }

  return streakDays;
}
