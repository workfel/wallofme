import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { onboardingSchema } from "../validators/user.validator";
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

    return c.json({ data: profile });
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
          updatedAt: new Date(),
        })
        .where(eq(user.id, currentUser.id))
        .returning();

      return c.json({ data: updated });
    }
  );
