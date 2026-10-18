import SEO from "@/components/SEO";
import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as gtm from "@/lib/gtm";
import {
  Award,
  Activity,
  ArrowLeft,
  FileText,
  TrendingUp,
  Calendar,
  ChevronRight,
  Loader2,
  Download,
  Leaf,
  Trash2,
  Sparkles,
  X,
  Crown,
  Clock3,
  CircleCheck,
  FileDown,
  Settings,
  Bookmark,
  Filter,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Copy, Check, Users } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSettingsModal } from "@/components/DashboardSettingsModal";
import BiomarkerTrendChart from "@/components/BiomarkerTrendChart";
import {
  exportBiomarkerReportPDF,
  exportDoctorLetterPDF,
  type BiomarkerReportItem,
} from "@/lib/pdfExport";
import { BIOMARKER_PROFILES } from "@/data/biomarkers";
import { getInitials, getSubscriptionBadge } from "@/lib/dashboardPresentation";
// ─── Onboarding checklist constants (mirrors PurchaseConfirmation) ────────────
const CHECKLIST_KEY = "pc_onboarding_v1";
const CHECKLIST_TOTAL = 5;
const DISMISS_KEY = "pc_progress_dismissed";
type ActivityFilterKey = "all" | "lab_report_saved" | "wellness_plan_saved" | "profile" | "saved_content" | "certificate_saved" | "subscription_portal_opened";
type ActivityEventType = "lab_report_saved" | "wellness_plan_saved" | "profile_image_updated" | "profile_image_removed" | "subscription_portal_opened" | "content_saved" | "content_unsaved" | "certificate_saved";
const ACTIVITY_FILTER_EVENT_TYPES: Record<ActivityFilterKey, ActivityEventType[] | undefined> = {
  all: undefined,
  lab_report_saved: ["lab_report_saved"],
  wellness_plan_saved: ["wellness_plan_saved"],
  profile: ["profile_image_updated", "profile_image_removed"],
  saved_content: ["content_saved", "content_unsaved"],
  certificate_saved: ["certificate_saved"],
  subscription_portal_opened: ["subscription_portal_opened"],
};

function getOnboardingProgress(): number {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return 0;
    return (JSON.parse(raw) as string[]).length;
  } catch {
    return 0;
  }
}

// ─── Range config helper ──────────────────────────────────────────────────────

function getRangeConfig(biomarkerName: string, unit: string) {
  const profile = BIOMARKER_PROFILES.find(
    (p) =>
      p.name.toLowerCase().includes(biomarkerName.toLowerCase()) ||
      biomarkerName.toLowerCase().includes(p.shortName.toLowerCase())
  );
  if (!profile) return undefined;
  return {
    standardLow: profile.standardRange.low,
    standardHigh: profile.standardRange.high,
    optimalLow: profile.optimalRange.low,
    optimalHigh: profile.optimalRange.high,
    unit: profile.unit || unit,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const INTERACTIVE_CARD_CLASS =
  "group border border-[#EBE6DC] rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#7E9A85]/35 hover:shadow-[0_14px_34px_rgba(76,92,80,0.12)] focus-within:border-[#7E9A85]/45 focus-within:shadow-[0_14px_34px_rgba(76,92,80,0.12)]";

function DashboardSectionSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div className="grid gap-4" role="status" aria-label="Loading dashboard content">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="dashboard-loading-surface rounded-2xl border border-[#EBE6DC] bg-white p-5 shadow-sm"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="dashboard-skeleton h-4 w-44 rounded-md" />
              <Skeleton className="dashboard-skeleton h-3 w-64 max-w-full rounded-md" />
              <Skeleton className="dashboard-skeleton h-3 w-40 rounded-md" />
            </div>
            <Skeleton className="dashboard-skeleton h-9 w-24 rounded-xl" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading dashboard content</span>
    </div>
  );
}

