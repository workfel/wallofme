import { db } from "./index";
import {
  user,
  account,
  race,
  raceResult,
  trophy,
  room,
  roomItem,
  decoration,
  tokenTransaction,
} from "./schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Helpers ────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Static Data ────────────────────────────────────────

const FIRST_NAMES = [
  "Thomas",
  "Marie",
  "Lucas",
  "Emma",
  "Hugo",
  "Léa",
  "Nathan",
  "Chloé",
  "Maxime",
  "Camille",
  "Antoine",
  "Sarah",
  "Julien",
  "Laura",
  "Pierre",
  "Manon",
  "Alexandre",
  "Julie",
  "Romain",
  "Pauline",
  // US / CA / AU / NZ
  "Jake",
  "Emily",
  "Ryan",
  "Olivia",
  "Liam",
  "Chloe",
  "Mason",
  "Sophie",
  "Ethan",
  "Isla",
];

const LAST_NAMES = [
  "Martin",
  "Bernard",
  "Dubois",
  "Thomas",
  "Robert",
  "Richard",
  "Petit",
  "Durand",
  "Leroy",
  "Moreau",
  "Simon",
  "Laurent",
  "Lefebvre",
  "Michel",
  "Garcia",
  "David",
  "Bertrand",
  "Roux",
  "Vincent",
  "Fournier",
  // US / CA / AU / NZ
  "Johnson",
  "Williams",
  "Brown",
  "Taylor",
  "Campbell",
  "Mitchell",
  "Thompson",
  "Wilson",
  "Anderson",
  "Clarke",
];

const COUNTRIES = [
  "FR",
  "FR",
  "FR",
  "FR",
  "FR",
  "FR",
  "FR",
  "FR",
  "ES",
  "CH",
  "BE",
  "FR",
  "FR",
  "FR",
  "FR",
  "IT",
  "FR",
  "FR",
  "FR",
  "FR",
  // US / CA / AU / NZ
  "US",
  "US",
  "US",
  "CA",
  "CA",
  "AU",
  "AU",
  "AU",
  "NZ",
  "NZ",
];

// Geoloc bounds — mostly France with some neighboring countries
const GEOLOCS: Record<
  string,
  { latMin: number; latMax: number; lngMin: number; lngMax: number }
> = {
  FR: { latMin: 43.0, latMax: 49.0, lngMin: -1.5, lngMax: 7.0 },
  ES: { latMin: 36.0, latMax: 43.5, lngMin: -9.0, lngMax: 3.0 },
  CH: { latMin: 45.8, latMax: 47.8, lngMin: 5.9, lngMax: 10.5 },
  BE: { latMin: 49.5, latMax: 51.5, lngMin: 2.5, lngMax: 6.4 },
  IT: { latMin: 36.6, latMax: 47.1, lngMin: 6.6, lngMax: 18.5 },
  US: { latMin: 25.0, latMax: 48.0, lngMin: -124.0, lngMax: -71.0 },
  CA: { latMin: 43.0, latMax: 56.0, lngMin: -130.0, lngMax: -60.0 },
  AU: { latMin: -38.0, latMax: -12.0, lngMin: 114.0, lngMax: 153.0 },
  NZ: { latMin: -47.0, latMax: -34.0, lngMin: 166.0, lngMax: 178.0 },
};

const SPORTS_OPTIONS = [
  '["running"]',
  '["trail"]',
  '["triathlon"]',
  '["cycling"]',
  '["running","trail"]',
  '["triathlon","running"]',
  '["running","cycling"]',
  '["trail","running","cycling"]',
  '["triathlon","swimming","running"]',
  '["obstacle","running"]',
];

const MEDAL_IMAGES = [
  "/assets/medals/Screenshot 2026-01-07 at 21.55.45.png", // Ironman UK Bolton
  "/assets/medals/Screenshot 2026-01-07 at 21.56.54.png", // Ironman 70.3 Syracuse
  "/assets/medals/Screenshot 2026-01-07 at 22.06.59.png", // Ironman Klagenfurt
  "/assets/medals/Screenshot 2026-01-07 at 22.10.07.png", // Challenge Peguera Mallorca
];

