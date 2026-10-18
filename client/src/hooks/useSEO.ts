/**
 * useSEO — lightweight wrapper around react-helmet-async.
 *
 * Provides a single call-site for setting:
 *  - <title>
 *  - meta description
 *  - canonical URL
 *  - Open Graph (og:*) tags
 *  - Twitter Card tags
 *  - JSON-LD structured data
 *
 * Usage:
 * ```tsx
 * useSEO({
 *   title: "Biomarker Directory",
 *   description: "Explore 25+ lab biomarkers with optimal wellness ranges.",
 *   path: "/biomarkers",
 * });
 * ```
 */

export interface SEOProps {
  /** Page title — appended with site name automatically */
  title?: string;
  /** Meta description (150–160 chars ideal) */
  description?: string;
  /** Relative path, e.g. "/biomarkers". Used to build canonical + og:url */
  path?: string;
  /** Override og:image. Defaults to site-wide social card. */
  ogImage?: string;
  /** JSON-LD structured data object(s). Pass a single object or an array. */
  structuredData?: object | object[];
  /** Set to true for pages that should not be indexed (e.g. /admin, /dashboard) */
  noIndex?: boolean;
  /** Keywords for meta keywords tag (comma-separated or array) */
  keywords?: string | string[];
  /** Author name for meta author tag */
  author?: string;
  /** Language code (default: en-US) */
  lang?: string;
}

const SITE_NAME = "The Patient's Compass";
const BASE_URL = "https://thepatientscompass.com";
const DEFAULT_DESCRIPTION =
  "Turn confusing lab results into structured doctor conversations. Built by a Clinical Laboratory Scientist with 20+ years of experience.";
const DEFAULT_OG_IMAGE = `${BASE_URL}/manus-storage/patients-compass-social-preview_2f403d47.png`;
const DEFAULT_KEYWORDS = [
  "lab results",
  "biomarkers",
  "functional medicine",
  "health intelligence",
  "AI health assistant",
  "doctor visit prep",
  "optimal ranges",
  "clinical laboratory",
].join(", ");
const DEFAULT_AUTHOR = "The Patient's Compass Team";

/** Returns the full <title> string */
export function buildTitle(pageTitle?: string): string {
  if (!pageTitle) return `${SITE_NAME} — Health Intelligence System`;
  return `${pageTitle} | ${SITE_NAME}`;
}

/** Returns the canonical URL for a given relative path */
export function buildCanonical(path?: string): string {
  if (!path) return BASE_URL;
  return `${BASE_URL}${path}`;
}

/** Normalize keywords to comma-separated string */
export function normalizeKeywords(keywords?: string | string[]): string {
  if (!keywords) return DEFAULT_KEYWORDS;
  if (Array.isArray(keywords)) return keywords.join(", ");
  return keywords;
}

// Re-export so pages can import everything from one place
export { BASE_URL, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, DEFAULT_KEYWORDS, DEFAULT_AUTHOR };
