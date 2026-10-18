/**
 * FAQ Data Structure
 * Common questions organized by category for the public FAQ page
 */

export type FAQCategory = "getting-started" | "biomarkers" | "lab-analysis" | "books" | "billing" | "technical" | "health";

export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
  keywords: string[];
  helpful?: number; // Track helpfulness votes
  relatedTopics?: string[];
}

export const faqData: FAQItem[] = [
  // Getting Started
  {
    id: "gs-001",
    category: "getting-started",
    question: "What is The Patient's Compass?",
    answer:
      "The Patient's Compass is a health intelligence platform that helps you understand your lab results and optimize your wellness. Built by a clinical laboratory scientist, it transforms confusing lab values into actionable health insights. We help you map standard 'normal' ranges to optimal functional wellness zones.",
    keywords: ["platform", "what is", "overview", "health intelligence"],
    relatedTopics: ["Lab Analysis", "Biomarkers"],
  },
  {
    id: "gs-002",
    category: "getting-started",
    question: "How do I get started?",
    answer:
      "Start with our Symptom Quiz to identify potential health concerns, then explore the Biomarker Library to learn about relevant markers. Upload your lab results to our AI Lab Scanner for personalized analysis. Finally, use the Lifestyle AI to get customized wellness recommendations.",
    keywords: ["start", "getting started", "first steps", "how to begin"],
    relatedTopics: ["Lab Analysis", "Lifestyle AI"],
  },
  {
    id: "gs-003",
    category: "getting-started",
    question: "Do I need a medical background to use this?",
    answer:
      "No! The Patient's Compass is designed for everyone. We explain complex medical concepts in simple language. Our Biomarker Library breaks down what each marker means, why it matters, and how to improve it. No medical knowledge required.",
    keywords: ["medical background", "beginner friendly", "easy to use"],
    relatedTopics: ["Biomarkers", "Educational Resources"],
  },
  {
    id: "gs-004",
    category: "getting-started",
    question: "Is this a replacement for my doctor?",
    answer:
      "Absolutely not. The Patient's Compass is an educational tool to help you understand your health data and prepare for doctor visits. Always consult your healthcare provider for medical advice, diagnosis, or treatment. We help you be a more informed patient.",
    keywords: ["doctor", "medical advice", "healthcare provider", "diagnosis"],
    relatedTopics: ["Health", "Doctor Prep"],
  },

  // Biomarkers
  {
    id: "bm-001",
    category: "biomarkers",
    question: "What are biomarkers?",
    answer:
      "Biomarkers are measurable indicators of biological processes in your body. Common examples include cholesterol, glucose, thyroid hormones, and vitamin levels. They help identify health patterns and predict disease risk. Our Biomarker Library covers 25+ key markers.",
    keywords: ["biomarker", "definition", "what are", "markers"],
    relatedTopics: ["Lab Analysis", "Optimal Ranges"],
  },
  {
    id: "bm-002",
    category: "biomarkers",
    question: "What's the difference between 'normal' and 'optimal' ranges?",
    answer:
      "'Normal' ranges are based on population averages and include people with chronic diseases. 'Optimal' ranges represent values associated with longevity and disease prevention. For example, cholesterol might be 'normal' at 200 but 'optimal' at 150. We help you understand both.",
    keywords: ["normal", "optimal", "ranges", "difference"],
    relatedTopics: ["Biomarkers", "Health Optimization"],
  },
  {
    id: "bm-003",
    category: "biomarkers",
    question: "How can I improve my biomarker levels?",
    answer:
      "Most biomarkers respond to lifestyle changes: diet, exercise, sleep, and stress management. Our Lifestyle AI provides personalized recommendations based on your specific biomarkers. For example, high triglycerides often improve with reduced sugar and increased exercise. Consult your doctor before making major changes.",
    keywords: ["improve", "optimize", "lifestyle", "recommendations"],
    relatedTopics: ["Lifestyle AI", "Health Recommendations"],
  },
  {
    id: "bm-004",
    category: "biomarkers",
    question: "What if my biomarker is outside the optimal range?",
    answer:
      "Don't panic! Most biomarkers can be improved through lifestyle changes. Our platform provides specific recommendations for each marker. However, some conditions require medical treatment. Always discuss abnormal results with your doctor. We're here to help you understand what the numbers mean.",
    keywords: ["abnormal", "outside range", "high", "low", "concerning"],
    relatedTopics: ["Biomarkers", "Doctor Consultation"],
  },

  // Lab Analysis
  {
    id: "la-001",
    category: "lab-analysis",
    question: "How do I upload my lab results?",
    answer:
      "Go to your Dashboard and click 'Upload Lab Report'. You can upload PDF, JPG, or PNG files. Our AI Lab Scanner will automatically extract values and compare them to optimal ranges. You can also manually enter values if you prefer.",
    keywords: ["upload", "lab results", "lab report", "how to"],
    relatedTopics: ["Lab Scanner", "Dashboard"],
  },
  {
    id: "la-002",
    category: "lab-analysis",
    question: "What information does the AI Lab Scanner extract?",
    answer:
      "Our AI extracts biomarker names, values, reference ranges, and units from your lab report. It then compares your values to optimal ranges and provides personalized insights. The scanner works with most common lab formats.",
    keywords: ["lab scanner", "extract", "AI analysis", "information"],
    relatedTopics: ["Lab Analysis", "AI Features"],
  },
  {
    id: "la-003",
    category: "lab-analysis",
    question: "Can I upload labs from any lab company?",
    answer:
      "Yes! Our AI Lab Scanner works with reports from Quest, LabCorp, Ulta Lab Tests, and most other providers. If your lab format isn't recognized, you can manually enter the values. We're continuously improving our scanner.",
    keywords: ["lab company", "quest", "labcorp", "any lab"],
    relatedTopics: ["Lab Scanner", "Supported Labs"],
  },
  {
    id: "la-004",
    category: "lab-analysis",
    question: "How often should I test my biomarkers?",
    answer:
      "It depends on your health status and goals. Generally: annual testing for healthy people, quarterly for those managing conditions, and monthly for specific optimization projects. Consult your doctor for personalized testing frequency.",
    keywords: ["testing frequency", "how often", "retest", "monitoring"],
    relatedTopics: ["Lab Analysis", "Health Monitoring"],
  },

  // Books
  {
    id: "bk-001",
    category: "books",
    question: "What books does The Patient's Compass recommend?",
    answer:
      "We curate books on health, nutrition, lab interpretation, and wellness. Our collection includes bestsellers like 'The Cardiovascular Blueprint', 'Cholesterol Clarity', and 'The Complete Blood Work Guide'. Browse our Books section for recommendations organized by topic.",
    keywords: ["books", "recommendations", "reading list", "catalog"],
    relatedTopics: ["Books", "Educational Resources"],
  },
  {
    id: "bk-002",
    category: "books",
    question: "Can I read book excerpts on the platform?",
    answer:
      "Yes! Many books in our catalog include sample chapters and excerpts you can read directly on the platform. This helps you decide if a book is right for you before purchasing. Full books are available through Amazon.",
    keywords: ["excerpts", "sample chapters", "read", "preview"],
    relatedTopics: ["Books", "Content"],
  },
  {
    id: "bk-003",
    category: "books",
    question: "How do I purchase books?",
    answer:
      "Click the 'View on Amazon' link in any book's profile. This takes you directly to Amazon where you can purchase the book. We earn a small commission from qualifying purchases, which helps us maintain the platform.",
    keywords: ["purchase", "buy", "amazon", "order"],
    relatedTopics: ["Books", "Shopping"],
  },

  // Billing
  {
    id: "bl-001",
    category: "billing",
    question: "What's included in the free plan?",
    answer:
      "The free plan includes access to our Biomarker Library, Symptom Quiz, and Lifestyle AI. You can upload one lab report per month. Premium includes unlimited uploads, advanced AI analysis, and priority support.",
    keywords: ["free plan", "free tier", "what's included", "features"],
    relatedTopics: ["Pricing", "Plans"],
  },
  {
    id: "bl-002",
    category: "billing",
    question: "How much does premium cost?",
    answer:
      "Premium is $9.99/month or $99/year (save 17%). Both include unlimited lab uploads, advanced AI analysis, personalized recommendations, and priority support. We also offer a 7-day free trial.",
    keywords: ["pricing", "cost", "premium", "subscription"],
    relatedTopics: ["Billing", "Plans"],
  },
  {
    id: "bl-003",
    category: "billing",
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes! You can cancel anytime from your Account Settings. Your access continues until the end of your billing period. No hidden fees or long-term contracts.",
    keywords: ["cancel", "refund", "unsubscribe", "anytime"],
    relatedTopics: ["Billing", "Account Management"],
  },
  {
    id: "bl-004",
    category: "billing",
    question: "Do you offer refunds?",
    answer:
      "We offer a 7-day money-back guarantee on new subscriptions. If you're not satisfied, contact support@thepatientscompass.com for a full refund.",
    keywords: ["refund", "money back", "guarantee"],
    relatedTopics: ["Billing", "Support"],
  },

  // Technical
  {
    id: "tc-001",
    category: "technical",
    question: "What browsers are supported?",
    answer:
      "The Patient's Compass works on Chrome, Firefox, Safari, and Edge. We recommend the latest version of your browser for best performance. Mobile apps are available for iOS and Android.",
    keywords: ["browser", "supported", "chrome", "firefox"],
    relatedTopics: ["Technical Support", "Compatibility"],
  },
  {
    id: "tc-002",
    category: "technical",
    question: "Is my health data secure?",
    answer:
      "Yes. We use enterprise-grade encryption (SSL/TLS) for all data in transit and at rest. Your health information is never shared with third parties without your consent. We comply with HIPAA and GDPR regulations.",
    keywords: ["security", "privacy", "encryption", "safe"],
    relatedTopics: ["Privacy", "Security"],
  },
  {
    id: "tc-003",
    category: "technical",
    question: "What should I do if I'm having technical issues?",
    answer:
      "First, try clearing your browser cache and refreshing the page. If the issue persists, contact our support team at support@thepatientscompass.com or use the chat widget. We typically respond within 24 hours.",
    keywords: ["bug", "error", "not working", "technical issue"],
    relatedTopics: ["Technical Support", "Troubleshooting"],
  },
  {
    id: "tc-004",
    category: "technical",
    question: "Can I export my data?",
    answer:
      "Yes! You can export your lab history and analysis reports as PDF. Go to Dashboard → Export to download your data. This helps you share information with your doctor.",
    keywords: ["export", "download", "data", "pdf"],
    relatedTopics: ["Features", "Data Management"],
  },

  // Health
  {
    id: "hl-001",
    category: "health",
    question: "Should I take supplements?",
    answer:
      "Supplements can be helpful for specific deficiencies, but they're not a substitute for a healthy diet. Our Lifestyle AI provides personalized recommendations based on your biomarkers. Always consult your doctor before starting supplements.",
    keywords: ["supplements", "vitamins", "minerals", "should i take"],
    relatedTopics: ["Lifestyle", "Health Recommendations"],
  },
  {
    id: "hl-002",
    category: "health",
    question: "How does diet affect my biomarkers?",
    answer:
      "Diet significantly impacts most biomarkers. For example: high sugar increases glucose and triglycerides, while high fiber improves cholesterol. Our Lifestyle AI provides specific dietary recommendations based on your results. Nutrition is one of the most powerful tools for health optimization.",
    keywords: ["diet", "nutrition", "food", "eating"],
    relatedTopics: ["Lifestyle", "Nutrition"],
  },
  {
    id: "hl-003",
    category: "health",
    question: "How much exercise do I need?",
    answer:
      "The WHO recommends 150 minutes of moderate exercise or 75 minutes of vigorous exercise per week. Exercise improves most biomarkers including cholesterol, glucose, and blood pressure. Our Lifestyle AI provides personalized recommendations.",
    keywords: ["exercise", "workout", "fitness", "activity"],
    relatedTopics: ["Lifestyle", "Health Recommendations"],
  },
  {
    id: "hl-004",
    category: "health",
    question: "Why is sleep important for health?",
    answer:
      "Sleep is critical for health. Poor sleep increases inflammation, worsens glucose control, and raises blood pressure. Most adults need 7-9 hours per night. Our Lifestyle AI includes sleep optimization recommendations.",
    keywords: ["sleep", "rest", "insomnia", "sleep quality"],
    relatedTopics: ["Lifestyle", "Health Optimization"],
  },
];

/**
 * Get all FAQ items for a specific category
 */
export function getFAQByCategory(category: FAQCategory): FAQItem[] {
  return faqData.filter((item) => item.category === category);
}

/**
 * Search FAQ items by keywords
 */
export function searchFAQ(query: string): FAQItem[] {
  const lowerQuery = query.toLowerCase();
  return faqData.filter(
    (item) =>
      item.question.toLowerCase().includes(lowerQuery) ||
      item.answer.toLowerCase().includes(lowerQuery) ||
      item.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all unique categories
 */
export function getAllFAQCategories(): FAQCategory[] {
  const categories = new Set(faqData.map((item) => item.category));
  return Array.from(categories) as FAQCategory[];
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: FAQCategory): string {
  const names: Record<FAQCategory, string> = {
    "getting-started": "Getting Started",
    biomarkers: "Biomarkers",
    "lab-analysis": "Lab Analysis",
    books: "Books",
    billing: "Billing & Pricing",
    technical: "Technical Support",
    health: "Health & Wellness",
  };
  return names[category];
}
