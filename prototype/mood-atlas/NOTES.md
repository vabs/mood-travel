# Throwaway UI prototype

Question: does Mood Atlas's spatial mood discovery work with a quieter, readable collection, compared with a library or a guided journey?

Run from the repository root:

```sh
python3 -m http.server 7394 --bind 127.0.0.1 --directory prototype/mood-atlas
```

Open http://127.0.0.1:7394/?variant=A.

- A: Mood Atlas — mood bubbles, format orbit, readable recommendations, expanded resource.
- B: Quiet Library — browse a collection first, use feelings as entry points.
- C: Small Journey — choose a feeling, a direction, then recommendations.

Switch with the floating bar or left/right arrow keys. Escape moves up a level. Layout selection survives reload via the URL; all other state is in memory. No data is saved. External resource links use actual catalog URLs.

The buildless prototype is deliberately outside `src/`, following the existing `prototype/bubble-mood-ui` convention, to keep production pages untouched. No production imports reference it. `catalog.js` is a read-only snapshot of the current YAML collections; it is not a new storage format. CSS artwork is decorative, not official cover artwork.

Scope limits: only published catalog routes are represented. Empty mood families have explicit empty states. Search demonstrates exact terms and chooses the strongest synonym candidate; production's disambiguation UI is not reproduced. Mood-family and media selection transitions are simplified; this is a layout/interaction study, not the final physics implementation.

First review: user prefers A, with less color, less generic decorative styling, clearer recommendation cards, and an explicit mobile treatment. Revision uses neutral circles and an understated sage accent for active/hover states, removes decorative artwork from recommendation cards, simplifies copy, and gives phones a stable three-column circle grid with stacked recommendation cards. `refined.css` holds the throwaway revision for easy comparison with the first pass.

Verdict: awaiting review of the revised A. Do not promote this code directly to production.
