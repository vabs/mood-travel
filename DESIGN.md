# mood-travel — Design Doc

## Concept

User picks or searches for a feeling. The app recommends books, music,
movies, blogs, and podcasts placed on curator-defined mood journeys. A person
can explore related moods and routes rather than being funnelled toward a
supposedly universal "positive" endpoint.

Static site, open source, community-contributed content.

### Product boundaries and safety

Mood-travel is a discovery and reflection tool, not mental-health treatment,
diagnosis, or crisis support. Copy must not promise that a recommendation will
change a person's mood. Use language such as "may fit how you are feeling" and
"curated routes to explore," never clinical claims or guaranteed outcomes.

- A persistent, unobtrusive `Need immediate support?` link opens a small
  location selector and links to recognised emergency/crisis resources. It
  never attempts to assess risk or collect sensitive information.
- Every resource can carry content warnings (for example grief, violence,
  substance use, or explicit material); warnings are shown before an external
  link is opened.
- The initial product is English-language and does not infer a user's locale,
  identity, or mental-health status. Locale-specific crisis links and
  multilingual search are explicit future additions, not accidental promises.
- No accounts, mood histories, or personal recommendations are stored. Any
  optional analytics must be aggregate, privacy-preserving, documented, and
  disabled until a maintainer deliberately enables it.

## Stack

- **Astro** — static site generator. Content-heavy, data-driven pages
  (yaml/json collections), islands for interactive bits (mood
  search/graph UI).

## Mood taxonomy — Plutchik's Wheel of Emotion

Backbone instead of inventing a custom mood list.

- 8 primary emotions and 4 structural opposite pairs:
  - joy ↔ sadness
  - trust ↔ disgust
  - fear ↔ anger
  - anticipation ↔ surprise
- Each primary has 3 intensity steps, e.g.:
  - annoyance → anger → rage
  - serenity → joy → ecstasy
- **Dyads** — adjacent primaries blend into a named emotion (e.g.
  joy+trust=love, joy+anticipation=optimism). Used as the related-mood
  browse graph — free structure, no need to hand-invent adjacency.
- Contributors tag content against this fixed framework → consistent
  taxonomy, less bikeshedding on mood names.

**Tradeoff**: real feelings are messier than 24 wheel terms. People
search "anxious," "burnt out," "lonely" — not "fear" or "sadness."

**Fix — synonym layer**: `synonyms.yaml` maps free-text terms to one or more
candidate wheel emotions plus a confidence score (for example
anxious/worried/nervous → fear; lonely/empty → sadness). A high-confidence
match can open directly; otherwise search presents the best candidates and
asks the person to choose. The interface acknowledges the entered term (for
example, `Showing routes related to "anxious"`) and explains the selected
mood in plain language rather than silently replacing it with taxonomy jargon.

Taxonomy is an editorial navigation aid, not a claim that a person's feeling
has one objectively correct label. It must be possible to add a synonym,
adjust its candidates, or remove an inappropriate mapping without changing
the wheel itself.

### Mood journeys, not wheel opposites

Plutchik defines structural opposites, not universally beneficial destinations.
The app therefore never uses a wheel opposite as an automatic recommendation
target. A curated **mood journey** maps a starting mood to one or more
constructive destinations, with a short editorial rationale. For example,
`fear → trust` and `fear → serenity` may both be valid journeys; neither is
presented as universal or medically proven.

Journeys may start from any mood, including a positive or mixed one. This
supports exploration without asserting that a primary emotion is inherently
good or bad. Dyads remain useful as browse adjacency, but they do not define a
recommended outcome by themselves.

## Shift tempo

Each recommendation has a **tempo**: `quick` / `steady` / `slow-burn`. It is
an editorial indication of how much time and attention the resource usually
asks for, not a claim about how quickly it changes a person's mood. Pair it
with concrete `time_to_start` and optional `duration` fields (for example,
`5 minutes` and `42 minutes`) wherever those facts are known.

Tempo is assigned by maintainers using the documented editorial rubric. The
first release does not calculate public effectiveness ratings from contributor
votes. Any future feedback feature needs a separate privacy, anti-abuse, and
methodology design before it can influence ordering.

