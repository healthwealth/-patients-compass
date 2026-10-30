export interface Biomarker {
  name: string;
  category: string;
  normalRange: string;
  optimalRange: string;
  description: string;
  symptomsSuboptimal: string;
}

export interface Competitor {
  name: string;
  targetAudience: string;
  keyFeatures: string[];
  pricingModel: string;
  privacySafety: string;
  marketPositioning: string;
  badge: string;
}

export interface CaseStudy {
  title: string;
  biomarker: string;
  clinicalNormal: string;
  optimalWellness: string;
  symptoms: string;
  resolution: string;
  quote: string;
}

export const BIOMARKERS: Biomarker[] = [
  {
    name: "Ferritin (Iron Storage)",
    category: "Nutrient Balance",
    normalRange: "15 - 150 ng/mL",
    optimalRange: "50 - 100 ng/mL",
    description: "Reflects total body iron stores. Standard ranges often miss early subclinical iron depletion, which can cause fatigue and hair loss long before clinical anemia.",
    symptomsSuboptimal: "Fatigue, hair thinning, cold intolerance, brain fog."
  },
  {
    name: "Thyroid Stimulating Hormone (TSH)",
    category: "Hormonal System",
    normalRange: "0.45 - 4.5 mIU/L",
    optimalRange: "1.0 - 2.5 mIU/L",
    description: "Regulates metabolism. Patients often feel sluggish, gain weight, or experience mood shifts when TSH is above 2.5, even though standard labs consider up to 4.5 'normal'.",
    symptomsSuboptimal: "Sluggishness, unexplained weight gain, dry skin, low mood."
  },
  {
    name: "Hemoglobin A1c (HbA1c)",
    category: "Metabolic System",
    normalRange: "4.0% - 5.6%",
    optimalRange: "4.6% - 5.3%",
    description: "Measures 3-month average blood sugar. Standard ranges flag diabetes at 5.7% (prediabetes), but optimal wellness models aim to keep this below 5.3% to prevent early insulin resistance.",
    symptomsSuboptimal: "Energy crashes after meals, sugar cravings, mid-afternoon fatigue."
  },
  {
    name: "High-Sensitivity CRP (hs-CRP)",
    category: "Cardiovascular System",
    normalRange: "0.0 - 3.0 mg/L",
    optimalRange: "0.0 - 1.0 mg/L",
    description: "A key marker of systemic inflammation. Standard labs flag risk above 3.0 mg/L, but optimal cardiovascular and longevity targets aim for under 1.0 mg/L.",
    symptomsSuboptimal: "Joint stiffness, muscle aches, slow recovery, systemic fatigue."
  },
  {
    name: "Alanine Aminotransferase (ALT)",
    category: "Liver System",
    normalRange: "7 - 56 U/L",
    optimalRange: "10 - 25 U/L",
    description: "An enzyme primarily found in the liver. Standard limits can go up to 56 U/L, but functional ranges look for early fatty liver signs or metabolic stress when ALT exceeds 25 U/L.",
    symptomsSuboptimal: "Abdominal bloating, sluggish digestion, fatigue after heavy meals."
  }
];

