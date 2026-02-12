import { eq, and, sql, gte } from "drizzle-orm";
import { db } from "../db";
import { user, tokenTransaction } from "../db/schema";

type TransactionType =
  | "purchase"
  | "rewarded_video"
  | "spend_decoration"
  | "spend_theme"
  | "refund"
  | "bonus";

export async function getBalance(userId: string): Promise<number> {
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { tokenBalance: true },
  });
  return dbUser?.tokenBalance ?? 0;
}

export async function creditTokens(
  userId: string,
  amount: number,
  type: TransactionType,
  referenceId?: string,
  referenceType?: string
): Promise<number> {
  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(user)
      .set({ tokenBalance: sql`token_balance + ${amount}` })
      .where(eq(user.id, userId))
      .returning({ tokenBalance: user.tokenBalance });

    if (!updated) throw new Error("User not found");

    await tx.insert(tokenTransaction).values({
      userId,
      type,
      amount,
      balance: updated.tokenBalance,
      referenceId,
      referenceType,
    });

    return updated.tokenBalance;
  });
}

export async function debitTokens(
  userId: string,
  amount: number,
  type: TransactionType,
  referenceId?: string,
  referenceType?: string
): Promise<number> {
  return await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(user)
      .set({ tokenBalance: sql`token_balance - ${amount}` })
      .where(
        and(eq(user.id, userId), gte(user.tokenBalance, amount))
      )
      .returning({ tokenBalance: user.tokenBalance });

    if (!updated) throw new Error("Insufficient tokens");

    await tx.insert(tokenTransaction).values({
      userId,
      type,
      amount: -amount,
      balance: updated.tokenBalance,
      referenceId,
      referenceType,
    });

    return updated.tokenBalance;
  });
}
