export interface BiomarkerProfile {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  categoryColor: string;
  unit: string;
  standardRange: { low: number; high: number; label: string };
  optimalRange: { low: number; high: number; label: string };
  zones: {
    criticalLow: { max: number; label: string };
    suboptimal: { min: number; max: number; label: string };
    optimal: { min: number; max: number; label: string };
    normal: { min: number; max: number; label: string };
    high: { min: number; label: string };
  };
  overview: string;
  whyItMatters: string;
  symptomsLow: string[];
  symptomsHigh: string[];
  lifestyleFactors: Array<{ factor: string; impact: string }>;
  nutritionTips: string[];
  doctorQuestions: string[];
  relatedChapters: Array<{ book: string; chapter: string; topic: string }>;
  icon: string;
}

export const BIOMARKER_PROFILES: BiomarkerProfile[] = [
  {
    slug: "ferritin",
    name: "Ferritin (Iron Storage)",
    shortName: "Ferritin",
    category: "Nutrient Balance",
    categoryColor: "#D48C70",
    unit: "ng/mL",
    standardRange: { low: 15, high: 150, label: "15–150 ng/mL" },
    optimalRange: { low: 50, high: 100, label: "50–100 ng/mL" },
    zones: {
      criticalLow: { max: 12, label: "Critical Low (Clinical Anemia)" },
      suboptimal: { min: 12, max: 50, label: "Suboptimal / Low Iron Stores" },
      optimal: { min: 50, max: 100, label: "Optimal Wellness Zone" },
      normal: { min: 100, max: 150, label: "Normal (Standard Range)" },
      high: { min: 150, label: "High / Potential Inflammation" },
    },
    overview:
      "Ferritin is the primary iron storage protein in the body. It reflects how much iron your body has in reserve. Standard labs only flag ferritin as abnormal when it falls below 15 ng/mL — the threshold for clinical anemia. However, functional medicine research shows that many people experience significant fatigue, hair loss, and cognitive impairment when ferritin drops below 50 ng/mL, even though their labs read 'normal'.",
    whyItMatters:
      "Iron is required for hemoglobin production, mitochondrial energy generation, thyroid hormone conversion, and neurotransmitter synthesis. Subclinical iron depletion — where ferritin is technically normal but below optimal — is one of the most commonly missed causes of unexplained fatigue, especially in women of reproductive age.",
    symptomsLow: [
      "Chronic fatigue and low energy",
      "Hair thinning or excessive shedding",
      "Cold hands and feet",
      "Brain fog and difficulty concentrating",
      "Brittle nails",
      "Restless legs at night",
      "Shortness of breath during mild exertion",
    ],
    symptomsHigh: [
      "Joint pain and stiffness",
      "Abdominal pain",
      "Fatigue (paradoxically)",
      "Skin bronzing or darkening",
      "Elevated liver enzymes",
    ],
    lifestyleFactors: [
      {
        factor: "Menstruation",
        impact: "Monthly blood loss is the #1 cause of low ferritin in women. Track your cycle alongside labs.",
      },
      {
        factor: "Intense exercise",
        impact: "Endurance athletes have higher iron turnover. Foot-strike hemolysis in runners can deplete ferritin rapidly.",
      },
      {
        factor: "Chronic inflammation",
        impact: "Inflammation elevates ferritin as an acute-phase reactant, masking true iron status. Always check CRP alongside ferritin.",
      },
      {
        factor: "Dietary patterns",
        impact: "Plant-based diets provide non-heme iron, which has lower bioavailability. Vitamin C dramatically improves absorption.",
      },
      {
        factor: "Gut health",
        impact: "Poor gut integrity reduces iron absorption. Celiac disease, H. pylori, and low stomach acid are common culprits.",
      },
    ],
    nutritionTips: [
      "Pair iron-rich foods with vitamin C (e.g., spinach + lemon juice)",
      "Eat red meat, organ meats, or shellfish 2–3x/week for heme iron",
      "Avoid coffee and tea within 1 hour of iron-rich meals (tannins block absorption)",
      "Cook in cast iron pans to add dietary iron",
      "Include legumes, pumpkin seeds, and dark leafy greens daily",
    ],
    doctorQuestions: [
      "My ferritin is within the standard range but below 50 ng/mL — could this explain my fatigue?",
      "Should we recheck my ferritin in 3 months after dietary changes?",
      "Is my CRP elevated, which might be artificially raising my ferritin reading?",
      "Should we check a full iron panel (serum iron, TIBC, transferrin saturation) alongside ferritin?",
      "Could my gut health be affecting my iron absorption?",
    ],
    relatedChapters: [
      {
        book: "The Patient's Compass",
        chapter: "Chapter 4",
        topic: "Iron: The Energy Mineral",
      },
      {
        book: "Your Chronic Disease Lab Guide",
        chapter: "Chapter 7",
        topic: "Fatigue Panels & Nutrient Deficiencies",
      },
    ],
    icon: "🩸",
  },
  {
    slug: "tsh",
    name: "Thyroid Stimulating Hormone (TSH)",
    shortName: "TSH",
    category: "Hormonal System",
    categoryColor: "#A39EBA",
    unit: "mIU/L",
    standardRange: { low: 0.45, high: 4.5, label: "0.45–4.5 mIU/L" },
    optimalRange: { low: 1.0, high: 2.5, label: "1.0–2.5 mIU/L" },
    zones: {
      criticalLow: { max: 0.1, label: "Suppressed (Hyperthyroid Risk)" },
      suboptimal: { min: 0.1, max: 1.0, label: "Low-Normal / Possible Hyperthyroid Trend" },
      optimal: { min: 1.0, max: 2.5, label: "Optimal Wellness Zone" },
      normal: { min: 2.5, max: 4.5, label: "Normal (Standard Range)" },
      high: { min: 4.5, label: "Elevated (Hypothyroid Risk)" },
    },
    overview:
      "TSH is produced by the pituitary gland to signal the thyroid to produce hormones. When TSH is high, it means the pituitary is working harder to stimulate a sluggish thyroid. Standard labs consider TSH up to 4.5 mIU/L as normal — but functional medicine practitioners find that many patients experience classic hypothyroid symptoms (fatigue, weight gain, brain fog) when TSH rises above 2.5 mIU/L.",
    whyItMatters:
      "The thyroid regulates metabolism, body temperature, heart rate, and energy production. Subclinical hypothyroidism — where TSH is elevated but still within the 'normal' range — is estimated to affect 3–8% of the population and is frequently missed by standard screening alone.",
    symptomsLow: [
      "Heart palpitations",
      "Anxiety or nervousness",
      "Unexplained weight loss",
      "Heat intolerance",
      "Tremors",
      "Insomnia",
    ],
    symptomsHigh: [
      "Fatigue and sluggishness",
      "Unexplained weight gain",
      "Cold intolerance",
      "Dry skin and hair",
      "Brain fog",
      "Depression",
      "Constipation",
      "Muscle weakness",
    ],
    lifestyleFactors: [
      {
        factor: "Iodine intake",
        impact: "Both too little and too much iodine can disrupt thyroid function. Seaweed and iodized salt are key sources.",
      },
      {
        factor: "Selenium",
        impact: "Selenium is essential for converting T4 to active T3. Brazil nuts (1–2/day) are an excellent source.",
      },
      {
        factor: "Stress",
        impact: "Chronic cortisol elevation suppresses thyroid function and impairs T4-to-T3 conversion.",
      },
      {
        factor: "Goitrogenic foods",
        impact: "Raw cruciferous vegetables (kale, broccoli) in very large amounts may affect thyroid in iodine-deficient individuals. Cooking deactivates goitrogens.",
      },
      {
        factor: "Sleep quality",
        impact: "TSH follows a circadian rhythm. Poor sleep disrupts the normal TSH surge that occurs during deep sleep.",
      },
    ],
    nutritionTips: [
      "Eat 1–2 Brazil nuts daily for selenium (do not exceed — selenium toxicity is possible)",
      "Include iodine-rich foods: seafood, dairy, eggs, iodized salt",
      "Ensure adequate zinc from meat, shellfish, and pumpkin seeds",
      "Avoid extreme calorie restriction — it suppresses thyroid output",
      "Prioritize anti-inflammatory foods to reduce thyroid autoimmunity risk",
    ],
    doctorQuestions: [
      "My TSH is between 2.5 and 4.5 — could this be contributing to my fatigue and weight gain?",
      "Should we also check Free T3, Free T4, and thyroid antibodies (TPO, TgAb)?",
      "Is there a family history consideration for Hashimoto's thyroiditis?",
      "How often should we recheck my TSH to track trends?",
      "Could my selenium or iodine levels be affecting my thyroid function?",
    ],
    relatedChapters: [
      {
        book: "The Patient's Compass",
        chapter: "Chapter 6",
        topic: "The Thyroid-Metabolism Connection",
      },
      {
        book: "Your Chronic Disease Lab Guide",
        chapter: "Chapter 2",
        topic: "Hormonal Panels for Chronic Fatigue",
      },
    ],
    icon: "🦋",
  },
  {
    slug: "hba1c",
    name: "Hemoglobin A1c (HbA1c)",
    shortName: "HbA1c",
    category: "Metabolic System",
    categoryColor: "#7E9A85",
    unit: "%",
    standardRange: { low: 4.0, high: 5.6, label: "4.0–5.6%" },
    optimalRange: { low: 4.6, high: 5.3, label: "4.6–5.3%" },
    zones: {
      criticalLow: { max: 4.0, label: "Very Low (Hypoglycemia Risk)" },
      suboptimal: { min: 4.0, max: 4.6, label: "Low-Normal" },
      optimal: { min: 4.6, max: 5.3, label: "Optimal Wellness Zone" },
      normal: { min: 5.3, max: 5.6, label: "Normal (Watch Zone)" },
      high: { min: 5.7, label: "Prediabetes / Elevated Risk" },
    },
    overview:
      "HbA1c measures the percentage of hemoglobin coated with glucose over the past 2–3 months, providing a long-term picture of blood sugar regulation. Standard labs flag prediabetes at 5.7% — but functional medicine practitioners consider values above 5.3% as an early warning sign of insulin resistance, often years before a clinical diagnosis.",
    whyItMatters:
      "Insulin resistance is the root driver of Type 2 Diabetes, cardiovascular disease, PCOS, fatty liver, and cognitive decline. Catching rising HbA1c trends early — when lifestyle interventions are most effective — is one of the highest-value preventive health strategies available.",
    symptomsLow: [
      "Shakiness or trembling",
      "Sweating",
      "Confusion or difficulty thinking",
      "Irritability",
    ],
    symptomsHigh: [
      "Post-meal energy crashes",
      "Intense sugar and carbohydrate cravings",
      "Mid-afternoon fatigue",
      "Difficulty losing weight despite calorie restriction",
      "Increased thirst and urination",
      "Brain fog after meals",
      "Abdominal fat accumulation",
    ],
    lifestyleFactors: [
      {
        factor: "Carbohydrate quality",
        impact: "Refined carbohydrates cause rapid glucose spikes. Fiber-rich whole foods blunt the glycemic response.",
      },
      {
        factor: "Meal timing",
        impact: "Time-restricted eating (eating within an 8–10 hour window) improves insulin sensitivity significantly.",
      },
      {
        factor: "Exercise",
        impact: "Resistance training and post-meal walks (10–15 min) are among the most effective tools for lowering HbA1c.",
      },
      {
        factor: "Sleep",
        impact: "Even one night of poor sleep impairs insulin sensitivity by 25%. Chronic sleep deprivation is a major metabolic disruptor.",
      },
      {
        factor: "Stress",
        impact: "Cortisol directly raises blood glucose. Chronic stress is a hidden driver of rising HbA1c.",
      },
    ],
    nutritionTips: [
      "Eat protein and fat before carbohydrates at meals to blunt glucose spikes",
      "Choose low-glycemic carbohydrates: legumes, sweet potatoes, whole grains",
      "Add apple cider vinegar (1 tbsp in water) before meals — shown to reduce post-meal glucose",
      "Prioritize fiber: aim for 25–35g daily from vegetables, legumes, and seeds",
      "Limit liquid calories: fruit juices and sweetened beverages spike glucose rapidly",
    ],
    doctorQuestions: [
      "My HbA1c is between 5.3% and 5.6% — is this a trend I should monitor closely?",
      "Should we also check fasting insulin to assess insulin resistance more directly?",
      "What lifestyle changes would you recommend at this stage to prevent progression?",
      "Should we track my HbA1c every 3–6 months given my family history?",
      "Could my HbA1c be artificially affected by iron deficiency or hemoglobin variants?",
    ],
    relatedChapters: [
      {
        book: "Your Chronic Disease Lab Guide",
        chapter: "Chapter 3",
        topic: "Navigating Metabolic Health & Insulin Resistance",
      },
      {
        book: "The Patient's Compass",
        chapter: "Chapter 8",
        topic: "Blood Sugar: The Silent Epidemic",
      },
    ],
    icon: "🍬",
  },
  {
    slug: "hs-crp",
    name: "High-Sensitivity CRP (hs-CRP)",
    shortName: "hs-CRP",
    category: "Cardiovascular System",
    categoryColor: "#C97B7B",
    unit: "mg/L",
    standardRange: { low: 0, high: 3.0, label: "0.0–3.0 mg/L" },
    optimalRange: { low: 0, high: 1.0, label: "0.0–1.0 mg/L" },
    zones: {
      criticalLow: { max: 0, label: "Not Applicable" },
      suboptimal: { min: 0, max: 0, label: "N/A" },
      optimal: { min: 0, max: 1.0, label: "Optimal (Low Cardiovascular Risk)" },
      normal: { min: 1.0, max: 3.0, label: "Normal (Moderate Risk)" },
      high: { min: 3.0, label: "Elevated (High Cardiovascular Risk)" },
    },
    overview:
      "High-Sensitivity CRP (hs-CRP) is a protein produced by the liver in response to systemic inflammation. It is one of the most sensitive markers of low-grade chronic inflammation — the kind that silently drives cardiovascular disease, metabolic dysfunction, and accelerated aging. Standard labs flag risk above 3.0 mg/L, but optimal cardiovascular and longevity targets aim for under 1.0 mg/L.",
    whyItMatters:
      "Chronic low-grade inflammation is now recognized as the underlying driver of most modern chronic diseases, including heart disease, type 2 diabetes, Alzheimer's, and certain cancers. hs-CRP provides an early window into this inflammatory burden before clinical symptoms appear.",
    symptomsLow: [],
    symptomsHigh: [
      "Joint stiffness and achiness",
      "Muscle soreness without clear cause",
      "Slow recovery from exercise or illness",
      "Systemic fatigue",
      "Brain fog",
      "Gum inflammation or periodontal disease",
      "Skin redness or rashes",
    ],
    lifestyleFactors: [
      {
        factor: "Diet quality",
        impact: "Ultra-processed foods, refined sugars, and industrial seed oils are the primary dietary drivers of elevated CRP.",
      },
      {
        factor: "Body fat",
        impact: "Visceral (abdominal) fat is metabolically active and releases pro-inflammatory cytokines that raise CRP.",
      },
      {
        factor: "Sleep",
        impact: "Poor sleep quality and duration independently elevate CRP. Aim for 7–9 hours of quality sleep.",
      },
      {
        factor: "Exercise",
        impact: "Moderate regular exercise powerfully reduces CRP. However, overtraining without recovery can temporarily raise it.",
      },
      {
        factor: "Smoking",
        impact: "Smoking is one of the strongest lifestyle drivers of elevated CRP. Cessation produces measurable CRP reduction within weeks.",
      },
    ],
    nutritionTips: [
      "Follow a Mediterranean-style diet rich in olive oil, fish, vegetables, and legumes",
      "Eat fatty fish (salmon, sardines, mackerel) 2–3x/week for omega-3 fatty acids",
      "Include turmeric with black pepper daily (curcumin is a potent anti-inflammatory)",
      "Eat a variety of colorful vegetables for polyphenols and antioxidants",
      "Reduce ultra-processed foods, refined carbohydrates, and trans fats",
    ],
    doctorQuestions: [
      "My hs-CRP is between 1.0 and 3.0 mg/L — what does this mean for my cardiovascular risk?",
      "Should we investigate potential sources of inflammation (dental, gut, autoimmune)?",
      "How does my hs-CRP relate to my other cardiovascular risk markers (LDL, triglycerides)?",
      "Would an anti-inflammatory dietary protocol be appropriate to try for 3 months?",
      "Should we recheck hs-CRP after I make lifestyle changes to see if it responds?",
    ],
    relatedChapters: [
      {
        book: "The Patient's Compass",
        chapter: "Chapter 9",
        topic: "Inflammation: The Silent Driver",
      },
      {
        book: "Your Chronic Disease Lab Guide",
        chapter: "Chapter 5",
        topic: "Cardiovascular Risk Beyond Cholesterol",
      },
    ],
    icon: "❤️",
  },
  {
    slug: "alt",
    name: "Alanine Aminotransferase (ALT)",
    shortName: "ALT",
    category: "Liver System",
    categoryColor: "#8B9E6E",
    unit: "U/L",
    standardRange: { low: 7, high: 56, label: "7–56 U/L" },
    optimalRange: { low: 10, high: 25, label: "10–25 U/L" },
    zones: {
      criticalLow: { max: 5, label: "Very Low (Possible Deficiency)" },
      suboptimal: { min: 5, max: 10, label: "Low-Normal" },
      optimal: { min: 10, max: 25, label: "Optimal Wellness Zone" },
      normal: { min: 25, max: 56, label: "Normal (Watch Zone)" },
      high: { min: 56, label: "Elevated (Liver Stress)" },
    },
    overview:
      "ALT is an enzyme primarily found in liver cells. When liver cells are damaged or stressed, ALT leaks into the bloodstream. Standard labs allow ALT up to 56 U/L, but functional medicine practitioners look for early signs of fatty liver or metabolic stress when ALT exceeds 25 U/L, particularly when combined with other metabolic markers.",
    whyItMatters:
      "Non-alcoholic fatty liver disease (NAFLD) is now the most common liver condition worldwide, affecting an estimated 25% of adults. It is strongly linked to insulin resistance and metabolic syndrome. Catching rising ALT trends early — before they reach the clinical threshold — allows for effective lifestyle intervention.",
    symptomsLow: [],
    symptomsHigh: [
      "Abdominal bloating, especially after fatty meals",
      "Sluggish digestion",
      "Fatigue after eating",
      "Right upper abdominal discomfort",
      "Nausea",
      "Yellowing of skin or eyes (jaundice — severe cases only)",
    ],
    lifestyleFactors: [
      {
        factor: "Alcohol consumption",
        impact: "Even moderate alcohol intake raises ALT. The liver prioritizes alcohol metabolism over fat metabolism.",
      },
      {
        factor: "Fructose intake",
        impact: "High-fructose corn syrup and excessive fruit juice are directly metabolized by the liver and contribute to fatty liver.",
      },
      {
        factor: "Medications",
        impact: "Statins, NSAIDs, acetaminophen, and certain supplements can elevate ALT. Always disclose all medications.",
      },
      {
        factor: "Exercise",
        impact: "Intense exercise can temporarily raise ALT (muscle breakdown). Recheck after 48–72 hours rest if elevated after hard training.",
      },
      {
        factor: "Body weight",
        impact: "Visceral fat accumulation is the primary driver of NAFLD. Even 5–10% weight loss can normalize elevated ALT.",
      },
    ],
    nutritionTips: [
      "Reduce alcohol to zero or minimal amounts",
      "Eliminate high-fructose corn syrup and sweetened beverages",
      "Eat cruciferous vegetables (broccoli, Brussels sprouts) for liver detoxification support",
      "Include coffee (2–3 cups/day) — consistently shown to reduce liver inflammation",
      "Prioritize choline-rich foods (eggs, liver, salmon) for fat transport from the liver",
    ],
    doctorQuestions: [
      "My ALT is between 25 and 56 U/L — could this indicate early fatty liver?",
      "Should we do a liver ultrasound to assess for fatty infiltration?",
      "Could any of my current medications be contributing to this elevation?",
      "Should we check AST, GGT, and alkaline phosphatase for a complete liver panel?",
      "What lifestyle changes would you recommend to bring my ALT into the optimal range?",
    ],
    relatedChapters: [
      {
        book: "The Patient's Compass",
        chapter: "Chapter 11",
        topic: "Liver Health & Metabolic Detoxification",
      },
      {
        book: "Your Chronic Disease Lab Guide",
        chapter: "Chapter 6",
        topic: "Fatty Liver: The Silent Epidemic",
      },
    ],
    icon: "🫀",
  },
  {
    slug: "vitamin-d",
    name: "Vitamin D (25-OH)",
    shortName: "Vitamin D",
    category: "Nutrient Balance",
    categoryColor: "#E8B84B",
    unit: "ng/mL",
    standardRange: { low: 20, high: 100, label: "20–100 ng/mL" },
    optimalRange: { low: 50, high: 80, label: "50–80 ng/mL" },
    zones: {
      criticalLow: { max: 12, label: "Severe Deficiency" },
      suboptimal: { min: 12, max: 50, label: "Insufficient / Suboptimal" },
      optimal: { min: 50, max: 80, label: "Optimal Wellness Zone" },
      normal: { min: 80, max: 100, label: "Normal (High-Normal)" },
      high: { min: 100, label: "Potentially Toxic (Supplementation Review)" },
    },
    overview:
      "Vitamin D is technically a hormone, not just a vitamin. It is produced in the skin upon sun exposure and regulates over 200 genes involved in immune function, bone health, mood regulation, and cancer prevention. Standard labs consider anything above 20 ng/mL as sufficient, but research consistently shows optimal immune and metabolic function requires levels between 50–80 ng/mL.",
    whyItMatters:
      "Vitamin D deficiency is estimated to affect over 1 billion people worldwide. It is strongly linked to increased risk of autoimmune diseases, depression, cardiovascular disease, respiratory infections, and certain cancers. Most people living above 35° latitude are deficient during winter months regardless of diet.",
    symptomsLow: [
      "Frequent infections and slow recovery",
      "Bone pain or muscle weakness",
      "Fatigue and low energy",
      "Depression or seasonal mood changes",
      "Hair loss",
      "Impaired wound healing",
      "Back pain",
    ],
    symptomsHigh: [
      "Nausea and vomiting (from supplementation excess)",
      "Weakness",
      "Frequent urination",
      "Kidney stones (very high levels)",
    ],
    lifestyleFactors: [
      {
        factor: "Sun exposure",
        impact: "15–30 minutes of midday sun on arms and legs produces 10,000–20,000 IU of Vitamin D. Sunscreen blocks production.",
      },
      {
        factor: "Skin tone",
        impact: "Darker skin requires 3–5x more sun exposure to produce equivalent Vitamin D. Supplementation is especially important.",
      },
      {
        factor: "Body fat",
        impact: "Vitamin D is fat-soluble and stored in adipose tissue. Higher body fat can reduce circulating levels.",
      },
      {
        factor: "Magnesium",
        impact: "Magnesium is required to activate Vitamin D. Deficiency in magnesium impairs Vitamin D metabolism.",
      },
      {
        factor: "Gut health",
        impact: "Fat malabsorption conditions (Crohn's, celiac) reduce Vitamin D absorption from food and supplements.",
      },
    ],
    nutritionTips: [
      "Eat fatty fish (salmon, mackerel, sardines) 2–3x/week for dietary Vitamin D",
      "Include egg yolks and fortified dairy or plant milks",
      "Take Vitamin D3 with K2 (MK-7) for proper calcium routing",
      "Take Vitamin D supplements with the largest meal of the day for best absorption",
      "Ensure adequate magnesium intake (leafy greens, nuts, seeds) for Vitamin D activation",
    ],
    doctorQuestions: [
      "My Vitamin D is between 20 and 50 ng/mL — would supplementation be appropriate?",
      "What dose of Vitamin D3 would you recommend to reach the 50–80 ng/mL range?",
      "Should I take Vitamin D with K2 to protect against arterial calcification?",
      "How often should we recheck my Vitamin D level after starting supplementation?",
      "Could my magnesium levels be affecting my Vitamin D metabolism?",
    ],
    relatedChapters: [
      {
        book: "The Patient's Compass",
        chapter: "Chapter 5",
        topic: "The Sunshine Hormone: Vitamin D",
      },
    ],
    icon: "☀️",
  },
  {
    slug: "vitamin-b12",
    name: "Vitamin B12 (Cobalamin)",
    shortName: "B12",
    category: "Nutrient Balance",
    categoryColor: "#7B9EC9",
    unit: "pg/mL",
    standardRange: { low: 200, high: 900, label: "200–900 pg/mL" },
    optimalRange: { low: 500, high: 900, label: "500–900 pg/mL" },
    zones: {
      criticalLow: { max: 150, label: "Severe Deficiency (Neurological Risk)" },
      suboptimal: { min: 150, max: 500, label: "Suboptimal / Functional Deficiency" },
      optimal: { min: 500, max: 900, label: "Optimal Wellness Zone" },
      normal: { min: 900, max: 1200, label: "Normal (High-Normal)" },
      high: { min: 1200, label: "Very High (Investigate Cause)" },
    },
    overview:
      "Vitamin B12 is essential for DNA synthesis, red blood cell formation, and neurological function. Standard labs flag deficiency below 200 pg/mL, but many practitioners find that neurological symptoms — including tingling, memory issues, and fatigue — can occur at levels below 500 pg/mL, particularly in older adults and those on plant-based diets.",
    whyItMatters:
      "B12 deficiency is one of the most common and most underdiagnosed nutritional deficiencies, particularly in vegans, vegetarians, older adults, and those taking metformin or proton pump inhibitors. Neurological damage from B12 deficiency can be irreversible if not caught early.",
    symptomsLow: [
      "Fatigue and weakness",
      "Tingling or numbness in hands and feet",
      "Memory problems and cognitive decline",
      "Depression and mood changes",
      "Pale or yellowish skin",
      "Glossitis (inflamed, smooth tongue)",
      "Balance and coordination problems",
    ],
    symptomsHigh: [
      "Very high B12 without supplementation may indicate liver disease or certain blood cancers — requires investigation",
    ],
    lifestyleFactors: [
      {
        factor: "Dietary sources",
        impact: "B12 is found almost exclusively in animal products. Vegans and vegetarians are at high risk of deficiency.",
      },
      {
        factor: "Medications",
        impact: "Metformin (diabetes medication) and proton pump inhibitors (PPIs) significantly impair B12 absorption.",
      },
      {
        factor: "Age",
        impact: "Stomach acid production declines with age, reducing B12 absorption. Adults over 50 often need supplementation.",
      },
      {
        factor: "MTHFR gene variant",
        impact: "Some people have genetic variants that impair B12 metabolism. Methylcobalamin (active form) is better absorbed.",
      },
      {
        factor: "Gut health",
        impact: "B12 absorption requires intrinsic factor from the stomach. Autoimmune gastritis (pernicious anemia) destroys this.",
      },
    ],
    nutritionTips: [
      "Eat animal products daily: meat, fish, eggs, dairy are the best sources",
      "If plant-based, supplement with methylcobalamin (active form) at 1,000 mcg/day",
      "Choose fortified nutritional yeast as a plant-based B12 source",
      "If on metformin or PPIs, discuss B12 monitoring with your doctor",
      "Sublingual B12 bypasses gut absorption issues for those with intrinsic factor problems",
    ],
    doctorQuestions: [
      "My B12 is between 200 and 500 pg/mL — could this explain my fatigue and tingling?",
      "Should we check methylmalonic acid (MMA) and homocysteine for functional B12 deficiency?",
      "I take metformin/PPIs — should I be supplementing B12 proactively?",
      "Do I have intrinsic factor antibodies that might indicate pernicious anemia?",
      "Would methylcobalamin supplementation be more appropriate than cyanocobalamin for me?",
    ],
    relatedChapters: [
      {
        book: "The Patient's Compass",
        chapter: "Chapter 7",
        topic: "B Vitamins & Neurological Health",
      },
    ],
    icon: "🧠",
  },
  {
    slug: "fasting-insulin",
    name: "Fasting Insulin",
    shortName: "Fasting Insulin",
    category: "Metabolic System",
    categoryColor: "#7E9A85",
    unit: "μIU/mL",
    standardRange: { low: 2, high: 25, label: "2–25 μIU/mL" },
    optimalRange: { low: 2, high: 8, label: "2–8 μIU/mL" },
    zones: {
      criticalLow: { max: 1, label: "Very Low (Possible Type 1 Diabetes)" },
      suboptimal: { min: 1, max: 2, label: "Low-Normal" },
      optimal: { min: 2, max: 8, label: "Optimal Wellness Zone" },
      normal: { min: 8, max: 25, label: "Normal (Insulin Resistance Risk)" },
      high: { min: 25, label: "Elevated (Significant Insulin Resistance)" },
    },
    overview:
      "Fasting insulin is one of the most powerful and underutilized metabolic markers available. Standard labs consider anything under 25 μIU/mL as normal — but functional medicine research shows that insulin resistance begins when fasting insulin rises above 8 μIU/mL, often years before HbA1c or fasting glucose become abnormal.",
    whyItMatters:
      "Hyperinsulinemia (chronically elevated insulin) is the root driver of metabolic syndrome, PCOS, fatty liver, cardiovascular disease, and Type 2 Diabetes. Catching it early through fasting insulin testing — before glucose dysregulation appears — is one of the most impactful preventive health strategies available.",
    symptomsLow: [],
    symptomsHigh: [
      "Stubborn abdominal fat",
      "Difficulty losing weight despite calorie restriction",
      "Intense carbohydrate and sugar cravings",
      "Post-meal energy crashes",
      "Skin tags",
      "Acanthosis nigricans (dark patches in skin folds)",
      "PCOS symptoms in women",
    ],
    lifestyleFactors: [
      {
        factor: "Carbohydrate intake",
        impact: "Refined carbohydrates and sugars are the primary dietary drivers of elevated fasting insulin.",
      },
      {
        factor: "Meal frequency",
        impact: "Frequent snacking keeps insulin elevated throughout the day. Longer gaps between meals allow insulin to fall.",
      },
      {
        factor: "Exercise type",
        impact: "Resistance training is particularly effective at improving insulin sensitivity by increasing muscle glucose uptake.",
      },
      {
        factor: "Sleep",
        impact: "Even one night of poor sleep reduces insulin sensitivity by 25%. Chronic sleep deprivation is a major driver.",
      },
      {
        factor: "Stress",
        impact: "Cortisol directly stimulates insulin secretion and promotes insulin resistance.",
      },
    ],
    nutritionTips: [
      "Reduce refined carbohydrates and added sugars dramatically",
      "Practice time-restricted eating (16:8 or 14:10) to allow insulin to fall",
      "Eat protein at every meal to stabilize blood sugar and reduce insulin spikes",
      "Include apple cider vinegar before meals to blunt insulin response",
      "Prioritize fiber-rich foods that slow glucose absorption",
    ],
    doctorQuestions: [
      "My fasting insulin is above 8 μIU/mL — does this indicate early insulin resistance?",
      "Should we calculate my HOMA-IR score (fasting insulin × fasting glucose / 405)?",
      "What is the most effective lifestyle intervention for reducing fasting insulin?",
      "Could my fasting insulin be contributing to my difficulty losing weight?",
      "Should we check for PCOS if I'm a woman with elevated fasting insulin?",
    ],
    relatedChapters: [
      {
        book: "Your Chronic Disease Lab Guide",
        chapter: "Chapter 3",
        topic: "Navigating Metabolic Health & Insulin Resistance",
      },
    ],
    icon: "⚡",
  },
  {
    slug: "vitamin-d-25oh",
    name: "25-OH Vitamin D",
    shortName: "25-OH Vit D",
    category: "Nutrient Balance",
    categoryColor: "#E8B84B",
    unit: "ng/mL",
    standardRange: { low: 20, high: 100, label: "20–100 ng/mL" },
    optimalRange: { low: 50, high: 80, label: "50–80 ng/mL" },
    zones: {
      criticalLow: { max: 12, label: "Severe Deficiency" },
      suboptimal: { min: 12, max: 50, label: "Insufficient / Suboptimal" },
      optimal: { min: 50, max: 80, label: "Optimal Wellness Zone" },
      normal: { min: 80, max: 100, label: "Normal (High-Normal)" },
      high: { min: 100, label: "Potentially Toxic" },
    },
    overview: "See Vitamin D (25-OH) profile above.",
    whyItMatters: "See Vitamin D (25-OH) profile above.",
    symptomsLow: [],
    symptomsHigh: [],
    lifestyleFactors: [],
    nutritionTips: [],
    doctorQuestions: [],
    relatedChapters: [],
    icon: "☀️",
  },
  {
    slug: "cholesterol-ldl",
    name: "LDL Cholesterol",
    shortName: "LDL",
    category: "Cardiovascular System",
    categoryColor: "#C97B7B",
    unit: "mg/dL",
    standardRange: { low: 0, high: 130, label: "< 130 mg/dL" },
    optimalRange: { low: 0, high: 100, label: "< 100 mg/dL (general)" },
    zones: {
      criticalLow: { max: 40, label: "Very Low (Possible Concern)" },
      suboptimal: { min: 40, max: 70, label: "Low (May Be Appropriate)" },
      optimal: { min: 70, max: 100, label: "Optimal (General Population)" },
      normal: { min: 100, max: 130, label: "Normal / Borderline" },
      high: { min: 130, label: "Elevated (Cardiovascular Risk)" },
    },
    overview:
      "LDL cholesterol has long been considered the primary cardiovascular risk marker. However, modern research shows that LDL particle size and number (LDL-P) are more predictive of risk than total LDL alone. Small, dense LDL particles are far more atherogenic than large, buoyant particles — and standard labs do not distinguish between them.",
    whyItMatters:
      "Cardiovascular disease remains the #1 cause of death globally. Understanding LDL in context — alongside HDL, triglycerides, hs-CRP, and particle size — provides a far more accurate cardiovascular risk picture than LDL alone. Many people with 'normal' LDL have dangerous particle profiles, while others with elevated LDL have low actual risk.",
    symptomsLow: [],
    symptomsHigh: [
      "No direct symptoms — cardiovascular risk is silent",
      "Xanthomas (fatty deposits under skin) in very high cases",
      "Corneal arcus (gray ring around iris) in familial hypercholesterolemia",
    ],
    lifestyleFactors: [
      {
        factor: "Saturated fat intake",
        impact: "Saturated fat raises LDL, but primarily the large, buoyant (less harmful) particles. Context matters.",
      },
      {
        factor: "Trans fats",
        impact: "Industrial trans fats (partially hydrogenated oils) raise LDL and lower HDL — the worst combination.",
      },
      {
        factor: "Fiber intake",
        impact: "Soluble fiber (oats, legumes, psyllium) binds bile acids and reduces LDL by 5–15%.",
      },
      {
        factor: "Exercise",
        impact: "Regular aerobic exercise shifts LDL particles from small/dense to large/buoyant — improving the quality even if quantity stays similar.",
      },
      {
        factor: "Thyroid function",
        impact: "Hypothyroidism raises LDL. Always check TSH when LDL is unexpectedly elevated.",
      },
    ],
    nutritionTips: [
      "Eat 1–2 servings of oats or psyllium husk daily for soluble fiber",
      "Include legumes (beans, lentils) 4–5x/week",
      "Replace refined carbohydrates with whole foods — they raise small dense LDL",
      "Eat fatty fish 2–3x/week for omega-3s that improve particle quality",
      "Eliminate trans fats and ultra-processed foods entirely",
    ],
    doctorQuestions: [
      "Can we check LDL particle size and number (NMR LipoProfile) rather than just total LDL?",
      "What is my triglyceride-to-HDL ratio? (A ratio above 3 suggests insulin resistance)",
      "Is my LDL elevation familial (genetic) or lifestyle-driven?",
      "Should we check my thyroid function given my elevated LDL?",
      "What is my overall 10-year cardiovascular risk score considering all my markers?",
    ],
    relatedChapters: [
      {
        book: "The Patient's Compass",
        chapter: "Chapter 10",
        topic: "Cholesterol: Beyond the Numbers",
      },
      {
        book: "Your Chronic Disease Lab Guide",
        chapter: "Chapter 5",
        topic: "Cardiovascular Risk Beyond Cholesterol",
      },
    ],
    icon: "🫀",
  },
];

// Helper: get by slug
export function getBiomarkerBySlug(slug: string): BiomarkerProfile | undefined {
  return BIOMARKER_PROFILES.find((b) => b.slug === slug);
}

// Helper: get unique categories
export function getBiomarkerCategories(): string[] {
  return Array.from(new Set(BIOMARKER_PROFILES.map((b) => b.category)));
}
