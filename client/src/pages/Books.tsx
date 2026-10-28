import SEO from "@/components/SEO";
import { withAmazonTag } from "@/lib/amazon";
import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Search,
  Grid3X3,
  List,
  BookOpen,
  ExternalLink,
  Star,
  Headphones,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Book Data ────────────────────────────────────────────────────────────────

const AMAZON_AFFILIATE_COLLECTION_URL = "https://amzn.to/4hT5bPa";

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  category: string;
  description: string;
  pages?: number;
  isbn?: string;
  amazonUrl: string;
  /** US Audible link (ACX bounty link) when an audiobook edition exists. */
  audibleUrl?: string;
  coverUrl: string;
  featured: boolean;
  isNew?: boolean;
  sampleExcerpt?: string;
}

const BOOKS: Book[] = [
  {
    id: "patients-compass",
    title: "The Patient's Compass",
    subtitle: "Understand Your Blood Tests, Track Hidden Health Clues, and Ask Better Questions",
    author: "Sonya M.",
    category: "Health Education",
    description:
      "Understand your blood tests, track hidden health clues, and ask better questions. A comprehensive guide to understanding laboratory results and taking control of your health.",
    pages: 203,
    isbn: "979-8-88-654321-0",
    amazonUrl: "https://www.amazon.com/PATIENTS-COMPASS-Understand-Hidden-Questions-ebook/dp/B0H1GZMB6K",
    audibleUrl: "https://www.audible.com/pd/B0HNF5M8YP/?source_code=AUDFPWS0223189MWT-BK-ACX0-538164&ref=acx_bty_BK_ACX0_538164_rh_us",
    coverUrl: "/manus-storage/the-patient-s-compass_B0H1GZMB6K_2b45b9a1.jpg",
    featured: true,
    isNew: true,
    sampleExcerpt:
      "Every day, thousands of patients leave their doctor's offices feeling utterly exhausted, yet clutching a piece of paper that says they are perfectly fine. 'Your labs are normal,' the doctor says...",
  },
  {
    id: "your-lab-tests",
    title: "Your Lab Tests",
    subtitle: "Understanding Laboratory Results Without Fear",
    author: "Sonya M.",
    category: "Medical Reference",
    description:
      "Master the fundamentals of blood work and medical testing with clear, practical explanations that empower you to understand every result.",
    pages: 178,
    isbn: "979-8-88-654322-1",
    amazonUrl: "https://www.amazon.com/YOUR-LAB-TESTS-Understanding-Laboratory-ebook/dp/B0GZ83WG53/",
    audibleUrl: "https://www.audible.com/pd/B0HNCM353T/?source_code=AUDFPWS0223189MWT-BK-ACX0-535357&ref=acx_bty_BK_ACX0_535357_rh_us",
    coverUrl: "/manus-storage/your-lab-tests_B0GZ83WG53_82baabd8.jpg",
    featured: true,
    isNew: true,
    sampleExcerpt:
      "Understanding your lab results is the first step toward taking ownership of your health. This guide walks you through every panel, every number, and every flag...",
  },
  {
    id: "decode-blood-work-after-40",
    title: "Decode Your Blood Work After 40",
    subtitle: "Age-Specific Insights Into Blood Work and What They Mean for Your Health",
    author: "Sonya M.",
    category: "Health Education",
    description:
      "Age-specific insights into blood work interpretation. Understand what changes in your lab results as you age and what they mean for your long-term health.",
    pages: 156,
    isbn: "979-8-88-654323-2",
    amazonUrl: "https://www.amazon.com/Decode-Your-Blood-Work-After-ebook/dp/B0GZS1C6VR",
    audibleUrl: "https://www.audible.com/pd/B0HJX83B87/?source_code=AUDFPWS0223189MWT-BK-ACX0-531137&ref=acx_bty_BK_ACX0_531137_rh_us",
    coverUrl: "/manus-storage/decode-your-blood-work-after-40_B0GZS1C6VR_1533b867.jpg",
    featured: false,
  },
  {
    id: "womens-wellness-after-40",
    title: "Woman's Wellness After 40",
    subtitle: "Science-Backed Wellness Strategies for Women",
    author: "Sonya M.",
    category: "Wellness & Lifestyle",
    description:
      "Science-backed wellness strategies for women over 40 that address hormonal changes, metabolic shifts, and health priorities specific to women in midlife.",
    pages: 221,
    isbn: "979-8-88-654324-3",
    amazonUrl: "https://www.amazon.com/WOMANS-WELLNESS-AFTER-40-science-backed-ebook/dp/B0GLLHZG73/",
    audibleUrl: "https://www.audible.com/pd/B0HL12LC8L/?source_code=AUDFPWS0223189MWT-BK-ACX0-533308&ref=acx_bty_BK_ACX0_533308_rh_us",
    coverUrl: "/manus-storage/woman-s-wellness-after-40_B0GLLHZG73_1410500d.jpg",
    featured: true,
    sampleExcerpt:
      "After 40, a woman's body undergoes profound hormonal shifts. Understanding these changes through the lens of your lab work gives you the power to respond proactively...",
  },
  {
    id: "hormone-reset-after-40",
    title: "Hormone Reset After 40",
    subtitle: "Master Your Metabolism & Reclaim Your Energy With Science-Backed Hormonal Synchronization",
    author: "Sonya M.",
    category: "Wellness & Lifestyle",
    description:
      "Understand hormonal synchronization strategies. Learn practical methods to support natural hormone balance and reclaim your energy after 40.",
    pages: 189,
    isbn: "979-8-88-654325-4",
    amazonUrl: "https://www.amazon.com/Hormone-Reset-After-science-backed-synchronization/dp/B0GW61NWQL/",
    audibleUrl: "https://www.audible.com/pd/B0HJDGKW92/?source_code=AUDFPWS0223189MWT-BK-ACX0-530777&ref=acx_bty_BK_ACX0_530777_rh_us",
    coverUrl: "/manus-storage/hormone-reset-after-40_B0GW61NWQL_6e2de06f.jpg",
    featured: true,
    sampleExcerpt:
      "Hormonal balance is not a luxury — it is the foundation of vitality. This guide maps the precise lab markers that reveal your hormonal landscape...",
  },
  {
    id: "mediterranean-diet-longevity",
    title: "Mediterranean Diet for Longevity",
    subtitle: "Anti-Aging Nutrition Strategies Based on Mediterranean Principles",
    author: "Sonya M.",
    category: "Nutrition & Diet",
    description:
      "Anti-aging nutrition strategies based on Mediterranean principles. Learn how to eat for longevity and inflammation reduction using evidence-backed dietary science.",
    pages: 175,
    isbn: "979-8-88-654326-5",
    amazonUrl: "https://www.amazon.com/MEDITERRANEAN-DIET-LONGEVITY-Anti-Aging-Inflammation-ebook/dp/B0GZH1KY8S/",
    audibleUrl: "https://www.audible.com/pd/B0HNHYGG9M/?source_code=AUDFPWS0223189MWT-BK-ACX0-538297&ref=acx_bty_BK_ACX0_538297_rh_us",
    coverUrl: "/manus-storage/mediterranean-diet-for-longevity_B0GZH1KY8S_5cca0ad2.jpg",
    featured: true,
  },
  {
    id: "bio-marker-buffet-high-protein",
    title: "The Bio-Marker Buffet: High-Protein Eating",
    subtitle: "Evidence-Based High-Protein Eating Strategies",
    author: "Sonya M.",
    category: "Nutrition & Diet",
    description:
      "Evidence-based high-protein eating strategies. Optimize your nutrition based on your lab markers and health goals for sustained energy and muscle preservation.",
    pages: 144,
    isbn: "979-8-88-654327-6",
    amazonUrl: "https://www.amazon.com/BIO-MARKER-BUFFET-High-Protein-Eating-Science-Backed-ebook/dp/B0GX2WG8W2/",
    coverUrl: "/manus-storage/the-bio-marker-buffet-high-protein-eating_B0GX2WG8W2_ff93b419.jpg",
    featured: false,
  },
  {
    id: "gelatin-sustainable-weight-loss",
    title: "Gelatin for Sustainable Weight Loss",
    subtitle: "The Science-Based Satiety Method for Natural, Effortless Fat Loss",
    author: "Sonya M.",
    category: "Nutrition & Diet",
    description:
      "The role of gelatin and collagen in satiety and weight management. Discover how this simple addition can support your wellness goals through evidence-based nutrition.",
    pages: 128,
    isbn: "979-8-88-654328-7",
    amazonUrl: "https://www.amazon.com/Gelatin-Sustainable-Weight-Loss-Satiety/dp/B0GWF4KMXD/",
    audibleUrl: "https://www.audible.com/pd/B0HNF1JKRJ/?source_code=AUDFPWS0223189MWT-BK-ACX0-538159&ref=acx_bty_BK_ACX0_538159_rh_us",
    coverUrl: "/manus-storage/gelatin-cover_268a3be3.jpg",
    featured: false,
  },
  {
    id: "living-pharmacy",
    title: "The Living Pharmacy",
    subtitle: "Complete Guide to Medicinal Herbs and Natural Remedies",
    author: "Sonya M.",
    category: "Wellness & Lifestyle",
    description:
      "Complete guide to medicinal herbs and natural remedies. Learn to use nature's pharmacy to support specific health goals based on scientific evidence.",
    pages: 198,
    isbn: "979-8-88-654329-8",
    amazonUrl: "https://www.amazon.com/LIVING-PHARMACY-Complete-Medicine-Remedies-ebook/dp/B0GZ5XYDQ4/",
    coverUrl: "/manus-storage/the-living-pharmacy_B0GZ5XYDQ4_63a0e888.jpg",
    featured: false,
  },
  {
    id: "wellness-kitchen",
    title: "Transform Your Kitchen Into a Wellness Sanctuary",
    subtitle: "76 Curated Tools to Bring Nourishment, Healing, and Vitality to Your Home",
    author: "Sonya M.",
    category: "Wellness & Lifestyle",
    description:
      "Design your kitchen for health and wellness. Learn how to organize, stock, and use your kitchen as a tool for optimal nutrition and daily wellbeing.",
    pages: 161,
    isbn: "979-8-88-654330-9",
    amazonUrl: "https://www.amazon.com/TRANSFORM-YOUR-KITCHEN-WELLNESS-SANCTUARY/dp/B0GZ3D6VHD/",
    audibleUrl: "https://www.audible.com/pd/B0HL9H5XXD/?source_code=AUDFPWS0223189MWT-BK-ACX0-533305&ref=acx_bty_BK_ACX0_533305_rh_us",
    coverUrl: "/manus-storage/transform-your-kitchen-into-a-wellness-sanctuary_B0GZ3D6VHD_2ef5b69a.jpg",
    featured: false,
  },
  {
    id: "my-healthy-child",
    title: "My Healthy Child",
    subtitle: "How to Raise Healthy Children With Science-Backed Wellness Strategies",
    author: "Sonya M.",
    category: "Children's Books",
    description:
      "How to raise healthy children with science-backed wellness strategies. Support your child's optimal development through evidence-based nutrition and lifestyle choices.",
    pages: 172,
    isbn: "979-8-88-654331-0",
    amazonUrl: "https://www.amazon.com/My-Healthy-Child-Sonya-M-ebook/dp/B0H14BP3FQ/",
    audibleUrl: "https://www.audible.com/pd/B0HKWPYGCF/?source_code=AUDFPWS0223189MWT-BK-ACX0-533487&ref=acx_bty_BK_ACX0_533487_rh_us",
    coverUrl: "/manus-storage/my-healthy-child_B0H14BP3FQ_8173c60e.jpg",
    featured: false,
  },
  {
    id: "listen-to-your-body",
    title: "Listen to Your Body",
    subtitle: "A Comprehensive Guide to Understanding Your Body's Signals",
    author: "Sonya M.",
    category: "Wellness & Lifestyle",
    description:
      "Learn the Mediterranean principles for understanding your body's signals. Learn to interpret and respond with self-care using evidence-backed wellness frameworks.",
    pages: 183,
    isbn: "979-8-88-654332-1",
    amazonUrl: "https://www.amazon.com/Listen-Your-Body-Compassionate-Understanding-ebook/dp/B0GWTZW9HY/",
    audibleUrl: "https://www.audible.com/pd/B0HKSY1TV4/?source_code=AUDFPWS0223189MWT-BK-ACX0-531160&ref=acx_bty_BK_ACX0_531160_rh_us",
    coverUrl: "/manus-storage/listen-to-your-body_B0GWTZW9HY_6a4f8ea0.jpg",
    featured: false,
  },
  {
    id: "blood-type-explained",
    title: "Your Blood Type Explained",
    subtitle: "Understand Your Blood Type and Its Health Implications",
    author: "Sonya M.",
    category: "Medical Reference",
    description:
      "Understand your blood type and its health implications. Discover how your blood type influences your health and wellness strategies for personalized care.",
    pages: 134,
    isbn: "979-8-88-654333-2",
    amazonUrl: "https://www.amazon.com/YOUR-BLOOD-TYPE-EXPLAINED-Preventive-ebook/dp/B0GX33YVPK",
    audibleUrl: "https://www.audible.com/pd/B0HJXXH7T2/?source_code=AUDFPWS0223189MWT-BK-ACX0-530419&ref=acx_bty_BK_ACX0_530419_rh_us",
    coverUrl: "/manus-storage/your-blood-type-explained_B0GX33YVPK_d5ba595f.jpg",
    featured: false,
  },
  {
    id: "blood-test-knowledge-book",
    title: "Your Blood Test Knowledge Book",
    subtitle: "A Complete Patient Guide to Understanding Lab Results",
    author: "Sonya M.",
    category: "Medical Reference",
    description:
      "Comprehensive reference guide for blood test interpretation. A practical resource for understanding your lab results and having informed conversations with your doctor.",
    pages: 215,
    isbn: "979-8-88-654334-3",
    amazonUrl: "https://www.amazon.com/dp/B0GW62KNZZ",
    audibleUrl: "https://www.audible.com/pd/B0HHH14RKS/?source_code=AUDFPWS0223189MWT-BK-ACX0-529061&ref=acx_bty_BK_ACX0_529061_rh_us",
    coverUrl: "/manus-storage/your-blood-test-knowledge-book_B0GW62KNZZ_bd377673.jpg",
    featured: false,
    isNew: true,
    sampleExcerpt:
      "Your blood test results contain a wealth of information about your health. This comprehensive guide helps you decode every number and understand what it means for your wellbeing...",
  },
  {
    id: "chronic-disease-lab-guide",
    title: "Your Chronic Disease Lab Guide",
    subtitle: "Tracking What Matters for Long-Term Health Using The Patient's Compass Method™",
    author: "Sonya M.",
    category: "Medical Reference",
    description:
      "Tracking lab markers for long-term health management. Learn to monitor thyroid, kidney, and autoimmune conditions using The Patient's Compass Method™.",
    pages: 244,
    isbn: "979-8-88-654335-4",
    amazonUrl: "https://www.amazon.com/Your-Chronic-Disease-Lab-Guide-ebook/dp/B0GXPBKBS8",
    audibleUrl: "https://www.audible.com/pd/B0HJN1MWBD/?source_code=AUDFPWS0223189MWT-BK-ACX0-531466&ref=acx_bty_BK_ACX0_531466_rh_us",
    coverUrl: "/manus-storage/your-chronic-disease-lab-guide_B0GXPBKBS8_1f816ca6.jpg",
    featured: false,
    sampleExcerpt:
      "Managing a chronic condition requires a different relationship with your lab results. This guide gives you the tools to track what matters most over time...",
  },
  {
    id: "healthy-habits-super-kids",
    title: "Healthy Habits for Super Kids",
    subtitle: "Fun and Science-Backed Strategies for Children's Optimal Health",
    author: "Sonya M.",
    category: "Children's Books",
    description:
      "Fun and science-backed strategies for children's optimal health. Learn healthy habits through engaging activities and colorful illustrations for ages 5-12.",
    pages: 96,
    isbn: "979-8-88-654336-5",
    amazonUrl: "https://www.amazon.com/Healthy-Habits-Super-Kids-Activity-ebook/dp/B0H1W6GR84",
    audibleUrl: "https://www.audible.com/pd/B0HM6GMJTW/?source_code=AUDFPWS0223189MWT-BK-ACX0-535795&ref=acx_bty_BK_ACX0_535795_rh_us",
    coverUrl: "/manus-storage/healthy-habits-for-super-kids_B0H1W6GR84_737712e2.jpg",
    featured: false,
  },
  {
    id: "my-body-is-amazing",
    title: "MY BODY IS AMAZING!",
    subtitle: "A Magical Introduction to the Human Body for Young Explorers",
    author: "Sonya M.",
    category: "Children's Books",
    description:
      "A magical introduction to the human body for young explorers. This beautifully illustrated children's book teaches kids how their amazing body works in a fun, engaging way.",
    pages: 48,
    isbn: "979-8-88-654338-7",
    amazonUrl: "https://www.amazon.com/MY-BODY-AMAZING-Magical-Introduction-ebook/dp/B0H2S2P494",
    audibleUrl: "https://www.audible.com/pd/B0HJ6YDJKK/?source_code=AUDFPWS0223189MWT-BK-ACX0-530455&ref=acx_bty_BK_ACX0_530455_rh_us",
    coverUrl: "/manus-storage/my-body-is-amazing_B0H2S2P494_0706c5d8.jpg",
    featured: false,
  },
  {
    id: "bio-marker-buffet-seasonal",
    title: "The Bio-Marker Buffet: Seasonal Recipes to Stabilize Blood Sugar and Reduce Inflammation",
    subtitle: "Seasonal Recipes to Stabilize Blood Sugar and Reduce Inflammation",
    author: "Sonya M.",
    category: "Nutrition & Diet",
    description:
      "Seasonal recipes and strategies to stabilize blood sugar and reduce inflammation. Optimize your nutrition seasonally to support your lab markers and overall health.",
    pages: 167,
    isbn: "979-8-88-654337-6",
    amazonUrl: "https://www.amazon.com/dp/B0GX2X9KLG",
    audibleUrl: "https://www.audible.com/pd/B0HLW8GHWF/?source_code=AUDFPWS0223189MWT-BK-ACX0-535144&ref=acx_bty_BK_ACX0_535144_rh_us",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/P/B0GX2X9KLG.01.LZZZZZZZ.jpg",
    featured: true,
    sampleExcerpt:
      "Seasonal eating is not just a trend — it is a science-backed strategy for optimizing your biomarkers throughout the year. Each season brings different nutritional needs...",
  },
  {
    id: "ai-for-everyday-life",
    title: "AI for Everyday Life",
    subtitle: "Your Friendly Guide to Making AI Work for You",
    author: "Sonya M.",
    category: "AI & Technology",
    description:
      "Your friendly guide to making AI work for you. Learn how to save time, work smarter, automate tasks, and use AI with confidence — no technical background required.",
    pages: 142,
    isbn: "979-8-88-654340-0",
    amazonUrl: "https://www.amazon.com/Everyday-Life-Artificial-Intelligence-Productivity-ebook/dp/B0GX2WRFBF",
    audibleUrl: "https://www.audible.com/pd/B0HK1JNV28/?source_code=AUDFPWS0223189MWT-BK-ACX0-529687&ref=acx_bty_BK_ACX0_529687_rh_us",
    coverUrl: "/manus-storage/ai-for-everyday-life_B0GX2WRFBF_385d6be2.jpg",
    featured: true,
    isNew: true,
    sampleExcerpt:
      "AI is not here to replace you — it is here to amplify you. Whether you want to save hours on repetitive tasks, write better emails, or simply understand what everyone is talking about, this guide meets you where you are...",
  },
  {
    id: "blood-sugar-blueprint-after-40",
    title: "The Blood Sugar Blueprint After 40",
    subtitle: "A Lab-Guided Plan to Stabilize Your Blood Sugar",
    author: "Sonya M.",
    category: "Health Education",
    description:
      "Understand glucose, A1C, and insulin resistance after 40, and build a practical, lab-guided plan to stabilize your blood sugar for good.",
    amazonUrl: "https://www.amazon.com/dp/B0H6RPCMTP",
    audibleUrl: "https://www.audible.com/pd/B0HJFK68YL/?source_code=AUDFPWS0223189MWT-BK-ACX0-530955&ref=acx_bty_BK_ACX0_530955_rh_us",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/P/B0H6RPCMTP.01.LZZZZZZZ.jpg",
    featured: false,
  },
  {
    id: "managing-the-long-haul",
    title: "Managing the Long Haul",
    subtitle: "Using AI to Take Control of Chronic Conditions",
    author: "Sonya M.",
    category: "AI & Technology",
    description:
      "Use AI to track symptoms, understand your medical data, and take control of chronic conditions. A practical guide for the long haul.",
    amazonUrl: "https://www.amazon.com/dp/B0H4Q6K14L",
    audibleUrl: "https://www.audible.com/pd/B0HLVH9V2N/?source_code=AUDFPWS0223189MWT-BK-ACX0-535088&ref=acx_bty_BK_ACX0_535088_rh_us",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/P/B0H4Q6K14L.01.LZZZZZZZ.jpg",
    featured: false,
  },
  {
    id: "your-health-changing-world",
    title: "Your Health in This Changing World",
    subtitle: "A Clinical Laboratory Scientist's Guide to Staying Well Through New Risks, New Technology, and New Science",
    author: "Sonya M.",
    category: "Health Education",
    description:
      "A Clinical Laboratory Scientist's guide to staying well through new risks, new technology, and new science.",
    amazonUrl: "https://www.amazon.com/dp/B0HMMRQP68",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/P/B0HMMRQP68.01.LZZZZZZZ.jpg",
    featured: false,
    isNew: true,
  },
];
const CATEGORIES = [
  "All Books",
  "Health Education",
  "Nutrition & Diet",
  "Wellness & Lifestyle",
  "Medical Reference",
  "Children's Books",
  "AI & Technology",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Health Education": "bg-[#7E9A85]/15 text-[#7E9A85] border-[#7E9A85]/20",
  "Nutrition & Diet": "bg-[#D48C70]/15 text-[#D48C70] border-[#D48C70]/20",
  "Wellness & Lifestyle": "bg-[#A39EBA]/15 text-[#A39EBA] border-[#A39EBA]/20",
  "Medical Reference": "bg-blue-100 text-blue-700 border-blue-200",
  "Children's Books": "bg-pink-100 text-pink-700 border-pink-200",
  "AI & Technology": "bg-purple-100 text-purple-700 border-purple-200",
};

// ─── Sample Excerpt Modal ─────────────────────────────────────────────────────

function SampleModal({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-[#EBE6DC] max-w-lg w-full p-8 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 200ms cubic-bezier(0.23,1,0.32,1)" }}
      >
        <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }`}</style>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#9E9A90] hover:bg-[#EBE6DC]/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-2">
          <Badge className={`text-[10px] font-semibold border ${CATEGORY_COLORS[book.category] || "bg-gray-100 text-gray-600"}`}>
            {book.category}
          </Badge>
          <h3 className="text-xl font-serif font-bold text-[#2C2A29]">{book.title}</h3>
          <p className="text-xs text-[#9E9A90] font-medium">By {book.author}</p>
        </div>
        <div className="bg-[#F9F6F0] p-5 rounded-2xl border border-[#EBE6DC] relative">
          <span className="absolute top-3 left-4 text-4xl text-[#7E9A85]/20 font-serif leading-none select-none">"</span>
          <p className="text-sm text-[#4E4B4A] leading-relaxed font-serif pl-4 pt-2 italic">
            {book.sampleExcerpt || book.description}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            className="flex-grow bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2"
            onClick={() => window.open(withAmazonTag(book.amazonUrl), "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
            View on Amazon
          </Button>
          {book.audibleUrl && (
            <Button
              variant="outline"
              className="border-[#D48C70]/40 text-[#B86F53] hover:bg-[#D48C70]/10 rounded-xl text-sm font-semibold flex items-center gap-1.5"
              onClick={() => window.open(book.audibleUrl, "_blank", "noopener")}
            >
              <Headphones className="w-4 h-4" />
              Audible
            </Button>
          )}
          <Button
            variant="outline"
            className="border-[#EBE6DC] hover:bg-[#F5F1E9] rounded-xl text-sm font-semibold"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Book Card (Grid) ─────────────────────────────────────────────────────────

function BookCardGrid({ book, onReadSample }: { book: Book; onReadSample: (b: Book) => void }) {
  return (
    <div className="bg-white rounded-3xl border border-[#EBE6DC] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Cover */}
      <div className="relative bg-[#F9F6F0] overflow-hidden" style={{ aspectRatio: "2/3" }}>
        <img
          src={book.coverUrl}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.style.background = "linear-gradient(135deg, #7E9A85 0%, #5C7A65 100%)";
              const placeholder = document.createElement("div");
              placeholder.className = "absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center";
              placeholder.innerHTML = `<div class="text-4xl mb-3">📚</div><p class="font-serif font-bold text-sm leading-tight">${book.title}</p><p class="text-xs mt-1 opacity-80">${book.author}</p>`;
              parent.appendChild(placeholder);
            }
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.featured && (
            <div className="bg-[#D48C70] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              Featured
            </div>
          )}
          {book.isNew && (
            <div className="bg-[#7E9A85] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              New
            </div>
          )}
          {book.audibleUrl && (
            <div className="bg-[#2C2A29]/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Headphones className="w-2.5 h-2.5" />
              Audiobook
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow gap-3">
        <div className="space-y-1.5">
          <Badge className={`text-[9px] font-semibold border ${CATEGORY_COLORS[book.category] || "bg-gray-100 text-gray-600"}`}>
            {book.category}
          </Badge>
          {book.featured && (
            <Badge className="text-[9px] font-semibold border bg-[#D48C70]/10 text-[#D48C70] border-[#D48C70]/20 ml-1">
              Featured
            </Badge>
          )}
          {book.isNew && (
            <Badge className="text-[9px] font-semibold border bg-[#7E9A85]/10 text-[#7E9A85] border-[#7E9A85]/20 ml-1">
              New
            </Badge>
          )}
          <h3 className="font-serif font-bold text-sm text-[#2C2A29] leading-snug line-clamp-2">{book.title}</h3>
          <p className="text-[10px] text-[#9E9A90] font-medium">By {book.author}</p>
        </div>

        <p className="text-xs text-[#5C5A59] leading-relaxed line-clamp-3 flex-grow">{book.description}</p>

        {book.audibleUrl && (
          <a
            href={book.audibleUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#D48C70]/40 bg-[#FFF9F5] py-2 text-[11px] font-semibold text-[#B86F53] hover:bg-[#D48C70]/10 transition-colors"
          >
            <Headphones className="w-3.5 h-3.5" />
            Listen on Audible
          </a>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-grow bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 py-4"
            onClick={() => window.open(withAmazonTag(book.amazonUrl), "_blank")}
          >
            <ExternalLink className="w-3 h-3" />
            View on Amazon
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-[#EBE6DC] hover:bg-[#F5F1E9] rounded-xl text-[11px] font-semibold py-4"
            onClick={() => onReadSample(book)}
          >
            Read Sample
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Book Card (List) ─────────────────────────────────────────────────────────

function BookCardList({ book, onReadSample }: { book: Book; onReadSample: (b: Book) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EBE6DC] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex gap-4 p-4 group">
      {/* Cover thumbnail */}
      <div className="relative bg-[#F9F6F0] rounded-xl overflow-hidden shrink-0 w-20 h-28">
        <img
          src={book.coverUrl}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.style.background = "linear-gradient(135deg, #7E9A85 0%, #5C7A65 100%)";
              const placeholder = document.createElement("div");
              placeholder.className = "absolute inset-0 flex items-center justify-center text-white p-1";
              placeholder.innerHTML = `<span class="text-2xl">📚</span>`;
              parent.appendChild(placeholder);
            }
          }}
        />
        <div className="absolute top-1 left-1 flex flex-col gap-0.5">
          {book.featured && (
            <div className="bg-[#D48C70] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              ★
            </div>
          )}
          {book.isNew && (
            <div className="bg-[#7E9A85] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              New
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className={`text-[9px] font-semibold border ${CATEGORY_COLORS[book.category] || "bg-gray-100 text-gray-600"}`}>
                {book.category}
              </Badge>
              {book.featured && (
                <Badge className="text-[9px] font-semibold border bg-[#D48C70]/10 text-[#D48C70] border-[#D48C70]/20">
                  Featured
                </Badge>
              )}
              {book.isNew && (
                <Badge className="text-[9px] font-semibold border bg-[#7E9A85]/10 text-[#7E9A85] border-[#7E9A85]/20">
                  New
                </Badge>
              )}
            </div>
            <h3 className="font-serif font-bold text-sm text-[#2C2A29] leading-snug">{book.title}</h3>
            <p className="text-[10px] text-[#9E9A90] font-medium">By {book.author}</p>
          </div>
        </div>

        <p className="text-xs text-[#5C5A59] leading-relaxed line-clamp-2">{book.description}</p>

        <div className="flex items-center justify-between gap-3 mt-auto">
          <div className="flex items-center gap-3 text-[10px] font-medium">
            {book.audibleUrl && (
              <a
                href={book.audibleUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="flex items-center gap-1 text-[#B86F53] hover:underline"
              >
                <Headphones className="w-3 h-3" />
                Audiobook
              </a>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-[11px] font-semibold flex items-center gap-1.5 py-3 px-3"
              onClick={() => window.open(withAmazonTag(book.amazonUrl), "_blank")}
            >
              <ExternalLink className="w-3 h-3" />
              View on Amazon
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-[#EBE6DC] hover:bg-[#F5F1E9] rounded-xl text-[11px] font-semibold py-3 px-3"
              onClick={() => onReadSample(book)}
            >
              Read Sample
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Books Page ──────────────────────────────────────────────────────────

export default function Books() {
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = React.useState(false);
  const subscribeNewsletter = trpc.email.subscribe.useMutation({
    onSuccess: () => {
      toast.success("You're subscribed! Check your inbox for a confirmation.");
      setNewsletterEmail("");
      setNewsletterSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message || "Subscription failed. Please try again.");
      setNewsletterSubmitting(false);
    },
  });
  const { isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Books");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredBooks = useMemo(() => {
    return BOOKS.filter((book) => {
      const matchesSearch =
        searchQuery === "" ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All Books" || book.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All Books": BOOKS.length };
    BOOKS.forEach((book) => {
      counts[book.category] = (counts[book.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29] font-sans">
      <SEO
        title="Books & Resources"
        description="Explore The Patient's Compass book collection. Evidence-based guides on lab interpretation, functional medicine, and proactive health management."
        path="/books"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Books & Resources — The Patient's Compass",
          "description": "Evidence-based health books and resources for proactive patients",
          "url": "https://www.thepatientscompass.com/books"
        }}
      />
      {/* Trust Banner */}
      <div className="bg-[#7E9A85] text-white py-2.5 px-4 text-center text-sm font-medium tracking-wide">
        Built by a Clinical Laboratory Scientist with 20+ Years of Experience
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC]">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-[#7E9A85] text-white p-2 rounded-xl shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#2C2A29]">Patient's Compass</span>
              <p className="text-[10px] text-[#7E9A85] font-semibold tracking-wider uppercase">Health Intelligence System</p>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#5C5A59]">
            <a href="/" className="hover:text-[#2C2A29] transition-colors">Home</a>
            <a href="/books" className="text-[#2C2A29] font-semibold border-b-2 border-[#7E9A85] pb-0.5">Books</a>
            <a href="/biomarkers" className="hover:text-[#2C2A29] transition-colors text-[#7E9A85] font-semibold">Biomarker Library</a>
            <a href="/lifestyle" className="hover:text-[#2C2A29] transition-colors text-[#D48C70] font-semibold">Lifestyle AI</a>
            <a href="/features" className="hover:text-[#2C2A29] transition-colors">Features</a>
            <a href="/medical-assistant" className="hover:text-[#2C2A29] transition-colors">Health Companion</a>
            <a href="/blog" className="hover:text-[#2C2A29] transition-colors">Blog</a>
            <a href="/pricing" className="hover:text-[#2C2A29] transition-colors">Pricing</a>
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 rounded-xl text-xs" onClick={() => window.location.href = "/dashboard"}>
                  My Dashboard
                </Button>
                <Button variant="outline" className="border-[#EBE6DC] text-[#5C5A59] hover:bg-[#EBE6DC]/40 rounded-xl text-xs" onClick={() => logout()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-xs" onClick={() => window.location.href = "/signin"}>
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl text-[#5C5A59] hover:bg-[#EBE6DC]/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#EBE6DC] bg-[#F9F6F0]/98 backdrop-blur-md">
            <nav className="container max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              <a href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Home</a>
              <a href="/books" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#2C2A29] bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl">Books</a>
              <a href="/biomarkers" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#7E9A85] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Biomarker Library</a>
              <a href="/lifestyle" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#D48C70] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Lifestyle AI</a>
              <a href="/features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Features</a>
              <a href="/medical-assistant" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Health Companion</a>
              <a href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Blog</a>
              <a href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Pricing</a>
            </nav>
          </div>
        )}
      </header>

      {/* Page Hero */}
      <section className="py-12 border-b border-[#EBE6DC] bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-[#9E9A90] mb-6">
            <a href="/" className="hover:text-[#7E9A85] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Home
            </a>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[#2C2A29] font-medium">Books & Resources</span>
          </div>

          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#7E9A85]/10 border border-[#7E9A85]/20 text-[#7E9A85] px-3 py-1 rounded-full text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{BOOKS.length} Published Books</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#2C2A29]">
              Our Books & Resources
            </h1>
            <p className="text-base text-[#5C5A59] leading-relaxed">
              Comprehensive health education resources to empower your wellness journey. Explore Sonya M.'s collection of evidence-based guides on lab tests, nutrition, wellness, and more.
            </p>
            <div className="pt-2 flex flex-col items-center gap-2">
              <a
                href={AMAZON_AFFILIATE_COLLECTION_URL}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2C2A29] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#4E4B4A] focus:outline-none focus:ring-2 focus:ring-[#7E9A85] focus:ring-offset-2"
                aria-label="Shop Sonya M.'s complete book collection on Amazon"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Shop the complete Amazon collection
              </a>
              <p className="text-[10px] text-[#9E9A90]">
                All titles link to Amazon. As an Amazon Associate, Patients Compass may earn from qualifying purchases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search + Filters + View Toggle */}
      <section className="sticky top-[73px] z-40 bg-[#F9F6F0]/95 backdrop-blur-md border-b border-[#EBE6DC] py-4">
        <div className="container max-w-7xl mx-auto px-4 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9A90]" />
            <Input
              type="text"
              placeholder="Search books by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border-[#EBE6DC] bg-white focus:border-[#7E9A85] text-sm"
            />
          </div>

          {/* Category chips + view toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
                      isActive
                        ? "bg-[#7E9A85] text-white border-[#7E9A85] shadow-sm"
                        : "bg-white text-[#5C5A59] border-[#EBE6DC] hover:border-[#7E9A85]/50 hover:text-[#2C2A29]"
                    }`}
                  >
                    {cat} {count > 0 && <span className={`ml-1 ${isActive ? "opacity-80" : "text-[#9E9A90]"}`}>({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-white border border-[#EBE6DC] rounded-xl p-1 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-[#7E9A85] text-white" : "text-[#9E9A90] hover:text-[#5C5A59]"}`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-[#7E9A85] text-white" : "text-[#9E9A90] hover:text-[#5C5A59]"}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Books Grid/List */}
      <main className="container max-w-7xl mx-auto px-4 py-10">
        {/* Results count */}
        <p className="text-sm text-[#9E9A90] font-medium mb-6">
          Showing {filteredBooks.length} of {BOOKS.length} books
        </p>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl">📚</div>
            <h3 className="text-xl font-serif font-bold text-[#2C2A29]">No books found</h3>
            <p className="text-sm text-[#5C5A59]">Try adjusting your search or filter criteria.</p>
            <Button
              variant="outline"
              className="border-[#EBE6DC] hover:bg-[#F5F1E9] rounded-xl text-sm font-semibold"
              onClick={() => { setSearchQuery(""); setActiveCategory("All Books"); }}
            >
              Clear Filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredBooks.map((book) => (
              <BookCardGrid key={book.id} book={book} onReadSample={setSelectedBook} />
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {filteredBooks.map((book) => (
              <BookCardList key={book.id} book={book} onReadSample={setSelectedBook} />
            ))}
          </div>
        )}
      </main>

      {/* Newsletter Signup Section */}
      <section className="bg-gradient-to-r from-[#7E9A85] to-[#6B8574] py-16">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold text-white mb-3">Get Weekly Health Tips</h2>
            <p className="text-white/90 mb-8 text-lg">Get Sonya's plain-language lab and wellness tips, plus new book announcements, in your inbox.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newsletterEmail) return;
              setNewsletterSubmitting(true);
              subscribeNewsletter.mutate({ email: newsletterEmail });
            }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={newsletterSubmitting}
                className="flex-1 px-4 py-3 rounded-lg bg-white text-[#2C2A29] placeholder-[#9E9A90] focus:outline-none focus:ring-2 focus:ring-[#D4A574] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={newsletterSubmitting}
                className="px-6 py-3 bg-[#D4A574] text-white font-semibold rounded-lg hover:bg-[#C49564] transition-colors duration-200 whitespace-nowrap disabled:opacity-60"
              >
                {newsletterSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            
            <p className="text-white/70 text-sm mt-4">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      {/* Author Bio Section */}
      <section className="bg-white border-t border-[#EBE6DC] py-16 mt-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar / Initials */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg ring-4 ring-[#7E9A85]/30">
                <img
                  src="/manus-storage/sonya-professional-portrait_c5acc8f2.webp"
                  alt="Patients Compass founder portrait"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Bio Text */}
            <div className="flex-grow text-center sm:text-left space-y-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">About Sonya M.</h2>
                <p className="text-sm font-semibold text-[#7E9A85] mt-0.5">Clinical Laboratory Scientist &amp; Health Educator</p>
              </div>
              <p className="text-sm text-[#5C5A59] leading-relaxed">
                Sonya M. is a Clinical Laboratory Scientist with over 20 years of experience in medical diagnostics and patient health education. She bridges the gap between complex laboratory science and everyday health decisions, empowering patients to understand their bodies through evidence-based guidance.
              </p>
              <p className="text-sm text-[#5C5A59] leading-relaxed">
                Her books span adult health, children's wellness, nutrition science, and lab interpretation — all grounded in the belief that informed patients make better health decisions. From decoding blood work to teaching children about their amazing bodies, Sonya's mission is to make health literacy accessible to everyone.
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start pt-2">
                <a
                  href={withAmazonTag("https://www.amazon.com/stores/Sonya-M/author/B0GMBQCK7J/allbooks")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#7E9A85] hover:bg-[#6A8571] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View All Books on Amazon
                </a>
                <a
                  href="/medical-assistant"
                  className="inline-flex items-center gap-2 border border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Ask the AI Health Assistant
                </a>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-[#EBE6DC]">
            <div className="text-center">
              <p className="text-3xl font-serif font-bold text-[#7E9A85]">{BOOKS.length}+</p>
              <p className="text-xs text-[#9E9A90] font-medium mt-1 uppercase tracking-wider">Published Books</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-serif font-bold text-[#D48C70]">20+</p>
              <p className="text-xs text-[#9E9A90] font-medium mt-1 uppercase tracking-wider">Years Experience</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-serif font-bold text-[#A39EBA]">5</p>
              <p className="text-xs text-[#9E9A90] font-medium mt-1 uppercase tracking-wider">Health Categories</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2A29] text-[#EBE6DC] py-10 border-t border-[#3D3A39]">
        <div className="container max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#9E9A90] border-b border-[#3D3A39] pb-4">
            <a href="/faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="/support" className="hover:text-white transition-colors">Help Center</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#9E9A90] font-medium">
            <p>© {new Date().getFullYear()} The Patient's Compass Health Intelligence System. All rights reserved.</p>
            <p className="uppercase tracking-wider">Educational Content Only — Not Medical Advice</p>
          </div>
        </div>
      </footer>

      {/* Sample Excerpt Modal */}
      {selectedBook && (
        <SampleModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}
