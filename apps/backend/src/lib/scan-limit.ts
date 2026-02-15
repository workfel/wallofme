import { and, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { trophy } from "../db/schema";

// 50 pour la BETA
export const FREE_SCAN_LIMIT = 50;

export function getStartOfMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getMonthlyScansUsed(userId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trophy)
    .where(
      and(
        eq(trophy.userId, userId),
        gte(trophy.createdAt, getStartOfMonthUTC()),
        ne(trophy.status, "error")
      )
    );
  return count;
}
