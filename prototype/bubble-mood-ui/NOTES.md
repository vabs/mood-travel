# Prototype: bubble-field mood UI

**Question**: does a floating-bubble field + zoom-into-bubble metaphor feel
right for mood navigation? Which search-motion, zoom-transition, and
exit-mechanism works best?

**Plan**: three structurally different variants on one throwaway page,
switchable via `?variant=A|B|C` or the bottom-center bar. Run by opening
`index.html` directly in a browser — no build step.

## Variants

- **A — Physics field**: bubbles drift/repel continuously (custom rAF
  physics, no library). Typing pulls the matched bubble to center and
  enlarges it while others shrink/fade toward the edges. Click zooms the
  whole viewport into the bubble (CSS `transform: scale()` from the click
  point). Exit = fixed "← Back to field" button.
- **B — Clustered grid**: bubbles sit at fixed, family-clustered positions
  with a subtle CSS `@keyframes float` bob (no JS animation loop). Typing
  lifts the matched bubble into a "spotlight" strip below the search bar
  while the field dims. Click opens a lightbox (fade+scale overlay). Exit =
  click the dimmed backdrop *or* a corner `×` (testing both).
- **C — Orbiting constellation**: bubbles slowly orbit their family's
  centroid; each negative mood is tethered by a dashed line to its
  (placeholder) positive counterpart, visible at all times. Typing makes
  the matched bubble glow in place (no fading/repositioning of others —
  most ambient of the three). Click zooms in; exit = breadcrumb trail
  (`Field › Fear › Trust › …`), and explore-next chips let you jump
  mood-to-mood without fully exiting.

All three share the same zoomed-in content feed: single mixed list of
dummy book/music/movie/blog/podcast cards, filterable by type and tempo
(quick/steady/slow-burn) — that part was already decided, not under test
here.

## Known simplification (flagged, not fixed here)

Plutchik's actual wheel-opposite pairs are joy↔sadness, trust↔disgust,
fear↔anger, anticipation↔surprise. Only the first two are a clean
negative→positive flip — fear's real opposite is anger (also negative),
and anticipation/surprise are closer to neutral than positive/negative.
The `counterpart` field in this prototype's dummy data is a placeholder
(fear→trust, anger→joy, sadness→joy, disgust→trust) chosen to make the
demo *feel* right, not a fix for that mismatch. Needs resolving in
`DESIGN.md` / the real data model before entries are actually authored —
e.g. map each negative mood to whichever positive mood empirically works
best, rather than assuming the strict wheel-opposite is always positive.

## Verdict — round 1

**Variant A (physics field) won.** B and C dropped. Feedback that drove round 2:
bubbles too small; a real bug where searching "ra" highlighted "Fear" (synonym
substring match — "afraid" contains "ra"); the click-to-open content-feed panel
broke the bubble metaphor and needed rethinking.

## Round 2 — nested bubbles

- Bubbles enlarged (140px / 165px intense, up from 90/112). Also fixed an
  overlap bug found while doing this: same-family bubbles (e.g. Fear + Terror)
  were both targeting the exact same rest coordinate — now offset around
  their family centroid so they don't stack.
- Search bug fixed: `resolveSearch` rewritten from "does any synonym contain
  this substring" to a prefix-scored match (exact > label-prefix >
  synonym-prefix). "ra" now correctly resolves to "Rage", not "Fear".
- Clicking a mood bubble no longer opens a card panel. It opens a small ring
  of 5 type bubbles (Book/Music/Movie/Blog/Podcast) tethered to the enlarged
  mood bubble at center — same bubble language carried inward, per feedback
  ("similar to bubbles the UI should follow").
- Clicking a type bubble opens the actual content. **How to display that
  content was unresolved**, so 3 switchable ideas are implemented — flip via
  the bottom bar or ←/→ (only shown once a type bubble is open):
  1. **Orbiting item-bubbles + popover** — entries are bubbles too (sized by
     tempo: quick=small, slow-burn=large), click reveals a small detail card
     next to it. Fully continues the bubble metaphor down to the leaf.
  2. **Shelf / list** — plain scannable list, tempo shown as a tag.
     Deliberately breaks the bubble metaphor here — a list just reads better
     once you're at 3+ items of actual text content.
  3. **Accordion rows** — list-like, but click-to-reveal is preserved
     (row expands in place instead of navigating further).
- ESC now pops one nav level (leaf → ring → field); same action as the back
  button, whose label changes contextually ("← Back to field" / "← Back to
  {mood}").

## Verdict — round 2

**Idea 1 (orbiting item-bubbles) won.** Shelf/list and accordion dropped.
Feedback: the click-to-reveal popover didn't fit — needed a different way to
show item detail. Also: bubbles should react on mouse hover, everywhere.

## Round 3 — recursive expand + hover

- Popover replaced with a recursive zoom: clicking an item-bubble morphs
  that same element into a larger rounded shape centered in the leaf stage,
  showing its own title/tempo/note inline. Siblings shrink and fade outward.
  Same grammar already used for mood → ring (click bubble, it centers/
  enlarges, reveals what's inside) — now one level deeper. Click it again,
  click empty space, or ESC collapses it back to the ring of items.
- ESC / back button now "step back" one level at a time: collapse an
  expanded item first if one's open, then pop leaf → ring → field.
- Hover reactions added to every bubble (field, type-bubble, item-bubble):
  scale up + brighten. Implementation snag worth knowing about: field
  bubbles have position/scale rewritten every animation frame via inline
  styles, and inline styles always beat a stylesheet rule for the same
  property — even a `:hover` one. A plain CSS hover rule would've been
  silently overwritten 60x/second. Fixed by driving position/scale through
  CSS custom properties (`--tx`/`--ty`/`--s`) instead of inline `transform`,
  so the actual `transform` property only ever lives in the stylesheet and
  `:hover` can cascade over the base rule normally. Applied the same pattern
  to type-bubbles and item-bubbles for consistency.

## Verdict — round 3

_(fill in once reviewed)_
