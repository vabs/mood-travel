import { describe, expect, it } from "vitest";
import {
  BUBBLE_DIAMETER,
  FIELD_ASPECT,
  RESOURCE_TYPES,
  buildLeafEntries,
  deriveExploreNext,
  deriveTypeCounts,
  exploreHref,
  restPosition,
  type ExploreJourney,
  type ExploreRecommendation,
} from "../src/lib/explore";
import { loadJourneys, loadMoods, loadRecommendations, loadResources } from "./helpers/loadData";

// Same conventions as content-integrity.test.ts: real YAML via loadData.ts
// (Vitest can't use getCollection — see vitest.config.ts), plus small
// synthetic fixtures where the real catalog can't exercise a branch.

const moods = loadMoods();
const journeys = loadJourneys() as ExploreJourney[];
const recommendations = loadRecommendations() as ExploreRecommendation[];
const resources = loadResources();

// The field is FIELD_ASPECT times wider than it is tall, so a y offset of 1
// spans half the pixels an x offset of 1 does. Convert both to the same
// space (fractions of the field WIDTH) before measuring any distance.
const pixelGap = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, (a.y - b.y) / FIELD_ASPECT);

describe("restPosition", () => {
  it("is deterministic", () => {
    for (const m of moods) {
      expect(restPosition(m)).toEqual(restPosition(m));
    }
  });

  it("spreads bubbles across the whole field instead of clustering centrally", () => {
    const xs = moods.map((m) => restPosition(m).x);
    const ys = moods.map((m) => restPosition(m).y);
    // Bubbles reach the outer quarters on both axes — a centred wheel fails this.
    expect(Math.min(...xs)).toBeLessThan(0.25);
    expect(Math.max(...xs)).toBeGreaterThan(0.75);
    expect(Math.min(...ys)).toBeLessThan(0.3);
    expect(Math.max(...ys)).toBeGreaterThan(0.7);
  });

  it("keeps each family together and further from itself than from other families", () => {
    const byFamily = new Map<string, typeof moods>();
    for (const m of moods) {
      byFamily.set(m.family, [...(byFamily.get(m.family) ?? []), m]);
    }
    expect(byFamily.size).toBe(8);

    for (const [family, members] of byFamily) {
      expect(members).toHaveLength(3);
      const own = members.map((m) => restPosition(m));
      const widestWithinFamily = Math.max(
        ...own.flatMap((a, i) => own.slice(i + 1).map((b) => pixelGap(a, b))),
      );
      const nearestOtherFamily = Math.min(
        ...moods
          .filter((m) => m.family !== family)
          .flatMap((other) => own.map((a) => pixelGap(a, restPosition(other)))),
      );
      expect(widestWithinFamily, `${family} cluster`).toBeLessThan(nearestOtherFamily);
    }
  });

  it("leaves every pair of bubbles far enough apart not to overlap", () => {
    // Any two bubbles must sit further apart than one diameter, or the field
    // self-occludes — exactly what the first fan-based layout did (Fear was
    // buried behind Terror and Apprehension).
    for (let i = 0; i < moods.length; i++) {
      for (let j = i + 1; j < moods.length; j++) {
        const gap = pixelGap(restPosition(moods[i]), restPosition(moods[j]));
        expect(gap, `${moods[i].id} vs ${moods[j].id}`).toBeGreaterThan(BUBBLE_DIAMETER);
      }
    }
  });

  it("keeps every bubble fully inside the field", () => {
    const rx = BUBBLE_DIAMETER / 2;
    const ry = (BUBBLE_DIAMETER / 2) * FIELD_ASPECT; // same pixels, more y units
    for (const m of moods) {
      const { x, y } = restPosition(m);
      expect(x - rx, `${m.id} left`).toBeGreaterThan(0);
      expect(x + rx, `${m.id} right`).toBeLessThan(1);
      expect(y - ry, `${m.id} top`).toBeGreaterThan(0);
      expect(y + ry, `${m.id} bottom`).toBeLessThan(1);
    }
  });
});

