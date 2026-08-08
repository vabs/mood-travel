# mood-travel Content Research Catalog

## Purpose

This document is the editorial research ledger for mood-travel's public
catalog. It records candidate resources and the distinct, non-clinical routes
on which they may appear. A placement means only that a maintainer judged a
work potentially fitting for a route; it does not claim that the work treats,
improves, or predictably changes a person's mental health or mood.

## Coverage target

The fixed taxonomy has 24 mood nodes, five media categories, and a minimum of
ten recommendation placements for each `mood x category` combination: 1,200
placements in total. Placements may reuse a canonical resource only when the
route rationale is materially different.

The current interactive prototype contains only twelve nodes. This catalog uses
the complete Plutchik intensity set below; implementation must update the
prototype taxonomy rather than silently dropping the other twelve.

| Family | Low intensity | Primary | High intensity |
| --- | --- | --- | --- |
| Joy | Serenity | Joy | Ecstasy |
| Trust | Acceptance | Trust | Admiration |
| Fear | Apprehension | Fear | Terror |
| Surprise | Distraction | Surprise | Amazement |
| Sadness | Pensiveness | Sadness | Grief |
| Disgust | Boredom | Disgust | Loathing |
| Anger | Annoyance | Anger | Rage |
| Anticipation | Interest | Anticipation | Vigilance |

Categories: books, music, movies, blogs/articles, and podcasts.

## Editorial rules

- Count placements, not invented uniqueness. A canonical resource may appear
  in no more than three mood placements by default and only once within a
  `mood x category` set. Exceptions require maintainer review.
- Each placement needs a mood-specific route rationale, concrete time/format
  details, content warnings where appropriate, a canonical resource URL, and a
  discovery source URL.
- No category quota justifies a weak, broken, unsafe, duplicate, undisclosed
  commercial, or unverified recommendation. Mark an under-covered cell as
  `needs research` rather than padding it.
- Seek variety in creator, culture, geography, language, cost, length,
  accessibility, and emotional tone. Do not turn the catalog into a narrow
  list of English-language commercial recommendations.
- Medical, therapy, self-help, trauma, grief, addiction, and crisis material
  require extra scrutiny. Content warnings and the product's safety boundaries
  apply before a resource is linked.
- Blog and podcast recommendations must name a specific article or episode,
  not merely an entire publication or show, unless the resource is explicitly
  an introductory series.

## Evidence standard

Every candidate must be checked against a canonical publisher, creator,
platform, or library/catalog page before it can become verified. Editorial
discovery may begin from reputable reading lists, cultural criticism,
public-library lists, or trusted journalism, but a search-result snippet is
never sufficient publication evidence.

Use this record format when adding entries:

```yaml
resource:
  id: <stable slug>
  category: book | music | movie | blog | podcast
  title: <title>
  creator: <creator>
  canonical_url: <publisher, creator, or stable platform URL>
  discovery_source_url: <source that led to the candidate>
  language: <BCP-47 tag>
  time_to_start: <e.g. 5 minutes, one track, one film>
  duration: <optional>
  availability: free | paid | mixed | unknown
  content_warnings: [<controlled warning ids>]
  checked_on: <YYYY-MM-DD>
placement:
  mood: <mood id>
  route: <journey id>
  rationale: <specific, non-clinical editorial rationale>
  tempo: quick | steady | slow-burn
  review_status: candidate | verified | published | rejected
```

## Source ledger

| Source | Use | Reliability boundary |
| --- | --- | --- |
| [Open Library Search API](https://openlibrary.org/dev/docs/api/search) | Verify book title, author, edition metadata | Discovery/catalog metadata only; not a quality endorsement |
| [Google Books API](https://developers.google.com/books/docs/v1/using) | Verify publisher metadata and canonical book records | Discovery/catalog metadata only |
| [Apple Search API](https://performance-partners.apple.com/search-api) | Verify music and podcast titles, creators, and platform records | Platform metadata only; availability may vary by region |
| [The Movie Database API](https://developer.themoviedb.org/docs/getting-started) | Verify film title, creator, release metadata, and canonical records | Discovery/catalog metadata only |
| [Internet Archive](https://archive.org/developers/internetarchive/) | Find public-domain/free cultural works and metadata | Confirm rights and availability before publication |
| [Greater Good Magazine](https://greatergood.berkeley.edu/) | Discover evidence-informed reflection articles and practices | Articles are not individual treatment advice |
| [NPR Books](https://www.npr.org/books/) and [NPR Music](https://www.npr.org/music/) | Discover culturally diverse editorial recommendations | Confirm item metadata on canonical pages |
| [Public library reading lists](https://www.nypl.org/books-music-movies/recommendations) | Discover books and films through librarian curation | Confirm each item and current availability |

## Research workflow

1. Gather candidates by category from the source ledger and record canonical
   metadata first.
2. Check the actual work/article/episode description and safety concerns.
3. Add one or more placement records only with a distinct route rationale.
4. Run duplicate, source, warning, language, and per-resource placement-cap
   checks.
5. Have a maintainer approve `verified` entries before public publication.

## Coverage dashboard

The catalog must track this matrix in machine-readable data. Do not represent a
cell as complete until it contains ten verified placements.

| Mood | Books | Music | Movies | Blogs/articles | Podcasts |
| --- | ---: | ---: | ---: | ---: | ---: |
| Serenity | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Joy | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Ecstasy | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Acceptance | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Trust | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Admiration | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Apprehension | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Fear | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Terror | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Distraction | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Surprise | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Amazement | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Pensiveness | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Sadness | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Grief | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Boredom | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Disgust | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Loathing | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Annoyance | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Anger | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Rage | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Interest | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Anticipation | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |
| Vigilance | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified | 10 candidate / 0 verified |

## Family research ledgers

The 1,200 placements are organised into reviewable family files. Each canonical
resource row has three intensity-specific route rationales, so it counts as
three candidate placements while remaining within the default three-placement
reuse cap. These are candidate records only: `0 / 1,200` placements are
verified or publishable until the verification workflow is complete.

| Ledger | Families | Candidate placements |
| --- | --- | ---: |
| [Joy and Trust](research/joy-trust-catalog.md) | Serenity, Joy, Ecstasy; Acceptance, Trust, Admiration | 300 |
| [Fear and Surprise](research/fear-surprise-catalog.md) | Apprehension, Fear, Terror; Distraction, Surprise, Amazement | 300 |
| [Sadness and Disgust](research/sadness-disgust-catalog.md) | Pensiveness, Sadness, Grief; Boredom, Disgust, Loathing | 300 |
| [Anger](research/anger-catalog.md) | Annoyance, Anger, Rage | 150 |
| [Anticipation](research/anticipation-catalog.md) | Interest, Anticipation, Vigilance | 150 |
