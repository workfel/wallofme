import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "../db";
import { trophy, race, raceResult } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import {
  analyzeSchema,
  removeBackgroundSchema,
  validateSchema,
  searchResultsSchema,
  searchDateSchema,
  refineSearchSchema,
  rotateSchema,
} from "../validators/scan.validator";
import { analyzeImage, searchRaceDate, searchRaceInfo, searchRaceResults } from "../lib/ai-analyzer";
import { processTrophyImage } from "../lib/image-processor";
import { downloadBuffer, uploadBuffer, getPublicUrl } from "../lib/storage";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { processReferrerReward } from "../lib/referral-service";
import type { auth } from "../lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const scan = new Hono<{ Variables: Variables }>()
  // Analyze trophy image with AI
  .post(
    "/analyze",
    requireAuth,
    zValidator("json", analyzeSchema),
    async (c) => {
      const currentUser = c.get("user")!;
      const { trophyId } = c.req.valid("json");

      const item = await db.query.trophy.findFirst({
        where: eq(trophy.id, trophyId),
      });

      if (!item || item.userId !== currentUser.id) {
        return c.json({ error: "Not found" }, 404);
      }

      if (!item.originalImageUrl) {
        return c.json({ error: "Trophy has no image" }, 400);
      }

      const analysis = await analyzeImage(item.originalImageUrl);

      if (analysis.hasPornContent) {
        return c.json({ error: "Inappropriate content detected" }, 422);
      }

      // If date is January 1st (likely a default), search for the real date
      if (analysis.date && analysis.date.endsWith("-01-01") && analysis.raceName) {
        const year = analysis.date.substring(0, 4);
        const refinedDate = await searchRaceDate(
          analysis.raceName,
          year,
          analysis.sportKind,
          analysis.city,
          analysis.country,
        );
        if (refinedDate) {
          analysis.date = refinedDate;
        }
      }

      // Update trophy with AI-identified race info
      await db
        .update(trophy)
        .set({
          aiIdentifiedRace: analysis.raceName,
          aiConfidence: 0.8,
          type:
            analysis.imageKind === "unknown" ? item.type : analysis.imageKind,
          updatedAt: new Date(),
        })
        .where(eq(trophy.id, trophyId));

      return c.json({ data: analysis });
    },
  )

  // Remove background from trophy image (synchronous — waits for result)
  .post(
    "/remove-background",
    requireAuth,
    zValidator("json", removeBackgroundSchema),
    async (c) => {
      const currentUser = c.get("user")!;
      const { trophyId } = c.req.valid("json");

      const item = await db.query.trophy.findFirst({
        where: eq(trophy.id, trophyId),
      });

      if (!item || item.userId !== currentUser.id) {
        return c.json({ error: "Not found" }, 404);
      }

      if (!item.originalImageUrl) {
        return c.json({ error: "Trophy has no image" }, 400);
      }

      try {
        const originalKey = item.originalImageUrl.replace(
          `${process.env.R2_PUBLIC_URL}/`,
          "",
        );
        console.log("[remove-bg] Downloading original:", originalKey);
        const imageBuffer = await downloadBuffer(originalKey);
        console.log("[remove-bg] Downloaded, size:", imageBuffer.length);

        console.log("[remove-bg] Starting processTrophyImage...");
        const urls = await processTrophyImage(imageBuffer, currentUser.id);
        console.log("[remove-bg] Done, urls:", urls);

        await db
          .update(trophy)
          .set({
            processedImageUrl: urls.processedImageUrl,
            textureUrl: urls.textureUrl,
            thumbnailUrl: urls.thumbnailUrl,
            status: "ready",
            updatedAt: new Date(),
          })
          .where(eq(trophy.id, trophyId));

        return c.json({ data: urls });
      } catch (error) {
        console.error("Background removal failed:", error);
        await db
          .update(trophy)
          .set({ status: "error", updatedAt: new Date() })
          .where(eq(trophy.id, trophyId));
        return c.json({ error: "Image processing failed" }, 500);
      }
    },
  )

  // Validate analysis and create race + race result
  .post(
    "/validate",
    requireAuth,
    zValidator("json", validateSchema),
    async (c) => {
      const currentUser = c.get("user")!;
      const body = c.req.valid("json");

      const item = await db.query.trophy.findFirst({
        where: eq(trophy.id, body.trophyId),
      });

      if (!item || item.userId !== currentUser.id) {
        return c.json({ error: "Not found" }, 404);
      }

      // Use existing race or create a new one
      let raceRecord;
      if (body.raceId) {
        const existing = await db.query.race.findFirst({
          where: eq(race.id, body.raceId),
        });
        if (!existing) {
          return c.json({ error: "Race not found" }, 404);
        }
        raceRecord = existing;
      } else {
        const [created] = await db
          .insert(race)
          .values({
            name: body.raceName,
            date: body.date ? new Date(body.date) : null,
            location:
              [body.city, body.country].filter(Boolean).join(", ") || null,
            distance: body.distance ?? null,
            sport: body.sport ?? null,
          })
          .returning();
        raceRecord = created;
      }

      // Count community finishers (excluding current user)
      const [communityCountResult] = await db
        .select({ count: sql<number>`count(distinct ${raceResult.userId})::int` })
        .from(raceResult)
        .where(and(eq(raceResult.raceId, raceRecord.id), ne(raceResult.userId, currentUser.id)));
      const communityFinishersCount = Number(communityCountResult?.count ?? 0);

      // Create race result stub
      const [newRaceResult] = await db
        .insert(raceResult)
        .values({
          userId: currentUser.id,
          raceId: raceRecord.id,
          source: "ai",
        })
        .returning();

      // Link trophy to race result and update type
      await db
        .update(trophy)
        .set({
          raceResultId: newRaceResult.id,
          type: body.type,
          updatedAt: new Date(),
        })
        .where(eq(trophy.id, body.trophyId));

      // Fire-and-forget: reward referrer on first validated trophy
      processReferrerReward(currentUser.id).catch(console.error);

      return c.json({
        data: {
          race: raceRecord,
          raceResult: newRaceResult,
          communityFinishersCount,
        },
      });
    },
  )

  // Search race results for the user
  .post(
    "/search-results",
    requireAuth,
    zValidator("json", searchResultsSchema),
    async (c) => {
      const currentUser = c.get("user")!;

      // Check user has firstName/lastName
      if (!currentUser.firstName || !currentUser.lastName) {
        return c.json(
          {
            error:
              "Please complete your profile with first and last name before searching results",
          },
          400,
        );
      }

      const { raceResultId } = c.req.valid("json");

      const result = await db.query.raceResult.findFirst({
        where: eq(raceResult.id, raceResultId),
        with: { race: true },
      });

      if (!result || result.userId !== currentUser.id) {
        return c.json({ error: "Not found" }, 404);
      }

      const searchResult = await searchRaceResults(
        currentUser.firstName,
        currentUser.lastName,
        result.race.name,
        result.race.sport ?? "running",
        result.race.date?.toISOString().split("T")[0],
        result.race.location?.split(", ")[0],
        result.race.location?.split(", ")[1],
      );

      return c.json({ data: searchResult });
    },
  )

  // Search for race date using AI + Google Search
  .post(
    "/search-date",
    requireAuth,
    zValidator("json", searchDateSchema),
    async (c) => {
      const { raceName, year, sportKind, city, country } = c.req.valid("json");
      const date = await searchRaceDate(raceName, year, sportKind, city, country);
      return c.json({ data: { found: !!date, date } });
    },
  )

  // Enriched race info search (date + location + sport + distance)
  .post(
    "/refine-search",
    requireAuth,
    zValidator("json", refineSearchSchema),
    async (c) => {
      const { raceName, year, sportKind, city, country } = c.req.valid("json");
      const result = await searchRaceInfo(raceName, year, sportKind, city, country);
      return c.json({ data: result });
    },
  )

  // Rotate processed trophy images 90° clockwise
  .post(
    "/rotate",
    requireAuth,
    zValidator("json", rotateSchema),
    async (c) => {
      const currentUser = c.get("user")!;
      const { trophyId } = c.req.valid("json");

      const item = await db.query.trophy.findFirst({
        where: eq(trophy.id, trophyId),
      });

      if (!item || item.userId !== currentUser.id) {
        return c.json({ error: "Not found" }, 404);
      }

      if (!item.processedImageUrl || !item.textureUrl || !item.thumbnailUrl) {
        return c.json({ error: "No processed images to rotate" }, 400);
      }

      try {
        const prefix = `trophy-processed/${currentUser.id}`;
        const id = nanoid();

        // Download, rotate 90° clockwise, re-upload all three variants
        const rotate = async (url: string, suffix: string, resize?: { w: number; h: number; fit: "inside" | "cover" }) => {
          const key = url.replace(`${process.env.R2_PUBLIC_URL}/`, "");
          const buf = await downloadBuffer(key);
          let pipeline = sharp(buf).rotate(90);
          if (resize) {
            pipeline = pipeline.resize(resize.w, resize.h, {
              fit: resize.fit,
              withoutEnlargement: resize.fit === "inside",
            });
          }
          const out = await pipeline.webp({ quality: 85 }).toBuffer();
          const newKey = `${prefix}/${id}${suffix}.webp`;
          await uploadBuffer(out, newKey, "image/webp");
          return getPublicUrl(newKey);
        };

        const [processedImageUrl, textureUrl, thumbnailUrl] = await Promise.all([
          rotate(item.processedImageUrl, ""),
          rotate(item.textureUrl, "-texture", { w: 1024, h: 1024, fit: "inside" }),
          rotate(item.thumbnailUrl, "-thumb", { w: 256, h: 256, fit: "cover" }),
        ]);

        await db
          .update(trophy)
          .set({ processedImageUrl, textureUrl, thumbnailUrl, updatedAt: new Date() })
          .where(eq(trophy.id, trophyId));

        return c.json({ data: { processedImageUrl, textureUrl, thumbnailUrl } });
      } catch (error) {
        console.error("Rotation failed:", error);
        return c.json({ error: "Rotation failed" }, 500);
      }
    },
  );