export const COMPETITORS: Competitor[] = [
  {
    name: "The Patient's Compass",
    targetAudience: "Book readers, proactive patients, health advocates",
    keyFeatures: [
      "PDF lab report OCR extraction",
      "Functional medicine range mapping",
      "Interactive Doctor's Letter generator",
      "Biomarker-mapped meal plans"
    ],
    pricingModel: "Companion Platform (Free with book / Freemium)",
    privacySafety: "Secure, educational focus; emphasizes doctor follow-up & collaboration",
    marketPositioning: "The Literate Health Companion: Best for patients seeking to understand the 'why' behind their labs and prepare for clinical visits.",
    badge: "Best for Patient Advocacy"
  },
  {
    name: "AI-LabTest.com",
    targetAudience: "Casual consumers seeking quick, one-off analyses",
    keyFeatures: [
      "PDF/JPG upload",
      "Plain-language marker explanations",
      "Basic medical chat support"
    ],
    pricingModel: "Free preview + $1.99 per full report",
    privacySafety: "Privacy-first; educational disclaimer",
    marketPositioning: "The Budget Explainer: Best for immediate, low-cost, single-report translation without subscription commitments.",
    badge: "Best for One-off Reports"
  },
  {
    name: "SelfDecode Labs Analyzer",
    targetAudience: "Longevity, bio-hacking, and wellness enthusiasts",
    keyFeatures: [
      "Analysis of 2000+ biomarkers",
      "DecodyGPT 24/7 AI health coach",
      "DNA kit cross-referencing",
      "Diet, lifestyle, and supplement lists"
    ],
    pricingModel: "$59/year (or $499 bundled with DNA kit)",
    privacySafety: "HIPAA & GDPR compliant; world-class encryption",
    marketPositioning: "The Bio-Hacker's Dashboard: Best for continuous wellness tracking, optimization, and genetic correlation.",
    badge: "Best for Longevity Tracking"
  },
  {
    name: "Docus.ai",
    targetAudience: "Patients, doctors, and diagnostic labs",
    keyFeatures: [
      "AI Doctor chat with second opinion",
      "Clinical report generation for doctors",
      "Patient-friendly lab summaries"
    ],
    pricingModel: "Freemium patient plan; flexible B2B subscription for labs",
    privacySafety: "Dual-facing patient/doctor portal; HIPAA aligned",
    marketPositioning: "The Clinical Bridge: Best for integrating AI interpretation directly into physician-patient communication.",
    badge: "Best for Clinical Workflows"
  },
  {
    name: "Quest AI Companion",
    targetAudience: "Quest Diagnostics patients (MyQuest portal users)",
    keyFeatures: [
      "Google Gemini-powered secure chat",
      "5-year historical trend analysis",
      "Terminology translator",
      "In-portal doctor prep helper"
    ],
    pricingModel: "Free for adult MyQuest users",
    privacySafety: "Native, secure, HIPAA-compliant Quest Diagnostics ecosystem",
    marketPositioning: "The Portal Native: The gold standard for mainstream, secure, automatic integration of commercial lab data.",
    badge: "Best Portal Integration"
  },
  {
    name: "Labs AI (Hims & Hers)",
    targetAudience: "Telehealth subscribers and members",
    keyFeatures: [
      "Assessment of 130+ biomarkers",
      "Custom AI care agent",
      "Personalized lifestyle plans",
      "Direct provider connection & prescription flows"
    ],
    pricingModel: "Included in telehealth memberships",
    privacySafety: "Vetted clinical guardrails; closed medical knowledge base",
    marketPositioning: "The Telehealth Assistant: Best for seamlessly linking lab results directly to prescription and treatment plans.",
    badge: "Best for Telehealth"
  }
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    title: "The Exhaustion Paradox",
    biomarker: "Ferritin (Iron Storage)",
    clinicalNormal: "22 ng/mL (Normal: 15-150)",
    optimalWellness: "50-100 ng/mL",
    symptoms: "Severe afternoon fatigue, hair thinning, brittle nails, cold hands.",
    resolution: "Her ferritin was inside the lab's reference range but low for how she felt. After she discussed it with her doctor, her iron stores rose to 65 ng/mL and her energy improved.",
    quote: "I was told my labs were 'perfect' for two years. Understanding the functional range changed everything."
  },
  {
    title: "Sluggish and Overlooked",
    biomarker: "Thyroid Stimulating Hormone (TSH)",
    clinicalNormal: "3.8 mIU/L (Normal: 0.45-4.5)",
    optimalWellness: "1.0-2.5 mIU/L",
    symptoms: "Sluggishness, brain fog, difficulty losing weight despite strict diet.",
    resolution: "Her TSH was inside the standard range, but its upward trend led to a thyroid follow-up conversation with her doctor. With her doctor's plan plus nutrition and lifestyle changes, her TSH later measured 1.8 and her brain fog eased.",
    quote: "Our doctor was able to have a highly targeted discussion once we presented the TSH functional trends."
  },
  {
    title: "Catching Insulin Resistance Early",
    biomarker: "Hemoglobin A1c (HbA1c)",
    clinicalNormal: "5.6% (Normal: 4.0-5.6)",
    optimalWellness: "4.6-5.3%",
    symptoms: "Intense post-meal sugar cravings, mid-day energy crashes, abdominal fat.",
    resolution: "At 5.6%, her HbA1c was 0.1% below the prediabetes cutoff. Spotting the trend early led to lifestyle changes, agreed with her doctor, that brought it down to 5.0%.",
    quote: "The trend tracking caught my blood sugar rise long before my standard physical would have flagged it."
  }
];

