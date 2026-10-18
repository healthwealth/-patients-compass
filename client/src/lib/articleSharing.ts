const CANONICAL_ORIGIN = "https://thepatientscompass.com";

export type ArticleShareInput = {
  slug: string;
  title: string;
  description: string;
};

export function buildArticleShareLinks({ slug, title, description }: ArticleShareInput) {
  const canonicalUrl = `${CANONICAL_ORIGIN}/blog/${encodeURIComponent(slug)}`;
  const shareText = `${title} — ${description}`;

  return {
    canonicalUrl,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(canonicalUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${canonicalUrl}`)}`,
  };
}
