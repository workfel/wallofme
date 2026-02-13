import { db } from "./index";
import { decoration } from "./schema";
import { eq } from "drizzle-orm";

const decorations = [
  {
    name: "Bicycle",
    description: "A road bicycle for your Pain Cave",
    modelUrl: "/assets/models/Bicycle.glb",
    category: "equipment",
    isPremium: false,
    priceTokens: 0,
    defaultScale: 0.5,
    floorOnly: true,
    wallMountable: false,
  },
  {
    name: "Kettlebell",
    description: "A kettlebell to show your strength",
    modelUrl: "/assets/models/Kettlebell.glb",
    category: "equipment",
    isPremium: false,
    priceTokens: 0,
    defaultScale: 0.5,
    floorOnly: true,
    wallMountable: false,
  },
  {
    name: "Treadmill",
    description: "A treadmill for the dedicated runner",
    modelUrl: "/assets/models/Treadmill.glb",
    category: "equipment",
    isPremium: false,
    priceTokens: 0,
    defaultScale: 0.5,
    floorOnly: true,
    wallMountable: false,
  },
  {
    name: "Chair",
    description: "A comfy recovery chair for post-race rest",
    modelUrl: "/assets/models/Chair.glb",
    category: "furniture",
    isPremium: false,
    priceTokens: 5,
    defaultScale: 0.5,
    floorOnly: true,
    wallMountable: false,
  },
  {
    name: "Window",
    description: "Let some light into your Pain Cave",
    modelUrl: "/assets/models/Window.glb",
    category: "furniture",
    isPremium: false,
    priceTokens: 10,
    defaultScale: 0.5,
    floorOnly: false,
    wallMountable: true,
  },
];

export async function seedDecorations() {
  console.log("Seeding decorations...");

  for (const d of decorations) {
    const existing = await db.query.decoration.findFirst({
      where: eq(decoration.name, d.name),
    });
    if (!existing) {
      await db.insert(decoration).values(d);
      console.log(`  Inserted: ${d.name}`);
    } else {
      console.log(`  Skipped (exists): ${d.name}`);
    }
  }

  console.log("Decorations seeded successfully.");
}

// Run directly: bun run src/db/seed-decorations.ts
if (import.meta.main) {
  seedDecorations()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