## Data model

- `data/moods.yaml` — fixed 24-node Plutchik wheel (8 primaries × 3
  intensities), including labels, family, intensity, and display metadata.
- `data/synonyms.yaml` — free-text term → ranked mood candidates. Open for
  contribution, but validated for normalisation, duplicate terms, and valid
  mood IDs.
- `data/journeys.yaml` — curated starting mood → one or more destination
  moods, including a short non-clinical rationale and an editorial status.
- `data/resources/*.yaml` — one canonical file for the work itself:
  ```yaml
  id: <slug>
  type: book | music | movie | blog | podcast
  title: <string>
  creator: <string>
  canonical_url: <https url>
  language: en
  time_to_start: <human-readable duration>
  duration: <human-readable duration, optional>
  availability: free | paid | mixed | unknown
  content_warnings: [<controlled warning id>]
  source_url: <url explaining the work, optional>
  last_checked: <YYYY-MM-DD>
  contributor: <github username>
  notes: <string, optional>
  ```
- `data/recommendations/*.yaml` — a resource's editorial placement on a
  journey; this permits the same work to suit several journeys without
  duplicating its metadata:
  ```yaml
  id: <slug>
  resource_id: <resource id>
  journey_id: <journey id>
  tempo: quick | steady | slow-burn
  rationale: <short editorial explanation>
  priority: <positive integer>
  ```
- JSON Schema validates every collection in CI. Validation also enforces
  unique IDs, references, allowed URL protocols, controlled warning values,
  ISO dates, and resource/recommendation duplication rules.

Resource cards show creator, time commitment, availability, warnings, and
source/provenance. The app discloses that external links leave mood-travel,
does not reproduce copyrighted works, and provides a documented correction or
takedown route.

### Catalog lifecycle

Catalog content needs ongoing care rather than a one-time contribution flow:

- A scheduled CI job checks external URLs and flags redirects, failures, and
  stale `last_checked` dates for maintainer review. A failed check never
  silently republishes a broken recommendation.
- Maintainers have a content policy covering relevance, attribution, unsafe or
  hateful material, explicit content, commercial links, duplicate works, and
  removal requests.
- Launch requires a documented minimum catalog for each public journey. Types
  with no recommendations are not rendered as selectable bubbles; the UI shows
  available counts and useful adjacent routes instead of an empty visual.

## Storage & contribution flow — git-as-DB

Rejected raw GitHub Issues as the data store: no schema enforcement,
can't query at build time without hitting API + rate limits, mixes
moderation state with data.

Instead:

1. Data lives as resources, journeys, and recommendations in versioned,
   diffable, schema-checkable repository files.
2. Non-technical contributors use a **GitHub Issue Form** (structured,
   zero git knowledge needed) to submit a suggestion.
3. A GitHub Action parses the submitted issue and auto-opens a draft PR
   against the appropriate resource and recommendation collections.
4. Maintainer reviews/merges PR → triggers static rebuild + deploy.
5. Technical contributors can skip the issue form and PR data files
   directly.

This is the "issue-ops" pattern (seen in awesome-list / homebrew-style
repos).

### Moderation and automation safeguards

The Issue Form is a submission queue, not publication. It requires the
canonical resource URL, creator, content-warning confirmation, journey choice,
and acknowledgement of the content policy. The automation parses only
structured fields and opens a draft PR; it does not merge, deploy, or execute
contributor-provided code.

- The issue-processing workflow uses least-privilege permissions, no secrets
  exposed to untrusted issue content, idempotent issue labels, and rate-limit /
  duplicate checks.
- Pull-request CI validates schemas, references, URL format, duplicate
  canonical URLs, prohibited text/links, and the static build. Link checks run
  in a separate trusted workflow and report rather than mutate untrusted PRs.
- A CODEOWNERS or documented maintainer review is required for data changes.
  The repository records merge criteria, spam handling, response expectations,
  appeals, and removal/takedown handling.
- Direct data PRs follow the same policy and CI as Issue Form submissions.

## UI — floating bubble field