export const IMAGES = {
  hero: "/manus-storage/patients-compass-wellness-hero_f0d24959.png",
  compass: "/manus-storage/patients-compass-system-wheel_f293f31e.png",
  author: "/manus-storage/sonya-professional-portrait_c5acc8f2.webp"
};


export interface BookExcerpt {
  bookTitle: string;
  chapterTitle: string;
  chapterNumber: string;
  paragraphs: string[];
  keyTakeaways: string[];
}

export const BOOK_EXCERPTS: BookExcerpt[] = [
  {
    bookTitle: "The Patient's Compass",
    chapterTitle: "The Reference Range Illusion",
    chapterNumber: "Chapter 1",
    paragraphs: [
      "Every day, thousands of patients leave their doctor's offices feeling utterly exhausted, yet clutching a piece of paper that says they are perfectly fine. 'Your labs are normal,' the doctor says, offering a reassuring smile. But if everything is normal, why do you feel so incredibly tired?",
      "The answer lies in a fundamental misunderstanding of what a 'normal reference range' actually is. In clinical laboratory science, the reference range is not a target for optimal health. It is simply a statistical calculation representing the middle 95% of a population.",
      "Consider who makes up that population. The people getting their blood drawn at clinical laboratories are rarely at the peak of vitality—they are often sick, stressed, or managing chronic conditions. When you are compared to this group, 'normal' simply means you are average among those who are unwell.",
      "To truly thrive, we must shift our focus from pathological normal ranges to functional wellness zones. By identifying subtle shifts within the normal range, we can catch subclinical deficiencies before they progress into full-blown chronic diseases."
    ],
    keyTakeaways: [
      "Standard reference ranges represent the middle 95% of the population, not optimal health.",
      "The laboratory reference pool consists heavily of individuals who are stressed, tired, or managing illnesses.",
      "Functional medicine targets narrow 'Optimal Zones' to optimize energy, mood, and daily vitality."
    ]
  },
  {
    bookTitle: "Your Chronic Disease Lab Guide",
    chapterTitle: "Navigating Metabolic Health & Insulin Resistance",
    chapterNumber: "Chapter 3",
    paragraphs: [
      "Metabolic dysfunction does not happen overnight. It is a slow, silent progression that can take a decade to trigger a clinical diagnosis of Type 2 Diabetes. Yet, standard physicals often miss the early warning signs because they rely solely on Fasting Glucose.",
      "A fasting glucose level of 95 mg/dL is clinically normal. However, your body might be producing massive amounts of insulin just to keep that glucose level stable. This state of hyperinsulinemia is highly inflammatory and is the true driver of stubborn weight gain, brain fog, and afternoon energy crashes.",
      "By tracking Hemoglobin A1c (HbA1c) with a functional lens, we look for values creeping above 5.3%. While standard labs do not flag prediabetes until 5.7%, functional targets allow us to intervene with simple lifestyle and dietary adjustments years before insulin resistance hardens.",
      "Taking control of your metabolic labs means understanding how to read the subtle clues your blood chemistry is sending. You don't have to wait for a clinical diagnosis to start optimizing your health."
    ],
    keyTakeaways: [
      "Fasting glucose can remain normal for years even while insulin resistance is actively developing.",
      "An HbA1c above 5.3% is an early functional warning sign of metabolic stress.",
      "Early lifestyle intervention during subclinical phases can completely reverse metabolic dysfunction."
    ]
  }
];

// Auth helpers
/** The site's own sign-in page (email/password, email link, or Google). */
export function getLoginUrl(returnPath?: string, _rememberMe = false): string {
  const path = returnPath && returnPath.startsWith("/") ? returnPath : "";
  return path && path !== "/" ? `/signin?returnPath=${encodeURIComponent(path)}` : "/signin";
}
