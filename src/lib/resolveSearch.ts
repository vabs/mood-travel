// Pure, no I/O — used identically at build time (prerendering /feeling/[term]/
// for every mood + synonym) and at runtime (the live-search enhancement).
// Callers pass in the already-loaded mood/synonym data; this module only
// decides what a query resolves to.

export type MoodCandidate = { moodId: string; confidence: number };

export type SearchResult =
  | { state: 'empty' }
  | { state: 'exact'; query: string; moodId: string }
  | { state: 'candidates'; query: string; candidates: MoodCandidate[] }
  | { state: 'no-match'; query: string };

export interface SearchableMood {
  id: string;
  label: string;
}

export interface SearchableSynonym {
  term: string;
  candidates: MoodCandidate[];
}

// Top candidate must clear this to auto-resolve...
const EXACT_THRESHOLD = 0.85;
// ...and beat the runner-up by at least this much (or have no runner-up).
const CLEAR_WINNER_MARGIN = 0.15;
// Below this, a candidate is just noise — don't show it in a disambiguation list.
const CANDIDATE_FLOOR = 0.3;

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveSearch(
  raw: string,
  moods: SearchableMood[],
  synonyms: SearchableSynonym[],
): SearchResult {
  const query = normalize(raw);
  if (!query) return { state: 'empty' };
  return decide(query, findCandidates(query, moods, synonyms));
}

function findCandidates(
  query: string,
  moods: SearchableMood[],
  synonyms: SearchableSynonym[],
): MoodCandidate[] {
  // Exact term/label/id match short-circuits to that entry's own candidate set.
  const exactSynonym = synonyms.find((s) => s.term === query);
  if (exactSynonym) return exactSynonym.candidates;

  const exactMood = moods.find((m) => m.id === query || m.label.toLowerCase() === query);
  if (exactMood) return [{ moodId: exactMood.id, confidence: 1 }];

  // Prefix-scored fallback. Deliberately NOT substring-anywhere — that's the
  // exact bug the Explore-mode prototype hit and fixed ("ra" matched Fear via
  // the synonym "afraid" because "afraid".includes("ra") is true anywhere in
  // the word). Prefix-only means a query only matches words that actually
  // start with it.
  const scored = new Map<string, number>();
  const bump = (moodId: string, score: number) => {
    if (score > (scored.get(moodId) ?? 0)) scored.set(moodId, score);
  };

  for (const mood of moods) {
    if (mood.label.toLowerCase().startsWith(query)) bump(mood.id, 0.6);
  }
  for (const synonym of synonyms) {
    if (synonym.term.startsWith(query)) {
      for (const c of synonym.candidates) bump(c.moodId, 0.5 * c.confidence);
    }
  }

  return [...scored.entries()].map(([moodId, confidence]) => ({ moodId, confidence }));
}

function decide(query: string, candidates: MoodCandidate[]): SearchResult {
  if (candidates.length === 0) return { state: 'no-match', query };

  const sorted = [...candidates].sort((a, b) => b.confidence - a.confidence);
  const [top, runnerUp] = sorted;
  const clearWinner = !runnerUp || top.confidence - runnerUp.confidence >= CLEAR_WINNER_MARGIN;

  if (top.confidence >= EXACT_THRESHOLD && clearWinner) {
    return { state: 'exact', query, moodId: top.moodId };
  }

  const shortlist = sorted.filter((c) => c.confidence >= CANDIDATE_FLOOR).slice(0, 5);
  if (shortlist.length > 0) return { state: 'candidates', query, candidates: shortlist };

  return { state: 'no-match', query };
}
