import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db";
import { user, trophy, room } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import {
  onboardingSchema,
  updateProfileSchema,
} from "../validators/user.validator";
import { getPublicUrl } from "../lib/storage";
import { FREE_SCAN_LIMIT, getMonthlyScansUsed } from "../lib/scan-limit";
import { generateReferralCode } from "../lib/referral-service";
import { calculateStreak } from "../lib/streak-service";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const users = new Hono<{ Variables: Variables }>()
  // Get current user profile
  .get("/me", requireAuth, async (c) => {
    const currentUser = c.get("user")!;

    const profile = await db.query.user.findFirst({
      where: eq(user.id, currentUser.id),
    });

    if (!profile) {
      return c.json({ error: "Not found" }, 404);
    }

    let scansRemaining: number | null = null;

    if (!profile.isPro) {
      const used = await getMonthlyScansUsed(currentUser.id);
      scansRemaining = Math.max(0, FREE_SCAN_LIMIT - used);
    }

    const streakDays = await calculateStreak(currentUser.id);

    return c.json({
      data: {
        ...profile,
        sports: profile.sports ? JSON.parse(profile.sports) : [],
        scansRemaining,
        scanLimit: profile.isPro ? null : FREE_SCAN_LIMIT,
        streakDays,
      },
    });
  })

  // Get public user profile by ID
  .get("/:id", async (c) => {
    const userId = c.req.param("id");

    const profile = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        displayName: true,
        firstName: true,
        image: true,
        country: true,
        sports: true,
        isPro: true,
      },
    });

    if (!profile) {
      return c.json({ error: "Not found" }, 404);
    }

    const [trophyCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(trophy)
      .where(and(eq(trophy.userId, userId), eq(trophy.status, "ready")));

    const trophies = await db.query.trophy.findMany({
      where: and(eq(trophy.userId, userId), eq(trophy.status, "ready")),
      columns: { id: true, type: true, thumbnailUrl: true },
      orderBy: desc(trophy.createdAt),
    });

    const userRoom = await db.query.room.findFirst({
      where: eq(room.userId, userId),
      columns: { likeCount: true, viewCount: true },
    });

    return c.json({
      data: {
        ...profile,
        sports: profile.sports ? JSON.parse(profile.sports) : [],
        trophyCount: trophyCountResult?.count ?? 0,
        likeCount: userRoom?.likeCount ?? 0,
        viewCount: userRoom?.viewCount ?? 0,
        trophies,
      },
    });
  })

  // Onboarding — set firstName, lastName, country
  .post(
    "/onboarding",
    requireAuth,
    zValidator("json", onboardingSchema),
    async (c) => {
      const currentUser = c.get("user")!;
      const body = c.req.valid("json");

      // Check if user was referred — give bonus tokens
      const existingProfile = await db.query.user.findFirst({
        where: eq(user.id, currentUser.id),
        columns: { referredBy: true },
      });
      const isReferred = !!existingProfile?.referredBy;
      const starterTokens = isReferred ? 6000 : 5500;

      // Generate referral code for this user
      const referralCode = await generateReferralCode(body.firstName);

      const [updated] = await db
        .update(user)
        .set({
          firstName: body.firstName,
          lastName: body.lastName,
          country: body.country ?? null,
          displayName: `${body.firstName} ${body.lastName}`,
          sports: body.sports ? JSON.stringify(body.sports) : undefined,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
          updatedAt: new Date(),
          tokenBalance: starterTokens,
          referralCode,
        })
        .where(eq(user.id, currentUser.id))
        .returning();

      return c.json({ data: updated });
    }
  )

  // Update profile settings
  .patch(
    "/me",
    requireAuth,
    zValidator("json", updateProfileSchema),
    async (c) => {
      const currentUser = c.get("user")!;
      const body = c.req.valid("json");

      const updates: Record<string, unknown> = { updatedAt: new Date() };

      if (body.firstName !== undefined) updates.firstName = body.firstName;
      if (body.lastName !== undefined) updates.lastName = body.lastName;
      if (body.displayName !== undefined)
        updates.displayName = body.displayName;
      if (body.country !== undefined) updates.country = body.country;
      if (body.locale !== undefined) updates.locale = body.locale;
      if (body.sports !== undefined)
        updates.sports = JSON.stringify(body.sports);
      if (body.image !== undefined)
        updates.image = body.image ? getPublicUrl(body.image) : null;
      if (body.latitude !== undefined) updates.latitude = body.latitude;
      if (body.longitude !== undefined) updates.longitude = body.longitude;

      const [updated] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, currentUser.id))
        .returning();

      return c.json({ data: updated });
    }
  )

  // Get current user's subscription info
  .get("/me/subscription", requireAuth, async (c) => {
    const currentUser = c.get("user")!;

    const profile = await db.query.user.findFirst({
      where: eq(user.id, currentUser.id),
      columns: { isPro: true, proExpiresAt: true },
    });

    if (!profile) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({
      data: {
        isPro: profile.isPro,
        proExpiresAt: profile.proExpiresAt,
        managementUrl: null,
      },
    });
  });
