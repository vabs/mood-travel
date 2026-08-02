import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { CONTENT_WARNING_IDS } from './lib/content-warnings';

// data/ lives at the repo root (not under src/) to match DESIGN.md's literal
// paths and keep a future CODEOWNERS rule on /data/** clean. file()'s
// fileName is resolved relative to the project root, so these are plain
// strings, not import.meta.url-relative URLs.

const SLUG = /^[a-z][a-z0-9-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://'), 'must be an https:// URL');

const MOOD_FAMILIES = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
] as const;

const moods = defineCollection({
  loader: file('data/moods.yaml'),
  schema: z.object({
    id: z.string().regex(SLUG),
    label: z.string().min(1),
    family: z.enum(MOOD_FAMILIES),
    intensity: z.enum(['mild', 'medium', 'intense']),
    // Shared by all 3 intensities within a family; opposite pairs sit 4 apart
    // on the 8-point wheel (see DESIGN.md's 4 stated opposite pairs).
    wheel_position: z.number().int().min(1).max(8),
    // Text-equivalent cue only — never the sole signal for anything in the UI.
    valence: z.enum(['pleasant', 'unpleasant', 'neutral']),
    short_description: z.string().min(1),
  }),
});

const synonyms = defineCollection({
  loader: file('data/synonyms.yaml'),
  schema: z.object({
    term: z
      .string()
      .min(1)
      .refine((t) => t === t.trim().toLowerCase(), 'term must be pre-normalized (trimmed, lowercase)'),
    // Shown as a shortcut on the empty-search home state.
    featured: z.boolean().default(false),
    candidates: z
      .array(
        z.object({
          mood_id: reference('moods'),
          confidence: z.number().min(0).max(1),
        }),
      )
      .min(1),
  }),
});

const journeys = defineCollection({
  loader: file('data/journeys.yaml'),
  schema: z.object({
    id: z.string().regex(SLUG),
    starting_mood_id: reference('moods'),
    destination_mood_id: reference('moods'),
    name: z.string().min(1),
    rationale: z.string().min(1),
    manageable_feelings: z.array(z.enum(['calm', 'connection', 'distraction', 'reflection'])).min(1),
    status: z.enum(['draft', 'published']),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '*.yaml', base: 'data/resources' }),
  schema: z.object({
    id: z.string().regex(SLUG),
    type: z.enum(['book', 'music', 'movie', 'blog', 'podcast']),
    title: z.string().min(1),
    creator: z.string().min(1),
    canonical_url: httpsUrl,
    language: z.literal('en'),
    time_to_start: z.string().min(1),
    duration: z.string().min(1).optional(),
    availability: z.enum(['free', 'paid', 'mixed', 'unknown']),
    content_warnings: z.array(z.enum(CONTENT_WARNING_IDS)).default([]),
    source_url: httpsUrl.optional(),
    last_checked: z
      .string()
      .regex(ISO_DATE)
      .refine((d) => !Number.isNaN(Date.parse(d)), 'must be a valid calendar date'),
    contributor: z.string().min(1),
    notes: z.string().optional(),
  }),
});

const recommendations = defineCollection({
  loader: glob({ pattern: '*.yaml', base: 'data/recommendations' }),
  schema: z.object({
    id: z.string().regex(SLUG),
    resource_id: reference('resources'),
    journey_id: reference('journeys'),
    tempo: z.enum(['quick', 'steady', 'slow-burn']),
    rationale: z.string().min(1),
    priority: z.number().int().positive(),
  }),
});

export const collections = { moods, synonyms, journeys, resources, recommendations };
