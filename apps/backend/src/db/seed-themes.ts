import { db } from "./index";
import { theme } from "./schema";

const freeThemes = [
  {
    name: "Warm Diorama",
    slug: "classic",
    description: "The original warm tones of your Pain Cave",
    floorColor: "#c9a87c",
    wallColor: "#faedcd",
    backgroundColor: "#f5f0e8",
    isFree: true,
    priceTokens: 0,
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Dark Cave",
    slug: "dark-cave",
    description: "A moody underground training den",
    floorColor: "#2a2a2a",
    wallColor: "#1a1a2e",
    backgroundColor: "#0a0a1a",
    isFree: true,
    priceTokens: 0,
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Alpine",
    slug: "alpine",
    description: "Clean mountain-inspired aesthetics",
    floorColor: "#e8e8e8",
    wallColor: "#f0f5f9",
    backgroundColor: "#e8eef4",
    isFree: true,
    priceTokens: 0,
    sortOrder: 3,
    isActive: true,
  },
];

export async function seedThemes() {
  console.log("Seeding themes...");

  for (const t of freeThemes) {
    await db
      .insert(theme)
      .values(t)
      .onConflictDoNothing({ target: theme.slug });
  }

  console.log("Themes seeded successfully.");
}

// Run directly: bun run src/db/seed-themes.ts
if (import.meta.main) {
  seedThemes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
