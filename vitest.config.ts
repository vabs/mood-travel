import { defineConfig } from 'vitest/config';

// Deliberately plain (not Astro's getViteConfig): Astro's Content Layer API
// needs a real sync/dev-server pass to populate its data store, which
// getViteConfig skips (it's called with `sync: false`) — getCollection()
// returns empty in a standalone Vitest process regardless of what
// `astro build`/`astro sync` already wrote to disk. Content-integrity tests
// read the YAML files directly instead (see tests/helpers/loadData.ts); the
// Zod schemas themselves are already validated by `astro build`/`astro sync`.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
