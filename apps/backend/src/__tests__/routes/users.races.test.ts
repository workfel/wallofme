import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Hono } from "hono";

// ─── Shared queues ─────────────────────────────────────────────────────────────
const userFindFirstQueue:       unknown[] = [];
const raceResultFindManyQueue:  unknown[] = [];
// For the existing /:id profile route (also fetches trophy / room counts)
const trophyFindManyQueue:      unknown[] = [];
const selectQueue:              unknown[] = [];

function makeChain(value: unknown) {
  const c: any = {};
  for (const m of ["from", "where", "groupBy", "orderBy", "limit", "offset", "leftJoin"]) {
    c[m] = () => c;
  }
  c.then    = (res: any, rej: any) => Promise.resolve(value).then(res, rej);
  c.catch   = (rej: any) => Promise.resolve(value).catch(rej);
  c.finally = (fin: any) => Promise.resolve(value).finally(fin);
  return c;
}

// ─── Module mocks ─────────────────────────────────────────────────────────────

mock.module("../../db", () => ({
  db: {
    select: () => makeChain(selectQueue.shift() ?? []),
    update: () => { const c: any = { set: () => c, where: () => c }; return c; },
    query: {
      user: {
        findFirst: () => Promise.resolve(userFindFirstQueue.shift() ?? null),
      },
      trophy: {
        findMany: () => Promise.resolve(trophyFindManyQueue.shift() ?? []),
      },
      room: {
        findFirst: () => Promise.resolve(null),
      },
      raceResult: {
        findMany: () => Promise.resolve(raceResultFindManyQueue.shift() ?? []),
      },
    },
  },
}));

mock.module("../../lib/auth", () => ({
  auth: { api: { getSession: async () => null } },
}));

mock.module("../../lib/storage", () => ({
  getPublicUrl: (key: string) => `https://cdn.example.com/${key}`,
}));

mock.module("../../lib/scan-limit", () => ({
  FREE_SCAN_LIMIT:      5,
  getMonthlyScansUsed:  async () => 0,
}));

mock.module("../../lib/referral-service", () => ({
  processReferrerReward: async () => {},
  generateReferralCode:  async () => "CODE123",
}));

mock.module("../../lib/streak-service", () => ({
  calculateStreak: async () => 0,
}));

// ─── Import route after mocks ─────────────────────────────────────────────────
import { users } from "../../routes/users.routes";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const USER_UUID = "550e8400-e29b-41d4-a716-446655440002";
const RACE_UUID = "550e8400-e29b-41d4-a716-446655440001";

const userFixture = {
  id:          USER_UUID,
  displayName: "Jean Athlete",
  firstName:   "Jean",
  image:       null,
  country:     "FR",
  sports:      '["running"]',
  isPro:       false,
};

const raceResultWithRaceFixture = {
  time:    "3:45:00",
  ranking: 5,
  race: {
    id:       RACE_UUID,
    name:     "Paris Marathon",
    date:     new Date("2024-04-14"),
    location: "Paris, France",
    sport:    "running",
    distance: "42km",
  },
};

const makeApp = (authUser: { id: string } | null = null) => {
  const app = new Hono<{ Variables: { user: any; session: any } }>();
  app.use("*", async (c: any, next: any) => {
    c.set("user", authUser);
    c.set("session", null);
    await next();
  });
  app.route("/", users);
  return app;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  userFindFirstQueue.length      = 0;
  raceResultFindManyQueue.length = 0;
  trophyFindManyQueue.length     = 0;
  selectQueue.length             = 0;
});

describe("GET /users/:id/races", () => {
  it("returns 404 when user does not exist", async () => {
    userFindFirstQueue.push(null); // user not found

    const res = await makeApp().request(`/${USER_UUID}/races`);
    expect(res.status).toBe(404);
  });

  it("returns empty list when user has no race results", async () => {
    userFindFirstQueue.push(userFixture);    // user exists
    raceResultFindManyQueue.push([]);        // no results

    const res = await makeApp().request(`/${USER_UUID}/races`);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data).toHaveLength(0);
    expect(json.page).toBe(1);
  });

  it("returns race results with nested race data", async () => {
    userFindFirstQueue.push(userFixture);
    raceResultFindManyQueue.push([raceResultWithRaceFixture]);

    const res = await makeApp().request(`/${USER_UUID}/races`);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].race.name).toBe("Paris Marathon");
    expect(json.data[0].time).toBe("3:45:00");
    expect(json.data[0].ranking).toBe(5);
  });

  it("is publicly accessible without authentication", async () => {
    userFindFirstQueue.push(userFixture);
    raceResultFindManyQueue.push([raceResultWithRaceFixture]);

    // No authUser passed — unauthenticated request
    const res = await makeApp(null).request(`/${USER_UUID}/races`);
    expect(res.status).toBe(200);
  });

  it("respects pagination params", async () => {
    userFindFirstQueue.push(userFixture);
    raceResultFindManyQueue.push([]);

    const res = await makeApp().request(`/${USER_UUID}/races?page=2&limit=5`);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.page).toBe(2);
    expect(json.limit).toBe(5);
  });

  it("returns 400 for invalid pagination (limit > 100)", async () => {
    const res = await makeApp().request(`/${USER_UUID}/races?limit=999`);
    expect(res.status).toBe(400);
  });

  it("routes /:id/races before /:id (does not fall through to profile)", async () => {
    // If /:id/races were matched by /:id, the handler would try to build
    // a profile response — but we push race-result data and expect the /races shape.
    userFindFirstQueue.push(userFixture);
    raceResultFindManyQueue.push([raceResultWithRaceFixture]);

    const res = await makeApp().request(`/${USER_UUID}/races`);
    const json: any = await res.json();

    // The /:id/races response has { data: [...raceResults], page, limit }
    // while /:id profile has { data: { trophies, trophyCount, ... } }
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("returns multiple race results in order", async () => {
    const result2 = {
      ...raceResultWithRaceFixture,
      time: "4:10:00",
      race: { ...raceResultWithRaceFixture.race, id: "550e8400-e29b-41d4-a716-446655440099", name: "Lyon Half Marathon" },
    };
    userFindFirstQueue.push(userFixture);
    raceResultFindManyQueue.push([raceResultWithRaceFixture, result2]);

    const res = await makeApp().request(`/${USER_UUID}/races`);
    const json: any = await res.json();

    expect(json.data).toHaveLength(2);
    expect(json.data[0].race.name).toBe("Paris Marathon");
    expect(json.data[1].race.name).toBe("Lyon Half Marathon");
  });
});
