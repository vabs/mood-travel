// The Explore field's physics enhancement — loaded only by /explore/, so no
// other page ships a frame loop.
//
// The bubbles are already server-rendered as links at their rest positions
// (--rx/--ry, set in the page). This script only *offsets* them: it writes
// --tx/--ty/--s and never touches `transform`/`translate` directly, so the
// stylesheet's :hover and :focus-visible rules still cascade normally. Writing
// inline transforms from a frame loop would silently clobber them 60x/second —
// the trap the prototype documented.
//
// If this script never runs, the field is a static, fully navigable set of
// links. Nothing here creates content.

import { BUBBLE_DIAMETER, FIELD_ASPECT, exploreHref } from "../lib/explore";
import { resolveSearch, type SearchResult } from "../lib/resolveSearch";
import { withBase } from "../lib/site";

const SPRING_K = 3;
const DAMPING = 0.9;
const DT = 0.016;
const JITTER = 0.012;
const FOCUS_POINT = { x: 0.5, y: 0.45 };
const FOCUS_SCALE = 1.4;
// How far unmatched bubbles are pushed outward during a search, and the hard
// backstop that keeps them inside the field however that constant is retuned.
// Bubbles escaping the field would cover the search box and back link above
// it, which DESIGN.md forbids. The margins are a shrunken bubble's own radius:
// half a diameter in x, and twice that in y because the field is FIELD_ASPECT
// times wider than tall, so one y unit is worth half an x unit.
const SPREAD = 1.15;
const SHRINK = 0.62;
const EDGE_MARGIN_X = (BUBBLE_DIAMETER / 2) * SHRINK;
const EDGE_MARGIN_Y = EDGE_MARGIN_X * FIELD_ASPECT;
const MOTION_KEY = "mood-travel:explore-motion";
// Below this the field is a wrapped flow layout (see global.css) — offsetting
// statically-positioned bubbles would fight the flow, so the sim stays off.
const FIELD_LAYOUT_MIN_WIDTH = 701;

interface Bubble {
  el: HTMLElement;
  moodId: string;
  baseHref: string;
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

type SearchIndex = {
  moods: { id: string; label: string }[];
  synonyms: { term: string; candidates: { moodId: string; confidence: number }[] }[];
};

export function initExploreField(): void {
  const fieldEl = document.querySelector<HTMLElement>("[data-bubble-field]");
  const input = document.querySelector<HTMLInputElement>("#explore-search-input");
  const status = document.querySelector<HTMLElement>("#explore-search-status");
  const form = document.querySelector<HTMLFormElement>(".explore-search");
  if (!fieldEl) return;
  // Hoisted function declarations below don't see the null-narrowing above.
  const field = fieldEl;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wideEnough = window.matchMedia(`(min-width: ${FIELD_LAYOUT_MIN_WIDTH}px)`);

  const bubbles: Bubble[] = [...field.querySelectorAll<HTMLElement>("[data-mood-id]")].map(
    (el, i) => {
      const restX = parseFloat(el.style.getPropertyValue("--rx")) / 100;
      const restY = parseFloat(el.style.getPropertyValue("--ry")) / 100;
      return {
        el,
        moodId: el.dataset.moodId!,
        baseHref: el.getAttribute("href")!,
        restX,
        restY,
        x: restX,
        y: restY,
        vx: 0,
        vy: 0,
        // Deterministic phase offsets — bubbles breathe out of sync without
        // needing randomness that would differ between runs.
        phase: (i * 2 * Math.PI) / 24,
      };
    },
  );
  if (bubbles.length === 0) return;

  // --- Motion state ---------------------------------------------------------

  let paused = window.localStorage?.getItem(MOTION_KEY) === "paused";
  let raf = 0;
  let matched: Set<string> | null = null; // null = no active search
  let centered: string | null = null;

  const shouldRun = () =>
    !paused &&
    !reducedMotion.matches &&
    wideEnough.matches &&
    document.visibilityState === "visible";

  function start(): void {
    if (raf || !shouldRun()) return;
    raf = requestAnimationFrame(tick);
  }

  function stop(): void {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // Targets apply with or without the loop running: when motion is off, the
  // search still re-targets, it just lands via the CSS transition instead of
  // being sprung there.
  function applyTargets(): void {
    const rect = field.getBoundingClientRect();
    for (const b of bubbles) {
      const t = targetFor(b);
      b.x = t.x;
      b.y = t.y;
      b.vx = 0;
      b.vy = 0;
      write(b, rect, t.scale);
    }
  }

  function targetFor(b: Bubble): { x: number; y: number; scale: number } {
    if (centered === b.moodId) {
      return { x: FOCUS_POINT.x, y: FOCUS_POINT.y, scale: FOCUS_SCALE };
    }
    if (matched && !matched.has(b.moodId)) {
      return {
        x: clamp(0.5 + (b.restX - 0.5) * SPREAD, EDGE_MARGIN_X),
        y: clamp(0.5 + (b.restY - 0.5) * SPREAD, EDGE_MARGIN_Y),
        scale: SHRINK,
      };
    }
    return { x: b.restX, y: b.restY, scale: 1 };
  }

  function clamp(v: number, margin: number): number {
    return Math.min(1 - margin, Math.max(margin, v));
  }

  function write(b: Bubble, rect: DOMRect, scale: number): void {
    b.el.style.setProperty("--tx", `${(b.x - b.restX) * rect.width}px`);
    b.el.style.setProperty("--ty", `${(b.y - b.restY) * rect.height}px`);
    b.el.style.setProperty("--s", `${scale}`);
  }

  function tick(time: number): void {
    const rect = field.getBoundingClientRect();
    // Drift pauses while a person is searching or reading (DESIGN.md); the
    // spring keeps working so re-targeting still lands.
    const drifting = !matched && centered === null && document.activeElement !== input;

    for (const b of bubbles) {
      const t = targetFor(b);
      b.vx = (b.vx + (t.x - b.x) * SPRING_K * DT) * DAMPING;
      b.vy = (b.vy + (t.y - b.y) * SPRING_K * DT) * DAMPING;
      b.x += b.vx;
      b.y += b.vy;

      let { x, y } = b;
      if (drifting) {
        x += Math.sin(time / 1400 + b.phase) * JITTER;
        y += Math.cos(time / 1600 + b.phase) * JITTER;
      }
      b.el.style.setProperty("--tx", `${(x - b.restX) * rect.width}px`);
      b.el.style.setProperty("--ty", `${(y - b.restY) * rect.height}px`);
      b.el.style.setProperty("--s", `${t.scale}`);
    }

    raf = requestAnimationFrame(tick);
  }

  // --- Motion toggle --------------------------------------------------------

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "motion-toggle";
  const syncToggle = () => {
    toggle.textContent = paused ? "Resume motion" : "Pause motion";
    toggle.setAttribute("aria-pressed", String(paused));
  };
  toggle.addEventListener("click", () => {
    paused = !paused;
    try {
      window.localStorage?.setItem(MOTION_KEY, paused ? "paused" : "running");
    } catch {
      // Private-mode storage failure is not worth breaking the toggle over.
    }
    syncToggle();
    if (paused) {
      stop();
      applyTargets();
    } else {
      start();
    }
  });
  syncToggle();
  // Reduced motion removes drift regardless of the toggle, so don't offer a
  // control that would appear to do nothing.
  if (!reducedMotion.matches) field.before(toggle);

  // --- Lifecycle ------------------------------------------------------------

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") start();
    else stop();
  });
  window.addEventListener("pagehide", stop);
  window.addEventListener("pageshow", start);
  reducedMotion.addEventListener("change", () => {
    stop();
    applyTargets();
    start();
  });
  wideEnough.addEventListener("change", () => {
    stop();
    // Leaving the absolute layout: clear offsets so the flow layout is clean.
    if (!wideEnough.matches) {
      for (const b of bubbles) {
        b.el.style.removeProperty("--tx");
        b.el.style.removeProperty("--ty");
        b.el.style.removeProperty("--s");
      }
    } else {
      applyTargets();
    }
    start();
  });
  window.addEventListener("resize", () => {
    if (!raf) applyTargets();
  });

