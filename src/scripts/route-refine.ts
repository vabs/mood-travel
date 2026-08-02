// Refinement filters on /feeling/[term]/: reorder and dim already-rendered
// route cards, never remove them. A route not matching the current filters
// is still one click away — refining is a reorder, not a gate.
export function initRouteRefine(): void {
  const form = document.querySelector<HTMLFormElement>(".refine-form");
  const list = document.querySelector<HTMLUListElement>(".route-cards");
  if (!form || !list) return;

  const cards = [...list.querySelectorAll<HTMLLIElement>(".route-card")];

  function selected(name: string): string[] {
    return [...form!.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((i) => i.value);
  }

  function matches(card: HTMLLIElement, name: string, values: string[]): boolean {
    if (values.length === 0) return true;
    const cardValues = (card.dataset[name] ?? "").split(" ");
    return values.some((v) => cardValues.includes(v));
  }

  function apply() {
    const feelings = selected("manageable_feeling");
    const types = selected("media_type");
    const tempos = selected("tempo");

    const scored = cards.map((card) => {
      const matchesAll =
        matches(card, "manageableFeelings", feelings) &&
        matches(card, "types", types) &&
        matches(card, "tempos", tempos);
      card.classList.toggle("is-dimmed", !matchesAll);
      return { card, matchesAll };
    });

    scored
      .sort((a, b) => Number(b.matchesAll) - Number(a.matchesAll))
      .forEach(({ card }) => list!.appendChild(card));
  }

  form.addEventListener("change", apply);
}
