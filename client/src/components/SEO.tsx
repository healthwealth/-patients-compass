import { Helmet } from "react-helmet-async";
import {
  buildTitle,
  buildCanonical,
  normalizeKeywords,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_AUTHOR,
  SITE_NAME,
  type SEOProps,
} from "@/hooks/useSEO";

/**
 * SEO component — drop into any page to set title, description, canonical,
 * Open Graph, Twitter Card, and optional JSON-LD structured data.
 *
 * Example:
 * ```tsx
 * <SEO
 *   title="Biomarker Directory"
 *   description="Explore 25+ lab biomarkers with optimal wellness ranges."
 *   path="/biomarkers"
 * />
 * ```
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  structuredData,
  noIndex = false,
  keywords,
  author = DEFAULT_AUTHOR,
  lang = "en-US",
}: SEOProps) {
  const fullTitle = buildTitle(title);
  const canonical = buildCanonical(path);
  const normalizedKeywords = normalizeKeywords(keywords);
  const schemaArray = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet>
      {/* ── Primary ── */}
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={normalizedKeywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── Open Graph ── */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="The Patient's Compass health intelligence tools" />
      <meta property="og:locale" content="en_US" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="The Patient's Compass health intelligence tools" />

      {/* ── JSON-LD Structured Data ── */}
      {schemaArray.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
