// Pure, no I/O — same pattern as resolveSearch.ts. Callers pass plain arrays
// with content-collection references already flattened to string ids: Astro
// frontmatter maps `j.data.starting_mood_id.id`, Vitest gets raw YAML strings
// via tests/helpers/loadData.ts. This module only derives what the Explore
// pages render.

export const RESOURCE_TYPES = ['book', 'music', 'movie', 'blog', 'podcast'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const TYPE_LABELS: Record<ResourceType, string> = {
  book: 'Books',
  music: 'Music',
  movie: 'Movies',
  blog: 'Blogs',
  podcast: 'Podcasts',
};

export type Intensity = 'mild' | 'medium' | 'intense';
export type Tempo = 'quick' | 'steady' | 'slow-burn';

export interface ExploreMood {
  id: string;
  wheel_position: number;
  intensity: Intensity;
}

export interface ExploreJourney {
  id: string;
  starting_mood_id: string;
  destination_mood_id: string;
  name: string;
  rationale: string;
  status: 'draft' | 'published';
}

export interface ExploreRecommendation {
  id: string;
  resource_id: string;
  journey_id: string;
  tempo: Tempo;
  rationale: string;
  priority: number;
}

// --- Field layout ---------------------------------------------------------

// Normalized 0–1 coordinates over a field that is twice as wide as it is tall
// (the container enforces FIELD_ASPECT). The bubbles are spread across the
// whole field rather than gathered into one central wheel, so the page reads
// as a drifting field rather than a diagram.
//
// The 8 families get one anchor each on a 4x2 grid of the field; a family's
// three intensities sit in a small triangle around its anchor, so same-family
// bubbles stay together and never share a point (DESIGN.md). Each triangle is
// rotated by a different amount so the grid doesn't read as a grid.
//
// Because x spans twice the pixels y does, a circular arrangement in pixels is
// an ellipse in these coordinates — hence the FIELD_ASPECT factor on the y
// offset. Everything below is expressed as a fraction of the field WIDTH.
//
// Spacing, all in width-fractions (BUBBLE_DIAMETER = --bubble-d in global.css):
//   within a family: triangle chord = FAN_RADIUS * sqrt(3) ≈ 0.107 > 0.095
//   between columns: 0.25 - 2 * (FAN_RADIUS + BUBBLE_DIAMETER/2) ≈ 0.032 clear
//   between rows:    0.24 - 2 * (FAN_RADIUS + BUBBLE_DIAMETER/2) ≈ 0.022 clear
// explore-derivations.test.ts checks every pair of the real 24 moods in pixel
// space, so retuning any constant here reports overlaps instead of hiding them.
export const FIELD_ASPECT = 2;
export const BUBBLE_DIAMETER = 0.095;
const FAN_RADIUS = 0.0618;
const ANCHOR_COLUMNS = [0.125, 0.375, 0.625, 0.875];
const ANCHOR_ROWS = [0.26, 0.74];

export function restPosition(mood: ExploreMood): { x: number; y: number } {
  const slot = mood.wheel_position - 1;
  const anchorX = ANCHOR_COLUMNS[slot % ANCHOR_COLUMNS.length];
  const anchorY = ANCHOR_ROWS[Math.floor(slot / ANCHOR_COLUMNS.length)];

  const corner = { mild: 0, medium: 1, intense: 2 }[mood.intensity];
  // 37° per family is just a number that doesn't divide 120 — it keeps the
  // eight triangles pointing different ways.
  const angle =
    ((slot * 37) * Math.PI) / 180 + (corner * 2 * Math.PI) / 3;

  return {
    x: anchorX + FAN_RADIUS * Math.cos(angle),
    y: anchorY + FAN_RADIUS * FIELD_ASPECT * Math.sin(angle),
  };
}

// --- Catalog derivations ---------------------------------------------------

function publishedJourneysFrom(moodId: string, journeys: ExploreJourney[]): ExploreJourney[] {
  return journeys.filter((j) => j.status === 'published' && j.starting_mood_id === moodId);
}

export interface LeafEntry<R> {
  recId: string;
  journeyId: string;
  journeyName: string;
  tempo: Tempo;
  rationale: string;
  priority: number;
  resource: R;
}

// Ordered rows for one (mood, type) leaf page. One row per resource: when a
// resource is placed on several journeys from this mood (e.g. little-prince on
// both fear journeys), keep the best-priority placement — its rationale and
// journey name frame the row. Ties break on rec id for determinism.
export function buildLeafEntries<R extends { id: string; type: string }>(
  moodId: string,
  type: ResourceType,
  journeys: ExploreJourney[],
  recommendations: ExploreRecommendation[],
  resources: R[],
): LeafEntry<R>[] {
  const journeyById = new Map(publishedJourneysFrom(moodId, journeys).map((j) => [j.id, j]));
  const resourceById = new Map(resources.filter((r) => r.type === type).map((r) => [r.id, r]));

  const best = new Map<string, LeafEntry<R>>();
  for (const rec of recommendations) {
    const journey = journeyById.get(rec.journey_id);
    const resource = resourceById.get(rec.resource_id);
    if (!journey || !resource) continue;
    const existing = best.get(resource.id);
    const wins =
      !existing ||
      rec.priority < existing.priority ||
      (rec.priority === existing.priority && rec.id < existing.recId);
    if (wins) {
      best.set(resource.id, {
        recId: rec.id,
        journeyId: journey.id,
        journeyName: journey.name,
        tempo: rec.tempo,
        rationale: rec.rationale,
        priority: rec.priority,
        resource,
      });
    }
  }

  return [...best.values()].sort(
    (a, b) => a.priority - b.priority || a.recId.localeCompare(b.recId),
  );
}

// Distinct-resource count per type for a mood's ring page. Types with zero
// resources are omitted entirely — DESIGN.md: absent, not dead ends. Counts
// are derived from buildLeafEntries so the badge number always equals the
// leaf page's row count.
export function deriveTypeCounts<R extends { id: string; type: string }>(
  moodId: string,
  journeys: ExploreJourney[],
  recommendations: ExploreRecommendation[],
  resources: R[],
): Partial<Record<ResourceType, number>> {
  const counts: Partial<Record<ResourceType, number>> = {};
  for (const type of RESOURCE_TYPES) {
    const n = buildLeafEntries(moodId, type, journeys, recommendations, resources).length;
    if (n > 0) counts[type] = n;
  }
  return counts;
}

export interface ExploreNextChip {
  journeyId: string;
  name: string;
  rationale: string;
  destinationMoodId: string;
  destinationLabel: string;
}

const MAX_EXPLORE_NEXT = 3;

// "Explore next" chips come ONLY from published journeys starting at this
// mood — never wheel-opposite math, never auto same-family suggestions
// (DESIGN.md: dyad-adjacent/same-family moods are editorial candidates via
// journeys.yaml, not automatic recommendations).
export function deriveExploreNext(
  moodId: string,
  journeys: ExploreJourney[],
  moods: Array<{ id: string; label: string }>,
): ExploreNextChip[] {
  const labelById = new Map(moods.map((m) => [m.id, m.label]));
  return publishedJourneysFrom(moodId, journeys)
    .filter((j) => j.destination_mood_id !== moodId)
    .slice(0, MAX_EXPLORE_NEXT)
    .map((j) => ({
      journeyId: j.id,
      name: j.name,
      rationale: j.rationale,
      destinationMoodId: j.destination_mood_id,
      destinationLabel: labelById.get(j.destination_mood_id) ?? j.destination_mood_id,
    }));
}

// --- URLs -------------------------------------------------------------------

// The only cross-mode state is the search text: append it as ?q= so the
// Explore/Guided toggle never discards what the person typed. Callers wrap
// the path in withBase() themselves.
export function exploreHref(path: string, q?: string | null): string {
  const query = q?.trim();
  if (!query) return path;
  return `${path}?q=${encodeURIComponent(query)}`;
}
