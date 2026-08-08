// Navigation conveniences for the Explore ring and leaf pages.
//
// Every depth here is a real page, so back/forward, reload, sharing and
// history are the browser's job — this script never touches history. It only
// adds two things the browser can't infer: an Escape shortcut that steps back
// exactly one level, and focus restoration when returning to a page you left
// by clicking something.

import { exploreHref } from "../lib/explore";

const REFOCUS_PREFIX = "explore:refocus:";

function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null; // Private mode — focus restoration is a nicety, not a gate.
  }
}

function writeSession(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore.
  }
}

export function initExploreNav(): void {
  carryQueryOntoLinks();
  restoreFocus();
  rememberFocusOnLeave();
  bindEscape();
}

// The field has a search box that consumes ?q=; the ring and leaf don't, so
// they just pass it along on the links that lead back there. Links whose
// destination has no use for the query (the guided mood page, which already
// carries the resolved mood in its path) are left alone.
function carryQueryOntoLinks(): void {
  const q = new URLSearchParams(window.location.search).get("q");
  if (!q) return;
  const back = document.querySelector<HTMLAnchorElement>(".explore-back");
  if (back) back.href = exploreHref(back.getAttribute("href")!, q);
  for (const link of document.querySelectorAll<HTMLAnchorElement>(".type-bubble")) {
    link.href = exploreHref(link.getAttribute("href")!, q);
  }
}

// Focus lands back on whatever you clicked to leave this page. Keyed by the
// path being left, so a forward navigation never steals focus — the key only
// exists for a page you have already been on and clicked away from.
function restoreFocus(): void {
  const key = REFOCUS_PREFIX + window.location.pathname;
  const id = readSession(key);
  if (!id) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore.
  }
  const target = document.querySelector<HTMLElement>(
    `[data-mood-id="${CSS.escape(id)}"], [data-type="${CSS.escape(id)}"]`,
  );
  target?.focus();
}

function rememberFocusOnLeave(): void {
  document.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest<HTMLElement>(
      "[data-mood-id], [data-type]",
    );
    if (!link) return;
    const id = link.dataset.moodId ?? link.dataset.type;
    if (id) writeSession(REFOCUS_PREFIX + window.location.pathname, id);

    // Hand this one bubble the shared transition name so the browser morphs it
    // into the next page's ring centre (.ring-center owns the same name). The
    // name has to be unique per document, which is why it's set on click
    // rather than rendered onto all 24 bubbles.
    if (link.dataset.moodId) link.style.viewTransitionName = "mood-portal";
  });
}

// Escape steps back exactly one level: collapse an open disclosure first,
// otherwise follow the visible "Back to ..." link. Never history.back() — a
// person who arrived here from a shared link would be thrown off the site.
function bindEscape(): void {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;

    const active = document.activeElement;
    const openDetails =
      (active instanceof Element ? active.closest("details[open]") : null) ??
      document.querySelector("details[open]");
    if (openDetails instanceof HTMLDetailsElement) {
      openDetails.open = false;
      openDetails.querySelector("summary")?.focus();
      return;
    }

    const back = document.querySelector<HTMLAnchorElement>(".explore-back");
    if (back) back.click();
  });
}
