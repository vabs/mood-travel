import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadYamlObjectMap(relPath: string): any[] {
  const raw = readFileSync(join(ROOT, relPath), 'utf-8');
  return Object.values(load(raw) as Record<string, unknown>);
}

function loadYamlDir(relDir: string): any[] {
  const dirPath = join(ROOT, relDir);
  return readdirSync(dirPath)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => load(readFileSync(join(dirPath, f), 'utf-8')));
}

export const loadMoods = () => loadYamlObjectMap('data/moods.yaml');
export const loadSynonyms = () => loadYamlObjectMap('data/synonyms.yaml');
export const loadJourneys = () => loadYamlObjectMap('data/journeys.yaml');
export const loadResources = () => loadYamlDir('data/resources');
export const loadRecommendations = () => loadYamlDir('data/recommendations');