const RACES_DATA = [
  // Triathlon
  {
    name: "Ironman UK Bolton",
    sport: "triathlon" as const,
    location: "Bolton, England",
    distance: "226km",
    date: new Date("2017-07-16"),
    officialUrl: "https://www.ironman.com/im-uk",
  },
  {
    name: "Ironman 70.3 Syracuse",
    sport: "triathlon" as const,
    location: "Syracuse, New York",
    distance: "113km",
    date: new Date("2015-06-21"),
    officialUrl: "https://www.ironman.com/im703-syracuse",
  },
  {
    name: "Ironman Klagenfurt Austria",
    sport: "triathlon" as const,
    location: "Klagenfurt, Austria",
    distance: "226km",
    date: new Date("2024-06-23"),
    officialUrl: "https://www.ironman.com/im-austria",
  },
  {
    name: "Challenge Peguera Mallorca",
    sport: "triathlon" as const,
    location: "Peguera, Mallorca",
    distance: "113km",
    date: new Date("2024-10-19"),
    officialUrl: "https://www.challenge-mallorca.com",
  },
  {
    name: "Ironman Nice",
    sport: "triathlon" as const,
    location: "Nice, France",
    distance: "226km",
    date: new Date("2024-09-22"),
    officialUrl: "https://www.ironman.com/im-nice",
  },
  {
    name: "Ironman 70.3 Aix-en-Provence",
    sport: "triathlon" as const,
    location: "Aix-en-Provence, France",
    distance: "113km",
    date: new Date("2024-05-12"),
    officialUrl: "https://www.ironman.com/im703-aix",
  },
  {
    name: "Triathlon de Paris",
    sport: "triathlon" as const,
    location: "Paris, France",
    distance: "Olympic",
    date: new Date("2024-07-07"),
    officialUrl: "https://www.paristri.com",
  },
  {
    name: "Ironman 70.3 Barcelona",
    sport: "triathlon" as const,
    location: "Barcelona, Spain",
    distance: "113km",
    date: new Date("2024-05-19"),
    officialUrl: "https://www.ironman.com/im703-barcelona",
  },
  // Running
  {
    name: "Marathon de Paris",
    sport: "running" as const,
    location: "Paris, France",
    distance: "42.195km",
    date: new Date("2024-04-07"),
    officialUrl: "https://www.schneiderelectricparismarathon.com",
  },
  {
    name: "Semi-Marathon de Boulogne",
    sport: "running" as const,
    location: "Boulogne-Billancourt, France",
    distance: "21.1km",
    date: new Date("2024-11-24"),
    officialUrl: "https://www.semi-boulogne.com",
  },
  {
    name: "10km de Paris",
    sport: "running" as const,
    location: "Paris, France",
    distance: "10km",
    date: new Date("2024-06-02"),
    officialUrl: "https://www.10kmparis.com",
  },
  {
    name: "Marseille-Cassis",
    sport: "running" as const,
    location: "Marseille, France",
    distance: "20km",
    date: new Date("2024-10-27"),
    officialUrl: "https://www.marseillecastis.com",
  },
  {
    name: "Marathon du Médoc",
    sport: "running" as const,
    location: "Pauillac, France",
    distance: "42.195km",
    date: new Date("2024-09-07"),
    officialUrl: "https://www.marathondumedoc.com",
  },
  {
    name: "La Parisienne",
    sport: "running" as const,
    location: "Paris, France",
    distance: "6.7km",
    date: new Date("2024-09-08"),
    officialUrl: "https://www.laparisienne.net",
  },
  {
    name: "Corrida de Houilles",
    sport: "running" as const,
    location: "Houilles, France",
    distance: "10km",
    date: new Date("2024-12-15"),
    officialUrl: "https://www.corrida-houilles.fr",
  },
  {
    name: "Marathon de Lyon",
    sport: "running" as const,
    location: "Lyon, France",
    distance: "42.195km",
    date: new Date("2024-10-06"),
    officialUrl: "https://www.runinlyon.com",
  },
  // Trail
  {
    name: "UTMB Mont-Blanc",
    sport: "trail" as const,
    location: "Chamonix, France",
    distance: "171km",
    date: new Date("2024-08-30"),
    officialUrl: "https://www.utmb.world",
  },
  {
    name: "Trail des Templiers",
    sport: "trail" as const,
    location: "Millau, France",
    distance: "73km",
    date: new Date("2024-10-20"),
    officialUrl: "https://www.festival-templiers.com",
  },
  {
    name: "Grand Trail du Saint-Jacques",
    sport: "trail" as const,
    location: "Conques, France",
    distance: "72km",
    date: new Date("2024-06-08"),
    officialUrl: "https://www.grandtrailsaintjacques.fr",
  },
  {
    name: "Écotrail de Paris",
    sport: "trail" as const,
    location: "Paris, France",
    distance: "80km",
    date: new Date("2024-03-16"),
    officialUrl: "https://www.ecotrail-paris.com",
  },
  {
    name: "Trail de la Sainte-Victoire",
    sport: "trail" as const,
    location: "Aix-en-Provence, France",
    distance: "46km",
    date: new Date("2024-03-24"),
    officialUrl: "https://www.trailsaintevictoire.com",
  },
  // Cycling
  {
    name: "Étape du Tour",
    sport: "cycling" as const,
    location: "Nice, France",
    distance: "135km",
    date: new Date("2024-07-14"),
    officialUrl: "https://www.letapedutour.com",
  },
  {
    name: "L'Ariégeoise",
    sport: "cycling" as const,
    location: "Ax-les-Thermes, France",
    distance: "170km",
    date: new Date("2024-06-29"),
    officialUrl: "https://www.ariegeoise.com",
  },
  {
    name: "La Marmotte",
    sport: "cycling" as const,
    location: "Bourg-d'Oisans, France",
    distance: "174km",
    date: new Date("2024-07-06"),
    officialUrl: "https://www.marmottegranfondoalpes.com",
  },
  // Obstacle
  {
    name: "Spartan Race Paris",
    sport: "obstacle" as const,
    location: "Paris, France",
    distance: "21km",
    date: new Date("2024-05-04"),
    officialUrl: "https://www.spartan.com",
  },
  {
    name: "Mud Day Paris",
    sport: "obstacle" as const,
    location: "Beynes, France",
    distance: "13km",
    date: new Date("2024-06-01"),
    officialUrl: "https://www.themudday.com",
  },
  // Swimming
  {
    name: "Traversée de Paris à la nage",
    sport: "swimming" as const,
    location: "Paris, France",
    distance: "5km",
    date: new Date("2024-07-14"),
    officialUrl: "https://www.traverseedeparis.com",
  },
  {
    name: "Nagez Grandeur Nature Annecy",
    sport: "swimming" as const,
    location: "Annecy, France",
    distance: "3km",
    date: new Date("2024-08-25"),
    officialUrl: "https://www.nageon.com",
  },
  // Other
  {
    name: "La SaintéLyon",
    sport: "other" as const,
    location: "Saint-Étienne → Lyon, France",
    distance: "72km",
    date: new Date("2024-12-01"),
    officialUrl: "https://www.saintelyon.com",
  },
  {
    name: "Ekiden de Paris",
    sport: "running" as const,
    location: "Paris, France",
    distance: "42.195km (relay)",
    date: new Date("2024-11-10"),
    officialUrl: "https://www.ekidendeparis.com",
  },
];