Validated through 3 rounds of interactive prototyping at
`prototype/bubble-mood-ui/index.html` (throwaway, see its `NOTES.md` for
full history). Settled design:

**Default entry — guided route picker.** The home experience is a calm,
text-first route picker, not the animated field. Its first and only required
prompt is `What feels closest right now?`, answered by free-text search,
common starting terms, or the semantic browse list. Once a person chooses a
feeling, show two or three curator-defined routes with plain-language names,
short rationales, time/attention expectations, and a small preview of their
best resources. A person can open a route immediately without completing a
multi-step wizard.

Optional, dismissible refinements appear after the first answer: `What would
feel manageable?` (for example, calm, connection, distraction, or reflection),
`How much time do you have?`, and media type. They filter and reorder routes;
they never diagnose the person or require a supposedly "positive" goal. Results
are shown as an ordered list with filters, so the fastest path is always
predictable and readable.

Search remains visible throughout the picker and resolves through
`synonyms.yaml` live as a person types. The UI shows an exact match, ranked
suggestions, or a clear no-match state with nearby moods; it never navigates on
an uncertain match.

When the search field is empty, show a small, editorially chosen set of common
starting terms such as `anxious`, `lonely`, and `overwhelmed`. These are
search shortcuts, not diagnostic labels, and they make the first interaction
useful without forcing a person to understand the taxonomy or decode the
floating field.

The static picker and result list are the complete no-JavaScript and
assistive-technology experience. They are also the default on mobile. An
explicit `Explore moods` control switches to the visual field without discarding
the current search or refinements; an equally clear `Guided routes` control
returns to the picker.

**Explore mode — the field.** Every wheel mood (8 primaries + intensity
variants) is a floating bubble, positioned by a lightweight physics sim
(spring-to-a-per-family rest point + small ambient jitter — continuous gentle
drift, not static). It is an optional discovery surface, not a data
visualization or a prerequisite for recommendations: every mood has a visible
text label, and a broad family palette must not imply that an emotion is
objectively good or bad. Valence and intensity always have text equivalents;
colour, size, and motion are supporting cues only. Bubbles belonging to the
same primary (e.g. Fear/Terror) are offset around their family's rest point
rather than sharing one point, so they don't stack.

Typing in the search box re-targets the physics sim live: the matched
bubble is pulled to center and enlarged; everything else is pushed
outward and faded. Matching is **prefix-scored** (exact label/synonym
match, then label-prefix, then synonym-prefix) — deliberately not
substring-anywhere, which produced false positives (e.g. "ra" matching
Fear via the synonym "afraid").

Ambient drift pauses while a person searches, focuses a bubble, or reads a
resource. Zoom, blur, and movement are short, interruptible, and optional;
the list path never depends on them.

Every bubble reacts on hover (scale up + brighten), at every depth
described below. Implementation note for whoever ports this to Astro:
field bubbles have their position/scale rewritten every animation
frame via JS, and an inline style always wins over a stylesheet rule
for the same property — including `:hover` ones — so a plain CSS hover
rule gets silently overwritten 60×/second. Fix: drive position/scale
through CSS custom properties (`--tx`/`--ty`/`--s`) set from JS, and
declare the actual `transform` only in the stylesheet, where `:hover`
can cascade over the base rule normally.

**Click a mood bubble → the ring.** The whole viewport zooms into the
clicked bubble (CSS `transform: scale()` from the click point, +
blur/darken behind). The bubble re-centers, enlarged, and a ring of the
available type bubbles (Books / Music / Movies / Blogs / Podcasts) appears
tethered to it by dashed lines. Each type bubble includes its available result
count; zero-result types are absent rather than acting as dead ends. Also show
at most three contextual `explore next` routes. Each route uses plain language
(for example, `Toward calm` or `Toward connection`) and includes a short
editorial rationale before a person follows it. Dyad-adjacent and same-family
moods are candidate routes, not automatic recommendations.

**Click a type bubble → the leaf.** Zooms further in, then presents an ordered,
scannable resource list as the default reading and comparison surface. The
optional orbiting item-bubble view remains available for visual exploration
when the set is small enough to be useful, but it is never the only way to
inspect resources. Item bubbles use a stable minimum tap target and cannot use
size as the sole signal for tempo or importance.

