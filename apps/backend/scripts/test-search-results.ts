/**
 * Test script for searchRaceResults
 *
 * Usage:
 *   bun run scripts/test-search-results.ts
 *
 * Edit the test cases below to try different searches.
 */

import { searchRaceResults } from "../src/lib/ai-analyzer";

const testCases = [
  // {
  //   firstName: "Johan",
  //   lastName: "Pujol",
  //   raceName: "Ironman Klagenfurt Austria",
  //   sportKind: "triathlon",
  //   date: "16 juin 2024",
  //   city: "Klagenfurt",
  //   country: "AT",
  // },
  {
    firstName: "Johan",
    lastName: "Pujol",
    raceName: "Challenge roth",
    sportKind: "triathlon",
    date: "06 juillet 2025",
    city: "Roth",
    country: "Allemagne",
  },
  // {
  //   firstName: "Johan",
  //   lastName: "Pujol",
  //   raceName: "Challenge Gran canaria",
  //   sportKind: "triathlon",
  //   date: "26 avril 2025",
  //   city: "Gran canaria",
  //   country: "ES",
  // },

  // {
  //   firstName: "Johan",
  //   lastName: "Pujol",
  //   raceName: "Astragale Hivernale",
  //   sportKind: "trail",
  //   date: "7 décembre 2024",
  //   city: "Roquefort",
  //   country: "FR",
  // },
  {
    firstName: "Guillaume",
    lastName: "Hernandez",
    raceName: "UCI Gravel World Series - Wish One Millau Grands Causse",
    sportKind: "gravel",
    date: "15/06/2025",
    city: "Millau",
    country: "France",
  },
  {
    firstName: "Laura",
    lastName: "Pujol",
    raceName: "Carline Hivernale des templiers",
    sportKind: "trail",
    date: "07/12/2025",
    city: "Roquefort sur Soulzon",
    country: "France",
  },
];

console.log(`AI_PROVIDER: ${process.env.AI_PROVIDER || "mistral"}`);
console.log(`AI_TEXT_MODEL: ${process.env.AI_TEXT_MODEL || "(default)"}`);
console.log("---\n");

for (const tc of testCases) {
  console.log(
    `Searching: ${tc.firstName} ${tc.lastName} — ${tc.raceName} (${tc.sportKind}, ${tc.date ?? "no date"})`,
  );
  console.log("...");

  try {
    const result = await searchRaceResults(
      tc.firstName,
      tc.lastName,
      tc.raceName,
      tc.sportKind,
      tc.date,
      tc.city,
      tc.country,
    );
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }

  console.log("---\n");
}