describe("deriveTypeCounts", () => {
  it("omits zero-count types and matches the leaf page's row count exactly", () => {
    for (const m of moods) {
      const counts = deriveTypeCounts(m.id, journeys, recommendations, resources);
      for (const type of RESOURCE_TYPES) {
        const rows = buildLeafEntries(m.id, type, journeys, recommendations, resources);
        if (rows.length === 0) {
          expect(counts).not.toHaveProperty(type);
        } else {
          expect(counts[type]).toBe(rows.length);
        }
      }
    }
  });

  it("returns {} for a mood with no published journeys", () => {
    const journeyless = moods.filter(
      (m) => !journeys.some((j) => j.status === "published" && j.starting_mood_id === m.id),
    );
    expect(journeyless.length).toBeGreaterThan(0);
    for (const m of journeyless) {
      expect(deriveTypeCounts(m.id, journeys, recommendations, resources)).toEqual({});
    }
  });

  it("excludes draft journeys", () => {
    const draft: ExploreJourney[] = [
      {
        id: "fear-draft",
        starting_mood_id: "fear",
        destination_mood_id: "joy",
        name: "Draft route",
        rationale: "not published",
        status: "draft",
      },
    ];
    const recs: ExploreRecommendation[] = [
      {
        id: "fear-draft--r1",
        resource_id: "r1",
        journey_id: "fear-draft",
        tempo: "quick",
        rationale: "x",
        priority: 1,
      },
    ];
    const res = [{ id: "r1", type: "book" }];
    expect(deriveTypeCounts("fear", draft, recs, res)).toEqual({});
  });
});

describe("buildLeafEntries", () => {
  it("dedupes a resource placed on several journeys from the same mood, keeping best priority", () => {
    const twoJourneys: ExploreJourney[] = [
      {
        id: "j-a",
        starting_mood_id: "fear",
        destination_mood_id: "trust",
        name: "Route A",
        rationale: "a",
        status: "published",
      },
      {
        id: "j-b",
        starting_mood_id: "fear",
        destination_mood_id: "serenity",
        name: "Route B",
        rationale: "b",
        status: "published",
      },
    ];
    const recs: ExploreRecommendation[] = [
      { id: "j-a--r1", resource_id: "r1", journey_id: "j-a", tempo: "quick", rationale: "via A", priority: 3 },
      { id: "j-b--r1", resource_id: "r1", journey_id: "j-b", tempo: "steady", rationale: "via B", priority: 1 },
    ];
    const res = [{ id: "r1", type: "book" }];

    const rows = buildLeafEntries("fear", "book", twoJourneys, recs, res);
    expect(rows).toHaveLength(1);
    expect(rows[0].recId).toBe("j-b--r1");
    expect(rows[0].journeyName).toBe("Route B");
    expect(rows[0].priority).toBe(1);
  });

  it("orders by priority then rec id, against the real catalog", () => {
    for (const m of moods) {
      for (const type of RESOURCE_TYPES) {
        const rows = buildLeafEntries(m.id, type, journeys, recommendations, resources);
        for (let i = 1; i < rows.length; i++) {
          const prev = rows[i - 1];
          const cur = rows[i];
          const ordered =
            prev.priority < cur.priority ||
            (prev.priority === cur.priority && prev.recId < cur.recId);
          expect(ordered).toBe(true);
        }
        for (const row of rows) {
          expect(row.resource.type).toBe(type);
          expect(row.journeyName.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("deriveExploreNext", () => {
  it("returns at most 3 chips, journey-derived, never self, each with a rationale", () => {
    for (const m of moods) {
      const chips = deriveExploreNext(m.id, journeys, moods);
      expect(chips.length).toBeLessThanOrEqual(3);
      for (const chip of chips) {
        expect(chip.destinationMoodId).not.toBe(m.id);
        expect(chip.rationale.length).toBeGreaterThan(0);
        const journey = journeys.find((j) => j.id === chip.journeyId);
        expect(journey).toBeDefined();
        expect(journey!.status).toBe("published");
        expect(journey!.starting_mood_id).toBe(m.id);
        expect(moods.some((mo) => mo.id === chip.destinationMoodId)).toBe(true);
      }
    }
  });

  it("resolves destination labels from the mood list", () => {
    const chips = deriveExploreNext("fear", journeys, moods);
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      const mood = moods.find((m) => m.id === chip.destinationMoodId);
      expect(chip.destinationLabel).toBe(mood!.label);
    }
  });
});

describe("exploreHref", () => {
  it("appends ?q= only when there is a query, encoded", () => {
    expect(exploreHref("/explore/")).toBe("/explore/");
    expect(exploreHref("/explore/", "")).toBe("/explore/");
    expect(exploreHref("/explore/", "  ")).toBe("/explore/");
    expect(exploreHref("/explore/fear/", "anxious")).toBe("/explore/fear/?q=anxious");
    expect(exploreHref("/explore/", "burnt out")).toBe("/explore/?q=burnt%20out");
  });
});
