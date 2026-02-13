import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import {
  onboardingSchema,
  updateProfileSchema,
} from "../validators/user.validator";
import { FREE_SCAN_LIMIT, getMonthlyScansUsed } from "../lib/scan-limit";
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

    return c.json({
      data: {
        ...profile,
        sports: profile.sports ? JSON.parse(profile.sports) : [],
        scansRemaining,
        scanLimit: profile.isPro ? null : FREE_SCAN_LIMIT,
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

      const [updated] = await db
        .update(user)
        .set({
          firstName: body.firstName,
          lastName: body.lastName,
          country: body.country ?? null,
          displayName: `${body.firstName} ${body.lastName}`,
          sports: body.sports ? JSON.stringify(body.sports) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(user.id, currentUser.id))
        .returning();

      return c.json({ data: updated });
    },
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

      const [updated] = await db
        .update(user)
        .set(updates)
        .where(eq(user.id, currentUser.id))
        .returning();

      return c.json({ data: updated });
    },
  );