  // --- Live search re-targeting --------------------------------------------

  if (input && form) {
    let index: SearchIndex | null = null;
    let latest: SearchResult = { state: "empty" };

    const apply = (result: SearchResult) => {
      latest = result;
      // Carry the query onto every bubble so it survives field -> ring -> back
      // (the ring passes it along; the field's search box consumes it).
      const q = result.state === "empty" ? null : input.value;
      for (const b of bubbles) b.el.setAttribute("href", exploreHref(b.baseHref, q));

      switch (result.state) {
        case "empty":
          matched = null;
          centered = null;
          if (status) status.textContent = "";
          break;
        case "exact":
          matched = new Set([result.moodId]);
          centered = result.moodId;
          if (status) {
            const label = index?.moods.find((m) => m.id === result.moodId)?.label ?? result.moodId;
            status.textContent = `Showing ${label}. Press Enter to open it.`;
          }
          break;
        case "candidates":
          matched = new Set(result.candidates.map((c) => c.moodId));
          centered = null;
          if (status) {
            status.textContent = `${result.candidates.length} moods may fit “${result.query}”. Pick one from the field.`;
          }
          break;
        case "no-match":
          matched = new Set();
          centered = null;
          if (status) {
            status.textContent = `No mood matches “${result.query}”. Clear the box to see them all.`;
          }
          break;
      }
      // Size and position alone must not carry the result — the status region
      // above says it in words, and this only de-emphasises, never to the
      // point where a label stops being readable.
      for (const b of bubbles) {
        b.el.classList.toggle("bubble--dimmed", !!matched && !matched.has(b.moodId));
      }
      if (!raf) applyTargets();
    };

    fetch(withBase("/search-index.json"))
      .then((res) => res.json())
      .then((data: SearchIndex) => {
        index = data;
        const carried = new URLSearchParams(window.location.search).get("q");
        if (carried && !input.value) input.value = carried;
        if (input.value) apply(resolveSearch(input.value, data.moods, data.synonyms));
      })
      .catch(() => {
        // No index — the field stays a plain set of links and the form's
        // native GET to /feelings/ still works.
      });

    let debounce = 0;
    input.addEventListener("input", () => {
      if (!index) return;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        apply(resolveSearch(input.value, index!.moods, index!.synonyms));
      }, 150);
    });
    input.addEventListener("focus", () => {
      // Drift stops on focus; the loop reads activeElement each frame, so a
      // stopped loop needs one manual settle.
      if (!raf) applyTargets();
    });

    // Typing never navigates (WCAG 3.2.2) — only an explicit submit does, and
    // only when the query resolved to exactly one mood.
    form.addEventListener("submit", (event) => {
      if (latest.state !== "exact") return; // fall through to the native GET
      event.preventDefault();
      window.location.href = withBase(`/explore/${latest.moodId}/`);
    });
  }

  applyTargets();
  start();
}
