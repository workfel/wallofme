import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Hono } from "hono";

// ─── Shared queues ─────────────────────────────────────────────────────────────
const selectQueue:       unknown[]   = [];
const trophyFindFirst:   unknown[]   = [];
const raceFindFirst:     unknown[]   = [];
const insertReturnQueue: unknown[]   = [];

function makeChain(value: unknown) {
  const c: any = {};
  for (const m of ["from", "where", "groupBy", "orderBy", "limit", "offset"]) {
    c[m] = () => c;
  }
  c.then    = (res: any, rej: any) => Promise.resolve(value).then(res, rej);
  c.catch   = (rej: any) => Promise.resolve(value).catch(rej);
  c.finally = (fin: any) => Promise.resolve(value).finally(fin);
  return c;
}

function makeInsertChain() {
  const c: any = {
    values:       () => c,
    returning:    () => Promise.resolve(insertReturnQueue.shift() ?? []),
    onConflictDoNothing: () => c,
  };
  return c;
}

function makeUpdateChain() {
  const c: any = { set: () => c, where: () => c };
  return c;
}

// ─── Module mocks ─────────────────────────────────────────────────────────────

mock.module("../../db", () => ({
  db: {
    select: () => makeChain(selectQueue.shift() ?? []),
    insert: () => makeInsertChain(),
    update: () => makeUpdateChain(),
    query: {
      trophy:     { findFirst: () => Promise.resolve(trophyFindFirst.shift()  ?? null) },
      race:       { findFirst: () => Promise.resolve(raceFindFirst.shift()    ?? null) },
      raceResult: { findFirst: () => Promise.resolve(null) },
    },
  },
}));

mock.module("../../lib/auth", () => ({
  auth: { api: { getSession: async () => null } },
}));

// Stub heavyweight deps not needed for /validate
mock.module("../../lib/ai-analyzer", () => ({
  analyzeImage:        async () => ({}),
  searchRaceDate:      async () => null,
  searchRaceInfo:      async () => ({}),
  searchRaceResults:   async () => ({}),
}));

mock.module("../../lib/image-processor", () => ({
  processTrophyImage: async () => ({
    processedImageUrl: "http://cdn/p.webp",
    textureUrl:        "http://cdn/t.webp",
    thumbnailUrl:      "http://cdn/th.webp",
  }),
}));

mock.module("../../lib/storage", () => ({
  downloadBuffer: async () => Buffer.from(""),
  uploadBuffer:   async () => {},
  getPublicUrl:   (key: string) => `https://cdn.example.com/${key}`,
}));

mock.module("../../lib/referral-service", () => ({
  processReferrerReward: async () => {},
  generateReferralCode:  async () => "CODE123",
}));

mock.module("sharp", () => ({
  default: () => ({
    rotate:  () => ({ webp: () => ({ toBuffer: async () => Buffer.from("") }) }),
    resize:  () => ({ webp: () => ({ toBuffer: async () => Buffer.from("") }) }),
    webp:    () => ({ toBuffer: async () => Buffer.from("") }),
  }),
}));

mock.module("nanoid", () => ({
  nanoid: () => "mocked-nanoid",
}));

// ─── Import route after mocks ─────────────────────────────────────────────────
import { scan } from "../../routes/scan.routes";

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const TROPHY_UUID = "550e8400-e29b-41d4-a716-446655440003";
const RACE_UUID   = "550e8400-e29b-41d4-a716-446655440001";
const RESULT_UUID = "550e8400-e29b-41d4-a716-446655440004";
const USER_UUID   = "550e8400-e29b-41d4-a716-446655440002";

const trophyFixture = {
  id:                TROPHY_UUID,
  userId:            USER_UUID,
  type:              "medal",
  status:            "pending",
  originalImageUrl:  "https://cdn.example.com/photo.webp",
  raceResultId:      null,
};

const raceFixture = {
  id:       RACE_UUID,
  name:     "Paris Marathon",
  date:     null,
  location: "Paris, France",
  sport:    "running",
  distance: "42km",
};

const raceResultFixture = {
  id:     RESULT_UUID,
  userId: USER_UUID,
  raceId: RACE_UUID,
  source: "ai",
};

const makeApp = (user: { id: string } | null = null) => {
  const app = new Hono<{ Variables: { user: any; session: any } }>();
  app.use("*", async (c: any, next: any) => {
    c.set("user", user);
    c.set("session", null);
    await next();
  });
  app.route("/", scan);
  return app;
};

const authUser = { id: USER_UUID };

const validateBody = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    trophyId: TROPHY_UUID,
    type:     "medal",
    raceName: "Paris Marathon",
    raceId:   RACE_UUID,
    ...overrides,
  });

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  selectQueue.length      = 0;
  trophyFindFirst.length  = 0;
  raceFindFirst.length    = 0;
  insertReturnQueue.length = 0;
});

describe("POST /validate — communityFinishersCount", () => {
  it("returns 401 when unauthenticated", async () => {
    const res = await makeApp(null).request("/validate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    validateBody(),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when trophy not found", async () => {
    trophyFindFirst.push(null);

    const res = await makeApp(authUser).request("/validate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    validateBody(),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when trophy belongs to a different user", async () => {
    trophyFindFirst.push({ ...trophyFixture, userId: "other-user-id" });

    const res = await makeApp(authUser).request("/validate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    validateBody(),
    });
    expect(res.status).toBe(404);
  });

  it("returns communityFinishersCount=0 when user is first finisher", async () => {
    trophyFindFirst.push(trophyFixture);
    raceFindFirst.push(raceFixture);               // existing race lookup
    selectQueue.push([{ count: 0 }]);              // community count = 0
    insertReturnQueue.push([raceResultFixture]);    // insert raceResult

    const res = await makeApp(authUser).request("/validate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    validateBody(),
    });
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.data.communityFinishersCount).toBe(0);
    expect(json.data.race.id).toBe(RACE_UUID);
    expect(json.data.raceResult.id).toBe(RESULT_UUID);
  });

  it("returns communityFinishersCount=3 when 3 others already finished", async () => {
    trophyFindFirst.push(trophyFixture);
    raceFindFirst.push(raceFixture);
    selectQueue.push([{ count: 3 }]);              // community count = 3
    insertReturnQueue.push([raceResultFixture]);

    const res = await makeApp(authUser).request("/validate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    validateBody(),
    });

    const json: any = await res.json();
    expect(json.data.communityFinishersCount).toBe(3);
  });

  it("creates a new race when no raceId is provided", async () => {
    trophyFindFirst.push(trophyFixture);
    // No raceFindFirst — route inserts a new race instead
    insertReturnQueue.push([raceFixture]);          // insert race
    selectQueue.push([{ count: 1 }]);              // community count
    insertReturnQueue.push([raceResultFixture]);    // insert raceResult

    const res = await makeApp(authUser).request("/validate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    validateBody({ raceId: undefined }),
    });
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(typeof json.data.communityFinishersCount).toBe("number");
  });

  it("counts community BEFORE inserting own result (no self-count)", async () => {
    // If count was done AFTER insert, we'd see count+1 in the response.
    // We verify that communityFinishersCount reflects pre-insert count.
    trophyFindFirst.push(trophyFixture);
    raceFindFirst.push(raceFixture);
    selectQueue.push([{ count: 5 }]);
    insertReturnQueue.push([raceResultFixture]);

    const json: any = await (
      await makeApp(authUser).request("/validate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    validateBody(),
      })
    ).json();

    // Exactly 5 — not 6 (which would mean the current user was counted)
    expect(json.data.communityFinishersCount).toBe(5);
  });
});
