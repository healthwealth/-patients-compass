/**
 * Comprehensive Biomarker Knowledge Base for Support Chat
 * Contains detailed information about common biomarkers, optimal ranges, and health implications
 */

export interface BiomarkerInfo {
  name: string;
  aliases: string[];
  category: string;
  description: string;
  optimalRange: {
    min: number;
    max: number;
    unit: string;
  };
  normalRange: {
    min: number;
    max: number;
    unit: string;
  };
  highSymptoms: string[];
  lowSymptoms: string[];
  causes: {
    high: string[];
    low: string[];
  };
  recommendations: {
    high: string[];
    low: string[];
  };
  relatedBiomarkers: string[];
  testFrequency: string;
  notes: string;
}

export const biomarkerDatabase: Record<string, BiomarkerInfo> = {
  // GLUCOSE & METABOLISM
  glucose: {
    name: "Fasting Glucose",
    aliases: ["blood sugar", "fasting blood sugar", "FBS"],
    category: "Glucose & Metabolism",
    description:
      "Measures blood sugar levels after 8-12 hours of fasting. Essential for detecting diabetes and metabolic health.",
    optimalRange: { min: 70, max: 100, unit: "mg/dL" },
    normalRange: { min: 70, max: 100, unit: "mg/dL" },
    highSymptoms: [
      "Increased thirst",
      "Frequent urination",
      "Fatigue",
      "Blurred vision",
      "Headaches",
    ],
    lowSymptoms: [
      "Shakiness",
      "Sweating",
      "Rapid heartbeat",
      "Anxiety",
      "Confusion",
    ],
    causes: {
      high: [
        "Diabetes",
        "Stress",
        "Illness",
        "Certain medications",
        "Poor diet",
      ],
      low: ["Excessive insulin", "Skipped meals", "Intense exercise"],
    },
    recommendations: {
      high: [
        "Reduce refined carbohydrates",
        "Increase fiber intake",
        "Regular exercise",
        "Stress management",
        "Consult endocrinologist",
      ],
      low: [
        "Eat balanced meals",
        "Include complex carbs",
        "Avoid long fasting periods",
        "Monitor medication",
      ],
    },
    relatedBiomarkers: ["HbA1c", "Insulin", "Triglycerides"],
    testFrequency: "Annually or as recommended by doctor",
    notes:
      "Fasting glucose is one of the earliest indicators of metabolic dysfunction. Optimal is <100 mg/dL.",
  },

  hba1c: {
    name: "Hemoglobin A1c",
    aliases: ["HbA1c", "glycated hemoglobin", "A1c"],
    category: "Glucose & Metabolism",
    description:
      "Measures average blood sugar over 2-3 months. Best indicator of long-term glucose control.",
    optimalRange: { min: 4.0, max: 5.6, unit: "%" },
    normalRange: { min: 4.0, max: 5.6, unit: "%" },
    highSymptoms: [
      "Increased thirst",
      "Frequent urination",
      "Fatigue",
      "Neuropathy",
    ],
    lowSymptoms: ["Hypoglycemia symptoms"],
    causes: {
      high: ["Diabetes", "Poor glucose control", "Chronic stress"],
      low: ["Over-treatment with insulin"],
    },
    recommendations: {
      high: [
        "Dietary changes",
        "Regular exercise",
        "Weight management",
        "Medication adjustment",
      ],
      low: ["Medication review", "Balanced diet"],
    },
    relatedBiomarkers: ["Fasting Glucose", "Insulin", "C-Peptide"],
    testFrequency: "Every 3-6 months for diabetics, annually for others",
    notes:
      "HbA1c <5.7% is considered normal. 5.7-6.4% indicates prediabetes. ≥6.5% indicates diabetes.",
  },

  insulin: {
    name: "Fasting Insulin",
    aliases: ["insulin level", "fasting insulin"],
    category: "Glucose & Metabolism",
    description:
      "Measures insulin production. High levels indicate insulin resistance.",
    optimalRange: { min: 2.0, max: 5.0, unit: "mIU/L" },
    normalRange: { min: 2.0, max: 12.0, unit: "mIU/L" },
    highSymptoms: [
      "Weight gain",
      "Fatigue",
      "Brain fog",
      "Cravings for sugar",
    ],
    lowSymptoms: ["Hypoglycemia", "Weakness"],
    causes: {
      high: [
        "Insulin resistance",
        "Metabolic syndrome",
        "Poor diet",
        "Sedentary lifestyle",
      ],
      low: ["Type 1 diabetes", "Pancreatic issues"],
    },
    recommendations: {
      high: [
        "Low glycemic diet",
        "Regular exercise",
        "Weight loss",
        "Intermittent fasting",
      ],
      low: ["Insulin therapy", "Medical consultation"],
    },
    relatedBiomarkers: ["Glucose", "HbA1c", "HOMA-IR"],
    testFrequency: "Annually or if metabolic concerns",
    notes:
      "Optimal fasting insulin is <5 mIU/L. Levels >10 suggest insulin resistance.",
  },

  // LIPID PANEL
  cholesterol: {
    name: "Total Cholesterol",
    aliases: ["total cholesterol", "serum cholesterol"],
    category: "Lipid Panel",
    description:
      "Sum of all cholesterol in blood. Important for cardiovascular health assessment.",
    optimalRange: { min: 0, max: 200, unit: "mg/dL" },
    normalRange: { min: 0, max: 200, unit: "mg/dL" },
    highSymptoms: ["Usually none (silent condition)"],
    lowSymptoms: ["Fatigue", "Hormonal issues"],
    causes: {
      high: [
        "High saturated fat diet",
        "Genetics",
        "Sedentary lifestyle",
        "Age",
      ],
      low: ["Malnutrition", "Liver disease", "Hyperthyroidism"],
    },
    recommendations: {
      high: [
        "Reduce saturated fats",
        "Increase soluble fiber",
        "Exercise regularly",
        "Consider statins if needed",
      ],
      low: ["Nutritional support", "Medical evaluation"],
    },
    relatedBiomarkers: ["LDL", "HDL", "Triglycerides"],
    testFrequency: "Every 4-6 years, or annually if elevated",
    notes:
      "Total cholesterol alone is not sufficient. Look at HDL/LDL ratio for better assessment.",
  },

  ldl: {
    name: "LDL Cholesterol",
    aliases: ["bad cholesterol", "low-density lipoprotein"],
    category: "Lipid Panel",
    description:
      "Carries cholesterol to arteries. High levels increase cardiovascular risk.",
    optimalRange: { min: 0, max: 100, unit: "mg/dL" },
    normalRange: { min: 0, max: 130, unit: "mg/dL" },
    highSymptoms: ["Usually none"],
    lowSymptoms: ["Rare"],
    causes: {
      high: [
        "High saturated fat diet",
        "Genetics",
        "Sedentary lifestyle",
        "Smoking",
      ],
      low: ["Malnutrition", "Liver disease"],
    },
    recommendations: {
      high: [
        "Mediterranean diet",
        "Increase fiber",
        "Regular aerobic exercise",
        "Reduce trans fats",
        "Consider statins",
      ],
      low: ["Nutritional assessment"],
    },
    relatedBiomarkers: ["HDL", "Triglycerides", "Total Cholesterol"],
    testFrequency: "Every 4-6 years, or annually if elevated",
    notes:
      "Optimal LDL is <100 mg/dL. <70 mg/dL for those with heart disease.",
  },

  hdl: {
    name: "HDL Cholesterol",
    aliases: ["good cholesterol", "high-density lipoprotein"],
    category: "Lipid Panel",
    description:
      "Removes cholesterol from arteries. Higher levels are protective.",
    optimalRange: { min: 60, max: 300, unit: "mg/dL" },
    normalRange: { min: 40, max: 300, unit: "mg/dL" },
    highSymptoms: ["None (beneficial)"],
    lowSymptoms: ["Increased cardiovascular risk"],
    causes: {
      high: ["Regular exercise", "Healthy diet", "Moderate alcohol"],
      low: [
        "Sedentary lifestyle",
        "Poor diet",
        "Smoking",
        "Obesity",
        "Genetics",
      ],
    },
    recommendations: {
      high: ["Maintain current lifestyle"],
      low: [
        "Increase aerobic exercise",
        "Healthy fats",
        "Quit smoking",
        "Weight loss",
      ],
    },
    relatedBiomarkers: ["LDL", "Triglycerides", "Total Cholesterol"],
    testFrequency: "Every 4-6 years, or annually if low",
    notes: "Higher HDL is better. Aim for >60 mg/dL for cardiovascular protection.",
  },

  triglycerides: {
    name: "Triglycerides",
    aliases: ["blood triglycerides", "trigs"],
    category: "Lipid Panel",
    description:
      "Type of fat in blood. High levels increase cardiovascular and metabolic risk.",
    optimalRange: { min: 0, max: 100, unit: "mg/dL" },
    normalRange: { min: 0, max: 150, unit: "mg/dL" },
    highSymptoms: ["Usually none"],
    lowSymptoms: ["Rare"],
    causes: {
      high: [
        "High carb diet",
        "Excess alcohol",
        "Obesity",
        "Metabolic syndrome",
        "Diabetes",
      ],
      low: ["Malnutrition", "Hyperthyroidism"],
    },
    recommendations: {
      high: [
        "Reduce refined carbs",
        "Limit alcohol",
        "Increase omega-3s",
        "Regular exercise",
        "Weight loss",
      ],
      low: ["Nutritional support"],
    },
    relatedBiomarkers: ["Glucose", "Insulin", "HDL"],
    testFrequency: "Every 4-6 years, or annually if elevated",
    notes:
      "Optimal is <100 mg/dL. High triglycerides often indicate metabolic dysfunction.",
  },

  // THYROID
  tsh: {
    name: "TSH (Thyroid Stimulating Hormone)",
    aliases: ["thyroid stimulating hormone", "TSH level"],
    category: "Thyroid",
    description:
      "Produced by pituitary gland. Controls thyroid function. First test for thyroid issues.",
    optimalRange: { min: 0.5, max: 2.5, unit: "mIU/L" },
    normalRange: { min: 0.4, max: 4.0, unit: "mIU/L" },
    highSymptoms: [
      "Fatigue",
      "Weight gain",
      "Cold sensitivity",
      "Dry skin",
      "Hair loss",
      "Depression",
    ],
    lowSymptoms: [
      "Anxiety",
      "Tremor",
      "Weight loss",
      "Heat sensitivity",
      "Insomnia",
    ],
    causes: {
      high: ["Hypothyroidism", "Hashimoto's", "Iodine deficiency"],
      low: ["Hyperthyroidism", "Graves' disease", "Thyroiditis"],
    },
    recommendations: {
      high: [
        "Thyroid medication",
        "Iodine-rich foods",
        "Selenium supplementation",
        "Stress management",
      ],
      low: [
        "Thyroid medication",
        "Beta-blockers if needed",
        "Stress reduction",
      ],
    },
    relatedBiomarkers: ["Free T3", "Free T4", "TPO Antibodies"],
    testFrequency: "Annually or as recommended",
    notes:
      "Optimal TSH is 0.5-2.5 mIU/L. Normal range is wider but optimal is narrower.",
  },

  // INFLAMMATION
  crp: {
    name: "C-Reactive Protein (hs-CRP)",
    aliases: ["CRP", "high-sensitivity CRP", "hs-CRP"],
    category: "Inflammation",
    description:
      "Marker of systemic inflammation. Elevated levels indicate increased cardiovascular risk.",
    optimalRange: { min: 0, max: 1.0, unit: "mg/L" },
    normalRange: { min: 0, max: 3.0, unit: "mg/L" },
    highSymptoms: ["Usually none (chronic inflammation)"],
    lowSymptoms: ["None"],
    causes: {
      high: [
        "Chronic inflammation",
        "Infection",
        "Cardiovascular disease",
        "Obesity",
        "Smoking",
      ],
      low: ["Anti-inflammatory lifestyle"],
    },
    recommendations: {
      high: [
        "Anti-inflammatory diet",
        "Regular exercise",
        "Stress management",
        "Omega-3 supplementation",
        "Sleep optimization",
      ],
      low: ["Maintain current lifestyle"],
    },
    relatedBiomarkers: ["Homocysteine", "Fibrinogen"],
    testFrequency: "Annually or if cardiovascular risk",
    notes:
      "Optimal <1.0 mg/L. 1.0-3.0 moderate risk. >3.0 high cardiovascular risk.",
  },

  // LIVER FUNCTION
  ast: {
    name: "AST (Aspartate Aminotransferase)",
    aliases: ["SGOT", "aspartate aminotransferase"],
    category: "Liver Function",
    description:
      "Enzyme found in liver and muscles. Elevated levels may indicate liver damage.",
    optimalRange: { min: 0, max: 30, unit: "U/L" },
    normalRange: { min: 0, max: 40, unit: "U/L" },
    highSymptoms: ["Jaundice", "Abdominal pain", "Fatigue", "Dark urine"],
    lowSymptoms: ["Rare"],
    causes: {
      high: [
        "Liver disease",
        "Hepatitis",
        "Alcohol abuse",
        "Muscle injury",
        "Certain medications",
      ],
      low: ["Vitamin B6 deficiency"],
    },
    recommendations: {
      high: [
        "Reduce alcohol",
        "Liver-supportive diet",
        "Medical evaluation",
        "Avoid hepatotoxic drugs",
      ],
      low: ["B6 supplementation"],
    },
    relatedBiomarkers: ["ALT", "Bilirubin", "Albumin"],
    testFrequency: "As part of annual physical or if symptoms",
    notes: "AST/ALT ratio can indicate type of liver damage.",
  },

  alt: {
    name: "ALT (Alanine Aminotransferase)",
    aliases: ["SGPT", "alanine aminotransferase"],
    category: "Liver Function",
    description:
      "Enzyme found primarily in liver. More specific to liver damage than AST.",
    optimalRange: { min: 0, max: 30, unit: "U/L" },
    normalRange: { min: 0, max: 40, unit: "U/L" },
    highSymptoms: ["Jaundice", "Abdominal pain", "Fatigue", "Nausea"],
    lowSymptoms: ["Rare"],
    causes: {
      high: [
        "Fatty liver disease",
        "Hepatitis",
        "Cirrhosis",
        "Alcohol abuse",
        "Certain medications",
      ],
      low: ["Vitamin B6 deficiency"],
    },
    recommendations: {
      high: [
        "Weight loss if overweight",
        "Reduce alcohol",
        "Liver-supportive diet",
        "Medical evaluation",
      ],
      low: ["B6 supplementation"],
    },
    relatedBiomarkers: ["AST", "Bilirubin", "Albumin"],
    testFrequency: "As part of annual physical or if symptoms",
    notes:
      "ALT is more liver-specific than AST. Elevated ALT suggests liver damage.",
  },

  // KIDNEY FUNCTION
  creatinine: {
    name: "Creatinine",
    aliases: ["serum creatinine", "creatinine level"],
    category: "Kidney Function",
    description:
      "Waste product from muscle metabolism. Elevated levels indicate kidney dysfunction.",
    optimalRange: { min: 0.6, max: 1.2, unit: "mg/dL" },
    normalRange: { min: 0.7, max: 1.3, unit: "mg/dL" },
    highSymptoms: ["Fatigue", "Swelling", "Nausea", "Shortness of breath"],
    lowSymptoms: ["Muscle weakness"],
    causes: {
      high: [
        "Kidney disease",
        "Diabetes",
        "Hypertension",
        "Dehydration",
        "Muscle breakdown",
      ],
      low: ["Low muscle mass", "Liver disease"],
    },
    recommendations: {
      high: [
        "Kidney-protective diet",
        "Blood pressure control",
        "Diabetes management",
        "Hydration",
        "Medical monitoring",
      ],
      low: ["Nutritional support"],
    },
    relatedBiomarkers: ["BUN", "eGFR", "Cystatin C"],
    testFrequency: "Annually or more if kidney concerns",
    notes:
      "Creatinine alone is not sufficient. eGFR provides better kidney function assessment.",
  },

  bun: {
    name: "BUN (Blood Urea Nitrogen)",
    aliases: ["urea nitrogen", "blood urea"],
    category: "Kidney Function",
    description:
      "Waste product from protein metabolism. Elevated levels may indicate kidney or liver issues.",
    optimalRange: { min: 7, max: 20, unit: "mg/dL" },
    normalRange: { min: 7, max: 20, unit: "mg/dL" },
    highSymptoms: ["Fatigue", "Confusion", "Nausea", "Swelling"],
    lowSymptoms: ["Liver disease symptoms"],
    causes: {
      high: [
        "Kidney disease",
        "Dehydration",
        "High protein diet",
        "Urinary tract obstruction",
      ],
      low: ["Liver disease", "Malnutrition", "Pregnancy"],
    },
    recommendations: {
      high: [
        "Adequate hydration",
        "Kidney-protective diet",
        "Medical evaluation",
        "Monitor protein intake",
      ],
      low: ["Nutritional support", "Medical evaluation"],
    },
    relatedBiomarkers: ["Creatinine", "eGFR", "Sodium"],
    testFrequency: "Annually or if kidney concerns",
    notes: "BUN/Creatinine ratio helps differentiate causes of elevated BUN.",
  },

  // IRON
  ferritin: {
    name: "Ferritin",
    aliases: ["serum ferritin", "iron stores"],
    category: "Iron Metabolism",
    description:
      "Stores iron in body. Elevated levels may indicate iron overload or inflammation.",
    optimalRange: { min: 30, max: 100, unit: "ng/mL" },
    normalRange: { min: 30, max: 400, unit: "ng/mL" },
    highSymptoms: [
      "Joint pain",
      "Fatigue",
      "Heart problems",
      "Liver damage",
      "Diabetes",
    ],
    lowSymptoms: ["Fatigue", "Weakness", "Shortness of breath", "Hair loss"],
    causes: {
      high: [
        "Iron overload",
        "Hemochromatosis",
        "Inflammation",
        "Liver disease",
      ],
      low: ["Iron deficiency", "Blood loss", "Poor diet"],
    },
    recommendations: {
      high: [
        "Limit iron-rich foods",
        "Avoid iron supplements",
        "Phlebotomy if needed",
        "Medical monitoring",
      ],
      low: [
        "Iron supplementation",
        "Iron-rich foods",
        "Vitamin C for absorption",
      ],
    },
    relatedBiomarkers: ["Iron", "TIBC", "Hemoglobin"],
    testFrequency: "Annually or if symptoms",
    notes:
      "Ferritin is an acute phase reactant. May be elevated with inflammation.",
  },

  // VITAMIN D
  vitaminD: {
    name: "Vitamin D (25-Hydroxyvitamin D)",
    aliases: ["vitamin D", "25-OH vitamin D", "calcifediol"],
    category: "Vitamins & Minerals",
    description:
      "Essential for bone health, immunity, and mood. Deficiency is common.",
    optimalRange: { min: 40, max: 60, unit: "ng/mL" },
    normalRange: { min: 30, max: 100, unit: "ng/mL" },
    highSymptoms: ["Nausea", "Weakness", "Kidney stones", "Hypercalcemia"],
    lowSymptoms: [
      "Fatigue",
      "Bone pain",
      "Muscle weakness",
      "Depression",
      "Infections",
    ],
    causes: {
      high: ["Excessive supplementation", "Sun exposure"],
      low: [
        "Limited sun exposure",
        "Poor diet",
        "Malabsorption",
        "Kidney disease",
      ],
    },
    recommendations: {
      high: ["Reduce supplementation", "Medical monitoring"],
      low: [
        "Sun exposure (15-30 min daily)",
        "Vitamin D-rich foods",
        "Supplementation",
      ],
    },
    relatedBiomarkers: ["Calcium", "Phosphorus", "Parathyroid Hormone"],
    testFrequency: "Annually or if deficiency suspected",
    notes:
      "Optimal is 40-60 ng/mL. Many experts recommend 50+ ng/mL for optimal health.",
  },

  // MAGNESIUM
  magnesium: {
    name: "Magnesium",
    aliases: ["serum magnesium", "Mg"],
    category: "Vitamins & Minerals",
    description:
      "Essential for muscle, nerve, and heart function. Deficiency is common.",
    optimalRange: { min: 2.0, max: 2.5, unit: "mg/dL" },
    normalRange: { min: 1.7, max: 2.2, unit: "mg/dL" },
    highSymptoms: ["Nausea", "Weakness", "Heart arrhythmias"],
    lowSymptoms: [
      "Muscle cramps",
      "Tremor",
      "Anxiety",
      "Insomnia",
      "Heart palpitations",
    ],
    causes: {
      high: ["Kidney disease", "Excessive supplementation"],
      low: [
        "Poor diet",
        "Stress",
        "Alcohol abuse",
        "Certain medications",
        "Diarrhea",
      ],
    },
    recommendations: {
      high: ["Reduce supplementation", "Medical monitoring"],
      low: [
        "Magnesium-rich foods",
        "Supplementation",
        "Stress reduction",
        "Limit alcohol",
      ],
    },
    relatedBiomarkers: ["Calcium", "Potassium", "Phosphorus"],
    testFrequency: "If symptoms or risk factors present",
    notes:
      "Serum magnesium is not the best indicator. RBC magnesium is more accurate.",
  },
};