function formatActivityTime(value: Date | string) {
  const elapsed = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [exportingReport, setExportingReport] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(0);
  const [progressDismissed, setProgressDismissed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activityRange, setActivityRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [activityType, setActivityType] = useState<ActivityFilterKey>("all");

  useEffect(() => {
    setOnboardingCompleted(getOnboardingProgress());
    const completed = getOnboardingProgress();
    setOnboardingCompleted(completed);
    // Auto-dismiss permanently once all steps are done
    if (completed >= CHECKLIST_TOTAL) {
      localStorage.setItem(DISMISS_KEY, "1");
      setProgressDismissed(true);
    } else {
      setProgressDismissed(!!localStorage.getItem(DISMISS_KEY));
    }
  }, []);

  function dismissProgress() {
    localStorage.setItem(DISMISS_KEY, "1"); // permanent — survives new sessions
    setProgressDismissed(true);
  }

  const {
    data: labReports,
    isLoading: reportsLoading,
    error: reportsError,
  } = trpc.lab.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 2,
  });

  // Track dashboard page view on mount
  React.useEffect(() => {
    if (isAuthenticated) {
      gtm.trackPageView("/dashboard", "Dashboard");
    }
  }, [isAuthenticated]);

  const {
    data: biomarkerHistory,
    isLoading: historyLoading,
    error: historyError,
  } = trpc.lab.biomarkerHistory.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 2,
  });

  const {
    data: wellnessPlans,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = trpc.wellnessPlans.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 2,
  });

  const { data: referralEarnings, isLoading: referralLoading } =
    trpc.referral.getEarnings.useQuery(undefined, {
      enabled: isAuthenticated,
      retry: 2,
    });

  const { data: referralCodeData } = trpc.referral.getOrCreateCode.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 2,
  });

  const { data: subscription, isLoading: subscriptionLoading } =
    trpc.subscription.getStatus.useQuery(undefined, {
      enabled: isAuthenticated,
      retry: 2,
    });

  const { data: dashboardProfile } = trpc.profile.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 2,
  });
  const activityQueryInput = useMemo(() => ({
    limit: 12,
    range: activityRange,
    eventTypes: ACTIVITY_FILTER_EVENT_TYPES[activityType],
  }), [activityRange, activityType]);
  const { data: recentActivity, isLoading: activityLoading } = trpc.activity.list.useQuery(
    activityQueryInput,
    { enabled: isAuthenticated, retry: 2 }
  );

  const subscriptionStatus =
    subscription?.status === "active" ||
    subscription?.status === "canceled" ||
    subscription?.status === "past_due"
      ? subscription.status
      : "free";
  const subscriptionBadge = getSubscriptionBadge(subscriptionStatus, subscription?.plan);

  const [referralLinkCopied, setReferralLinkCopied] = useState(false);

  const referralUrl = referralCodeData?.referralUrl
    ?? (referralCodeData?.code ? `${window.location.origin}/signup?ref=${referralCodeData.code}` : null);

  const copyReferralLink = useCallback(() => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setReferralLinkCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setReferralLinkCopied(false), 2500);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setReferralLinkCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setReferralLinkCopied(false), 2500);
    });
  }, [referralUrl]);

  // Referral progress maths — 1 referral = $10 credit
  const REFERRAL_THRESHOLD = 1;
  const referralCount = referralEarnings?.referralCount ?? 0;
  const creditsEarned = Math.floor(referralCount / REFERRAL_THRESHOLD);
  const progressToNextCredit = Math.min(
    ((referralCount % REFERRAL_THRESHOLD) / REFERRAL_THRESHOLD) * 100,
    100
  );

  const deletePlan = trpc.wellnessPlans.delete.useMutation({
    onSuccess: (_data, variables) => {
      // Play exit animation for 320ms before removing from DOM
      setTimeout(() => {
        setDeletingPlanId(null);
        refetchPlans();
        toast.success("Wellness plan deleted.");
      }, 320);
    },
    onError: () => {
      setDeletingPlanId(null);
      toast.error("Failed to delete plan.");
    },
  });

  const handleDeletePlan = (id: number) => {
    setDeletingPlanId(id);
    deletePlan.mutate({ id });
  };

  // Group biomarker history by name for trend display
  const biomarkerGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    if (biomarkerHistory) {
      for (const reading of biomarkerHistory) {
        const name = reading.biomarkerName;
        if (!groups[name]) groups[name] = [];
        groups[name].push(reading);
      }
    }
    return groups;
  }, [biomarkerHistory]);

  // ─── Export handlers ────────────────────────────────────────────────────────

  const handleExportBiomarkerReport = () => {
    if (!biomarkerHistory || biomarkerHistory.length === 0) {
      toast.error("No biomarker data to export yet.");
      return;
    }

    // Build one item per unique biomarker (latest reading)
    const items: BiomarkerReportItem[] = Object.entries(biomarkerGroups).map(
      ([name, readings]) => {
        const latest = readings[0];
        const profile = BIOMARKER_PROFILES.find(
          (p) =>
            p.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(p.shortName.toLowerCase())
        );
        return {
          name,
          value: latest.value,
          unit: latest.unit || profile?.unit || "",
          standardRange: profile?.standardRange.label || "See lab report",
          optimalRange: profile?.optimalRange.label || "See functional guidelines",
          status: latest.status || "Unknown",
          category: profile?.category,
          symptoms: profile?.symptomsLow?.slice(0, 3).join(", "),
        };
      }
    );

    try {
      exportBiomarkerReportPDF(items, user?.name ?? undefined);
      toast.success("Biomarker report exported as PDF");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  const handleExportDoctorLetter = async (report: any) => {
    gtm.trackPDFExport("doctor_letter");
    const analysis = report.analysisResult as any;
    const biomarkers = analysis?.biomarkers ?? [];
    const primaryBiomarker =
      biomarkers.find((b: any) => b.status !== "optimal")?.name ||
      biomarkers[0]?.name ||
      "Key Biomarkers";
    const symptoms = analysis?.keyFindings?.join("; ") || "";

    try {
      exportDoctorLetterPDF({
        patientName: user?.name || "Patient",
        biomarker: primaryBiomarker,
        symptoms,
        questions: analysis?.doctorDiscussionPoints,
      });
      toast.success("Doctor's letter exported as PDF");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  // ─── Auth guard ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center p-6">
        <div className="dashboard-brand-loader flex flex-col items-center gap-5 text-center" role="status" aria-live="polite">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7E9A85] text-white shadow-[0_16px_40px_rgba(76,92,80,0.2)]">
            <span className="dashboard-loader-halo absolute inset-0 rounded-2xl border border-[#7E9A85]/30" />
            <Activity className="h-7 w-7" />
            <Loader2 className="absolute -bottom-2 -right-2 h-6 w-6 animate-spin rounded-full bg-[#F9F6F0] p-1 text-[#7E9A85]" />
          </div>
          <div className="space-y-1">
            <p className="font-serif text-lg font-bold text-[#2C2A29]">Preparing your health dashboard</p>
            <p className="text-sm text-[#7A7670]">Loading your latest reports and wellness progress.</p>
          </div>
          <span className="sr-only">Loading dashboard</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex flex-col items-center justify-center gap-6 p-4">
        <div className="bg-[#7E9A85] text-white p-4 rounded-2xl shadow-md">
          <Activity className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">Sign In Required</h2>
          <p className="text-sm text-[#5C5A59]">
            Your personal health dashboard is only available to signed-in users. Sign in to view
            your saved lab reports and biomarker history.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl px-6"
            onClick={() => {
              window.location.href = "/signin";
            }}
          >
            Sign In
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-[#EBE6DC] rounded-xl px-6">
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="My Dashboard"
        description="Your personal health dashboard on The Patient's Compass."
        path="/dashboard"
        noIndex={true}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#5C5A59] hover:text-[#2C2A29] gap-1.5 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden text-sm sm:inline">Back</span>
              </Button>
            </Link>
            <div className="h-5 w-px bg-[#EBE6DC]" />
            <div className="flex items-center gap-2">
              <div className="bg-[#7E9A85] text-white p-1.5 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight">My Health Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {subscriptionLoading ? (
              <Skeleton className="dashboard-skeleton h-7 w-20 rounded-full" />
            ) : (
              <Badge
                className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] shadow-none sm:px-2.5 sm:text-[10px] ${
                  subscriptionBadge.tone === "sage"
                    ? "border-[#7E9A85]/30 bg-[#7E9A85]/10 text-[#5F7B67]"
                    : subscriptionBadge.tone === "coral"
                      ? "border-[#D48C70]/30 bg-[#D48C70]/10 text-[#B26850]"
                      : "border-[#CFC9BE] bg-white text-[#7A7670]"
                }`}
              >
                {subscriptionBadge.tone === "sage" && <Crown className="mr-1 h-3 w-3" />}
                {subscriptionBadge.label}
              </Badge>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-xs text-[#8A857E]">Welcome back</p>
              <p className="max-w-36 truncate text-sm font-semibold text-[#3A3733]">
                {dashboardProfile?.name || user?.name || "Patient"}
              </p>
            </div>
            <Avatar className="h-9 w-9 border border-[#7E9A85]/25 bg-white shadow-sm">
              {(dashboardProfile?.profileImageUrl || user?.profileImageUrl) && (
                <AvatarImage src={dashboardProfile?.profileImageUrl || user?.profileImageUrl || undefined} alt={`${dashboardProfile?.name || user?.name || "Patient"} profile`} />
              )}
              <AvatarFallback className="bg-[#7E9A85]/12 text-xs font-bold text-[#5F7B67]">
                {getInitials(dashboardProfile?.name || user?.name, dashboardProfile?.email || user?.email)}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-[#6B756C] hover:bg-[#7E9A85]/10 hover:text-[#4F6756]" onClick={() => setSettingsOpen(true)} aria-label="Open account settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Link href="/favorites"><Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-[#6B756C] hover:bg-[#7E9A85]/10 hover:text-[#4F6756]" aria-label="Open saved content"><Bookmark className="h-4 w-4" /></Button></Link>
            {/* Export all biomarkers button */}
            {!historyLoading && Object.keys(biomarkerGroups).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-[#EBE6DC] text-[#7E9A85] hover:bg-[#7E9A85]/5 rounded-xl text-xs gap-1.5"
                onClick={handleExportBiomarkerReport}
              >
                <Download className="w-3.5 h-3.5" />
                Export Report
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* ── Onboarding Progress Banner ── */}
        {!progressDismissed && onboardingCompleted < CHECKLIST_TOTAL && (
          <div className="animate-slide-down relative bg-gradient-to-r from-[#7E9A85]/10 to-[#A8C5AF]/10 border border-[#7E9A85]/30 rounded-2xl p-5">
            <button
              onClick={dismissProgress}
              className="absolute top-3 right-3 text-[#9B9690] hover:text-[#2C2A29] transition-colors"
              aria-label="Dismiss onboarding progress"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="bg-[#7E9A85] text-white p-2 rounded-xl flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 pr-6">
                  <h3 className="font-semibold text-[#2C2A29] text-sm">
                    Getting Started — {onboardingCompleted} of {CHECKLIST_TOTAL} steps done
                  </h3>
                  <span className="text-xs font-bold text-[#7E9A85]">
                    {Math.round((onboardingCompleted / CHECKLIST_TOTAL) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[#EBE6DC] rounded-full h-2 mb-3">
                  <div
                    className="bg-[#7E9A85] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((onboardingCompleted / CHECKLIST_TOTAL) * 100)}%` }}
                  />
                </div>
                <Link href="/purchase-confirmation">
                  <span className="group inline-flex items-center gap-1 text-xs font-semibold text-[#7E9A85] hover:text-[#5a7a61] transition-colors duration-200 underline underline-offset-2 cursor-pointer">
                    Continue setup checklist
                    <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className={INTERACTIVE_CARD_CLASS}>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-[#9E9A90] font-semibold uppercase tracking-wider">
                Lab Reports
              </p>
              {reportsLoading ? (
                <Skeleton className="dashboard-skeleton h-9 w-12 rounded-md" />
              ) : (
                <p className="text-3xl font-serif font-bold text-[#7E9A85]">{labReports?.length ?? 0}</p>
              )}
            </CardContent>
          </Card>
          <Card className={INTERACTIVE_CARD_CLASS}>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-[#9E9A90] font-semibold uppercase tracking-wider">
                Biomarkers Tracked
              </p>
              {historyLoading ? (
                <Skeleton className="dashboard-skeleton h-9 w-12 rounded-md" />
              ) : (
                <p className="text-3xl font-serif font-bold text-[#D48C70]">{Object.keys(biomarkerGroups).length}</p>
              )}
            </CardContent>
          </Card>
          <Card className={`${INTERACTIVE_CARD_CLASS} col-span-2 md:col-span-1`}>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-[#9E9A90] font-semibold uppercase tracking-wider">
                Total Readings
              </p>
              {historyLoading ? (
                <Skeleton className="dashboard-skeleton h-9 w-12 rounded-md" />
              ) : (
                <p className="text-3xl font-serif font-bold text-[#A39EBA]">{biomarkerHistory?.length ?? 0}</p>
              )}
            </CardContent>
          </Card>
          <Card className={`${INTERACTIVE_CARD_CLASS} col-span-2 md:col-span-1`}>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-[#9E9A90] font-semibold uppercase tracking-wider">
                Saved Wellness Plans
              </p>
              {plansLoading ? (
                <Skeleton className="dashboard-skeleton h-9 w-12 rounded-md" />
              ) : (
                <p className="text-3xl font-serif font-bold text-[#7E9A85]">{wellnessPlans?.length ?? 0}</p>
              )}
            </CardContent>
          </Card>
          <Card className={`${INTERACTIVE_CARD_CLASS} col-span-2 md:col-span-1`}>
            <CardContent className="p-5 space-y-1">
              <p className="text-xs text-[#9E9A90] font-semibold uppercase tracking-wider">
                Referrals
              </p>
              {referralLoading ? (
                <Skeleton className="dashboard-skeleton h-9 w-12 rounded-md" />
              ) : (
                <p className="text-3xl font-serif font-bold text-[#D48C70]">{referralEarnings?.referralCount ?? 0}</p>
              )}
              {!referralLoading && (referralEarnings?.pendingCredits ?? 0) > 0 && (
                <p className="text-xs text-[#9E9A90]">
                  {referralEarnings!.pendingCredits} credits pending
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4" aria-labelledby="recent-activity-heading">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-[#7E9A85]" />
                <h2 id="recent-activity-heading" className="font-serif text-xl font-bold text-[#2C2A29]">
                  Recent Activity
                </h2>
              </div>
              <p className="mt-1 text-xs text-[#8A857E]">
                Private account activity from reports, plans, profile updates, and subscription settings.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-[#7E9A85]" aria-hidden="true" />
              <select aria-label="Filter activity by event type" value={activityType} onChange={(event) => setActivityType(event.target.value as typeof activityType)} className="h-9 rounded-lg border border-[#E5DED3] bg-white px-2 text-xs text-[#5C5A59] outline-none focus:border-[#7E9A85]">
                <option value="all">All activity</option><option value="lab_report_saved">Reports</option><option value="wellness_plan_saved">Plans</option><option value="profile">Profile</option><option value="saved_content">Saved content</option><option value="certificate_saved">Certificates</option><option value="subscription_portal_opened">Subscription</option>
              </select>
              <select aria-label="Filter activity by time range" value={activityRange} onChange={(event) => setActivityRange(event.target.value as typeof activityRange)} className="h-9 rounded-lg border border-[#E5DED3] bg-white px-2 text-xs text-[#5C5A59] outline-none focus:border-[#7E9A85]">
                <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option>
              </select>
            </div>
          </div>

          <Card className="overflow-hidden rounded-2xl border border-[#EBE6DC] bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-[#F0ECE4]">
                {activityLoading ? (
                  <div className="p-4"><DashboardSectionSkeleton cards={2} /></div>
                ) : recentActivity && recentActivity.length > 0 ? recentActivity.map((item) => {
                  const ActivityIcon =
                    item.eventType === "lab_report_saved" ? FileText : item.eventType === "wellness_plan_saved" ? CircleCheck : item.eventType === "subscription_portal_opened" ? Crown : item.eventType === "content_saved" || item.eventType === "content_unsaved" ? Bookmark : item.eventType === "certificate_saved" ? Award : Activity;
                  return (
                    <div
                      key={item.id}
                      className="group flex items-start gap-4 px-5 py-4 transition-colors duration-200 hover:bg-[#F9F6F0]/80"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7E9A85]/10 text-[#6E8A76] transition-transform duration-200 group-hover:scale-105">
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                          <p className="text-sm font-semibold text-[#34312E]">{item.title}</p>
                          <span className="shrink-0 text-[11px] font-medium text-[#9A958D]">
                            {formatActivityTime(item.createdAt)}
                          </span>
                        </div>
                        {item.summary && <p className="mt-1 text-xs leading-relaxed text-[#6E6A64]">{item.summary}</p>}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="px-6 py-9 text-center">
                    <Clock3 className="mx-auto h-7 w-7 text-[#B7B0A6]" />
                    <p className="mt-3 text-sm font-semibold text-[#5B5650]">No account activity yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#8A857E]">Your private activity will appear here after you save a report or wellness plan, update your profile picture, or open subscription settings.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Lab Reports Section */}

        {/* ── Referral Progress Card ── */}
        {isAuthenticated && (
          referralLoading ? (
            /* Loading skeleton — prevents layout shift while referral data fetches */
            <div className="dashboard-loading-surface rounded-2xl border border-[#EBE6DC] bg-white shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="dashboard-skeleton w-7 h-7 rounded-lg" />
                  <Skeleton className="dashboard-skeleton h-4 w-36" />
                </div>
                <Skeleton className="dashboard-skeleton h-4 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="dashboard-skeleton h-3 w-28" />
                <Skeleton className="dashboard-skeleton h-3 w-24" />
              </div>
              <Skeleton className="dashboard-skeleton h-2 w-full rounded-full" />
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="dashboard-skeleton h-3 w-48" />
                <Skeleton className="dashboard-skeleton h-7 w-24 rounded-lg" />
              </div>
              <Skeleton className="dashboard-skeleton h-3 w-32" />
            </div>
          ) : (
            <div className={`${INTERACTIVE_CARD_CLASS} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7E9A85]/15 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#7E9A85]" />
                  </div>
                  <p className="text-sm font-semibold text-[#2C2A29]">Your Referral Progress</p>
                </div>
                <span className="text-sm font-bold text-[#7E9A85]">${creditsEarned * 10} earned</span>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#5C5A59]">
                  <strong>{referralCount}</strong> referral{referralCount !== 1 ? "s" : ""} made
                </span>
                <span className="text-xs text-[#9B9690]">
                  {referralCount === 0
                    ? "Earn $10 per referral"
                    : `${REFERRAL_THRESHOLD - (referralCount % REFERRAL_THRESHOLD)} more to next $10`}
                </span>
              </div>

              <Progress value={progressToNextCredit} className="h-2 bg-[#EBE6DC] mb-3" />

              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs text-[#9B9690] leading-relaxed">
                  Share your link — every friend who upgrades earns you <strong className="text-[#2C2A29]">$10 credit</strong>.
                </p>
                {referralUrl ? (
                  <button
                    onClick={copyReferralLink}
                    className="inline-flex items-center gap-1.5 flex-shrink-0 bg-[#7E9A85] hover:bg-[#6A8571] hover:scale-105 active:scale-[0.97] text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                  >
                    {referralLinkCopied ? (
                      <><Check className="w-3.5 h-3.5" /> Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Copy Link</>
                    )}
                  </button>
                ) : (
                  <Link href="/referrals">
                    <button className="inline-flex items-center gap-1.5 flex-shrink-0 bg-[#7E9A85]/10 hover:bg-[#7E9A85]/20 text-[#7E9A85] font-semibold text-xs px-3 py-1.5 rounded-lg transition-all duration-150">
                      Get Link
                    </button>
                  </Link>
                )}
              </div>

              {/* View full referral history link */}
              <Link href="/referrals">
                <span className="group inline-flex items-center gap-1 text-xs font-semibold text-[#7E9A85] hover:text-[#5a7a61] transition-colors duration-200 underline underline-offset-2 cursor-pointer">
                  View full referral history
                  <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          )
        )}

        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[#2C2A29] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#7E9A85]" />
              Saved Lab Reports
            </h2>
            <Link href="/#upload-demo">
              <Button
                variant="outline"
                size="sm"
                className="border-[#EBE6DC] text-[#7E9A85] hover:bg-[#7E9A85]/5 rounded-xl text-xs font-semibold"
              >
                + Analyze New Report
              </Button>
            </Link>
          </div>

          {reportsLoading ? (
            <DashboardSectionSkeleton cards={2} />
          ) : reportsError ? (
            <Card className="border border-red-100 rounded-2xl bg-red-50/30">
              <CardContent className="p-8 text-center space-y-2">
                <p className="font-semibold text-red-700 text-sm">Failed to load lab reports</p>
                <p className="text-xs text-red-600">{reportsError.message}</p>
              </CardContent>
            </Card>
          ) : !labReports || labReports.length === 0 ? (
            <Card className="border border-dashed border-[#C5C0B5] rounded-2xl bg-white/50">
              <CardContent className="p-10 text-center space-y-3">
                <FileText className="w-10 h-10 text-[#C5C0B5] mx-auto" />
                <p className="font-semibold text-[#5C5A59]">No lab reports yet</p>
                <p className="text-xs text-[#9E9A90]">
                  Upload a lab report on the home page to get AI-powered insights. Reports are
                  automatically saved when you're signed in.
                </p>
                <Link href="/">
                  <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-xs mt-2">
                    Go to Lab Scanner
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {labReports.map((report: any, index: number) => {
                const analysis = report.analysisResult as any;
                const biomarkerCount = analysis?.biomarkers?.length ?? 0;
                const suboptimalCount =
                  analysis?.biomarkers?.filter((b: any) => b.status !== "optimal").length ?? 0;

                return (
                  <Card
                    key={report.id}
                    className={INTERACTIVE_CARD_CLASS}
                    style={{
                      animation: `wellness-card-in 0.45s cubic-bezier(0.23, 1, 0.32, 1) both`,
                      animationDelay: `${index * 80}ms`,
                    }}
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#7E9A85] transition-transform duration-200 group-hover:scale-110" />
                          <span className="font-semibold text-sm">{report.fileName}</span>
                          <Badge
                            className={`text-[10px] font-bold border-none px-2 py-0.5 rounded-full ${
                              report.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : report.status === "failed"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#9E9A90]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          {biomarkerCount > 0 && (
                            <span>{biomarkerCount} biomarkers analyzed</span>
                          )}
                          {suboptimalCount > 0 && (
                            <span className="text-amber-600 font-semibold">
                              {suboptimalCount} need attention
                            </span>
                          )}
                        </div>
                        {analysis?.overallAssessment && (
                          <p className="text-xs text-[#5C5A59] leading-relaxed max-w-lg line-clamp-2">
                            {analysis.overallAssessment}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {report.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#EBE6DC] text-[#7E9A85] hover:bg-[#7E9A85]/5 rounded-xl text-xs gap-1.5"
                            onClick={() => handleExportDoctorLetter(report)}
                          >
                            <Download className="w-3 h-3" />
                            Doctor Letter
                          </Button>
                        )}
                        <ChevronRight className="w-5 h-5 text-[#C5C0B5] hidden sm:block" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Wellness Plans History Section */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[#2C2A29] flex items-center gap-2">
              <Leaf className="w-5 h-5 text-[#7E9A85]" />
              Saved Wellness Plans
            </h2>
            <Link href="/lifestyle">
              <Button
                variant="outline"
                size="sm"
                className="border-[#EBE6DC] text-[#7E9A85] hover:bg-[#7E9A85]/5 rounded-xl text-xs font-semibold"
              >
                + New Plan
              </Button>
            </Link>
          </div>

          {plansLoading ? (
            <DashboardSectionSkeleton cards={2} />
          ) : !wellnessPlans || wellnessPlans.length === 0 ? (
            <Card className="border border-dashed border-[#C5C0B5] rounded-2xl bg-white/50">
              <CardContent className="p-10 text-center space-y-3">
                <Leaf className="w-10 h-10 text-[#C5C0B5] mx-auto" />
                <p className="font-semibold text-[#5C5A59]">No saved wellness plans yet</p>
                <p className="text-xs text-[#9E9A90]">
                  Use the Lifestyle Customizer to generate a personalized wellness plan, then click
                  “Save Plan” to store it here.
                </p>
                <Link href="/lifestyle">
                  <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-xs mt-2">
                    Go to Lifestyle Customizer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {wellnessPlans.map((plan: any, index: number) => {
                const output = plan.planOutput as any;
                const inputs = plan.inputs as any;
                const biomarkerCount = inputs?.biomarkers?.length ?? 0;
                const goalCount = inputs?.goals?.length ?? 0;

                return (
                  <Card
                    key={plan.id}
                    className={INTERACTIVE_CARD_CLASS}
                    style={{
                      animation: deletingPlanId === plan.id
                        ? `wellness-card-out 0.3s cubic-bezier(0.55, 0, 1, 0.45) both`
                        : `wellness-card-in 0.45s cubic-bezier(0.23, 1, 0.32, 1) both`,
                      animationDelay: deletingPlanId === plan.id ? `0ms` : `${index * 80}ms`,
                    }}
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-[#7E9A85] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                          <span className="font-semibold text-sm truncate">{plan.title}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#9E9A90]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                          {biomarkerCount > 0 && (
                            <span>{biomarkerCount} biomarker{biomarkerCount !== 1 ? "s" : ""}</span>
                          )}
                          {goalCount > 0 && (
                            <span>{goalCount} goal{goalCount !== 1 ? "s" : ""}</span>
                          )}
                        </div>
                        {output?.summary && (
                          <p className="text-xs text-[#5C5A59] leading-relaxed max-w-lg line-clamp-2">
                            {output.summary}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#C5C0B5] hover:text-red-500 hover:bg-red-50 rounded-xl text-xs gap-1.5 transition-colors"
                          onClick={() => handleDeletePlan(plan.id)}
                          disabled={deletePlan.isPending || deletingPlanId === plan.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Biomarker Trend Section — Elite Recharts */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-[#2C2A29] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D48C70]" />
              Biomarker Trend History
            </h2>
            {!historyLoading && Object.keys(biomarkerGroups).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-[#EBE6DC] text-[#D48C70] hover:bg-[#D48C70]/5 rounded-xl text-xs gap-1.5"
                onClick={handleExportBiomarkerReport}
              >
                <Download className="w-3.5 h-3.5" />
                Export All
              </Button>
            )}
          </div>

          {historyLoading ? (
            <DashboardSectionSkeleton cards={2} />
          ) : historyError ? (
            <Card className="border border-red-100 rounded-2xl bg-red-50/30">
              <CardContent className="p-8 text-center space-y-2">
                <p className="font-semibold text-red-700 text-sm">
                  Failed to load biomarker history
                </p>
                <p className="text-xs text-red-600">{historyError.message}</p>
              </CardContent>
            </Card>
          ) : Object.keys(biomarkerGroups).length === 0 ? (
            <Card className="border border-dashed border-[#C5C0B5] rounded-2xl bg-white/50">
              <CardContent className="p-10 text-center space-y-3">
                <TrendingUp className="w-10 h-10 text-[#C5C0B5] mx-auto" />
                <p className="font-semibold text-[#5C5A59]">No trend data yet</p>
                <p className="text-xs text-[#9E9A90]">
                  Biomarker readings are saved automatically when you analyze lab reports. Analyze
                  multiple reports over time to see trends.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(biomarkerGroups).map(([name, readings]) => {
                const rangeConfig = getRangeConfig(name, readings[0]?.unit || "");
                return (
                  <BiomarkerTrendChart
                    key={name}
                    biomarkerName={name}
                    readings={readings}
                    rangeConfig={rangeConfig}
                    showExport
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
      <DashboardSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
