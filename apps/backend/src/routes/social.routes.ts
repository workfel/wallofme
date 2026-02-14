import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "../db";
import {
  room,
  roomView,
  deviceToken,
  notification,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema } from "../validators/common.validator";
import {
  batchLikeSchema,
  registerDeviceTokenSchema,
  unregisterDeviceTokenSchema,
} from "../validators/social.validator";
import type { auth } from "../lib/auth";

const IP_HASH_SALT = process.env.IP_HASH_SALT || "wallofme-view-salt";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const social = new Hono<{ Variables: Variables }>()
  // Batch increment likes on a room (anonymous, no auth required)
  .post(
    "/rooms/:id/like",
    zValidator("param", idParamSchema),
    zValidator("json", batchLikeSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { count } = c.req.valid("json");

      const targetRoom = await db.query.room.findFirst({
        where: eq(room.id, id),
      });

      if (!targetRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      // Atomically increment like count
      const [updated] = await db
        .update(room)
        .set({ likeCount: sql`${room.likeCount} + ${count}` })
        .where(eq(room.id, id))
        .returning();

      return c.json({ data: { likeCount: updated.likeCount } });
    },
  )

  // Get like count for a room (anonymous, no auth required)
  .get(
    "/rooms/:id/likes",
    zValidator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const targetRoom = await db.query.room.findFirst({
        where: eq(room.id, id),
      });

      if (!targetRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      return c.json({
        data: { likeCount: targetRoom.likeCount },
      });
    },
  )

  // Record a room view
  .post(
    "/rooms/:id/view",
    zValidator("param", idParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      const targetRoom = await db.query.room.findFirst({
        where: eq(room.id, id),
      });

      if (!targetRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      const currentUser = c.get("user");

      // Don't count own views
      if (currentUser && targetRoom.userId === currentUser.id) {
        return c.json({ data: { recorded: false } });
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      if (currentUser) {
        // Authenticated dedup by userId
        const recentView = await db.query.roomView.findFirst({
          where: and(
            eq(roomView.roomId, id),
            eq(roomView.viewerUserId, currentUser.id),
            gte(roomView.createdAt, twentyFourHoursAgo),
          ),
        });

        if (recentView) {
          return c.json({ data: { recorded: false } });
        }

        await db.insert(roomView).values({
          roomId: id,
          viewerUserId: currentUser.id,
        });
      } else {
        // Anonymous dedup by IP hash
        const ip =
          c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
          c.req.header("x-real-ip") ||
          "unknown";
        const ipHash = createHash("sha256")
          .update(ip + IP_HASH_SALT)
          .digest("hex");

        const recentView = await db.query.roomView.findFirst({
          where: and(
            eq(roomView.roomId, id),
            eq(roomView.viewerIpHash, ipHash),
            gte(roomView.createdAt, twentyFourHoursAgo),
          ),
        });

        if (recentView) {
          return c.json({ data: { recorded: false } });
        }

        await db.insert(roomView).values({
          roomId: id,
          viewerIpHash: ipHash,
        });
      }

      // Increment view count atomically
      await db
        .update(room)
        .set({ viewCount: sql`${room.viewCount} + 1` })
        .where(eq(room.id, id));

      return c.json({ data: { recorded: true } });
    },
  )

  // Register device token for push notifications
  .post(
    "/notifications/register",
    requireAuth,
    zValidator("json", registerDeviceTokenSchema),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      await db
        .insert(deviceToken)
        .values({
          userId: user.id,
          token: body.token,
          platform: body.platform,
        })
        .onConflictDoUpdate({
          target: deviceToken.token,
          set: { userId: user.id, platform: body.platform },
        });

      return c.json({ data: { registered: true } });
    },
  )

  // Unregister device token
  .delete(
    "/notifications/unregister",
    requireAuth,
    zValidator("json", unregisterDeviceTokenSchema),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      await db
        .delete(deviceToken)
        .where(
          and(
            eq(deviceToken.token, body.token),
            eq(deviceToken.userId, user.id),
          ),
        );

      return c.json({ data: { unregistered: true } });
    },
  )

  // List notifications
  .get("/notifications", requireAuth, async (c) => {
    const user = c.get("user")!;

    const notifications = await db.query.notification.findMany({
      where: eq(notification.userId, user.id),
      orderBy: [desc(notification.createdAt)],
      limit: 50,
    });

    return c.json({ data: notifications });
  })

  // Mark notification as read
  .patch(
    "/notifications/:id/read",
    requireAuth,
    zValidator("param", idParamSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");

      const existing = await db.query.notification.findFirst({
        where: eq(notification.id, id),
      });

      if (!existing || existing.userId !== user.id) {
        return c.json({ error: "Notification not found" }, 404);
      }

      const [updated] = await db
        .update(notification)
        .set({ readAt: new Date() })
        .where(eq(notification.id, id))
        .returning();

      return c.json({ data: updated });
    },
  );
