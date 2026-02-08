import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db";
import { trophy } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { idParamSchema } from "../validators/common.validator";
import { getUploadUrl, getPublicUrl } from "../lib/storage";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const presignedUrlSchema = z.object({
  type: z.enum(["trophy-photo", "avatar"]),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
});

const confirmUploadSchema = z.object({
  key: z.string().min(1),
});

export const upload = new Hono<{ Variables: Variables }>()
  // Get presigned upload URL
  .post(
    "/presigned-url",
    requireAuth,
    zValidator("json", presignedUrlSchema),
    async (c) => {
      const user = c.get("user")!;
      const { type, contentType } = c.req.valid("json");

      const ext = contentType.split("/")[1];
      const key = `${type}/${user.id}/${nanoid()}.${ext}`;
      const url = await getUploadUrl(key, contentType);

      return c.json({ url, key });
    }
  )

  // Confirm upload and trigger processing
  .post(
    "/confirm/:id",
    requireAuth,
    zValidator("param", idParamSchema),
    zValidator("json", confirmUploadSchema),
    async (c) => {
      const user = c.get("user")!;
      const { id } = c.req.valid("param");
      const { key } = c.req.valid("json");

      const item = await db.query.trophy.findFirst({
        where: eq(trophy.id, id),
      });

      if (!item || item.userId !== user.id) {
        return c.json({ error: "Not found" }, 404);
      }

      const [updated] = await db
        .update(trophy)
        .set({
          originalImageUrl: getPublicUrl(key),
          status: "processing",
          updatedAt: new Date(),
        })
        .where(eq(trophy.id, id))
        .returning();

      // TODO: Trigger async image processing pipeline
      // processImage(key, id) — Sharp resize, thumbnail, texture generation

      return c.json({ data: updated });
    }
  );
