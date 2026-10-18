export type RecommendationCandidate = {
  slug: string;
};

/** Keep primary related articles first, then fill open slots with same-category published articles. */
export function buildRelatedRecommendations<T extends RecommendationCandidate>(
  primary: T[],
  categoryFallback: T[],
  currentSlug: string,
  limit = 3,
): T[] {
  const seen = new Set<string>([currentSlug]);
  return [...primary, ...categoryFallback].filter((article) => {
    if (seen.has(article.slug)) return false;
    seen.add(article.slug);
    return true;
  }).slice(0, limit);
}
