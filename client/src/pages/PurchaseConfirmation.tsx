import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Mail,
  ArrowRight,
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  MessageCircle,
  Settings,
  Sparkles,
} from "lucide-react";
import { Twitter, Linkedin, Facebook, Mail as MailShare, MessageCircle as WhatsAppIcon, Copy, Check, LogIn } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trackShareClick } from "@/lib/gtm";

const CHECKLIST_KEY = "pc_onboarding_v1";
// Fires once per browser session — not on every page reload
const CONFETTI_KEY = "pc_confetti_fired";
// Guards the celebration confetti so it fires only once per session
const CELEBRATION_CONFETTI_KEY = "pc_celebration_confetti_fired";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: React.ElementType;
}

const CHECKLIST: ChecklistItem[] = [
  {
    id: "dashboard",
    title: "Visit your Pro Dashboard",
    description: "See your subscription status, usage stats, and account settings all in one place.",
    cta: "Go to Dashboard",
    href: "/dashboard?return=/purchase-confirmation?from=dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "lab",
    title: "Upload your first lab report",
    description: "Drop in a PDF or paste your values — the AI will interpret every biomarker instantly.",
    cta: "Analyse a Lab Report",
    href: "/lab",
    icon: FlaskConical,
  },
  {
    id: "assistant",
    title: "Ask Health Companion a question",
    description: "Your personal AI medical assistant is ready. Ask anything about your results.",
    cta: "Open Health Companion",
    href: "/medical-assistant",
    icon: MessageCircle,
  },
  {
    id: "email_prefs",
    title: "Set your email preferences",
    description: "Choose how often you want health insights, weekly digests, and product updates.",
    cta: "Update Preferences",
    href: "/settings",
    icon: Settings,
  },
  {
    id: "books",
    title: "Explore the resource library",
    description: "Curated books, guides, and references written for patients who want to understand their health.",
    cta: "Browse Resources",
    href: "/books",
    icon: BookOpen,
  },
];

const PRO_FEATURES = [
  "Unlimited lab report analysis",
  "Advanced AI insights with Health Companion",
  "Personalised health recommendations",
  "Doctor's letter generation",
  "Priority email support",
  "Ad-free experience",
  "Export reports as PDF",
];

const SITE_URL = "https://www.thepatientscompass.com";
const TWEET_TEXT =
  "Just upgraded to Pro on @ThePatientsCompass 🎉 Finally making sense of my lab results with AI-powered insights. If you want to understand your health data, check it out:";
