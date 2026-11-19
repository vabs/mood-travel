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

## UI — neutral Mood Atlas

The approved production direction is the refined Mood Atlas, shipped in the
actual Astro routes. Both exploratory prototype directories have been removed.

**Home.** A neutral, spatial arrangement of eight labeled mood-family circles
sits beside “How are you feeling?”, free-text search, and common feeling
shortcuts. Circles use the same neutral fill; restrained sage indicates hover
and keyboard focus. No color ranks feelings as good or bad. On phones the
same links become a stable three-column grid with readable labels and no drift.

**Collection.** Three recommendations introduce the catalog on the home page.
Cards show media type, concrete duration when known, title and creator, with
consistent borders, spacing and links. `/collection/` lists canonical resources
with published placements, without duplicating resources or decorative fake
cover artwork. Each card opens the relevant journey at its resource anchor.

**Search and guided routes.** The existing synonym search and disambiguation
remain available. Common terms and the full `/feelings/` list work as native
links. Guided routes keep their editorial rationales and optional refinements;
no form requires an emotional destination or promises a mood change.

**Explore.** `/explore/` retains the optional all-24-feeling field and search.
Desktop physics is an enhancement only and pauses on narrow viewports, reduced
motion, user pause and hidden pages. The mobile layout is a stable three-column
grid. `/explore/[mood]/` shows the mood, explicit neighboring intensity links,
and circles only for media types with published resources. Uncovered moods
show an honest empty state. Routes are curator-defined, never wheel opposites.

**Resources.** Journey and media pages use readable cards with the title,
creator, journey-specific rationale, time commitment, availability, content
warnings, provenance and one external `Open resource` action. Details are
visible without opening an accordion. Each card has a stable
`#resource-<recommendation-id>` anchor, so collection links lead to a visible
resource and show warnings before leaving the site.

**Navigation and accessibility.** Every state uses real static links under the
GitHub Pages `/mood-travel/` base path. Browser Back/Forward, reload and sharing
work without client routing. Escape and focus restoration enhance Explore
navigation. Native links and forms, skip link, visible keyboard focus, labeled
search, reduced-motion support and meaningful reading order are preserved.
The common header, footer, filters and empty states share the neutral palette.
No prototype switcher or snapshot catalog is shipped.

**Deployment.** The `main` branch runs the GitHub Actions Pages workflow. Source
changes must be integrated into `src/`; pushing standalone mockups does not
change the published UI. Verification includes the Pages run for the pushed
commit and the actual served homepage.

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
