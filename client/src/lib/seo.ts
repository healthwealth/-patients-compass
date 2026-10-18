/**
 * SEO Utilities for meta tag management
 * Used with react-helmet-async for per-page SEO optimization
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  author?: string;
  robots?: string;
  structuredData?: Record<string, any>;
}

/**
 * Generate page-specific SEO configuration
 */
export const generateSEO = (config: SEOConfig): SEOConfig => {
  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords || [],
    ogImage: config.ogImage || "https://thepatientscompass.com/og-card.png",
    ogType: config.ogType || "website",
    canonical: config.canonical || "https://thepatientscompass.com",
    author: config.author || "The Patient's Compass",
    robots: config.robots || "index, follow",
    structuredData: config.structuredData,
  };
};

/**
 * SEO configurations for each page
 */
export const pageConfigs = {
  home: generateSEO({
    title: "The Patient's Compass — AI-Powered Health Intelligence System",
    description:
      "Turn confusing lab results into structured doctor conversations. Built by a Clinical Laboratory Scientist with 20+ years of experience. Free access to 19 published books, biomarker library, and AI health assistant.",
    keywords: [
      "lab results",
      "biomarkers",
      "functional medicine",
      "optimal ranges",
      "doctor visit prep",
      "health intelligence",
      "clinical laboratory",
      "AI health assistant",
    ],
    canonical: "https://thepatientscompass.com/",
  }),

  features: generateSEO({
    title: "Features & Capabilities — The Patient's Compass",
    description:
      "Explore all features including AI Lab Scanner, Biomarker Library, Doctor's Letter Generator, Lifestyle AI, and unlimited queries with Pro subscription.",
    keywords: [
      "health features",
      "lab analysis",
      "biomarker tracking",
      "AI health tools",
      "wellness features",
      "health optimization",
    ],
    canonical: "https://thepatientscompass.com/features",
  }),

  pricing: generateSEO({
    title: "Pricing — The Patient's Compass",
    description:
      "Choose between Free ($0) or Pro ($9/month or $99.99/year) to unlock unlimited AI queries, full lab analysis, and advanced health tracking.",
    keywords: [
      "pricing",
      "subscription",
      "health app cost",
      "pro features",
      "lab analysis pricing",
    ],
    canonical: "https://thepatientscompass.com/pricing",
  }),

  biomarkers: generateSEO({
    title: "Biomarker Library — 25+ Lab Markers Explained",
    description:
      "Explore 25+ lab biomarkers with optimal ranges, functional medicine guidelines, symptom mapping, and lifestyle factors. Understand what your lab results really mean.",
    keywords: [
      "biomarkers",
      "lab markers",
      "blood test results",
      "optimal ranges",
      "functional medicine",
      "lab interpretation",
      "health markers",
    ],
    canonical: "https://thepatientscompass.com/biomarkers",
  }),

  books: generateSEO({
    title: "Health Education Books — The Patient's Compass",
    description:
      "Access 19 published books on lab guides, functional medicine, and health optimization. Real Amazon covers, full sample chapters, and searchable catalog.",
    keywords: [
      "health books",
      "medical education",
      "lab guides",
      "functional medicine books",
      "health resources",
    ],
    canonical: "https://thepatientscompass.com/books",
  }),

  lifestyle: generateSEO({
    title: "Lifestyle AI — Personalized Wellness Recommendations",
    description:
      "Get AI-powered nutrition and wellness recommendations based on your biomarkers. Personalized health advice from a clinical laboratory scientist.",
    keywords: [
      "lifestyle recommendations",
      "nutrition advice",
      "wellness coaching",
      "personalized health",
      "AI health coach",
    ],
    canonical: "https://thepatientscompass.com/lifestyle",
  }),

  medicalAssistant: generateSEO({
    title: "Health Companion — AI Medical Health Assistant",
    description:
      "Chat with Health Companion AI assistant in three modes: Health Assistant, Lab Analyzer, and Nutrition Coach. Get instant health insights powered by clinical expertise.",
    keywords: [
      "medical assistant",
      "health AI",
      "lab analyzer",
      "health chatbot",
      "medical AI",
      "health advice",
    ],
    canonical: "https://thepatientscompass.com/medical-assistant",
  }),

  upgradePro: generateSEO({
    title: "Upgrade to Pro — Unlimited AI Health Queries",
    description:
      "Upgrade to Pro for unlimited AI queries, full lab report analysis, advanced exports, and personalized health tracking. Only $9/month or $99.99/year.",
    keywords: [
      "upgrade pro",
      "subscription",
      "premium features",
      "unlimited queries",
      "health app premium",
    ],
    canonical: "https://thepatientscompass.com/upgrade-pro",
  }),

  faq: generateSEO({
    title: "FAQ — Frequently Asked Questions",
    description:
      "Find answers to common questions about The Patient's Compass, lab analysis, biomarkers, AI features, and subscription.",
    keywords: ["FAQ", "help", "questions", "support", "troubleshooting"],
    canonical: "https://thepatientscompass.com/faq",
  }),

  contact: generateSEO({
    title: "Contact Us — The Patient's Compass",
    description:
      "Get in touch with The Patient's Compass team. We're here to help with questions, feedback, or partnership inquiries.",
    keywords: ["contact", "support", "feedback", "partnership"],
    canonical: "https://thepatientscompass.com/contact",
  }),

  privacy: generateSEO({
    title: "Privacy Policy — The Patient's Compass",
    description:
      "Learn how The Patient's Compass protects your health data and privacy. Our comprehensive privacy policy explains data handling practices.",
    keywords: ["privacy", "data protection", "HIPAA", "security"],
    canonical: "https://thepatientscompass.com/privacy",
  }),

  terms: generateSEO({
    title: "Terms of Service — The Patient's Compass",
    description:
      "Read the terms of service for The Patient's Compass. Understand your rights and responsibilities when using our health intelligence platform.",
    keywords: ["terms", "terms of service", "legal", "agreement"],
    canonical: "https://thepatientscompass.com/terms",
  }),
};

/**
 * Generate FAQ schema markup for SEO
 */
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};

/**
 * Generate breadcrumb schema markup
 */
export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * Generate product/service schema markup
 */
export const generateServiceSchema = (service: {
  name: string;
  description: string;
  price: string;
  priceCurrency: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    offers: {
      "@type": "Offer",
      price: service.price,
      priceCurrency: service.priceCurrency,
    },
  };
};
