export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function createSlugCandidate(username: string, attempt = 0): string {
  const base = normalizeSlug(username) || "developer";
  if (attempt === 0) return base;
  return `${base}-${attempt + 1}`;
}
