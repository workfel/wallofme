/**
 * Seed script for frame decoration styles.
 * Run with: cd apps/backend && bun run scripts/seed-frames.ts
 */
import { db } from "./index";
import { decoration } from "./schema";

const frameStyles = [
  {
    name: "Classic Black",
    description: "Sleek black frame for a minimalist look",
    modelUrl: "__frame_classic__",
    category: "frame",
    isPremium: true,
    priceTokens: 1000,
    defaultScale: 1,
    wallMountable: true,
    floorOnly: false,
  },
  {
    name: "Gold Ornate",
    description: "Luxurious gold frame to showcase your best moments",
    modelUrl: "__frame_gold__",
    category: "frame",
    isPremium: true,
    priceTokens: 2500,
    defaultScale: 1,
    wallMountable: true,
    floorOnly: false,
  },
  {
    name: "LED Neon",
    description: "Glowing neon frame that lights up your room",
    modelUrl: "__frame_neon__",
    category: "frame",
    isPremium: true,
    priceTokens: 3000,
    defaultScale: 1,
    wallMountable: true,
    floorOnly: false,
  },
  {
    name: "Wood Vintage",
    description: "Warm vintage wooden frame with rustic charm",
    modelUrl: "__frame_wood__",
    category: "frame",
    isPremium: true,
    priceTokens: 1500,
    defaultScale: 1,
    wallMountable: true,
    floorOnly: false,
  },
];

async function seed() {
  console.log("Seeding frame decorations...");

  for (const frame of frameStyles) {
    await db.insert(decoration).values(frame).onConflictDoNothing();
    console.log(`  ✓ ${frame.name} (${frame.priceTokens} tokens)`);
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
