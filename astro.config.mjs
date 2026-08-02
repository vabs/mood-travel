import { defineConfig } from 'astro/config';

// Static, no adapter — see DESIGN.md's UI section: the guided picker is the
// complete no-JavaScript baseline, so the whole site prerenders. Live search
// is a client-side enhancement over prerendered pages, not a server feature.
export default defineConfig({
  output: 'static',
});
