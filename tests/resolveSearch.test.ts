import { describe, expect, it } from "vitest";
import { resolveSearch, type SearchableMood, type SearchableSynonym } from "../src/lib/resolveSearch";

// Synthetic fixtures, independent of the real seed data, so these tests keep
// testing the algorithm even if the catalog changes.
const moods: SearchableMood[] = [
  { id: "fear", label: "Fear" },
  { id: "apprehension", label: "Apprehension" },
  { id: "rage", label: "Rage" },
  { id: "sadness", label: "Sadness" },
];

const synonyms: SearchableSynonym[] = [
  {
    term: "anxious",
    candidates: [
      { moodId: "fear", confidence: 0.92 },
      { moodId: "apprehension", confidence: 0.55 },
    ],
  },
  {
    term: "afraid",
    candidates: [{ moodId: "apprehension", confidence: 0.8 }],
  },
  {
    term: "empty",
    candidates: [
      { moodId: "sadness", confidence: 0.55 },
      { moodId: "apprehension", confidence: 0.5 },
    ],
  },
];

describe("resolveSearch", () => {
  it("returns empty state for blank input", () => {
    expect(resolveSearch("", moods, synonyms)).toEqual({ state: "empty" });
    expect(resolveSearch("   ", moods, synonyms)).toEqual({ state: "empty" });
  });

  it("resolves an exact synonym term with a clear winner to 'exact'", () => {
    const result = resolveSearch("anxious", moods, synonyms);
    expect(result).toEqual({ state: "exact", query: "anxious", moodId: "fear" });
  });

  it("resolves a bare mood label/id to 'exact' at full confidence", () => {
    expect(resolveSearch("fear", moods, synonyms)).toEqual({ state: "exact", query: "fear", moodId: "fear" });
    expect(resolveSearch("Rage", moods, synonyms)).toEqual({ state: "exact", query: "rage", moodId: "rage" });
  });

  it("falls back to 'candidates' when top confidence is below the exact threshold", () => {
    const result = resolveSearch("empty", moods, synonyms);
    expect(result.state).toBe("candidates");
    if (result.state === "candidates") {
      expect(result.candidates.map((c) => c.moodId)).toEqual(
        expect.arrayContaining(["sadness", "apprehension"]),
      );
    }
  });

  it("does not confuse a substring match with a prefix match (regression)", () => {
    // "ra" is a substring of "afraid" but not a prefix of it — the old
    // Explore-mode bug matched Fear via "afraid".includes("ra"). Prefix-only
    // matching means "ra" should match "Rage" (label starts with "ra") and
    // must NOT pull in "afraid"'s mood (apprehension) at all.
    const result = resolveSearch("ra", moods, synonyms);
    expect(result.state).toBe("candidates");
    if (result.state === "candidates") {
      const ids = result.candidates.map((c) => c.moodId);
      expect(ids).toContain("rage");
      expect(ids).not.toContain("apprehension");
    }
  });

  it("returns no-match when nothing scores at all", () => {
    expect(resolveSearch("banana", moods, synonyms)).toEqual({ state: "no-match", query: "banana" });
  });

  it("never includes a candidate below the candidate floor", () => {
    const lowConfidenceSynonyms: SearchableSynonym[] = [
      {
        term: "meh",
        candidates: [
          { moodId: "sadness", confidence: 0.5 },
          { moodId: "apprehension", confidence: 0.1 },
        ],
      },
    ];
    const result = resolveSearch("meh", moods, lowConfidenceSynonyms);
    expect(result.state).toBe("candidates");
    if (result.state === "candidates") {
      expect(result.candidates.map((c) => c.moodId)).not.toContain("apprehension");
    }
  });
});
