const CANONICAL_ORIGIN = "https://thepatientscompass.com";

const SUPER_KIDS_SEO = {
  title: "Healthy Habits for Super Kids by Sonya M. | The Patient's Compass",
  description: "Download Sonya M.'s free 19-page Healthy Habits for Super Kids activity pack for playful family learning at home. No registration required.",
  keywords: "Healthy Habits for Super Kids, Sonya M., free kids activity PDF, family wellness activities",
  canonical: `${CANONICAL_ORIGIN}/super-kids`,
  ogImage: `${CANONICAL_ORIGIN}/manus-storage/activity-page-01_f4d8a670.jpg`,
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function replaceTag(template: string, pattern: RegExp, replacement: string) {
  return template.replace(pattern, replacement);
}

/**
 * Injects page metadata into the SPA shell for crawlers and link unfurlers.
 * React Helmet still owns the same metadata after hydration.
 */
export function applyRouteSeo(template: string, requestUrl: string) {
  let pathname = requestUrl;
  try {
    pathname = new URL(requestUrl, CANONICAL_ORIGIN).pathname;
  } catch {
    // Keep the original request path when a malformed URL is supplied.
  }
  if (pathname !== "/super-kids") return template;

  const title = escapeHtml(SUPER_KIDS_SEO.title);
  const description = escapeHtml(SUPER_KIDS_SEO.description);
  const keywords = escapeHtml(SUPER_KIDS_SEO.keywords);
  const canonical = escapeHtml(SUPER_KIDS_SEO.canonical);
  const ogImage = escapeHtml(SUPER_KIDS_SEO.ogImage);
  let page = template;

  page = replaceTag(page, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  page = replaceTag(page, /<meta name="description"[^>]*>/i, `<meta name="description" content="${description}" />`);
  page = replaceTag(page, /<meta name="keywords"[^>]*>/i, `<meta name="keywords" content="${keywords}" />`);
  page = replaceTag(page, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  page = replaceTag(page, /<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
  page = replaceTag(page, /<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
  page = replaceTag(page, /<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`);
  page = replaceTag(page, /<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImage}" />`);
  page = replaceTag(page, /<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
  page = replaceTag(page, /<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`);
  page = replaceTag(page, /<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${ogImage}" />`);

  const bookSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Book",
    name: "Healthy Habits for Super Kids",
    author: { "@type": "Person", name: "Sonya M." },
    description: "A free printable family activity pack for ages 3–8.",
    image: SUPER_KIDS_SEO.ogImage,
    isAccessibleForFree: true,
    educationalUse: "Family activity",
    encoding: {
      "@type": "MediaObject",
      name: "Healthy Habits for Super Kids — Free Printable Activity Pack",
      contentUrl: `${CANONICAL_ORIGIN}/manus-storage/Healthy_Habits_Super_Kids_Free_Printables_8b45bee6.pdf`,
      encodingFormat: "application/pdf",
      contentSize: "29.9 KB",
      description: "Downloadable 19-page printable activity pack for children ages 3–8.",
    },
    url: SUPER_KIDS_SEO.canonical,
  });
  return page.replace("</head>", `<script type="application/ld+json">${bookSchema}</script>\n  </head>`);
}
