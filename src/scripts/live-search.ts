import { resolveSearch, type SearchableMood, type SearchableSynonym, type SearchResult } from "../lib/resolveSearch";
import { withBase } from "../lib/site";

interface SearchIndex {
  moods: SearchableMood[];
  synonyms: SearchableSynonym[];
}

// Progressive enhancement over the prerendered /feeling/[term]/ pages. Typing
// alone never navigates (WCAG 3.2.2 — no context change from mere input);
// an exact match navigates only on an explicit Enter/submit. Candidates never
// auto-navigate at all — the person must click a specific option.
export function initLiveSearch(): void {
  const form = document.querySelector<HTMLFormElement>(".search-form");
  const input = document.getElementById("feeling-search") as HTMLInputElement | null;
  const resultsEl = document.getElementById("live-results");
  if (!form || !input || !resultsEl) return;

  let index: SearchIndex | null = null;
  let latestResult: SearchResult = { state: "empty" };
  let debounceHandle: ReturnType<typeof setTimeout> | undefined;

  fetch(withBase("/search-index.json"))
    .then((res) => res.json())
    .then((data: SearchIndex) => {
      index = data;
    })
    .catch(() => {
      // Network/parse failure — the form's native GET to /feelings/ still works.
    });

  function render(result: SearchResult, index: SearchIndex) {
    if (!resultsEl) return;
    if (result.state === "empty") {
      resultsEl.innerHTML = "";
      return;
    }
    if (result.state === "exact") {
      const mood = index.moods.find((m) => m.id === result.moodId);
      resultsEl.innerHTML = `<div class="live-result">
        <a href="${withBase(`/feeling/${result.moodId}/`)}">→ Routes for ${mood?.label ?? result.moodId}</a>
      </div>`;
      return;
    }
    if (result.state === "candidates") {
      const items = result.candidates
        .map((c) => {
          const mood = index.moods.find((m) => m.id === c.moodId);
          return `<li><a href="${withBase(`/feeling/${c.moodId}/`)}">${mood?.label ?? c.moodId}</a></li>`;
        })
        .join("");
      resultsEl.innerHTML = `<div class="live-result">
        <p>"${result.query}" could mean a few things — did you mean:</p>
        <ul>${items}</ul>
      </div>`;
      return;
    }
    resultsEl.innerHTML = `<div class="live-result">
      <p>No routes match "${result.query}" yet. <a href="${withBase("/feelings/")}">Browse every feeling</a> instead.</p>
    </div>`;
  }

  input.addEventListener("input", () => {
    if (!index) return;
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => {
      if (!index) return;
      latestResult = resolveSearch(input.value, index.moods, index.synonyms);
      render(latestResult, index);
    }, 150);
  });

  form.addEventListener("submit", (event) => {
    if (!index) return; // no JS index yet — fall back to the native GET
    if (latestResult.state === "exact") {
      event.preventDefault();
      window.location.href = withBase(`/feeling/${latestResult.moodId}/`);
    } else if (latestResult.state === "candidates") {
      // Never auto-navigate on an uncertain match — keep the disambiguation
      // list on screen and let the person click a specific option.
      event.preventDefault();
    }
    // 'empty' / 'no-match': let the native submission proceed to /feelings/.
  });
}
