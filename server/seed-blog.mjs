/**
 * Blog Seed Script
 * Creates initial SEO-optimized healthcare blog articles
 * Run with: node seed-blog.mjs
 */

import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const articles = [
  {
    title: "Complete Guide to Lab Result Interpretation: Understanding Your Biomarkers",
    slug: "lab-result-interpretation-guide",
    description: "Learn how to interpret your lab results and understand what your biomarkers mean for your health. A comprehensive guide to common tests and optimal ranges.",
    content: `# Understanding Your Lab Results

## Introduction
Lab results can be confusing, but they're one of the most important tools for understanding your health. This guide will help you interpret common biomarkers and understand what they mean for your wellness journey.

## What Are Biomarkers?
Biomarkers are measurable biological indicators that can be used to assess your health status. They include:
- Blood glucose levels
- Cholesterol and lipid panels
- Thyroid function
- Liver and kidney function
- Inflammation markers
- Nutrient levels

## Common Lab Tests Explained

### Complete Blood Count (CBC)
The CBC measures different types of blood cells and can indicate:
- Anemia or blood disorders
- Infection or immune system issues
- Clotting problems

### Metabolic Panel
This group of tests measures:
- Glucose (blood sugar)
- Kidney function
- Liver function
- Electrolytes

### Lipid Panel
Measures cholesterol and triglycerides:
- Total cholesterol
- LDL ("bad") cholesterol
- HDL ("good") cholesterol
- Triglycerides

## Optimal Ranges vs. Normal Ranges
It's important to understand the difference:
- **Normal Range**: The range where most people fall (usually 95% of the population)
- **Optimal Range**: The range associated with best health outcomes

Many people fall within "normal" ranges but not optimal ranges.

## How to Use Your Results
1. Compare your results to optimal ranges
2. Look for trends over time
3. Discuss results with your healthcare provider
4. Make lifestyle adjustments based on your results

## Next Steps
- Upload your lab report to The Patient's Compass for AI analysis
- Explore our biomarker library for detailed information
- Chat with Dr. Compass for personalized insights

---
**EDUCATIONAL CONTENT ONLY**: This article provides general health information for educational purposes. It is not a substitute for professional medical advice. Always consult with your healthcare provider about your lab results.`,
    category: "lab-analysis",
    author: "Dr. Sarah Chen",
    readingTimeMinutes: 8,
    keywords: "lab results, biomarkers, blood tests, health interpretation",
    tags: "lab-results,biomarkers,health-education",
    viewCount: 0,
    publishedAt: new Date(),
  },
  {
    title: "Biomarker Optimization: The Functional Medicine Approach to Preventive Health",
    slug: "biomarker-optimization-functional-medicine",
    description: "Discover how functional medicine uses biomarker optimization to prevent disease and optimize health. Learn which biomarkers matter most for longevity.",
    content: `# Biomarker Optimization: A Functional Medicine Approach

## What is Functional Medicine?
Functional medicine focuses on optimizing health and preventing disease through personalized, systems-based care. Rather than waiting for disease to develop, functional medicine practitioners work to optimize your biomarkers.

## Key Biomarkers for Longevity

### 1. Fasting Glucose & HbA1c
- **Why it matters**: Elevated glucose increases risk of diabetes and cardiovascular disease
- **Optimal range**: Fasting glucose 70-85 mg/dL, HbA1c < 5.5%
- **How to optimize**: Regular exercise, reduce refined carbs, increase fiber

### 2. Lipid Panel
- **Why it matters**: Cholesterol patterns predict cardiovascular risk
- **Optimal range**: LDL < 100, HDL > 60, Triglycerides < 100
- **How to optimize**: Increase omega-3s, reduce processed foods, exercise regularly

### 3. Inflammation Markers
- **Why it matters**: Chronic inflammation underlies most diseases
- **Optimal range**: CRP < 1.0 mg/L, ESR < 10 mm/hr
- **How to optimize**: Anti-inflammatory diet, stress management, sleep quality

### 4. Thyroid Function
- **Why it matters**: Affects metabolism, energy, and mood
- **Optimal range**: TSH 1.5-2.5 mIU/L, Free T4 and T3 in upper-normal range
- **How to optimize**: Adequate iodine, selenium, manage stress

### 5. Nutrient Levels
- **Why it matters**: Deficiencies impair cellular function
- **Key nutrients**: Vitamin D, B12, Iron, Magnesium, Zinc
- **How to optimize**: Nutrient-dense diet, targeted supplementation if needed

## The Optimization Process

1. **Baseline Testing**: Get comprehensive lab work
2. **Identify Gaps**: Compare to optimal ranges
3. **Create Plan**: Lifestyle modifications and targeted interventions
4. **Monitor Progress**: Retest every 3-6 months
5. **Adjust Strategy**: Fine-tune based on results

## Lifestyle Factors That Impact Biomarkers

### Nutrition
- Whole foods diet
- Adequate protein
- Healthy fats
- Minimal processed foods

### Movement
- 150+ minutes moderate exercise weekly
- Strength training 2-3x weekly
- Daily movement breaks

### Sleep
- 7-9 hours nightly
- Consistent sleep schedule
- Good sleep hygiene

### Stress Management
- Meditation or mindfulness
- Time in nature
- Social connection
- Hobbies and relaxation

## Working with a Functional Medicine Practitioner
A functional medicine approach includes:
- Comprehensive testing
- Personalized protocols
- Regular monitoring
- Lifestyle coaching

---
**EDUCATIONAL CONTENT ONLY**: This article provides general health information for educational purposes. It is not a substitute for professional medical advice. Always consult with your healthcare provider before making significant health changes.`,
    category: "functional-medicine",
    author: "Dr. James Mitchell",
    readingTimeMinutes: 10,
    keywords: "biomarker optimization, functional medicine, preventive health, longevity",
    tags: "functional-medicine,biomarkers,prevention,health-optimization",
    viewCount: 0,
    publishedAt: new Date(),
  },
  {
    title: "Understanding Inflammation Markers: CRP, ESR, and What They Mean for Your Health",
    slug: "inflammation-markers-crp-esr",
    description: "Deep dive into inflammation markers like CRP and ESR. Learn what causes elevated inflammation and how to reduce it naturally.",
    content: `# Understanding Inflammation Markers: CRP and ESR

## What is Inflammation?
Inflammation is your body's response to injury or infection. While acute inflammation is necessary for healing, chronic inflammation is linked to most modern diseases.

## Key Inflammation Markers

### C-Reactive Protein (CRP)
- **What it measures**: Liver's response to inflammation
- **Normal range**: < 3.0 mg/L
- **Optimal range**: < 1.0 mg/L
- **High CRP indicates**: Cardiovascular risk, infection, autoimmune disease

### Erythrocyte Sedimentation Rate (ESR)
- **What it measures**: How quickly red blood cells settle
- **Normal range**: < 20 mm/hr
- **Optimal range**: < 10 mm/hr
- **High ESR indicates**: Inflammation, infection, autoimmune conditions

## Causes of Elevated Inflammation

### Dietary Factors
- Refined carbohydrates
- Seed oils (omega-6 rich)
- Processed foods
- Excess sugar
- Alcohol

### Lifestyle Factors
- Chronic stress
- Poor sleep
- Sedentary lifestyle
- Smoking
- Environmental toxins

### Health Conditions
- Obesity
- Metabolic syndrome
- Autoimmune diseases
- Chronic infections
- Gut dysbiosis

## Natural Ways to Reduce Inflammation

### Dietary Strategies
1. **Increase anti-inflammatory foods**:
   - Fatty fish (salmon, sardines)
   - Berries and colorful vegetables
   - Nuts and seeds
   - Olive oil
   - Herbs and spices (turmeric, ginger)

2. **Eliminate pro-inflammatory foods**:
   - Refined carbs
   - Processed oils
   - Sugar
   - Processed meats

### Lifestyle Modifications
1. **Exercise**: 150+ minutes moderate activity weekly
2. **Sleep**: 7-9 hours nightly
3. **Stress**: Daily meditation or relaxation
4. **Gut health**: Probiotics and fiber-rich foods

### Supplementation
- Omega-3 fatty acids
- Curcumin (from turmeric)
- Ginger
- Quercetin
- Probiotics

## Monitoring Your Progress
- Retest CRP and ESR every 3 months
- Track dietary and lifestyle changes
- Note symptom improvements
- Work with a healthcare provider

---
**EDUCATIONAL CONTENT ONLY**: This article provides general health information for educational purposes. It is not a substitute for professional medical advice. Always consult with your healthcare provider before starting supplements or making significant health changes.`,
    category: "lab-analysis",
    author: "Dr. Sarah Chen",
    readingTimeMinutes: 7,
    keywords: "inflammation markers, CRP, ESR, chronic inflammation, anti-inflammatory",
    tags: "inflammation,biomarkers,health-education,prevention",
    viewCount: 0,
    publishedAt: new Date(),
  },
  {
    title: "The Role of Micronutrients in Health: Vitamin D, B12, Iron, and More",
    slug: "micronutrients-vitamin-d-b12-iron",
    description: "Comprehensive guide to essential micronutrients. Learn which nutrients matter most, optimal levels, and how to optimize them.",
    content: `# The Role of Micronutrients in Health

## Why Micronutrients Matter
Micronutrients are vitamins and minerals essential for:
- Energy production
- Immune function
- Brain health
- Bone strength
- Hormone balance
- DNA repair

## Essential Micronutrients

### Vitamin D
- **Function**: Bone health, immune function, mood regulation
- **Optimal level**: 40-60 ng/mL
- **Sources**: Sunlight, fatty fish, egg yolks, supplements
- **Deficiency signs**: Fatigue, mood changes, muscle weakness

### Vitamin B12
- **Function**: Energy, nerve function, DNA synthesis
- **Optimal level**: > 500 pg/mL
- **Sources**: Meat, fish, dairy, fortified foods, supplements
- **Deficiency signs**: Fatigue, brain fog, numbness

### Iron
- **Function**: Oxygen transport, energy production
- **Optimal level**: Ferritin 30-100 ng/mL
- **Sources**: Red meat, spinach, legumes, fortified cereals
- **Deficiency signs**: Fatigue, weakness, shortness of breath

### Magnesium
- **Function**: Muscle function, stress response, sleep
- **Optimal level**: 2.0-2.3 mg/dL
- **Sources**: Leafy greens, nuts, seeds, whole grains
- **Deficiency signs**: Muscle cramps, anxiety, insomnia

### Zinc
- **Function**: Immune function, wound healing, taste
- **Optimal level**: 70-100 µg/dL
- **Sources**: Oysters, beef, pumpkin seeds, chickpeas
- **Deficiency signs**: Weak immunity, slow healing, hair loss

## Testing for Micronutrient Status
- Comprehensive micronutrient panel
- Individual nutrient testing
- Functional medicine labs
- Retest every 6-12 months

## Optimizing Micronutrient Levels

### Through Diet
- Eat a variety of colorful foods
- Include protein at each meal
- Choose whole grains
- Include nuts, seeds, and healthy fats

### Through Supplementation
- Get tested first
- Use high-quality supplements
- Consider bioavailable forms
- Work with a healthcare provider

## Special Populations
- Vegans/vegetarians: B12, iron, zinc
- Older adults: B12, vitamin D, calcium
- Athletes: Iron, magnesium, zinc
- Pregnant women: Folate, iron, calcium

---
**EDUCATIONAL CONTENT ONLY**: This article provides general health information for educational purposes. It is not a substitute for professional medical advice. Always consult with your healthcare provider before starting supplements.`,
    category: "nutrition",
    author: "Dr. James Mitchell",
    readingTimeMinutes: 9,
    keywords: "micronutrients, vitamins, minerals, vitamin D, B12, iron, health",
    tags: "nutrition,micronutrients,vitamins,minerals,health-optimization",
    viewCount: 0,
    publishedAt: new Date(),
  },
  {
    title: "Metabolic Health 101: Understanding Insulin, Glucose, and Metabolic Syndrome",
    slug: "metabolic-health-insulin-glucose",
    description: "Learn about metabolic health, insulin resistance, and how to prevent metabolic syndrome through lifestyle changes.",
    content: `# Metabolic Health 101

## What is Metabolic Health?
Metabolic health refers to how efficiently your body:
- Processes glucose
- Manages insulin
- Handles lipids
- Maintains healthy weight
- Regulates blood pressure

## Key Metabolic Markers

### Fasting Glucose
- **Normal**: 70-100 mg/dL
- **Prediabetic**: 100-125 mg/dL
- **Diabetic**: > 126 mg/dL
- **Optimal**: 70-85 mg/dL

### Insulin Levels
- **Normal fasting**: < 12 mIU/L
- **Optimal**: < 5 mIU/L
- **High levels indicate**: Insulin resistance

### HbA1c (3-month glucose average)
- **Normal**: < 5.7%
- **Prediabetic**: 5.7-6.4%
- **Diabetic**: > 6.5%
- **Optimal**: < 5.5%

### Triglycerides
- **Normal**: < 150 mg/dL
- **Optimal**: < 100 mg/dL
- **Elevated**: > 150 mg/dL

## Insulin Resistance: The Root Cause
Insulin resistance occurs when cells don't respond properly to insulin, leading to:
- Higher insulin levels
- Elevated blood sugar
- Weight gain
- Increased disease risk

## Metabolic Syndrome
Metabolic syndrome is diagnosed when you have 3+ of:
- Abdominal obesity
- Elevated triglycerides
- Reduced HDL cholesterol
- Elevated blood pressure
- Elevated fasting glucose

## How to Improve Metabolic Health

### Dietary Strategies
1. **Reduce refined carbs**: Replace with whole grains
2. **Increase fiber**: Aim for 25-35g daily
3. **Prioritize protein**: Helps stabilize glucose
4. **Healthy fats**: Olive oil, nuts, fish
5. **Limit sugar**: Especially liquid calories

### Movement
- Regular aerobic exercise
- Strength training 2-3x weekly
- Daily walking
- Reduce sedentary time

### Sleep & Stress
- 7-9 hours quality sleep
- Consistent sleep schedule
- Stress management
- Meditation or yoga

### Monitoring
- Test fasting glucose and insulin
- Track HbA1c every 3 months
- Monitor weight and waist circumference
- Work with a healthcare provider

---
**EDUCATIONAL CONTENT ONLY**: This article provides general health information for educational purposes. It is not a substitute for professional medical advice. Always consult with your healthcare provider about metabolic health concerns.`,
    category: "metabolic-health",
    author: "Dr. Sarah Chen",
    readingTimeMinutes: 8,
    keywords: "metabolic health, insulin resistance, glucose, metabolic syndrome, diabetes prevention",
    tags: "metabolic-health,insulin,glucose,prevention,lifestyle",
    viewCount: 0,
    publishedAt: new Date(),
  },
];

async function seedBlog() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🌱 Seeding blog articles...");

    for (const article of articles) {
      const query = `
        INSERT INTO blog_posts (
          title, slug, description, content, category, author,
          readingTimeMinutes, keywords, tags, viewCount,
          publishedAt, published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `;

      const values = [
        article.title,
        article.slug,
        article.description,
        article.content,
        article.category,
        article.author,
        article.readingTimeMinutes,
        article.keywords,
        article.tags,
        article.viewCount,
        article.publishedAt,
      ];

      await connection.execute(query, values);
      console.log(`✅ Created: ${article.title}`);
    }

    console.log("🎉 Blog seeding complete!");
  } catch (error) {
    console.error("❌ Error seeding blog:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedBlog();
