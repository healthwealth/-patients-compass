export type SavedFilters = { search: string; category: string; from: string; to: string; expiresAt: number | null };

export function parseSavedFilters(search: string, now = Date.now()): SavedFilters {
  const params = new URLSearchParams(search);
  const rawExpiry = Number(params.get("exp"));
  const expiresAt = Number.isFinite(rawExpiry) && rawExpiry > 0 ? rawExpiry * 1000 : null;
  const expired = expiresAt !== null && expiresAt <= now;
  return { search: expired ? "" : params.get("q") ?? "", category: expired ? "" : params.get("topic") ?? "", from: expired ? "" : params.get("from") ?? "", to: expired ? "" : params.get("to") ?? "", expiresAt };
}

export function buildSavedFiltersQuery(filters: SavedFilters) {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("q", filters.search.trim());
  if (filters.category) params.set("topic", filters.category);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.expiresAt && filters.expiresAt > Date.now()) params.set("exp", String(Math.floor(filters.expiresAt / 1000)));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function isSavedFiltersExpired(expiresAt: number | null, now = Date.now()) {
  return expiresAt !== null && expiresAt <= now;
}
