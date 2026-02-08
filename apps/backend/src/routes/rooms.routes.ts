import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { room, roomItem } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema } from "../validators/common.validator";
import {
  updateRoomSchema,
  placeItemSchema,
  moveItemSchema,
} from "../validators/room.validator";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const rooms = new Hono<{ Variables: Variables }>()
  // Get current user's room (create if not exists)
  .get("/me", requireAuth, async (c) => {
    const user = c.get("user")!;

    let userRoom = await db.query.room.findFirst({
      where: eq(room.userId, user.id),
      with: {
        items: {
          with: { trophy: true, decoration: true },
        },
      },
    });

    if (!userRoom) {
      const [created] = await db
        .insert(room)
        .values({ userId: user.id })
        .returning();
      userRoom = { ...created, items: [] };
    }

    return c.json({ data: userRoom });
  })

  // Get another user's room (public visit)
  .get(
    "/user/:id",
    async (c) => {
      const id = c.req.param("id");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, id),
        with: {
          items: {
            with: { trophy: true, decoration: true },
          },
        },
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      return c.json({ data: userRoom });
    }
  )

  // Update room settings
  .patch(
    "/me",
    requireAuth,
    zValidator("json", updateRoomSchema),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      const [updated] = await db
        .update(room)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(room.userId, user.id))
        .returning();

      if (!updated) {
        return c.json({ error: "Room not found" }, 404);
      }

      return c.json({ data: updated });
    }
  )

  // Place item in room
  .post(
    "/items",
    requireAuth,
    zValidator("json", placeItemSchema),
    async (c) => {
      const user = c.get("user")!;
      const body = c.req.valid("json");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, user.id),
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      const [item] = await db
        .insert(roomItem)
        .values({ ...body, roomId: userRoom.id })
        .returning();

      return c.json({ data: item }, 201);
    }
  )

  // Move item in room
  .patch(
    "/items/:id",
    requireAuth,
    zValidator("param", idParamSchema),
    zValidator("json", moveItemSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, user.id),
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      const existing = await db.query.roomItem.findFirst({
        where: eq(roomItem.id, id),
      });

      if (!existing || existing.roomId !== userRoom.id) {
        return c.json({ error: "Item not found" }, 404);
      }

      const [updated] = await db
        .update(roomItem)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(roomItem.id, id))
        .returning();

      return c.json({ data: updated });
    }
  )

  // Remove item from room
  .delete(
    "/items/:id",
    requireAuth,
    zValidator("param", idParamSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");

      const userRoom = await db.query.room.findFirst({
        where: eq(room.userId, user.id),
      });

      if (!userRoom) {
        return c.json({ error: "Room not found" }, 404);
      }

      const existing = await db.query.roomItem.findFirst({
        where: eq(roomItem.id, id),
      });

      if (!existing || existing.roomId !== userRoom.id) {
        return c.json({ error: "Item not found" }, 404);
      }

      await db.delete(roomItem).where(eq(roomItem.id, id));
      return c.json({ success: true });
    }
  );