const EMAIL_SUBJECT = "I just upgraded to The Patient's Compass Pro — you should check it out";
const EMAIL_BODY_PREFIX =
  "Hey,\n\nI've been using The Patient's Compass to make sense of my lab results with AI-powered insights and it's been really helpful. Thought you might find it useful too!\n\nCheck it out here: ";

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveChecked(ids: Set<string>) {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export default function PurchaseConfirmation() {
  const { user } = useAuth();
  const [checked, setChecked] = useState<Set<string>>(loadChecked);
  const confettiFired = useRef(false);
  const celebrationFired = useRef(false);
  const [copied, setCopied] = useState(false);
  const [tweetText, setTweetText] = useState(TWEET_TEXT);
  const [copiedText, setCopiedText] = useState(false);

  // Analytics helper — fires a GA4 event with category "referral_share" and the platform as the label
  function trackShare(platform: string) {
    trackShareClick(platform as Parameters<typeof trackShareClick>[0]);
  }

  // Read session_id from URL — present for both authenticated and guest buyers
  const sessionId = new URLSearchParams(window.location.search).get("session_id") ?? "";

  // Public lookup — works for guest buyers (no auth required)
  const { data: sessionData, isLoading: sessionLoading } = trpc.plans.getSessionPlan.useQuery(
    { sessionId },
    { enabled: !!sessionId, retry: false, staleTime: Infinity }
  );

  // Fallback: authenticated subscription status (for users who navigate here directly)
  const { data: subStatus, isLoading: subLoading } = trpc.subscription.getStatus.useQuery(undefined, {
    retry: false,
  });

  const isLoading = sessionId ? sessionLoading : subLoading;

  const completedCount = checked.size;
  const totalCount = CHECKLIST.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  // Fetch referral URL — only when user is authenticated and all steps are done
  const { data: referralData } = trpc.referral.getOrCreateCode.useQuery(undefined, {
    enabled: !!user && allDone,
    retry: false,
  });
  const referralUrl = referralData?.referralUrl ?? SITE_URL;
  const tweetCharCount = tweetText.length + 1 + referralUrl.length; // +1 for space between text and URL
  const charsRemaining = 280 - tweetCharCount;
  const tweetOverLimit = tweetCharCount > 280;

  // Fetch referral earnings — only when user is authenticated and all steps are done
  const { data: referralStats } = trpc.referral.getEarnings.useQuery(undefined, {
    enabled: !!user && allDone,
    retry: false,
  });
  // creditAmount is stored in cents ($10 = 1000). Each conversion = 1 credit.
  // Progress bar fills to 100% at 1 referral (the threshold for the next $10 credit).
  const REFERRAL_THRESHOLD = 1;
  const progressToNextCredit = Math.min(
    ((referralStats?.referralCount ?? 0) % REFERRAL_THRESHOLD) / REFERRAL_THRESHOLD * 100,
    100
  );
  const creditsEarned = Math.floor((referralStats?.referralCount ?? 0) / REFERRAL_THRESHOLD);

  function copyFullText() {
    const fullText = `${tweetText} ${referralUrl}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = fullText;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    });
  }

  function copyReferralLink() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for browsers that block clipboard without HTTPS
      const el = document.createElement("textarea");
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecked(next);
      return next;
    });
  }

  // Prefer session-based plan name (accurate for guest buyers); fall back to subscription status
  const planLabel =
    sessionData?.planLabel ??
    (subStatus?.isPro ? "Pro" : sessionId ? "Pro" : "Free");

  // ── Confetti: fire once per session on first visit ──────────────────────────
  useEffect(() => {
    if (confettiFired.current) return;
    if (sessionStorage.getItem(CONFETTI_KEY)) return;
    confettiFired.current = true;
    sessionStorage.setItem(CONFETTI_KEY, "1");
    const end = Date.now() + 2000;
    const colors = ["#7E9A85", "#A8C5AF", "#F9F6F0", "#EBE6DC", "#2C2A29"];
    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  // ── Celebration confetti: full-screen burst when all steps complete ──────────
  useEffect(() => {
    if (!allDone) return;
    if (celebrationFired.current) return;
    if (sessionStorage.getItem(CELEBRATION_CONFETTI_KEY)) return;
    celebrationFired.current = true;
    sessionStorage.setItem(CELEBRATION_CONFETTI_KEY, "1");
    const colors = ["#7E9A85", "#A8C5AF", "#FFD700", "#FF6B6B", "#F9F6F0", "#2C2A29"];
    confetti({ particleCount: 120, spread: 100, origin: { x: 0.5, y: 0.5 }, colors });
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 130, origin: { x: 0.3, y: 0.4 }, colors });
    }, 300);
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 130, origin: { x: 0.7, y: 0.4 }, colors });
    }, 500);
  }, [allDone]);

  // ── Auto-mark dashboard step when returning from /dashboard ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "dashboard") {
      setChecked((prev) => {
        if (prev.has("dashboard")) return prev;
        const next = new Set(prev);
        next.add("dashboard");
        saveChecked(next);
        return next;
      });
      // Clean the query param from the URL without a page reload
      const clean = window.location.pathname + (params.toString().replace("from=dashboard", "").replace(/^&|&$/, "") ? "?" + params.toString().replace("from=dashboard", "").replace(/^&|&$/, "") : "");
      window.history.replaceState(null, "", clean);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7E9A85] mx-auto mb-4" />
          <p className="text-[#5C5A59]">Loading your subscription details…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Welcome to Pro — Setup Checklist"
        description="Your Pro subscription is active. Follow the setup checklist to get the most out of The Patient's Compass."
        path="/purchase-confirmation"
        noIndex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
        <div className="max-w-3xl mx-auto">

          {/* ── Success Header ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-[#2C2A29] mb-2">
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-lg text-[#5C5A59]">
              Your <strong>{planLabel}</strong> subscription is now active. Let's get you set up.
            </p>
          </div>

          {/* ── Onboarding Checklist ── */}
          <Card className="border-[#EBE6DC] shadow-lg mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#7E9A85]" />
                    Getting Started Checklist
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {allDone
                      ? "You're all set! Enjoy your Pro features."
                      : `${completedCount} of ${totalCount} steps completed`}
                  </CardDescription>
                </div>
                <Badge
                  className={
                    allDone
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-[#EBE6DC] text-[#5C5A59] border-[#D8D3C8]"
                  }
                >
                  {progressPct}%
                </Badge>
              </div>
              <Progress
                value={progressPct}
                className="mt-3 h-2 bg-[#EBE6DC] [&>div]:bg-[#7E9A85] [&>div]:transition-all [&>div]:duration-500"
              />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {CHECKLIST.map((item) => {
                const Icon = item.icon;
                const done = checked.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      done
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-[#EBE6DC] hover:border-[#7E9A85]/40"
                    }`}
                  >
                    <button
                      onClick={() => toggle(item.id)}
                      className="mt-0.5 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] rounded-full"
                      aria-label={done ? `Mark "${item.title}" as incomplete` : `Mark "${item.title}" as complete`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#C5C0B8]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${done ? "text-green-600" : "text-[#7E9A85]"}`} />
                        <h3 className={`font-semibold text-sm ${done ? "line-through text-[#9B9690]" : "text-[#2C2A29]"}`}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#5C5A59] mb-2">{item.description}</p>
                      <Link href={item.href} onClick={() => toggle(item.id)}>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`text-xs h-7 px-3 ${
                            done
                              ? "border-green-300 text-green-700 hover:bg-green-50"
                              : "border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85] hover:text-white"
                          }`}
                        >
                          {item.cta}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* ── Celebration Card (shown when all steps complete) ── */}
          {allDone && (
            <Card className="border-[#7E9A85]/40 bg-gradient-to-r from-[#7E9A85]/10 to-[#A8C5AF]/10 shadow-lg overflow-hidden">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="text-5xl mb-4 select-none">🎉</div>
                <h2 className="text-xl font-bold text-[#2C2A29] mb-2">You're all set!</h2>
                <p className="text-[#5C5A59] text-sm mb-6 max-w-sm mx-auto">
                  You've completed every setup step. Share your journey and help others discover smarter health tracking.
                </p>

                {/* ── Unauthenticated referral prompt ── */}
                {!user && (
                  <div className="mb-6 max-w-md mx-auto rounded-2xl border border-[#7E9A85]/30 bg-white/70 p-5 text-left shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#7E9A85]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <LogIn className="w-4 h-4 text-[#7E9A85]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C2A29] mb-1">
                          Get your personal referral link
                        </p>
                        <p className="text-xs text-[#5C5A59] mb-3">
                          Sign in to generate a unique referral link. Every friend who upgrades earns you <strong>$10 credit</strong> toward your next renewal.
                        </p>
                        <button
                          onClick={() => { window.location.href = `/signin?returnPath=${encodeURIComponent(window.location.pathname + window.location.search)}`; }}
                          className="inline-flex items-center gap-2 bg-[#7E9A85] hover:bg-[#6A8571] active:scale-[0.97] text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-150"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Sign in to unlock referral link
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Editable tweet textarea (authenticated only) ── */}
                {user && (
                  <>{/* ── Referral progress indicator ── */}
                    {referralStats !== undefined && (
                      <div className="mb-5 max-w-md mx-auto rounded-2xl border border-[#EBE6DC] bg-white p-4 text-left shadow-sm">
                        <p className="text-xs font-semibold text-[#9E9A90] uppercase tracking-wider mb-2">Your Referral Progress</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#2C2A29]">
                            <strong>{referralStats.referralCount}</strong> referral{referralStats.referralCount !== 1 ? "s" : ""} made
                          </span>
                          <span className="text-sm font-semibold text-[#7E9A85]">
                            ${creditsEarned * 10} earned
                          </span>
                        </div>
                        <Progress value={progressToNextCredit} className="h-2 bg-[#EBE6DC]" />
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <p className="text-xs text-[#9B9690]">
                            {referralStats.referralCount === 0
                              ? "Share your link — earn $10 for every friend who upgrades"
                              : `${REFERRAL_THRESHOLD - ((referralStats.referralCount ?? 0) % REFERRAL_THRESHOLD)} more referral${REFERRAL_THRESHOLD - ((referralStats.referralCount ?? 0) % REFERRAL_THRESHOLD) !== 1 ? "s" : ""} to your next $10 credit`}
                          </p>
                          <button
                            onClick={copyReferralLink}
                            className="inline-flex items-center gap-1.5 flex-shrink-0 bg-[#7E9A85] hover:bg-[#6A8571] hover:scale-105 active:scale-[0.97] text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all duration-150"
                          >
                            {copied ? (
                              <><Check className="w-3.5 h-3.5" /> Copied!</>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /> Copy Link</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mb-4 text-left max-w-md mx-auto">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#9E9A90] uppercase tracking-wider">
                          Customise your tweet
                        </label>
                        <button
                          type="button"
                          onClick={() => setTweetText(TWEET_TEXT)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors duration-150"
                        >
                          Reset to default
                        </button>
                      </div>
                      <textarea
                        value={tweetText}
                        onChange={(e) => setTweetText(e.target.value)}
                        rows={3}
                        className="w-full text-sm border border-[#EBE6DC] rounded-xl p-3 resize-none
                          focus:outline-none focus:ring-2 focus:ring-[#7E9A85]/40 text-[#2C2A29]
                          bg-white placeholder:text-[#C5C0B8] transition-shadow duration-150"
                        placeholder="Customise your tweet…"
                      />
                      <div className="flex items-center justify-end mt-1">
                        <span
                          className={`text-xs font-mono tabular-nums ${
                            tweetOverLimit ? "text-red-500 font-semibold" : "text-[#9B9690]"
                          }`}
                        >
                          {tweetOverLimit
                            ? `${Math.abs(charsRemaining)} over limit`
                            : `${charsRemaining} remaining`}
                        </span>
                      </div>
                    </div>

                    {/* ── Live tweet preview ── */}
                    <div className="mb-5 max-w-md mx-auto rounded-2xl border border-[#EBE6DC] bg-white p-4 text-left shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-[#7E9A85]/20 flex items-center justify-center text-[#7E9A85] font-bold text-sm select-none flex-shrink-0">
                          {(user?.name?.[0] ?? "U").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#2C2A29] leading-tight truncate">
                            {user?.name ?? "You"}
                          </p>
                          <p className="text-xs text-[#9B9690]">
                            @{(user?.name ?? "user").toLowerCase().replace(/\s+/g, "")}
                          </p>
                        </div>
                        <Twitter className="w-4 h-4 text-[#1DA1F2] ml-auto flex-shrink-0" />
                      </div>
                      <p className="text-sm text-[#2C2A29] whitespace-pre-wrap break-words leading-relaxed">
                        {tweetText || <span className="text-[#C5C0B8]">Your tweet text will appear here…</span>}{" "}
                        <span className="text-[#1DA1F2] break-all">{referralUrl}</span>
                      </p>
                      <p className="text-[10px] text-[#C5C0B8] mt-2.5">Preview only — actual tweet may vary slightly</p>
                    </div>
                  </>
                )}

                {/* ── Action buttons ── */}
                <div className="flex flex-col gap-3 items-center">
                  {/* Row 1: Copy buttons (authenticated only) */}
                  {user && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      {/* Copy referral link */}
                      <button
                        onClick={copyReferralLink}
                        className="inline-flex items-center gap-2 bg-[#7E9A85] hover:bg-[#6A8571] active:scale-[0.97] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-150 min-w-[180px] justify-center"
                      >
                        {copied ? (
                          <><Check className="w-4 h-4" /> Copied!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy Referral Link</>
                        )}
                      </button>
                      {/* Copy full text — for pasting on other platforms */}
                      <button
                        onClick={copyFullText}
                        className="inline-flex items-center gap-2 bg-white border border-[#EBE6DC] hover:border-[#7E9A85]/60 hover:bg-[#7E9A85]/5 active:scale-[0.97] text-[#2C2A29] font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-150 min-w-[160px] justify-center"
                      >
                        {copiedText ? (
                          <><Check className="w-4 h-4 text-green-600" /> Text Copied!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy Text</>
                        )}
                      </button>
                    </div>
                  )}
                  {/* Row 2: Social share buttons (always visible — uses referralUrl or SITE_URL fallback) */}
                  <div className="flex flex-wrap gap-3 justify-center items-center">
                    {/* X / Twitter — disabled when over character limit (authenticated) or always enabled (guest) */}
                    <a
                      href={
                        (user && tweetOverLimit)
                          ? undefined
                          : `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(referralUrl)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={user ? tweetOverLimit : false}
                      onClick={() => trackShare("twitter")}
                      className={`inline-flex items-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-lg transition-all duration-150 ${
                        user && tweetOverLimit
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                          : "bg-[#1DA1F2] hover:bg-[#1a8fd1] active:scale-[0.97] text-white"
                      }`}
                    >
                      <Twitter className="w-4 h-4" />
                      Share on X
                    </a>
                    {/* WhatsApp — with tooltip and hover scale */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { trackShare("whatsapp"); window.open(`https://wa.me/?text=${encodeURIComponent(`${tweetText} ${referralUrl}`)}`, "_blank"); }}
                          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fba59] hover:scale-105 active:scale-[0.97] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-all duration-150"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                          WhatsApp
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Share via WhatsApp</TooltipContent>
                    </Tooltip>
                    {/* LinkedIn */}
                    <button
                      onClick={() => { trackShare("linkedin"); window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, "_blank"); }}
                      className="inline-flex items-center gap-2 bg-[#0A66C2] hover:bg-[#0958a8] active:scale-[0.97] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-all duration-150"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </button>
                    {/* Facebook */}
                    <button
                      onClick={() => { trackShare("facebook"); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, "_blank"); }}
                      className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#1464d8] active:scale-[0.97] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-all duration-150"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </button>
                    {/* Share via Email — with tooltip and hover scale */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`mailto:?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(`${EMAIL_BODY_PREFIX}${referralUrl}`)}`}
                          onClick={() => trackShare("email")}
                          className="inline-flex items-center gap-2 bg-[#5C5A59] hover:bg-[#3E3C3B] hover:scale-105 active:scale-[0.97] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-all duration-150"
                        >
                          <MailShare className="w-4 h-4" />
                          Email a Friend
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Send to a friend by email</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Pro Features Summary ── */}
          <Card className="border-[#EBE6DC] shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Your Pro Features</CardTitle>
              <CardDescription>Everything included in your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRO_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#7E9A85] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#5C5A59]">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-[#EBE6DC] flex flex-col sm:flex-row gap-3">
                <Link href="/dashboard" asChild>
                  <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/settings/email" asChild>
                  <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85] hover:text-white flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Manage Subscription
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* ── Support ── */}
          <Card className="border-[#EBE6DC] shadow-lg bg-gradient-to-r from-[#F9F6F0] to-[#EBE6DC]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-[#7E9A85] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-[#2C2A29] mb-1">Need Help?</h3>
                  <p className="text-[#5C5A59] text-sm mb-4">
                    Our priority support team is here for you. Email us anytime at{" "}
                    <a href="mailto:support@thepatientscompass.com" className="text-[#7E9A85] underline">
                      support@thepatientscompass.com
                    </a>
                  </p>
                  <Link href="/support" asChild>
                    <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85] hover:text-white">
                      Visit Help Centre
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Footer ── */}
          <div className="text-center mt-12">
            <p className="text-sm text-[#5C5A59] mb-2">
              <strong>EDUCATIONAL CONTENT ONLY</strong> — Not Medical Advice
            </p>
            <p className="text-xs text-[#999]">
              © 2026 The Patient's Compass. Built by a Clinical Laboratory Scientist with 20+ years of experience.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
