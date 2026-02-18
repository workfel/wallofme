import { describe, it, expect } from "bun:test";
import {
  listRaceSchema,
  finishersSortSchema,
} from "../../validators/race.validator";

// ─── listRaceSchema ───────────────────────────────────────────────────────────

describe("listRaceSchema", () => {
  it("defaults page=1, limit=20, no filters", () => {
    const r = listRaceSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.limit).toBe(20);
    expect(r.q).toBeUndefined();
    expect(r.sport).toBeUndefined();
  });

  it("normalises a single sport string into a one-element array", () => {
    const r = listRaceSchema.parse({ sport: "running" });
    expect(r.sport).toEqual(["running"]);
  });

  it("accepts a sport array with multiple valid values", () => {
    const r = listRaceSchema.parse({ sport: ["running", "trail"] });
    expect(r.sport).toEqual(["running", "trail"]);
  });

  it("accepts all valid sport enum values", () => {
    const sports = ["running", "trail", "triathlon", "cycling", "swimming", "obstacle", "other"];
    for (const s of sports) {
      expect(() => listRaceSchema.parse({ sport: s })).not.toThrow();
    }
  });

  it("rejects unknown sport values", () => {
    expect(() => listRaceSchema.parse({ sport: ["ultramarathon"] })).toThrow();
  });

  it("rejects a mix of valid and invalid sport values", () => {
    expect(() => listRaceSchema.parse({ sport: ["running", "badminton"] })).toThrow();
  });

  it("accepts a q search string", () => {
    const r = listRaceSchema.parse({ q: "Paris Marathon" });
    expect(r.q).toBe("Paris Marathon");
  });

  it("coerces page and limit from strings", () => {
    const r = listRaceSchema.parse({ page: "3", limit: "50" });
    expect(r.page).toBe(3);
    expect(r.limit).toBe(50);
  });

  it("rejects limit > 100", () => {
    expect(() => listRaceSchema.parse({ limit: "101" })).toThrow();
  });

  it("rejects page < 1", () => {
    expect(() => listRaceSchema.parse({ page: "0" })).toThrow();
  });

  it("sport=undefined leaves the field absent", () => {
    const r = listRaceSchema.parse({ sport: undefined });
    expect(r.sport).toBeUndefined();
  });
});

// ─── finishersSortSchema ──────────────────────────────────────────────────────

describe("finishersSortSchema", () => {
  it("defaults sort to 'time' when omitted", () => {
    expect(finishersSortSchema.parse({}).sort).toBe("time");
  });

  it("accepts sort=time explicitly", () => {
    expect(finishersSortSchema.parse({ sort: "time" }).sort).toBe("time");
  });

  it("accepts sort=trophies", () => {
    expect(finishersSortSchema.parse({ sort: "trophies" }).sort).toBe("trophies");
  });

  it("accepts sort=likes", () => {
    expect(finishersSortSchema.parse({ sort: "likes" }).sort).toBe("likes");
  });

  it("rejects an invalid sort value", () => {
    expect(() => finishersSortSchema.parse({ sort: "name" })).toThrow();
  });

  it("rejects sort=Time (case-sensitive)", () => {
    expect(() => finishersSortSchema.parse({ sort: "Time" })).toThrow();
  });

  it("coerces page and limit from strings", () => {
    const r = finishersSortSchema.parse({ page: "2", limit: "10", sort: "likes" });
    expect(r.page).toBe(2);
    expect(r.limit).toBe(10);
    expect(r.sort).toBe("likes");
  });
});
