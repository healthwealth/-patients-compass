import {
  Activity,
  Award,
  BookOpen,
  FileText,
  Heart,
  HelpCircle,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type HeaderSearchDestination = {
  href: string;
  label: string;
  category: string;
  keywords: string;
  icon: LucideIcon;
};

export type SearchHighlightSegment = {
  value: string;
  matches: boolean;
};

export const RECENT_HEADER_SEARCHES_KEY = "patientscompass_recent_header_searches";
export const MAX_RECENT_HEADER_SEARCHES = 5;

export const HEADER_SEARCH_SYNONYMS: Record<string, string[]> = {
  cbc: ["complete blood count", "blood count", "lab values"],
  "complete blood count": ["cbc", "blood count", "lab values"],
  iron: ["ferritin", "lab values"],
  ferritin: ["iron", "lab values"],
  thyroid: ["tsh", "lab values"],
  tsh: ["thyroid", "lab values"],
  cholesterol: ["lipids", "ldl", "hdl", "lab values"],
  lipids: ["cholesterol", "ldl", "hdl", "lab values"],
  glucose: ["blood sugar", "lab values"],
  "blood sugar": ["glucose", "lab values"],
  fatigue: ["tired", "low energy", "wellness"],
  tired: ["fatigue", "low energy", "wellness"],
  "low energy": ["fatigue", "tired", "wellness"],
  "brain fog": ["wellness", "habits"],
  sleep: ["wellness", "habits"],
  stress: ["wellness", "habits"],
};

export const HEADER_SEARCH_DESTINATIONS: HeaderSearchDestination[] = [
  { href: "/biomarkers", label: "Biomarker Library", category: "Resource", keywords: "lab values ranges ferritin", icon: Activity },
  { href: "/lifestyle", label: "Lifestyle AI", category: "Tool", keywords: "nutrition wellness habits", icon: Sparkles },
  { href: "/books", label: "Books", category: "Library", keywords: "reading guides health literacy", icon: BookOpen },
  { href: "/blog", label: "Blog", category: "Article", keywords: "articles education insights", icon: FileText },
  { href: "/medical-assistant", label: "AI Assistant", category: "Feature", keywords: "dr compass health questions", icon: Heart },
  { href: "/features", label: "Features", category: "Product", keywords: "tools product capabilities", icon: Award },
  { href: "/support", label: "Help Center", category: "Support", keywords: "support faq contact", icon: HelpCircle },
  { href: "/pricing", label: "Pricing", category: "Plan", keywords: "plans pro subscription", icon: TrendingUp },
];

export function filterHeaderSearchDestinations(query: string, limit = 5) {
  const normalizedQuery = query.trim().toLowerCase();
  const searchableText = (destination: HeaderSearchDestination) =>
    `${destination.label} ${destination.category} ${destination.keywords}`.toLowerCase();
  const exactMatches = HEADER_SEARCH_DESTINATIONS.filter((destination) =>
    !normalizedQuery || searchableText(destination).includes(normalizedQuery)
  );
  const queryTerms = new Set([
    normalizedQuery,
    ...(HEADER_SEARCH_SYNONYMS[normalizedQuery] ?? []),
  ].filter(Boolean));

  const matches = HEADER_SEARCH_DESTINATIONS.filter((destination) =>
    !normalizedQuery ||
      Array.from(queryTerms).some((term) =>
        searchableText(destination).includes(term)
      )
  );

  return {
    matches,
    results: matches.slice(0, limit),
    synonymUsed: Boolean(normalizedQuery && exactMatches.length === 0 && matches.length > 0),
  };
}

export function getSearchHighlightSegments(text: string, query: string): SearchHighlightSegment[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [{ value: text, matches: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  const segments: SearchHighlightSegment[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery, cursor);

  while (index !== -1) {
    if (index > cursor) segments.push({ value: text.slice(cursor, index), matches: false });
    segments.push({ value: text.slice(index, index + normalizedQuery.length), matches: true });
    cursor = index + normalizedQuery.length;
    index = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) segments.push({ value: text.slice(cursor), matches: false });
  return segments.length > 0 ? segments : [{ value: text, matches: false }];
}

export function getKeywordMatchContext(destination: HeaderSearchDestination, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;

  const matchesLabelOrCategory = `${destination.label} ${destination.category}`
    .toLowerCase()
    .includes(normalizedQuery);

  return !matchesLabelOrCategory && destination.keywords.toLowerCase().includes(normalizedQuery)
    ? destination.keywords
    : null;
}

export function addRecentHeaderSearch(recentSearches: string[], query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return recentSearches;

  return [
    normalizedQuery,
    ...recentSearches.filter((search) => search.toLowerCase() !== normalizedQuery.toLowerCase()),
  ].slice(0, MAX_RECENT_HEADER_SEARCHES);
}
