// Controlled vocabulary for resource content warnings. Deliberately a plain
// const, not a 6th content collection — DESIGN.md's data model names exactly
// 5 collections (moods, synonyms, journeys, resources, recommendations).
export const CONTENT_WARNINGS = [
  { id: 'grief-and-loss', label: 'Grief and loss' },
  { id: 'violence', label: 'Violence' },
  { id: 'substance-use', label: 'Substance use' },
  { id: 'self-harm-or-suicide', label: 'Self-harm or suicide' },
  { id: 'sexual-content', label: 'Sexual content' },
  { id: 'domestic-or-relationship-abuse', label: 'Domestic or relationship abuse' },
  { id: 'medical-trauma', label: 'Medical trauma' },
  { id: 'discrimination-or-hate', label: 'Discrimination or hate' },
  { id: 'war-and-conflict', label: 'War and conflict' },
  { id: 'animal-harm', label: 'Animal harm' },
] as const;

export type ContentWarningId = (typeof CONTENT_WARNINGS)[number]['id'];

export const CONTENT_WARNING_IDS = CONTENT_WARNINGS.map((w) => w.id) as [
  ContentWarningId,
  ...ContentWarningId[],
];

export function contentWarningLabel(id: string): string {
  return CONTENT_WARNINGS.find((w) => w.id === id)?.label ?? id;
}