The list has filters for type, time commitment, availability, language, and
content warnings. Ordering is editorial priority, not an implied measure of
clinical effectiveness. Each row shows creator, concrete time commitment,
availability, tempo as a text label, warnings, and its journey-specific
rationale.

**Click an item bubble → recursive expand.** Rather than a popover (tried
and rejected — didn't fit the metaphor), the clicked bubble itself
morphs in place: grows, its shape eases from a circle toward a rounded
square, and it reveals its own title / tempo / link / note inline.
Sibling bubbles shrink and fade outward to make room. Same interaction
grammar as the mood → ring transition, one level deeper, applied
recursively instead of introducing a new UI primitive per depth. The equivalent
list row expands inline. Both detail treatments present the same information in
the same order: title and creator, why it appears on this route, time and
availability, content warnings, provenance, then one unmistakable `Open
resource` external-link action.

**Exit.** ESC or a contextual "← Back to …" button steps back exactly
one level: collapse an expanded item first if one's open, else pop
leaf → ring → field.

**URL and history.** Every navigable state has a canonical URL (mood, journey,
type, resource, and mode). Browser Back/Forward, reload, direct links, and
sharing restore the same state. ESC remains an in-page convenience and never
breaks browser history.

### Accessibility, responsive behavior, and performance

- Every interactive bubble is a native button or link with a descriptive
  accessible name. Keyboard focus, Enter/Space activation, visible focus
  indicators, logical focus transfer on zoom, and focus restoration on back are
  required. The expanded detail has a readable semantic heading and external
  link label.
- Information is never conveyed by colour, bubble size, hover, or motion alone.
  Tempo, valence, availability, and warnings always have text equivalents.
- `prefers-reduced-motion` disables drift, zoom, and nonessential transitions;
  a visible motion toggle pauses the field for everyone. Touch targets meet the
  project accessibility standard, and hover has an equivalent focus/tap state.
- On small screens the guided route picker/list view is the default, with an
  explicit optional switch to Explore only when it remains usable. The field
  must not hide search, back, crisis support, or focused content under animated
  layers.
- The page ships useful HTML and catalog links before JavaScript. The physics
  island loads only when the enhanced field is selected, respects a defined
  mobile performance budget (no animation work while hidden; no unbounded
  frame loop outside the field; and the initial page JavaScript stays below the
  project-approved gzip budget), and is covered by responsive visual regression
  checks.

Guided route path: `feeling → route choices → ordered resources → expanded
resource`.

Explore path: `field → ring (mood + available type-bubbles) → leaf (ordered
list, optional item-bubbles) → expanded item (inline detail)`.

## Open questions

The following decisions are intentionally deferred because they need evidence
or operational ownership rather than a UI assumption:

- Which initial mood journeys and resource minimums are safe and useful enough
  to publish. A maintainer must approve the first editorial rubric and launch
  catalog.
- Which verified crisis-resource directory supports the initial English-only
  launch, and who owns periodic review of those links.
- Whether anonymous, privacy-preserving feedback should ever affect curation.
  It is out of scope until its methodology, retention, moderation, and abuse
  controls are approved.
- Which maintainers own moderation, link repair, corrections, and takedowns,
  including their response expectations.
- Whether and how to expand language support; adding translated synonyms
  without translated safety, content, and moderation policies is not allowed.

## Delivery and quality gates

Before public launch, CI must validate all data and references, build the
static site, test synonym ranking and uncertain/no-result search states, test
journey selection and unavailable-type behavior, and run automated accessibility
checks. Manual release checks cover keyboard-only navigation, screen-reader
landmarks and announcements, reduced motion, narrow touch viewports, external
link/warning disclosure, deep-link/history restoration, and the no-JavaScript
catalog path.

Each release records catalog coverage, stale/broken-link status, unresolved
moderation items, and the safety-resource review date. A release with a broken
crisis link, unsafe published content, or a failed no-JavaScript journey is
blocked.
