import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Hono } from "hono";

// ─── Shared mutable queues (referenced by the mock factories below) ───────────
const selectQueue: unknown[] = [];
const raceFindFirstQueue: unknown[] = [];

// Chainable Drizzle query-builder mock — returns `value` when awaited
function makeChain(value: unknown) {
  const c: any = {};
  for (const m of [
    "from", "leftJoin", "innerJoin", "where",
    "groupBy", "orderBy", "limit", "offset",
  ]) {
    c[m] = () => c;
  }
  c.then    = (res: any, rej: any) => Promise.resolve(value).then(res, rej);
  c.catch   = (rej: any) => Promise.resolve(value).catch(rej);
  c.finally = (fin: any) => Promise.resolve(value).finally(fin);
  return c;
}

// ─── Module mocks (hoisted by Bun before any import) ─────────────────────────

mock.module("../../db", () => ({
  db: {
    select: () => makeChain(selectQueue.shift() ?? []),
    query: {
      race: {
        findFirst: () => Promise.resolve(raceFindFirstQueue.shift() ?? null),
      },
    },
  },
}));

// BetterAuth only needed as a type in races.routes — stub it to avoid startup side-effects
mock.module("../../lib/auth", () => ({
  auth: { api: { getSession: async () => null } },
}));

// race-matcher is only used by /search, but it's imported at module level
mock.module("../../lib/race-matcher", () => ({
  normalizeRaceName: (s: string) => s,
  getSearchTerms:    (s: string) => [s],
}));

// ─── Import route after mocks are registered ─────────────────────────────────
import { races } from "../../routes/races.routes";

// ─── Test-app factory ─────────────────────────────────────────────────────────
const RACE_UUID   = "550e8400-e29b-41d4-a716-446655440001";
const USER_UUID   = "550e8400-e29b-41d4-a716-446655440002";

const makeApp = (user: { id: string } | null = null) => {
  const app = new Hono<{ Variables: { user: any; session: any } }>();
  app.use("*", async (c: any, next: any) => {
    c.set("user", user);
    c.set("session", null);
    await next();
  });
  app.route("/", races);
  return app;
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const raceFixture = {
  id: RACE_UUID,
  name: "Paris Marathon",
  date: new Date("2024-04-14"),
  location: "Paris, France",
  sport: "running",
  distance: "42km",
};

const finisherFixture = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  time: "3:45:00",
  ranking: 1,
  categoryRanking: null,
  totalParticipants: 50000,
  user: { id: USER_UUID, displayName: "Jean Athlete", firstName: "Jean", lastName: "Athlete", image: null, isPro: false },
  roomLikeCount: 5,
  trophyCount: 3,
  isMe: false,
};

beforeEach(() => {
  selectQueue.length        = 0;
  raceFindFirstQueue.length = 0;
});

// ─── GET / — list races ───────────────────────────────────────────────────────

describe("GET /races", () => {
  it("returns 200 with races list and finisherCount", async () => {
    selectQueue.push([{ ...raceFixture, finisherCount: 3, userHasRun: false }]);

    const res = await makeApp().request("/?page=1&limit=20");
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].finisherCount).toBe(3);
    expect(json.data[0].userHasRun).toBe(false);
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });

  it("returns userHasRun=true when authenticated user ran the race", async () => {
    selectQueue.push([{ ...raceFixture, finisherCount: 1, userHasRun: true }]);

    const res = await makeApp({ id: USER_UUID }).request("/?page=1&limit=20");
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data[0].userHasRun).toBe(true);
  });

  it("accepts q filter in query string", async () => {
    selectQueue.push([{ ...raceFixture, finisherCount: 0, userHasRun: false }]);

    const res = await makeApp().request("/?q=Paris");
    expect(res.status).toBe(200);
  });

  it("accepts sport[] filter in query string", async () => {
    selectQueue.push([{ ...raceFixture, finisherCount: 2, userHasRun: false }]);

    const res = await makeApp().request("/?sport=running&sport=trail");
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid sort param", async () => {
    // limit > 100 violates the schema
    const res = await makeApp().request("/?limit=999");
    expect(res.status).toBe(400);
  });

  it("returns empty list when no races found", async () => {
    selectQueue.push([]);

    const res = await makeApp().request("/");
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data).toHaveLength(0);
  });
});

