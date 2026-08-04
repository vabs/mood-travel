// GitHub Pages project sites serve from a subpath (e.g. /mood-travel/), so
// every internal link/fetch must be base-aware rather than a bare "/..."
// path. import.meta.env.BASE_URL is a build-time constant — this works
// identically in server-rendered .astro frontmatter and in client scripts.
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
