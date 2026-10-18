import { useState, useMemo } from "react";
import SEO from "@/components/SEO";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  Utensils,
  Activity,
  MessageSquare,
  ChevronRight,
  Info,
} from "lucide-react";
import { getBiomarkerBySlug } from "@/data/biomarkers";

export default function BiomarkerDetail() {
  const { slug } = useParams<{ slug: string }>();
  const biomarker = getBiomarkerBySlug(slug || "");

  const [sliderValue, setSliderValue] = useState<number | null>(null);

  const displayValue = sliderValue !== null ? sliderValue : biomarker?.optimalRange.low;

  // Compute slider min/max from zones
  const sliderMin = useMemo(() => {
    if (!biomarker) return 0;
    return Math.max(0, biomarker.zones.criticalLow.max * 0.5);
  }, [biomarker]);

  const sliderMax = useMemo(() => {
    if (!biomarker) return 200;
    return biomarker.zones.high.min * 1.5;
  }, [biomarker]);

  const zoneStatus = useMemo(() => {
    if (!biomarker || displayValue === undefined) return null;
    const v = displayValue;
    const z = biomarker.zones;
    if (v <= z.criticalLow.max) {
      return { label: z.criticalLow.label, color: "text-red-600 bg-red-50 border-red-200" };
    }
    if (v >= z.optimal.min && v <= z.optimal.max) {
      return { label: z.optimal.label, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    }
    if (v >= z.normal.min && v <= z.normal.max) {
      return { label: z.normal.label, color: "text-blue-600 bg-blue-50 border-blue-200" };
    }
    if (v < z.optimal.min) {
      return { label: z.suboptimal.label, color: "text-amber-600 bg-amber-50 border-amber-200" };
    }
    return { label: z.high.label, color: "text-red-600 bg-red-50 border-red-200" };
  }, [biomarker, displayValue]);

  if (!biomarker) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-4xl">🔬</p>
        <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">Biomarker Not Found</h2>
        <p className="text-[#5C5A59] text-sm">
          The biomarker you are looking for does not exist in our library.
        </p>
        <Link href="/biomarkers">
          <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl mt-2">
            ← Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title={biomarker ? `${biomarker.name} — Optimal Range & Interpretation` : "Biomarker Detail"}
        description={biomarker ? `Learn the clinical normal vs. optimal wellness range for ${biomarker.name}. ${biomarker.overview.slice(0, 100)}...` : "Detailed biomarker interpretation with functional medicine ranges."}
        path={biomarker ? `/biomarkers/${slug}` : "/biomarkers"}
        structuredData={biomarker ? {
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          "name": `${biomarker.name} — The Patient's Compass`,
          "description": biomarker.overview,
          "url": `https://www.thepatientscompass.com/biomarkers/${slug}`,
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.thepatientscompass.com" },
              { "@type": "ListItem", "position": 2, "name": "Biomarker Directory", "item": "https://www.thepatientscompass.com/biomarkers" },
              { "@type": "ListItem", "position": 3, "name": biomarker.name, "item": `https://www.thepatientscompass.com/biomarkers/${slug}` }
            ]
          }
        } : undefined}
      />
      {/* Hero Header */}
      <div className="bg-[#2C2A29] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link href="/biomarkers" className="inline-flex items-center gap-1.5 text-[#7E9A85] text-sm font-semibold hover:text-[#9ABBA2] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Biomarker Directory
          </Link>
          <div className="flex items-start gap-4 mt-4">
            <div className="text-5xl">{biomarker.icon}</div>
            <div className="space-y-2">
              <Badge
                className="text-[10px] font-bold border rounded-full px-2.5 py-0.5"
                style={{
                  backgroundColor: `${biomarker.categoryColor}25`,
                  color: biomarker.categoryColor,
                  borderColor: `${biomarker.categoryColor}40`,
                }}
              >
                {biomarker.category}
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">
                {biomarker.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#C5C0B5]">
                <span>
                  Standard Range:{" "}
                  <span className="text-white font-semibold line-through">
                    {biomarker.standardRange.label}
                  </span>
                </span>
                <span>→</span>
                <span>
                  Optimal Range:{" "}
                  <span className="font-bold" style={{ color: biomarker.categoryColor }}>
                    {biomarker.optimalRange.label}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Overview */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">Overview</h2>
          <p className="text-[#5C5A59] leading-relaxed">{biomarker.overview}</p>
          <div className="bg-white border border-[#EBE6DC] rounded-2xl p-5 flex gap-3">
            <Info className="w-5 h-5 text-[#7E9A85] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#2C2A29] mb-1">Why This Matters</p>
              <p className="text-sm text-[#5C5A59] leading-relaxed">{biomarker.whyItMatters}</p>
            </div>
          </div>
        </section>

        {/* Interactive Range Visualizer */}
        <section className="space-y-4">
          <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">
            Interactive Range Visualizer
          </h2>
          <Card className="border border-[#EBE6DC] shadow-sm rounded-3xl bg-white">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">
                  Simulate Your Lab Value
                </span>
                <span className="text-3xl font-serif font-bold text-[#2C2A29]">
                  {displayValue?.toFixed(1)}{" "}
                  <span className="text-sm font-sans text-[#5C5A59]">{biomarker.unit}</span>
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={(sliderMax - sliderMin) / 100}
                  value={displayValue ?? sliderMin}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#7E9A85]"
                  style={{
                    background: `linear-gradient(to right, #7E9A85 0%, #7E9A85 ${
                      (((displayValue ?? sliderMin) - sliderMin) / (sliderMax - sliderMin)) * 100
                    }%, #EBE6DC ${
                      (((displayValue ?? sliderMin) - sliderMin) / (sliderMax - sliderMin)) * 100
                    }%, #EBE6DC 100%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] font-bold text-[#9E9A90] uppercase tracking-wider">
                  <span>Low</span>
                  <span style={{ color: biomarker.categoryColor }}>
                    Optimal: {biomarker.optimalRange.label}
                  </span>
                  <span>High</span>
                </div>
              </div>

              {zoneStatus && (
                <div
                  className={`p-4 rounded-xl border text-center font-semibold text-sm transition-all duration-300 ${zoneStatus.color}`}
                >
                  {zoneStatus.label}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F9F6F0] p-4 rounded-xl border border-[#EBE6DC] space-y-1">
                  <p className="text-[10px] text-[#5C5A59] uppercase tracking-wider font-semibold">
                    Standard Lab Range
                  </p>
                  <p className="text-lg font-serif font-bold text-[#5C5A59] line-through">
                    {biomarker.standardRange.label}
                  </p>
                  <p className="text-[10px] text-[#9E9A90]">
                    Only flags severe disease or clinical deficiency.
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl border space-y-1"
                  style={{
                    backgroundColor: `${biomarker.categoryColor}10`,
                    borderColor: `${biomarker.categoryColor}30`,
                  }}
                >
                  <p
                    className="text-[10px] uppercase tracking-wider font-bold"
                    style={{ color: biomarker.categoryColor }}
                  >
                    Optimal Functional Range
                  </p>
                  <p
                    className="text-lg font-serif font-bold"
                    style={{ color: biomarker.categoryColor }}
                  >
                    {biomarker.optimalRange.label}
                  </p>
                  <p className="text-[10px]" style={{ color: `${biomarker.categoryColor}CC` }}>
                    Optimized for daily vitality and longevity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Symptoms Grid */}
        {(biomarker.symptomsLow.length > 0 || biomarker.symptomsHigh.length > 0) && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D48C70]" />
              <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">
                Symptom Patterns
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {biomarker.symptomsLow.length > 0 && (
                <Card className="border border-amber-200 rounded-2xl bg-amber-50/50">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      When Too Low / Suboptimal
                    </p>
                    <ul className="space-y-2">
                      {biomarker.symptomsLow.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {biomarker.symptomsHigh.length > 0 && (
                <Card className="border border-red-200 rounded-2xl bg-red-50/50">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider">
                      When Too High / Elevated
                    </p>
                    <ul className="space-y-2">
                      {biomarker.symptomsHigh.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Lifestyle Factors */}
        {biomarker.lifestyleFactors.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#7E9A85]" />
              <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">
                Key Lifestyle Factors
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {biomarker.lifestyleFactors.map((lf, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#EBE6DC] rounded-2xl p-5 space-y-2"
                >
                  <p className="font-bold text-sm text-[#2C2A29]">{lf.factor}</p>
                  <p className="text-xs text-[#5C5A59] leading-relaxed">{lf.impact}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nutrition Tips */}
        {biomarker.nutritionTips.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#D48C70]" />
              <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">
                Nutrition & Supplementation Tips
              </h2>
            </div>
            <Card className="border border-[#EBE6DC] rounded-3xl bg-white">
              <CardContent className="p-6 space-y-3">
                {biomarker.nutritionTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: biomarker.categoryColor }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-sm text-[#5C5A59] leading-relaxed">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Doctor Questions */}
        {biomarker.doctorQuestions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#A39EBA]" />
              <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">
                Questions to Ask Your Doctor
              </h2>
            </div>
            <div className="space-y-3">
              {biomarker.doctorQuestions.map((q, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#A39EBA]/20 rounded-2xl p-4 flex items-start gap-3"
                >
                  <span className="text-[#A39EBA] font-bold text-sm shrink-0">Q{i + 1}.</span>
                  <p className="text-sm text-[#2C2A29] leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Chapters */}
        {biomarker.relatedChapters.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#7E9A85]" />
              <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">
                Related Book Chapters
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {biomarker.relatedChapters.map((ch, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#EBE6DC] rounded-2xl p-5 space-y-2 hover:border-[#7E9A85]/40 transition-colors"
                >
                  <p className="text-[10px] text-[#7E9A85] font-bold uppercase tracking-wider">
                    {ch.chapter}
                  </p>
                  <p className="font-serif font-bold text-base text-[#2C2A29]">{ch.topic}</p>
                  <p className="text-xs text-[#9E9A90] italic">{ch.book}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                onClick={() => window.open("https://www.amazon.com/dp/B0H1N9N7H8", "_blank")}
              >
                <span>Get the Book on Amazon</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </section>
        )}

        {/* Navigation: back + next steps */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#EBE6DC]">
          <Link href="/biomarkers">
            <Button
              variant="outline"
              className="border-[#EBE6DC] text-[#5C5A59] rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Directory
            </Button>
          </Link>
          <Link href="/lifestyle">
            <Button className="bg-[#D48C70] hover:bg-[#C27A5B] text-white rounded-xl flex items-center gap-2">
              <span>Get Personalized Lifestyle Plan</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="bg-white border border-[#EBE6DC] rounded-2xl p-5 flex gap-3">
          <span className="text-lg shrink-0">📋</span>
          <p className="text-xs text-[#5C5A59] leading-relaxed">
            <strong className="text-[#2C2A29]">Educational Disclaimer:</strong> All information on
            this page is for educational purposes only and is based on functional medicine and
            clinical laboratory science frameworks. It is not intended to diagnose, treat, cure, or
            replace professional medical advice. Always discuss your specific lab results with your
            licensed healthcare provider before making any health decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