// ─── GET /trending ────────────────────────────────────────────────────────────
// Critical: /trending must not be captured by /:id

describe("GET /races/trending", () => {
  it("returns 200 with trending races (not routed to /:id)", async () => {
    selectQueue.push([{ ...raceFixture, finisherCount: 100 }]);

    const res = await makeApp().request("/trending");
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].finisherCount).toBe(100);
  });

  it("returns empty array when no recent races exist", async () => {
    selectQueue.push([]);

    const res = await makeApp().request("/trending");
    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.data).toHaveLength(0);
  });

  it("does not require authentication", async () => {
    selectQueue.push([{ ...raceFixture, finisherCount: 5 }]);

    const res = await makeApp(null).request("/trending");
    expect(res.status).toBe(200);
  });
});

// ─── GET /:id/finishers — sort modes ─────────────────────────────────────────

describe("GET /races/:id/finishers", () => {
  it("returns 404 when race not found", async () => {
    raceFindFirstQueue.push(null);

    const res = await makeApp().request(`/${RACE_UUID}/finishers`);
    expect(res.status).toBe(404);
  });

  it("returns finishers with default sort=time", async () => {
    raceFindFirstQueue.push(raceFixture);
    selectQueue.push([{ count: 1 }]);         // count query
    selectQueue.push([finisherFixture]);       // finishers query

    const res = await makeApp().request(`/${RACE_UUID}/finishers`);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data.race.name).toBe("Paris Marathon");
    expect(json.data.finishers).toHaveLength(1);
    expect(json.data.totalFinishers).toBe(1);
  });

  it("returns finishers with sort=trophies", async () => {
    raceFindFirstQueue.push(raceFixture);
    selectQueue.push([{ count: 1 }]);
    selectQueue.push([{ ...finisherFixture, trophyCount: 10 }]);

    const res = await makeApp().request(`/${RACE_UUID}/finishers?sort=trophies`);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data.finishers[0].trophyCount).toBe(10);
  });

  it("returns finishers with sort=likes", async () => {
    raceFindFirstQueue.push(raceFixture);
    selectQueue.push([{ count: 1 }]);
    selectQueue.push([{ ...finisherFixture, roomLikeCount: 42 }]);

    const res = await makeApp().request(`/${RACE_UUID}/finishers?sort=likes`);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data.finishers[0].roomLikeCount).toBe(42);
  });

  it("sets isMe=true for the authenticated user's entry", async () => {
    raceFindFirstQueue.push(raceFixture);
    selectQueue.push([{ count: 1 }]);
    selectQueue.push([{ ...finisherFixture, user: { ...finisherFixture.user, id: USER_UUID }, isMe: true }]);

    const res = await makeApp({ id: USER_UUID }).request(`/${RACE_UUID}/finishers`);
    const json: any = await res.json();
    expect(json.data.finishers[0].isMe).toBe(true);
  });

  it("sets isMe=false when unauthenticated", async () => {
    raceFindFirstQueue.push(raceFixture);
    selectQueue.push([{ count: 1 }]);
    selectQueue.push([{ ...finisherFixture, isMe: false }]);

    const res = await makeApp(null).request(`/${RACE_UUID}/finishers`);
    const json: any = await res.json();
    expect(json.data.finishers[0].isMe).toBe(false);
  });

  it("rejects an invalid sort value with 400", async () => {
    const res = await makeApp().request(`/${RACE_UUID}/finishers?sort=alpha`);
    expect(res.status).toBe(400);
  });

  it("rejects a non-UUID race id with 400", async () => {
    const res = await makeApp().request("/not-a-uuid/finishers");
    expect(res.status).toBe(400);
  });
});
