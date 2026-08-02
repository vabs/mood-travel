// Filters on /journey/[journey]/: unlike route refinement, these hide
// non-matching resource rows outright — a person has already committed to
// this route, so narrowing the list is the point.
export function initResourceFilter(): void {
  const form = document.querySelector<HTMLFormElement>(".resource-filter-form");
  if (!form) return;

  const rows = [...document.querySelectorAll<HTMLDetailsElement>(".resource-row")];

  function selected(name: string): string[] {
    return [...form!.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((i) => i.value);
  }

  function apply() {
    const types = selected("type");
    const tempos = selected("tempo");
    const availabilities = selected("availability");
    const excludedWarnings = selected("exclude_warning");

    for (const row of rows) {
      const type = row.dataset.type ?? "";
      const tempo = row.dataset.tempo ?? "";
      const availability = row.dataset.availability ?? "";
      const warnings = (row.dataset.warnings ?? "").split(" ").filter(Boolean);

      const matchesType = types.length === 0 || types.includes(type);
      const matchesTempo = tempos.length === 0 || tempos.includes(tempo);
      const matchesAvailability = availabilities.length === 0 || availabilities.includes(availability);
      const hasExcludedWarning = warnings.some((w) => excludedWarnings.includes(w));

      row.hidden = !matchesType || !matchesTempo || !matchesAvailability || hasExcludedWarning;
    }

    for (const group of document.querySelectorAll<HTMLElement>(".type-group")) {
      const visibleRows = group.querySelectorAll(".resource-row:not([hidden])");
      group.hidden = visibleRows.length === 0;
    }
  }

  form.addEventListener("change", apply);
}