/**
 * Get biomarker information by name or alias
 */
export function getBiomarkerInfo(query: string): BiomarkerInfo | null {
  const lowerQuery = query.toLowerCase();

  for (const biomarker of Object.values(biomarkerDatabase)) {
    if (
      biomarker.name.toLowerCase().includes(lowerQuery) ||
      biomarker.aliases.some((alias) => alias.toLowerCase().includes(lowerQuery))
    ) {
      return biomarker;
    }
  }

  return null;
}

/**
 * Get all biomarkers in a category
 */
export function getBiomarkersByCategory(category: string): BiomarkerInfo[] {
  return Object.values(biomarkerDatabase).filter(
    (b) => b.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  for (const biomarker of Object.values(biomarkerDatabase)) {
    categories.add(biomarker.category);
  }
  return Array.from(categories).sort();
}

/**
 * Generate a summary for a biomarker value
 */
export function generateBiomarkerSummary(
  biomarkerName: string,
  value: number
): string {
  const info = getBiomarkerInfo(biomarkerName);
  if (!info) return "Biomarker not found in knowledge base.";

  const { optimalRange, normalRange, highSymptoms, lowSymptoms } = info;

  if (value < optimalRange.min) {
    return `Your ${info.name} is low (${value} ${info.optimalRange.unit}). This may cause: ${lowSymptoms.join(", ")}. Recommendations: ${info.recommendations.low.join(", ")}`;
  } else if (value > optimalRange.max) {
    return `Your ${info.name} is elevated (${value} ${info.optimalRange.unit}). This may cause: ${highSymptoms.join(", ")}. Recommendations: ${info.recommendations.high.join(", ")}`;
  } else {
    return `Your ${info.name} is optimal (${value} ${info.optimalRange.unit}). Keep up your current lifestyle!`;
  }
}
