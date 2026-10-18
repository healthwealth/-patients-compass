export type FilterableCoverAsset = { title: string; altText: string; category: string };

export function filterCoverAssets<T extends FilterableCoverAsset>(assets: T[], search: string, category: string) {
  const query = search.trim().toLowerCase();
  return assets.filter((asset) => {
    const matchesQuery = !query || `${asset.title} ${asset.altText} ${asset.category}`.toLowerCase().includes(query);
    return matchesQuery && (category === "all" || asset.category === category);
  });
}