// ─── Seed Functions ─────────────────────────────────────

async function seedUsers() {
  console.log("🏃 Seeding users...");
  const users: Array<{
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    displayName: string;
    isPro: boolean;
    locale: string;
    firstName: string;
    lastName: string;
    country: string;
    tokenBalance: number;
    sports: string;
    latitude: number;
    longitude: number;
  }> = [];

  for (let i = 1; i <= 30; i++) {
    const firstName = FIRST_NAMES[i - 1];
    const lastName = LAST_NAMES[i - 1];
    const country = COUNTRIES[i - 1];
    const geo = GEOLOCS[country] || GEOLOCS.FR;
    const isPro = Math.random() < 0.2;
    const createdAt = randomDate(2024, 2025);
    const locale = ["US", "CA", "AU", "NZ"].includes(country) ? "en" : "fr";

    users.push({
      id: `seed-user-${String(i).padStart(3, "0")}`,
      name: `${firstName} ${lastName}`,
      email: `user${i}@yopmail.com`,
      emailVerified: true,
      image: `https://i.pravatar.cc/300?u=user${i}@yopmail.com`,
      createdAt,
      updatedAt: createdAt,
      displayName: `${firstName} ${lastName}`,
      isPro,
      locale,
      firstName,
      lastName,
      country,
      tokenBalance: randomInt(0, 500),
      sports: pick(SPORTS_OPTIONS),
      latitude: parseFloat(randomBetween(geo.latMin, geo.latMax).toFixed(6)),
      longitude: parseFloat(randomBetween(geo.lngMin, geo.lngMax).toFixed(6)),
    });
  }

  for (const u of users) {
    await db
      .insert(user)
      .values(u)
      .onConflictDoUpdate({
        target: user.id,
        set: {
          name: u.name,
          email: u.email,
          image: u.image,
          displayName: u.displayName,
          isPro: u.isPro,
          locale: u.locale,
          firstName: u.firstName,
          lastName: u.lastName,
          country: u.country,
          tokenBalance: u.tokenBalance,
          sports: u.sports,
          latitude: u.latitude,
          longitude: u.longitude,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✅ ${u.email} (${u.displayName})`);
  }

  return users;
}

async function seedAccounts(userIds: string[]) {
  console.log("🔑 Seeding accounts...");

  for (const userId of userIds) {
    await db
      .insert(account)
      .values({
        id: `seed-account-${userId}`,
        accountId: userId,
        providerId: "credential",
        userId,
        password: "$2b$10$fakehashedpasswordforseeding000000000000000", // Not a real hash
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing({ target: account.id });
  }

  console.log(`  ✅ ${userIds.length} accounts`);
}

async function seedRaces() {
  console.log("🏁 Seeding races...");
  const raceIds: string[] = [];

  for (const r of RACES_DATA) {
    // Check if race already exists by name
    const existing = await db.query.race.findFirst({
      where: eq(race.name, r.name),
    });

    if (existing) {
      raceIds.push(existing.id);
      console.log(`  ⏭️  ${r.name} (exists)`);
    } else {
      const [inserted] = await db
        .insert(race)
        .values({
          name: r.name,
          sport: r.sport,
          location: r.location,
          distance: r.distance,
          date: r.date,
          officialUrl: r.officialUrl,
        })
        .returning({ id: race.id });
      raceIds.push(inserted.id);
      console.log(`  ✅ ${r.name}`);
    }
  }

  return raceIds;
}

async function seedRaceResultsAndTrophies(
  userIds: string[],
  raceIds: string[],
) {
  console.log("🏅 Seeding race results & trophies...");
  const resultData: Array<{
    userId: string;
    resultId: string;
    trophyId: string;
  }> = [];

  for (const userId of userIds) {
    // Each user gets 2-6 race results
    const numResults = randomInt(2, 6);
    const selectedRaceIds = pickN(raceIds, numResults);

    for (const raceId of selectedRaceIds) {
      // Check if result already exists
      const existingResult = await db.query.raceResult.findFirst({
        where: sql`${raceResult.userId} = ${userId} AND ${raceResult.raceId} = ${raceId}`,
      });

      if (existingResult) {
        console.log(`  ⏭️  Result for ${userId} in race (exists)`);
        continue;
      }

      const totalParticipants = randomInt(200, 5000);
      const ranking = randomInt(1, totalParticipants);
      const categoryRanking = randomInt(1, Math.floor(totalParticipants / 5));

      // Time varies by sport distance — rough estimates
      const timeSeconds = randomInt(1800, 50000); // 30 min to ~14 hours

      const [insertedResult] = await db
        .insert(raceResult)
        .values({
          userId,
          raceId,
          time: formatTime(timeSeconds),
          ranking,
          categoryRanking,
          totalParticipants,
          source: pick(["manual", "ai", "scraped"] as const),
          verified: Math.random() > 0.3,
        })
        .returning({ id: raceResult.id });

      // Create a trophy for this result
      const trophyType = Math.random() > 0.3 ? "medal" : "bib";
      const medalImage = pick(MEDAL_IMAGES);

      const [insertedTrophy] = await db
        .insert(trophy)
        .values({
          userId,
          raceResultId: insertedResult.id,
          type: trophyType,
          originalImageUrl: medalImage,
          processedImageUrl: medalImage,
          textureUrl: medalImage,
          thumbnailUrl: medalImage,
          status: "ready",
          aiIdentifiedRace:
            RACES_DATA.find((_, idx) => raceIds[idx] === raceId)?.name || null,
          aiConfidence: parseFloat(randomBetween(0.7, 0.99).toFixed(2)),
        })
        .returning({ id: trophy.id });

      resultData.push({
        userId,
        resultId: insertedResult.id,
        trophyId: insertedTrophy.id,
      });
    }
  }

  console.log(`  ✅ ${resultData.length} race results & trophies`);
  return resultData;
}

async function seedRooms(userIds: string[]) {
  console.log("🏠 Seeding rooms...");
  const roomMap: Record<string, string> = {}; // userId -> roomId

  for (const userId of userIds) {
    // Try insert, skip on conflict (userId is unique)
    const slug = `room-${nanoid(8)}`;
    await db
      .insert(room)
      .values({
        userId,
        shareSlug: slug,
        likeCount: randomInt(0, 150),
        viewCount: randomInt(0, 500),
      })
      .onConflictDoNothing();

    // Always fetch the room to get its ID (whether just created or existing)
    const existingRoom = await db.query.room.findFirst({
      where: eq(room.userId, userId),
    });
    if (existingRoom) {
      roomMap[userId] = existingRoom.id;
      console.log(`  ✅ Room for ${userId}`);
    }
  }

  return roomMap;
}

async function seedRoomItems(
  roomMap: Record<string, string>,
  resultData: Array<{ userId: string; resultId: string; trophyId: string }>,
) {
  console.log("🎨 Seeding room items...");

  // Get available decorations
  const decorations = await db.query.decoration.findMany();
  if (decorations.length === 0) {
    console.log("  ⚠️  No decorations found — run seed-decorations first!");
  }

  let totalItems = 0;

  for (const [userId, roomId] of Object.entries(roomMap)) {
    // Check if room already has items
    const existingItems = await db.query.roomItem.findMany({
      where: eq(roomItem.roomId, roomId),
    });

    if (existingItems.length > 0) {
      console.log(
        `  ⏭️  Room ${roomId} already has ${existingItems.length} items`,
      );
      totalItems += existingItems.length;
      continue;
    }

    // Get trophies for this user
    const userTrophies = resultData.filter((r) => r.userId === userId);

    const items: Array<{
      roomId: string;
      trophyId?: string;
      decorationId?: string;
      positionX: number;
      positionY: number;
      positionZ: number;
      rotationY: number;
      scaleX: number;
      scaleY: number;
      scaleZ: number;
      wall?: "left" | "right";
    }> = [];

    // Add trophies to walls
    for (let i = 0; i < userTrophies.length; i++) {
      const wall = i % 2 === 0 ? "left" : "right";
      const spacing = 1.2;
      const startX = -2.0;

      items.push({
        roomId,
        trophyId: userTrophies[i].trophyId,
        positionX: startX + Math.floor(i / 2) * spacing,
        positionY: 1.5 + randomBetween(-0.2, 0.2),
        positionZ: wall === "left" ? -2.4 : 2.4,
        rotationY: wall === "left" ? 0 : Math.PI,
        scaleX: 0.5,
        scaleY: 0.5,
        scaleZ: 0.5,
        wall: wall as "left" | "right",
      });
    }

    // Add some decorations on the floor
    if (decorations.length > 0) {
      const numDecorations = randomInt(3, 8);
      const selectedDecorations = pickN(
        decorations,
        Math.min(numDecorations, decorations.length),
      );

      for (const deco of selectedDecorations) {
        items.push({
          roomId,
          decorationId: deco.id,
          positionX: randomBetween(-2.5, 2.5),
          positionY: 0,
          positionZ: randomBetween(-2.0, 2.0),
          rotationY: randomBetween(0, Math.PI * 2),
          scaleX: deco.defaultScale,
          scaleY: deco.defaultScale,
          scaleZ: deco.defaultScale,
        });
      }
    }

    if (items.length > 0) {
      await db.insert(roomItem).values(items);
      totalItems += items.length;
    }
  }

  console.log(`  ✅ ${totalItems} room items total`);
}

async function seedTokenTransactions(userIds: string[]) {
  console.log("💰 Seeding token transactions...");
  let totalTx = 0;

  // Only seed for ~half the users
  const selectedUsers = pickN(userIds, 10);

  for (const userId of selectedUsers) {
    // Check if transactions already exist
    const existing = await db.query.tokenTransaction.findFirst({
      where: eq(tokenTransaction.userId, userId),
    });
    if (existing) {
      console.log(`  ⏭️  Transactions for ${userId} (exist)`);
      continue;
    }

    const numTx = randomInt(2, 5);
    let balance = 0;

    for (let i = 0; i < numTx; i++) {
      const type = pick([
        "purchase",
        "rewarded_video",
        "bonus",
        "spend_decoration",
      ] as const);

      const isSpend = type.startsWith("spend");
      const amount = isSpend ? -randomInt(5, 50) : randomInt(10, 100);
      balance = Math.max(0, balance + amount);

      await db.insert(tokenTransaction).values({
        userId,
        type,
        amount,
        balance,
        referenceId: isSpend ? `deco-${nanoid(6)}` : null,
        referenceType: isSpend ? "decoration" : null,
        createdAt: randomDate(2024, 2025),
      });
      totalTx++;
    }
  }

  console.log(`  ✅ ${totalTx} token transactions`);
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   🌱 WallOfMe Database Seeder            ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");

  // 1. Users
  const users = await seedUsers();
  const userIds = users.map((u) => u.id);

  // 2. Accounts
  await seedAccounts(userIds);

  // 3. Races
  const raceIds = await seedRaces();

  // 4. Race results + Trophies
  const resultData = await seedRaceResultsAndTrophies(userIds, raceIds);

  // 5. Rooms
  const roomMap = await seedRooms(userIds);

  // 6. Room items
  await seedRoomItems(roomMap, resultData);

  // 7. Token transactions
  await seedTokenTransactions(userIds);

  console.log("");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   ✅ Seed complete!                       ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");

  // Summary
  const userCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(user);
  const raceCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(race);
  const resultCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(raceResult);
  const trophyCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(trophy);
  const roomCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(room);
  const roomItemCount = await db
    .select({ count: sql<string>`count(*)` })
    .from(roomItem);

  console.log("📊 Database counts:");
  console.log(`   Users:        ${userCount[0].count}`);
  console.log(`   Races:        ${raceCount[0].count}`);
  console.log(`   Race Results: ${resultCount[0].count}`);
  console.log(`   Trophies:     ${trophyCount[0].count}`);
  console.log(`   Rooms:        ${roomCount[0].count}`);
  console.log(`   Room Items:   ${roomItemCount[0].count}`);
  console.log("");
}

// Run directly: bun run src/db/seed-data.ts
if (import.meta.main) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("❌ Seed failed:", e);
      process.exit(1);
    });
}
