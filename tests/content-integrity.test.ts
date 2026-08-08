import { describe, expect, it } from "vitest";
import { resolveSearch } from "../src/lib/resolveSearch";
import {
  loadJourneys,
  loadMoods,
  loadRecommendations,
  loadResources,
  loadSynonyms,
} from "./helpers/loadData";

// Reads the YAML files directly rather than going through Astro's content
// collections — see vitest.config.ts for why. Per-entry schema shape (Zod)
// is already validated by `astro build`/`astro sync`; these tests check
// cross-entry referential integrity, which Zod can't do on its own.

function duplicates<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const dupes = new Set<T>();
  for (const v of values) {
    if (seen.has(v)) dupes.add(v);
    seen.add(v);
  }
  return [...dupes];
}

describe("moods.yaml", () => {
  const moods = loadMoods();

  it("has exactly 24 unique moods across 8 families x 3 intensities", () => {
    expect(moods).toHaveLength(24);
    expect(duplicates(moods.map((m) => m.id))).toEqual([]);

    const byFamily = new Map<string, number>();
    for (const m of moods) byFamily.set(m.family, (byFamily.get(m.family) ?? 0) + 1);
    expect(byFamily.size).toBe(8);
    for (const count of byFamily.values()) expect(count).toBe(3);
  });

  it("has 8 unique wheel_position values, one per family", () => {
    const positionsByFamily = new Map<string, Set<number>>();
    for (const m of moods) {
      const set = positionsByFamily.get(m.family) ?? new Set();
      set.add(m.wheel_position);
      positionsByFamily.set(m.family, set);
    }
    for (const set of positionsByFamily.values()) expect(set.size).toBe(1);
    const allPositions = [...positionsByFamily.values()].map((s) => [...s][0]);
    expect(new Set(allPositions).size).toBe(8);
  });
});

describe("synonyms.yaml", () => {
  it("has unique terms (case-insensitive) with valid mood references", () => {
    const synonyms = loadSynonyms();
    const moodIds = new Set(loadMoods().map((m) => m.id));

    expect(duplicates(synonyms.map((s) => s.term.toLowerCase()))).toEqual([]);
    for (const s of synonyms) {
      expect(s.candidates.length).toBeGreaterThan(0);
      for (const c of s.candidates) {
        expect(moodIds.has(c.mood_id)).toBe(true);
      }
    }
  });
});

describe("journeys.yaml", () => {
  const journeys = loadJourneys();
  const recommendations = loadRecommendations();
  const moodIds = new Set(loadMoods().map((m) => m.id));

  it("references real moods and every published journey has >=1 recommendation", () => {
    expect(duplicates(journeys.map((j) => j.id))).toEqual([]);
    for (const j of journeys) {
      expect(moodIds.has(j.starting_mood_id)).toBe(true);
      expect(moodIds.has(j.destination_mood_id)).toBe(true);
    }

    const published = journeys.filter((j) => j.status === "published");
    expect(published.length).toBeGreaterThan(0);
    for (const j of published) {
      const count = recommendations.filter((r) => r.journey_id === j.id).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  it("only emits status values the schema/build understand", () => {
    for (const j of journeys) {
      expect(["draft", "published"]).toContain(j.status);
    }
  });

  it("never publishes a journey to its start's wheel opposite", () => {
    // DESIGN.md: Plutchik opposites are structural, not beneficial
    // destinations — the app never uses a wheel opposite as an automatic
    // (or editorial) recommendation target. Opposite pairs sit 4 apart.
    const positionById = new Map(loadMoods().map((m) => [m.id, m.wheel_position]));
    for (const j of journeys.filter((j) => j.status === "published")) {
      const start = positionById.get(j.starting_mood_id)!;
      const dest = positionById.get(j.destination_mood_id)!;
      expect((start - dest + 8) % 8).not.toBe(4);
    }
  });

  it("has at most 3 published journeys per starting mood", () => {
    // The Explore ring shows at most 3 "explore next" chips; more published
    // journeys than that would make the slice a silent editorial decision.
    const byStart = new Map<string, number>();
    for (const j of journeys.filter((j) => j.status === "published")) {
      byStart.set(j.starting_mood_id, (byStart.get(j.starting_mood_id) ?? 0) + 1);
    }
    for (const [moodId, count] of byStart) {
      expect(count, `published journeys starting at ${moodId}`).toBeLessThanOrEqual(3);
    }
  });
});

describe("resources.yaml + recommendations.yaml", () => {
  const resources = loadResources();
  const recommendations = loadRecommendations();
  const journeyIds = new Set(loadJourneys().map((j) => j.id));

  it("has unique resource ids and no duplicate canonical_url", () => {
    expect(duplicates(resources.map((r) => r.id))).toEqual([]);
    expect(duplicates(resources.map((r) => r.canonical_url))).toEqual([]);
  });

  it("every recommendation references a real resource and journey, with no duplicate placement", () => {
    const resourceIds = new Set(resources.map((r) => r.id));

    expect(duplicates(recommendations.map((r) => r.id))).toEqual([]);
    for (const r of recommendations) {
      expect(resourceIds.has(r.resource_id)).toBe(true);
      expect(journeyIds.has(r.journey_id)).toBe(true);
    }

    const pairs = recommendations.map((r) => `${r.resource_id}::${r.journey_id}`);
    expect(duplicates(pairs)).toEqual([]);
  });

  it("recommends the same resource on more than one journey at least once", () => {
    // Exercises "one resource, many journeys, no duplicated metadata."
    const byResource = new Map<string, number>();
    for (const r of recommendations) {
      byResource.set(r.resource_id, (byResource.get(r.resource_id) ?? 0) + 1);
    }
    expect([...byResource.values()].some((count) => count > 1)).toBe(true);
  });
});

describe("resolveSearch against the real catalog", () => {
  it("matches the documented resolution examples", () => {
    const moods = loadMoods();
    const synonyms = loadSynonyms();
    const searchableMoods = moods.map((m) => ({ id: m.id, label: m.label }));
    const searchableSynonyms = synonyms.map((s) => ({
      term: s.term,
      candidates: s.candidates.map((c: any) => ({ moodId: c.mood_id, confidence: c.confidence })),
    }));

    expect(resolveSearch("anxious", searchableMoods, searchableSynonyms)).toEqual({
      state: "exact",
      query: "anxious",
      moodId: "fear",
    });

    const nervous = resolveSearch("nervous", searchableMoods, searchableSynonyms);
    expect(nervous.state).toBe("candidates");

    const empty = resolveSearch("empty", searchableMoods, searchableSynonyms);
    expect(empty.state).toBe("candidates");
    if (empty.state === "candidates") {
      expect(empty.candidates.length).toBeGreaterThanOrEqual(3);
    }

    expect(resolveSearch("banana", searchableMoods, searchableSynonyms)).toEqual({
      state: "no-match",
      query: "banana",
    });
  });
});
