import SEO from "@/components/SEO";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  ChevronRight,
  Utensils,
  Activity,
  Moon,
  MessageSquare,
  RefreshCw,
  Download,
  Lock,
  Save,
  CheckCircle2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { exportRecommendationsPDF } from "@/lib/pdfExport";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── Types ────────────────────────────────────────────────────────────────────

type BiomarkerStatus = "critical_low" | "suboptimal" | "optimal" | "high" | "critical_high";

interface BiomarkerEntry {
  name: string;
  status: BiomarkerStatus;
}

interface LifestyleResult {
  summary: string;
  nutritionFocus: {
    headline: string;
    items: Array<{ title: string; description: string; foods: string[] }>;
  };
  lifestyleFocus: {
    headline: string;
    items: Array<{
      category: string;
      title: string;
      description: string;
      actionSteps: string[];
    }>;
  };
  biomarkerHabits: Array<{ biomarkerName: string; habit: string; rationale: string }>;
  doctorQuestions: string[];
  disclaimer: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BIOMARKER_OPTIONS: Array<{ name: string; category: string; defaultStatus: BiomarkerStatus }> =
  [
    { name: "Ferritin (Iron Storage)", category: "Nutrient Balance", defaultStatus: "suboptimal" },
    { name: "TSH (Thyroid)", category: "Hormonal System", defaultStatus: "high" },
    { name: "HbA1c (Blood Sugar)", category: "Metabolic System", defaultStatus: "high" },
    { name: "hs-CRP (Inflammation)", category: "Cardiovascular", defaultStatus: "high" },
    { name: "ALT (Liver)", category: "Liver System", defaultStatus: "high" },
    { name: "Vitamin D", category: "Nutrient Balance", defaultStatus: "suboptimal" },
    { name: "Vitamin B12", category: "Nutrient Balance", defaultStatus: "suboptimal" },
    { name: "Fasting Insulin", category: "Metabolic System", defaultStatus: "high" },
    { name: "LDL Cholesterol", category: "Cardiovascular", defaultStatus: "high" },
  ];

const STATUS_OPTIONS: Array<{ value: BiomarkerStatus; label: string; color: string }> = [
  { value: "critical_low", label: "Critically Low", color: "text-red-600" },
  { value: "suboptimal", label: "Suboptimal", color: "text-amber-600" },
  { value: "optimal", label: "Optimal", color: "text-emerald-600" },
  { value: "high", label: "Elevated / High", color: "text-orange-600" },
  { value: "critical_high", label: "Critically High", color: "text-red-700" },
];

const GOAL_OPTIONS = [
  { id: "energy", label: "Boost Daily Energy", icon: "⚡" },
  { id: "weight", label: "Support Healthy Weight", icon: "⚖️" },
  { id: "inflammation", label: "Reduce Inflammation", icon: "🔥" },
  { id: "hormones", label: "Balance Hormones", icon: "🦋" },
  { id: "longevity", label: "Optimize Longevity", icon: "🌱" },
  { id: "cognitive", label: "Sharpen Mental Clarity", icon: "🧠" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LifestyleCustomizer() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBiomarkers, setSelectedBiomarkers] = useState<BiomarkerEntry[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [result, setResult] = useState<LifestyleResult | null>(null);
  const [activeTab, setActiveTab] = useState<"nutrition" | "lifestyle" | "habits" | "questions">(
    "nutrition"
  );

  const [planSaved, setPlanSaved] = useState(false);

  const savePlan = trpc.wellnessPlans.save.useMutation({
    onSuccess: () => {
      setPlanSaved(true);
      toast.success("Wellness plan saved!", {
        description: "Your personalised plan is now in your dashboard.",
        duration: 5000,
        action: {
          label: "View Dashboard",
          onClick: () => { window.location.href = "/dashboard"; },
        },
      });
    },
    onError: () => {
      toast.error("Failed to save plan.", {
        description: "Please try again or check your connection.",
      });
    },
  });

  const handleSavePlan = () => {
    if (!result) return;
    const title = `Wellness Plan — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    savePlan.mutate({
      title,
      inputs: {
        biomarkers: selectedBiomarkers,
        goals: selectedGoals,
        additionalContext,
      },
      planOutput: result,
    });
  };

  const getRecommendations = trpc.lifestyle.getRecommendations.useMutation({
    onSuccess: (data) => {
      setResult(data as LifestyleResult);
      setStep(3);
    },
    onError: (err) => {
      toast.error("Failed to generate recommendations. Please try again.");
      console.error(err);
    },
  });

  const toggleBiomarker = (name: string, defaultStatus: BiomarkerStatus) => {
    setSelectedBiomarkers((prev) => {
      const exists = prev.find((b) => b.name === name);
      if (exists) return prev.filter((b) => b.name !== name);
      return [...prev, { name, status: defaultStatus }];
    });
  };

  const updateStatus = (name: string, status: BiomarkerStatus) => {
    setSelectedBiomarkers((prev) =>
      prev.map((b) => (b.name === name ? { ...b, status } : b))
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (selectedBiomarkers.length === 0) {
      toast.error("Please select at least one biomarker.");
      return;
    }
    const goalContext =
      selectedGoals.length > 0
        ? `My primary wellness goals are: ${selectedGoals
            .map((id) => GOAL_OPTIONS.find((g) => g.id === id)?.label)
            .filter(Boolean)
            .join(", ")}.`
        : "";
    const contextText = [goalContext, additionalContext].filter(Boolean).join(" ");

    getRecommendations.mutate({
      biomarkers: selectedBiomarkers,
      additionalContext: contextText || undefined,
    });
  };

  const TABS = [
    { id: "nutrition" as const, label: "Nutrition", icon: <Utensils className="w-4 h-4" /> },
    { id: "lifestyle" as const, label: "Lifestyle", icon: <Activity className="w-4 h-4" /> },
    { id: "habits" as const, label: "Daily Habits", icon: <Moon className="w-4 h-4" /> },
    {
      id: "questions" as const,
      label: "Doctor Questions",
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Lifestyle Customizer"
        description="Get a personalized wellness plan based on your health goals, biomarkers, and lifestyle. Built on functional medicine principles."
        path="/lifestyle"
      />
      {/* Header */}
      <div className="bg-[#2C2A29] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#7E9A85] text-sm font-semibold hover:text-[#9ABBA2] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <div className="bg-[#D48C70] p-2 rounded-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-[#D48C70] text-xs font-bold uppercase tracking-widest">
              AI-Powered Wellness
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold leading-tight">
            Lifestyle Customizer
          </h1>
          <p className="text-[#C5C0B5] text-base max-w-xl leading-relaxed">
            Tell us your biomarker statuses and wellness goals. Our AI generates a personalized
            nutrition, lifestyle, and habit plan based on clinical laboratory science frameworks.
          </p>

          {/* Step indicator */}
          {step < 3 && (
            <div className="flex items-center gap-2 pt-2">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? "bg-[#7E9A85] text-white" : "bg-[#3D3A39] text-[#9E9A90]"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 2 && (
                    <div
                      className={`h-0.5 w-8 transition-all ${
                        step > s ? "bg-[#7E9A85]" : "bg-[#3D3A39]"
                      }`}
                    />
                  )}
                </div>
              ))}
              <span className="text-xs text-[#9E9A90] ml-2">
                {step === 1 && "Select Biomarkers & Status"}
                {step === 2 && "Goals & Context"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Step 1: Biomarkers */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold">
                Which biomarkers are out of optimal range?
              </h2>
              <p className="text-sm text-[#5C5A59]">
                Select each biomarker that is not in your optimal range, then choose its status.
              </p>
            </div>
            <div className="space-y-3">
              {BIOMARKER_OPTIONS.map((b) => {
                const selected = selectedBiomarkers.find((x) => x.name === b.name);
                return (
                  <div
                    key={b.name}
                    className={`bg-white border rounded-2xl p-4 transition-all duration-200 ${
                      selected
                        ? "border-[#7E9A85] shadow-sm"
                        : "border-[#EBE6DC] hover:border-[#7E9A85]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => toggleBiomarker(b.name, b.defaultStatus)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                          selected
                            ? "bg-[#7E9A85] border-[#7E9A85]"
                            : "border-[#C5C0B5] hover:border-[#7E9A85]"
                        }`}
                      >
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div
                        className="flex-grow cursor-pointer"
                        onClick={() => toggleBiomarker(b.name, b.defaultStatus)}
                      >
                        <p className="text-sm font-semibold text-[#2C2A29]">{b.name}</p>
                        <p className="text-[10px] text-[#9E9A90] font-medium">{b.category}</p>
                      </div>
                      {selected && (
                        <select
                          value={selected.status}
                          onChange={(e) =>
                            updateStatus(b.name, e.target.value as BiomarkerStatus)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs border border-[#EBE6DC] rounded-lg px-2 py-1.5 bg-white focus:border-[#7E9A85] focus:outline-none font-medium"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-[#9E9A90]">
                {selectedBiomarkers.length} biomarker{selectedBiomarkers.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <Button
                className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl px-6 flex items-center gap-2"
                onClick={() => {
                  if (selectedBiomarkers.length === 0) {
                    toast.error("Please select at least one biomarker.");
                    return;
                  }
                  setStep(2);
                }}
              >
                Next: Goals
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Goals & Context */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold">
                What are your primary wellness goals?
              </h2>
              <p className="text-sm text-[#5C5A59]">
                Select up to 3 goals. This helps us prioritize your recommendations.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {GOAL_OPTIONS.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    if (selectedGoals.includes(g.id)) {
                      toggleGoal(g.id);
                    } else if (selectedGoals.length < 3) {
                      toggleGoal(g.id);
                    } else {
                      toast.error("Select up to 3 goals.");
                    }
                  }}
                  className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    selectedGoals.includes(g.id)
                      ? "bg-white border-[#7E9A85] shadow-md"
                      : "bg-white/50 border-[#EBE6DC] hover:border-[#7E9A85]/50"
                  }`}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <p className="font-semibold text-[#2C2A29]">{g.label}</p>
                </div>
              ))}
            </div>

            {/* Additional context */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">
                Additional Context (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. I'm a 42-year-old woman, postmenopausal, vegetarian, with a history of fatigue..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#EBE6DC] bg-white focus:border-[#7E9A85] focus:outline-none text-sm font-medium resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-[#9E9A90]">{additionalContext.length}/500 characters</p>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                className="border-[#EBE6DC] text-[#5C5A59] rounded-xl"
                onClick={() => setStep(1)}
              >
                ← Back
              </Button>
              <Button
                className="bg-[#D48C70] hover:bg-[#C27A5B] text-white rounded-xl px-6 flex items-center gap-2"
                onClick={handleGenerate}
                disabled={getRecommendations.isPending}
              >
                {getRecommendations.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Your Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate My Plan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {getRecommendations.isPending && (
          <div className="fixed inset-0 bg-[#F9F6F0]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
            <div className="bg-white border border-[#EBE6DC] rounded-3xl p-10 shadow-xl text-center space-y-4 max-w-sm">
              <Loader2 className="w-12 h-12 text-[#7E9A85] animate-spin mx-auto" />
              <h3 className="text-xl font-serif font-bold">Crafting Your Plan...</h3>
              <p className="text-sm text-[#5C5A59]">
                Our AI is analyzing your biomarker statuses and goals to create a personalized
                wellness roadmap based on functional medicine frameworks.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="space-y-8">
            {/* Summary header */}
            <div className="bg-white border border-[#7E9A85]/30 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#7E9A85]/10 p-2 rounded-xl">
                  <Sparkles className="w-5 h-5 text-[#7E9A85]" />
                </div>
                <h2 className="text-2xl font-serif font-bold">Your Personalized Wellness Plan</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedBiomarkers.map((b) => (
                  <Badge
                    key={b.name}
                    className="bg-[#7E9A85]/10 text-[#7E9A85] border border-[#7E9A85]/20 rounded-full text-[10px] font-semibold"
                  >
                    {b.name}:{" "}
                    {STATUS_OPTIONS.find((s) => s.value === b.status)?.label ?? b.status}
                  </Badge>
                ))}
                {selectedGoals.map((id) => {
                  const g = GOAL_OPTIONS.find((x) => x.id === id);
                  return g ? (
                    <Badge
                      key={id}
                      className="bg-[#D48C70]/10 text-[#D48C70] border border-[#D48C70]/20 rounded-full text-[10px] font-semibold"
                    >
                      {g.icon} {g.label}
                    </Badge>
                  ) : null;
                })}
              </div>
              {result.summary && (
                <p className="text-sm text-[#5C5A59] leading-relaxed border-t border-[#EBE6DC] pt-3">
                  {result.summary}
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === tab.id
                        ? "bg-[#2C2A29] text-white"
                        : "bg-white border border-[#EBE6DC] text-[#5C5A59] hover:border-[#7E9A85]"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <Card className="border border-[#EBE6DC] rounded-3xl bg-white">
                <CardContent className="p-6 space-y-4">
                  {activeTab === "nutrition" && result.nutritionFocus && (
                    <div className="space-y-5">
                      <p className="font-serif font-bold text-lg text-[#2C2A29]">
                        {result.nutritionFocus.headline}
                      </p>
                      {result.nutritionFocus.items.map((item, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#D48C70] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {i + 1}
                            </div>
                            <p className="font-bold text-sm text-[#2C2A29]">{item.title}</p>
                          </div>
                          <p className="text-sm text-[#5C5A59] leading-relaxed pl-8">
                            {item.description}
                          </p>
                          {item.foods.length > 0 && (
                            <div className="pl-8 flex flex-wrap gap-1.5">
                              {item.foods.map((food, fi) => (
                                <span
                                  key={fi}
                                  className="bg-[#F9F6F0] border border-[#EBE6DC] text-[#5C5A59] text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                >
                                  {food}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "lifestyle" && result.lifestyleFocus && (
                    <div className="space-y-5">
                      <p className="font-serif font-bold text-lg text-[#2C2A29]">
                        {result.lifestyleFocus.headline}
                      </p>
                      {result.lifestyleFocus.items.map((item, i) => (
                        <div
                          key={i}
                          className="bg-[#F9F6F0] border border-[#EBE6DC] rounded-2xl p-4 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none text-[10px] font-bold capitalize">
                              {item.category}
                            </Badge>
                            <p className="font-bold text-sm text-[#2C2A29]">{item.title}</p>
                          </div>
                          <p className="text-sm text-[#5C5A59] leading-relaxed">
                            {item.description}
                          </p>
                          {item.actionSteps.length > 0 && (
                            <ul className="space-y-1 pt-1">
                              {item.actionSteps.map((step, si) => (
                                <li
                                  key={si}
                                  className="flex items-start gap-2 text-xs text-[#5C5A59]"
                                >
                                  <span className="text-[#7E9A85] font-bold shrink-0">→</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "habits" && result.biomarkerHabits && (
                    <div className="space-y-4">
                      <p className="font-serif font-bold text-lg text-[#2C2A29]">
                        Biomarker-Specific Daily Habits
                      </p>
                      {result.biomarkerHabits.map((habit, i) => (
                        <div
                          key={i}
                          className="bg-[#F9F6F0] border border-[#EBE6DC] rounded-2xl p-4 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#A39EBA] uppercase tracking-wider">
                              {habit.biomarkerName}
                            </span>
                          </div>
                          <p className="font-semibold text-sm text-[#2C2A29]">{habit.habit}</p>
                          <p className="text-xs text-[#5C5A59] leading-relaxed">{habit.rationale}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "questions" && result.doctorQuestions && (
                    <div className="space-y-3">
                      <p className="font-serif font-bold text-lg text-[#2C2A29]">
                        Questions to Bring to Your Doctor
                      </p>
                      {result.doctorQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="bg-white border border-[#A39EBA]/20 rounded-2xl p-4 flex items-start gap-3"
                        >
                          <span className="text-[#A39EBA] font-bold text-sm shrink-0">
                            Q{i + 1}.
                          </span>
                          <p className="text-sm text-[#2C2A29] leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Disclaimer */}
            {result.disclaimer && (
              <div className="bg-[#F9F6F0] border border-[#EBE6DC] rounded-2xl p-4 flex gap-3">
                <span className="text-lg shrink-0">📋</span>
                <p className="text-xs text-[#5C5A59] leading-relaxed">{result.disclaimer}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isAuthenticated ? (
                /* Authenticated: save + export PDF */
                <div className="flex flex-wrap gap-3">
                  <Button
                    className={[
                      "relative overflow-hidden rounded-xl flex items-center gap-2 text-white transition-all duration-200",
                      planSaved
                        ? "bg-emerald-600 hover:bg-emerald-600 scale-100"
                        : savePlan.isPending
                        ? "bg-[#7E9A85] cursor-not-allowed opacity-90"
                        : "bg-[#7E9A85] hover:bg-[#6A8571] active:scale-95",
                    ].join(" ")}
                    onClick={handleSavePlan}
                    disabled={savePlan.isPending || planSaved}
                  >
                    {/* Shimmer overlay while saving */}
                    {savePlan.isPending && (
                      <span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        style={{
                          animation: "shimmer 1.2s infinite",
                          backgroundSize: "200% 100%",
                        }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      {planSaved ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 animate-[scale-in_0.2s_ease-out]" />
                          Saved!
                        </>
                      ) : savePlan.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Plan
                        </>
                      )}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#7E9A85] text-[#7E9A85] rounded-xl flex items-center gap-2"
                    onClick={() => {
                      try {
                        exportRecommendationsPDF({
                          summary: result.summary,
                          nutritionFocus: result.nutritionFocus,
                          lifestyleFocus: result.lifestyleFocus,
                          doctorQuestions: result.doctorQuestions,
                          biomarkers: selectedBiomarkers.map((b) => ({ name: b.name, status: b.status })),
                        });
                        toast.success("Wellness plan exported as PDF");
                      } catch {
                        toast.error("Export failed. Please try again.");
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export as PDF
                  </Button>
                </div>
              ) : (
                /* Not authenticated: show inline sign-in prompt */
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#F9F6F0] border border-[#EBE6DC] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[#5C5A59]">
                    <Lock className="w-4 h-4 text-[#D48C70] shrink-0" />
                    <span>
                      <strong className="text-[#2C2A29]">Sign in</strong> to save &amp; export your wellness plan as PDF
                    </span>
                  </div>
                  <Button
                    className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-sm font-semibold shrink-0"
                    onClick={() => {
                      window.location.href = getLoginUrl(location);
                    }}
                  >
                    Sign In to Export
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                className="border-[#EBE6DC] text-[#5C5A59] rounded-xl flex items-center gap-2"
                onClick={() => {
                  setStep(1);
                  setResult(null);
                  setSelectedBiomarkers([]);
                  setSelectedGoals([]);
                  setAdditionalContext("");
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Start Over
              </Button>
              <Link href="/biomarkers" className="w-full">
                <Button
                  variant="outline"
                  className="border-[#7E9A85] text-[#7E9A85] rounded-xl flex items-center gap-2 w-full"
                >
                  Explore Biomarker Library
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full">
                <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl flex items-center gap-2 w-full">
                  View My Dashboard
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
