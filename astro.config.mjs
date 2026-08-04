import { defineConfig } from 'astro/config';

// Static, no adapter — see DESIGN.md's UI section: the guided picker is the
// complete no-JavaScript baseline, so the whole site prerenders. Live search
// is a client-side enhancement over prerendered pages, not a server feature.
export default defineConfig({
  output: 'static',
  // GitHub Pages serves a project page (not a vabs.github.io user-page repo)
  // from a /mood-travel/ subpath — every internal link goes through
  // src/lib/site.ts's withBase() to stay correct under this.
  site: 'https://vabs.github.io',
  base: '/mood-travel',
});
