# Production Mood Atlas Implementation Plan

> **For agentic workers:** Implement inline; the user has approved the neutral Variant A and explicitly requested updating GitHub Pages and removing all prototypes.

**Goal:** Ship the approved neutral Mood Atlas in the actual Astro site and remove both prototype directories.

**Architecture:** Keep Astro's static routes and validated YAML content. A shared mood atlas and resource preview component render real internal links; the existing guided search, filter scripts, and accessible navigation remain intact. All URLs use `withBase` for GitHub Pages.

**Tech Stack:** Astro, TypeScript, plain CSS, YAML, GitHub Actions/Pages.

**Spec:** User-approved refined Variant A; existing `DESIGN.md` product and accessibility boundaries.

## Global Constraints

- Neutral circles, restrained sage hover/selection, no artificial decorative artwork.
- Stable three-column mood grid on mobile; desktop spatial mood layout.
- Use existing catalog data, warnings, attribution, availability and editorial rationale.
- Keep no-JavaScript links and forms usable; preserve ambiguous-search choices.
- Remove all tracked prototype files. Do not modify local Serena configuration.

## Review Focus

- GitHub Pages subpath: internal links and search fetches must retain `/mood-travel/`.
- Small phones: no horizontal scrolling or overlapping mood labels/cards at 320px and 390px.
- Uncovered mood intensities: clear empty state and explicit neighboring feeling links.
- Recommendation links: land on visible resources; warnings precede external navigation.
- Deployment: verify the Actions run for the pushed commit and the served homepage, not only a local preview.

### Task 1: Production homepage and shared presentation

- [ ] Add server-rendered shared MoodAtlas and ResourcePreview components; build the homepage from the live collections.
- [ ] Update BaseLayout and compact SearchForm; add a collection route with actual catalog previews.
- [ ] Replace the stylesheet with the approved neutral design, including mood, journey, resource, filter, empty and mobile states.
- [ ] Preserve existing data attributes and scripts; show resource details and warning metadata in readable cards.
- [ ] Run `npm test` and `npm run build`; inspect homepage, search, mood/type/route navigation and warnings in the browser.

### Task 2: Cleanup and deploy

- [ ] Remove both tracked prototype directories and update DESIGN.md with the shipped UI decision.
- [ ] Check rendered static internal links and responsive widths; inspect the final diff.
- [ ] Commit and push to `main` as authorized; verify Actions and the actual GitHub Pages URL.

## Progress

- Initial scope confirmed from the user's explicit request; production content additions already present in commit `a8fcc19`.
