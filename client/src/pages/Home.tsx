import React, { useEffect, useState, useMemo, useRef } from "react";
import { withAmazonTag } from "@/lib/amazon";
import SEO from "@/components/SEO";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { RevealSection } from "@/components/RevealSection";
import { trpc } from "@/lib/trpc";
import { trackHeaderSearchFeedback, trackHeaderSearchZeroResults, trackSuperKidsPdfTextLinkClick } from "@/lib/gtm";
import {
  addRecentHeaderSearch,
  filterHeaderSearchDestinations,
  getKeywordMatchContext,
  getSearchHighlightSegments,
  MAX_RECENT_HEADER_SEARCHES,
  RECENT_HEADER_SEARCHES_KEY,
} from "@/lib/headerSearch";
import { getLoginUrl } from "@/const";

const SUPER_KIDS_PDF = "/manus-storage/Healthy_Habits_Super_Kids_Free_Printables_8b45bee6.pdf";
const SUPER_KIDS_PREVIEW = "/manus-storage/activity-page-01_f4d8a670.jpg";
const HERO_VIDEO = "/manus-storage/patients-compass-hero_78607d0f.mp4";
const HERO_VIDEO_POSTER = "/manus-storage/patients-compass-hero-poster_3a4ec45a.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Activity, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  ChevronRight,
  ChevronDown,
  Printer, 
  Download, 
  RefreshCw,
  HelpCircle,
  TrendingUp,
  Award,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  Check,
  Mail,
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Lock,
  FileDown,
  Menu,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Volume2,
  VolumeX
} from "lucide-react";
import { BIOMARKERS, COMPETITORS, CASE_STUDIES, IMAGES, BOOK_EXCERPTS } from "../const";
import { toast } from "sonner";
import { exportDoctorLetterPDF } from "@/lib/pdfExport";

export default function Home() {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [heroVideoMuted, setHeroVideoMuted] = useState(true);
  const assistantAppearance = trpc.assistantAppearance.get.useQuery();
  const avatarUrl = assistantAppearance.data?.url ?? "/manus-storage/sonya-professional-portrait_c5acc8f2.webp";
  const portraitPosition = { objectPosition: `${assistantAppearance.data?.cropPositionX ?? 50}% ${assistantAppearance.data?.cropPositionY ?? 22}%` };
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const { data: homeSubStatus } = trpc.subscription.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const hasPro = homeSubStatus?.isPro ?? false;

  // 1. Quiz State
  const [quizStep, setQuizStep] = useState<number>(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<any>(null);

  // 2. Interactive Range Slider State
  const [activeBiomarker, setActiveBiomarker] = useState(BIOMARKERS[0]);
  const [userSliderVal, setUserSliderVal] = useState<number>(35); // For Ferritin example

  // 3. Interactive Doctor's Letter State
  const [patientName, setPatientName] = useState("");
  const [concernBiomarker, setConcernBiomarker] = useState(BIOMARKERS[0].name);
  const [userSymptomsText, setUserSymptomsText] = useState("");
  const [isLetterGenerated, setIsLetterGenerated] = useState(false);

  // 4. Lab Upload Demo State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<"idle" | "scanning" | "parsed" | "insights">("idle");
  const [parsedBiomarkers, setParsedBiomarkers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 5. Lead Capture State
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmittingEmail, setIsSubmittingSubmittingEmail] = useState(false);

  // 6. Book Excerpt State
  const [activeExcerptIdx, setActiveExcerptIdx] = useState(0);

  // 7. Mobile Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchActiveIndex, setHeaderSearchActiveIndex] = useState(0);
  const [recentHeaderSearches, setRecentHeaderSearches] = useState<string[]>([]);
  const [isSearchTyping, setIsSearchTyping] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<"helpful" | "not_helpful" | null>(null);
  const resourcesTriggerRef = useRef<HTMLButtonElement>(null);
  const resourceItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const moreItemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const headerSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const headerSearchSurfaceRef = useRef<"desktop" | "mobile">("desktop");
  const zeroResultsTrackedRef = useRef(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    try {
      const storedSearches = JSON.parse(localStorage.getItem(RECENT_HEADER_SEARCHES_KEY) ?? "[]");
      if (Array.isArray(storedSearches)) {
        setRecentHeaderSearches(
          storedSearches
            .filter((search): search is string => typeof search === "string" && search.trim().length > 0)
            .slice(0, MAX_RECENT_HEADER_SEARCHES)
        );
      }
    } catch {
      localStorage.removeItem(RECENT_HEADER_SEARCHES_KEY);
    }
  }, []);

  useEffect(() => {
    if (!headerSearch.trim()) {
      setIsSearchTyping(false);
      return;
    }

    setIsSearchTyping(true);
    const timer = window.setTimeout(() => setIsSearchTyping(false), 180);
    return () => window.clearTimeout(timer);
  }, [headerSearch]);

  // 8. Waitlist ticker
  const { data: waitlistLatestData } = trpc.email.waitlistLatest.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  const { data: popularArticles } = trpc.blog.getPopular.useQuery(
    { limit: 3 },
    { staleTime: 300_000, retry: false }
  );

  const timeAgo = (date: Date | null | undefined): string | null => {
    if (!date) return null;
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const lastJoinedLabel = timeAgo(waitlistLatestData?.latestAt);

  const navLinks = [
    { href: "#about", label: "Ecosystem" },
    { href: "#quiz", label: "Symptom Quiz" },
    { href: "#upload-demo", label: "AI Lab Scanner" },
    { href: "#biomarkers", label: "Optimal Ranges" },
    { href: "#letter", label: "Doctor Prep" },
    { href: "#authority", label: "Our Authority" },
    { href: "#cases", label: "Case Studies" },
  ];

  const resourceLinks = [
    { href: "/biomarkers", label: "Biomarker Library", icon: Activity },
    { href: "/lifestyle", label: "Lifestyle AI", icon: Sparkles },
    { href: "/books", label: "Books", icon: BookOpen },
    { href: "/blog", label: "Blog", icon: FileText },
  ];

  const secondaryLinks = [
    { href: "/medical-assistant", label: "AI Assistant", icon: Heart },
    { href: "/features", label: "Features", icon: Award },
    { href: "/support", label: "Help Center", icon: HelpCircle },
    ...(isAuthenticated ? [{ href: "/referrals", label: "Referrals", icon: TrendingUp }] : []),
  ];

  const isPageActive = (href: string) =>
    location === href || location.startsWith(`${href}/`);

  const isResourceActive = isPageActive;

  const { matches: headerSearchMatches, results: headerSearchResults, synonymUsed } = filterHeaderSearchDestinations(headerSearch);

  const activeHeaderSearchIndex = Math.min(
    headerSearchActiveIndex,
    Math.max(headerSearchResults.length - 1, 0)
  );

  useEffect(() => {
    if (!headerSearch.trim() || headerSearchResults.length > 0 || zeroResultsTrackedRef.current) return;

    const timer = window.setTimeout(() => {
      if (zeroResultsTrackedRef.current) return;
      trackHeaderSearchZeroResults(headerSearchSurfaceRef.current);
      zeroResultsTrackedRef.current = true;
    }, 350);

    return () => window.clearTimeout(timer);
  }, [headerSearch, headerSearchResults.length]);

  const closeHeaderSearch = () => {
    setHeaderSearchOpen(false);
    setHeaderSearch("");
    setHeaderSearchActiveIndex(0);
  };

  const rememberHeaderSearch = (query: string) => {
    const nextSearches = addRecentHeaderSearch(recentHeaderSearches, query);
    if (nextSearches === recentHeaderSearches) return;

    setRecentHeaderSearches(nextSearches);
    try {
      localStorage.setItem(RECENT_HEADER_SEARCHES_KEY, JSON.stringify(nextSearches));
    } catch {
      // Recent searches are a convenience only; continue without storage if unavailable.
    }
  };

  const clearRecentHeaderSearches = (surface: "desktop" | "mobile") => {
    setRecentHeaderSearches([]);
    try {
      localStorage.removeItem(RECENT_HEADER_SEARCHES_KEY);
    } catch {
      // Search history remains optional when browser storage is unavailable.
    }
    requestAnimationFrame(() =>
      (surface === "desktop" ? headerSearchInputRef : mobileSearchInputRef).current?.focus()
    );
  };

  const clearMobileSearch = () => {
    zeroResultsTrackedRef.current = false;
    setHeaderSearch("");
    setHeaderSearchActiveIndex(0);
    requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
  };

  useEffect(() => {
    const handleGlobalSearchShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      event.preventDefault();
      headerSearchSurfaceRef.current = "desktop";
      zeroResultsTrackedRef.current = false;
      setHeaderSearchOpen(true);
      setHeaderSearchActiveIndex(0);
      requestAnimationFrame(() => headerSearchInputRef.current?.focus());
    };

    document.addEventListener("keydown", handleGlobalSearchShortcut);
    return () => document.removeEventListener("keydown", handleGlobalSearchShortcut);
  }, []);

  const updateHeaderSearch = (query: string, surface: "desktop" | "mobile") => {
    headerSearchSurfaceRef.current = surface;
    if (!query.trim()) zeroResultsTrackedRef.current = false;
    setHeaderSearch(query);
    setHeaderSearchOpen(true);
    setHeaderSearchActiveIndex(0);
    setSearchFeedback(null);
  };

  const handleSearchFeedback = (feedback: "helpful" | "not_helpful", surface: "desktop" | "mobile") => {
    setSearchFeedback(feedback);
    trackHeaderSearchFeedback(feedback, surface, headerSearchResults.length);
    toast.success("Thank you for your feedback.", {
      description: "Your rating helps improve search results.",
    });
  };

  const openHeaderSearch = () => {
    headerSearchSurfaceRef.current = "desktop";
    if (!headerSearch.trim()) zeroResultsTrackedRef.current = false;
    setHeaderSearchOpen(true);
    setHeaderSearchActiveIndex(0);
    requestAnimationFrame(() => headerSearchInputRef.current?.focus());
  };

  const navigateFromHeaderSearch = (href: string) => {
    rememberHeaderSearch(headerSearch);
    closeHeaderSearch();
    setMobileMenuOpen(false);
    setMobileResourcesOpen(false);
    setLocation(href);
  };

  const renderSearchHighlight = (text: string) =>
    getSearchHighlightSegments(text, headerSearch).map((segment, index) =>
      segment.matches ? (
        <mark key={`${segment.value}-${index}`} className="rounded-sm bg-[#F4D7CA] px-0.5 text-inherit">
          {segment.value}
        </mark>
      ) : (
        <span key={`${segment.value}-${index}`}>{segment.value}</span>
      )
    );

  const handleHeaderSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && headerSearchResults.length > 0) {
      event.preventDefault();
      setHeaderSearchOpen(true);
      setHeaderSearchActiveIndex((index) => Math.min(index + 1, headerSearchResults.length - 1));
    } else if (event.key === "ArrowUp" && headerSearchResults.length > 0) {
      event.preventDefault();
      setHeaderSearchActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home" && headerSearchResults.length > 0) {
      event.preventDefault();
      setHeaderSearchActiveIndex(0);
    } else if (event.key === "End" && headerSearchResults.length > 0) {
      event.preventDefault();
      setHeaderSearchActiveIndex(headerSearchResults.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeHeaderSearch();
      event.currentTarget.blur();
    } else if (event.key === "Enter" && headerSearchResults[activeHeaderSearchIndex]) {
      event.preventDefault();
      navigateFromHeaderSearch(headerSearchResults[activeHeaderSearchIndex].href);
    }
  };

  const focusResourceItem = (index: number) => {
    resourceItemRefs.current[index]?.focus();
  };

  const openResourcesAt = (index: number) => {
    setResourcesOpen(true);
    requestAnimationFrame(() => focusResourceItem(index));
  };

  const closeResourcesAndRestoreFocus = () => {
    setResourcesOpen(false);
    resourcesTriggerRef.current?.focus();
  };

  const handleResourcesTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openResourcesAt(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openResourcesAt(resourceLinks.length - 1);
    } else if (event.key === "Escape" && resourcesOpen) {
      event.preventDefault();
      closeResourcesAndRestoreFocus();
    }
  };

  const handleResourcesMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const activeIndex = resourceItemRefs.current.findIndex((item) => item === document.activeElement);
    const currentIndex = activeIndex === -1 ? 0 : activeIndex;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusResourceItem((currentIndex + 1) % resourceLinks.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusResourceItem((currentIndex - 1 + resourceLinks.length) % resourceLinks.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusResourceItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusResourceItem(resourceLinks.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeResourcesAndRestoreFocus();
    }
  };

  const focusMoreItem = (index: number) => {
    moreItemRefs.current[index]?.focus();
  };

  const openMoreAt = (index: number) => {
    setMoreOpen(true);
    requestAnimationFrame(() => focusMoreItem(index));
  };

  const closeMoreAndRestoreFocus = () => {
    setMoreOpen(false);
    moreTriggerRef.current?.focus();
  };

  const handleMoreTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openMoreAt(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMoreAt(secondaryLinks.length - 1);
    } else if (event.key === "Escape" && moreOpen) {
      event.preventDefault();
      closeMoreAndRestoreFocus();
    }
  };

  const handleMoreMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const activeIndex = moreItemRefs.current.findIndex((item) => item === document.activeElement);
    const currentIndex = activeIndex === -1 ? 0 : activeIndex;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMoreItem((currentIndex + 1) % secondaryLinks.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMoreItem((currentIndex - 1 + secondaryLinks.length) % secondaryLinks.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusMoreItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusMoreItem(secondaryLinks.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMoreAndRestoreFocus();
    }
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    setMobileResourcesOpen(false);
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const toggleMobileMenu = () => {
    const nextOpen = !mobileMenuOpen;
    setMobileMenuOpen(nextOpen);
    if (!nextOpen) setMobileResourcesOpen(false);
  };

  // Symptoms options for Quiz
  const symptomsList = [
    "Chronic fatigue / afternoon energy crashes",
    "Brain fog / difficulty focusing",
    "Sluggish metabolism / unexplained weight gain",
    "Cold intolerance (hands/feet always cold)",
    "Hair thinning / brittle nails",
    "Joint stiffness / muscle aches",
    "Sugar/carb cravings after meals"
  ];

  const handleSymptomToggle = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const runQuizAnalysis = () => {
    if (selectedSymptoms.length === 0) {
      toast.error("Please select at least one symptom to analyze.");
      return;
    }
    setQuizStep(2); // Move to processing
    setTimeout(() => {
      // Map symptoms to recommended biomarkers
      const recommendations: string[] = [];
      if (selectedSymptoms.some(s => s.includes("fatigue") || s.includes("hair") || s.includes("cold"))) {
        recommendations.push("Ferritin (Iron Storage)");
      }
      if (selectedSymptoms.some(s => s.includes("sluggish") || s.includes("cold") || s.includes("fatigue"))) {
        recommendations.push("Thyroid Stimulating Hormone (TSH)");
      }
      if (selectedSymptoms.some(s => s.includes("cravings") || s.includes("crashes"))) {
        recommendations.push("Hemoglobin A1c (HbA1c)");
      }
      if (selectedSymptoms.some(s => s.includes("stiffness") || s.includes("aches"))) {
        recommendations.push("High-Sensitivity CRP (hs-CRP)");
      }
      if (selectedSymptoms.some(s => s.includes("weight") || s.includes("fatigue"))) {
        recommendations.push("Alanine Aminotransferase (ALT)");
      }

      // Default fallback
      if (recommendations.length === 0) {
        recommendations.push("Ferritin (Iron Storage)", "Thyroid Stimulating Hormone (TSH)");
      }

      setQuizResult({
        symptomsCount: selectedSymptoms.length,
        recommendedBiomarkers: recommendations,
        message: "Your symptoms suggest potential subclinical imbalances that standard 'normal' ranges might overlook. We recommend focusing on these specific biomarkers."
      });
      setQuizStep(3); // Result step
    }, 1500);
  };

  const resetQuiz = () => {
    setSelectedSymptoms([]);
    setQuizResult(null);
    setQuizStep(0);
  };

  // Live calculation of status based on slider value (Ferritin example: normal 15-150, optimal 50-100)
  const sliderStatus = useMemo(() => {
    if (userSliderVal < 15) return { label: "Pathologically Low (Clinical Anemia)", color: "text-red-600 bg-red-50 border-red-200" };
    if (userSliderVal >= 15 && userSliderVal < 50) return { label: "Suboptimal / Low Iron Stores", color: "text-amber-600 bg-amber-50 border-amber-200" };
    if (userSliderVal >= 50 && userSliderVal <= 100) return { label: "Optimal Wellness Zone", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (userSliderVal > 100 && userSliderVal <= 150) return { label: "Normal (Standard Range)", color: "text-blue-600 bg-blue-50 border-blue-200" };
    return { label: "High / Potential Inflammation", color: "text-red-600 bg-red-50 border-red-200" };
  }, [userSliderVal]);

  const handlePrintLetter = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!isLetterGenerated) return;
    try {
      exportDoctorLetterPDF({
        patientName,
        biomarker: concernBiomarker,
        symptoms: userSymptomsText,
      });
      toast.success("Doctor's letter exported as PDF!");
    } catch {
      toast.error("PDF export failed. Please try again.");
    }
  };

  // Real AI Lab Report Analysis via tRPC
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [labTextForSave, setLabTextForSave] = useState<string>("");
  const [labFileNameForSave, setLabFileNameForSave] = useState<string>("");

  // Save lab report for authenticated users after analysis
  const utils = trpc.useUtils();
  const saveLabMutation = trpc.lab.save.useMutation({
    onSuccess: () => {
      toast.success("Lab report saved to your history!");
      // Invalidate dashboard queries so they refresh when user navigates there
      utils.lab.list.invalidate();
      utils.lab.biomarkerHistory.invalidate();
    },
    onError: () => {
      toast.error("Could not save lab report. Please try again.");
    },
  });

  const analyzeLabMutation = trpc.lab.analyzeText.useMutation({
    onSuccess: (data, variables) => {
      setAiAnalysisResult(data);
      setParsedBiomarkers(data.biomarkers.map((b: any) => ({
        name: b.name,
        value: b.value,
        normal: b.standardRange,
        optimal: b.optimalRange,
        status: b.status === 'optimal' ? 'Optimal' : b.status === 'high' ? 'High' : b.status === 'critical_low' ? 'Critical Low' : b.status === 'critical_high' ? 'Critical High' : 'Suboptimal',
        statusColor: b.status === 'optimal' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : b.status === 'high' || b.status === 'critical_high' ? 'text-red-600 bg-red-50 border-red-200' : 'text-amber-600 bg-amber-50 border-amber-200',
        interpretation: b.interpretation,
        recommendation: b.recommendation,
      })));
      setUploadStep("parsed");
      toast.success("AI analysis complete! Review your results below.");
      // Auto-save for authenticated users
      if (isAuthenticated && variables.fileName) {
        saveLabMutation.mutate({
          fileName: variables.fileName,
          rawText: variables.text,
          analysisResult: data,
        });
      }
    },
    onError: () => {
      setUploadStep("idle");
      toast.error("Analysis failed. Please try again or paste your lab text directly.");
    },
  });

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFile(file.name);
      setUploadStep("scanning");
      
      // Read file content and send to AI for analysis
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && text.length > 10) {
          analyzeLabMutation.mutate({ text, fileName: file.name });
        } else {
          // File is not readable as text (e.g. binary PDF), use demo data
          setTimeout(() => {
            analyzeLabMutation.mutate({
              text: `Lab Report Demo:\nFerritin: 24 ng/mL (Ref: 15-150)\nTSH: 3.4 mIU/L (Ref: 0.45-4.5)\nHbA1c: 5.4% (Ref: 4.0-5.6)\nVitamin D: 28 ng/mL (Ref: 30-100)\nhs-CRP: 2.1 mg/L (Ref: <3.0)`,
              fileName: file.name
            });
          }, 500);
        }
      };
      reader.onerror = () => {
        // Fallback to demo analysis
        analyzeLabMutation.mutate({
          text: `Lab Report Demo:\nFerritin: 24 ng/mL (Ref: 15-150)\nTSH: 3.4 mIU/L (Ref: 0.45-4.5)\nHbA1c: 5.4% (Ref: 4.0-5.6)`,
          fileName: file.name
        });
      };
      reader.readAsText(file);
    }
  };

  // Real Email Signup via tRPC
  const emailSubscribeMutation = trpc.email.subscribe.useMutation({
    onSuccess: (data) => {
      setIsSubscribed(true);
      if (data.alreadySubscribed) {
        toast.success("You're already subscribed! Check your inbox for the tracker PDF.");
      } else {
        toast.success("Welcome! Your Free Lab Tracker PDF is on its way to your inbox.");
      }
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    emailSubscribeMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29] font-sans selection:bg-[#E2DCD3]">
      <SEO
        title="Health Intelligence System"
        description="Turn confusing lab results into structured doctor conversations. Built by a Clinical Laboratory Scientist with 20+ years of experience."
        path="/"
        ogImage="https://thepatientscompass.com/manus-storage/patients-compass-social-preview_2f403d47.png"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "The Patient's Compass",
            "url": "https://thepatientscompass.com",
            "description": "Health intelligence system for proactive patients",
            "image": "https://thepatientscompass.com/manus-storage/patients-compass-social-preview_2f403d47.png",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.thepatientscompass.com/biomarkers?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "The Patient's Compass",
            "url": "https://thepatientscompass.com",
            "description": "Functional medicine lab interpretation and doctor visit preparation platform",
            "primaryImageOfPage": "https://thepatientscompass.com/manus-storage/patients-compass-social-preview_2f403d47.png",
            "audience": { "@type": "Patient" },
            "medicalAudience": { "@type": "MedicalAudience", "audienceType": "Patient" }
          }
        ]}
      />
      {/* Top Banner / Trust Header */}
      <div className="bg-[#7E9A85] text-white py-2.5 px-4 text-center text-sm font-medium tracking-wide flex items-center justify-center gap-2">
        <UserCheck className="w-4 h-4" />
        <span>Built by a Clinical Laboratory Scientist with 20+ Years of Experience</span>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC] transition-all duration-200">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#7E9A85] text-white p-2 rounded-xl shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#2C2A29]">The Patient's Compass</span>
              <p className="text-[10px] text-[#7E9A85] font-semibold tracking-wider uppercase">Health Intelligence System</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav aria-label="Primary navigation" className="hidden xl:flex items-center gap-6 text-sm font-medium text-[#5C5A59]">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="hover:text-[#2C2A29] transition-colors">{link.label}</a>
            ))}
            <div
              className="relative"
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) {
                  setResourcesOpen(false);
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setResourcesOpen(false);
                }
              }}
            >
              <button
                ref={resourcesTriggerRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={resourcesOpen}
                aria-controls="resources-menu"
                onClick={() => setResourcesOpen((open) => !open)}
                onKeyDown={handleResourcesTriggerKeyDown}
                className="inline-flex items-center gap-1 text-[#5C5A59] hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] focus-visible:ring-offset-2 rounded-md transition-colors"
              >
                Resources
                <ChevronDown
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${resourcesOpen ? "rotate-180" : ""}`}
                />
              </button>
              {resourcesOpen && (
                <div
                  id="resources-menu"
                  role="menu"
                  aria-label="Resources"
                  className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200 motion-reduce:animate-none absolute left-1/2 top-full z-50 mt-3 w-56 -translate-x-1/2 rounded-2xl border border-[#EBE6DC] bg-white p-2 shadow-xl shadow-[#2C2A29]/10"
                  onKeyDown={handleResourcesMenuKeyDown}
                >
                  {resourceLinks.map((link, index) => {
                    const active = isResourceActive(link.href);
                    return (
                      <a
                        key={link.href}
                        ref={(node) => {
                          resourceItemRefs.current[index] = node;
                        }}
                        href={link.href}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setResourcesOpen(false)}
                        style={{ animationDelay: `${Math.min(index * 45, 135)}ms` }}
                        className={`motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-reduce:animate-none block rounded-xl px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] focus-visible:ring-inset transition-colors ${
                          active
                            ? "bg-[#7E9A85]/15 text-[#2C2A29] shadow-sm"
                            : "text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <link.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7E9A85]" />
                          {link.label}
                        </span>
                      </a>
                    );
                  })}
                  <a
                    href={SUPER_KIDS_PDF}
                    download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf"
                    role="menuitem"
                    onClick={() => { setResourcesOpen(false); trackSuperKidsPdfTextLinkClick(); }}
                    aria-label="Your Super Kid Activity Pack, 19 pages, completely free"
                    className="group mt-1 block rounded-xl border-t border-[#EBE6DC] px-3 py-2.5 text-sm font-semibold text-[#58705E] transition-colors hover:bg-[#FFF6E6] hover:text-[#D27F5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] focus-visible:ring-inset"
                  >
                    <span className="flex items-center gap-2"><FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-[#6F8D78] transition-colors group-hover:text-[#D27F5D]" /><span className="min-w-0 flex-1">Your Super Kid Activity Pack</span><span className="text-[10px] font-medium text-[#8A978D] group-hover:text-[#A36E43]">19 pages · free</span></span>
                  </a>
                </div>
              )}
            </div>
            <div
              className="relative"
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) {
                  setMoreOpen(false);
                }
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setMoreOpen(false);
                }
              }}
            >
              <button
                ref={moreTriggerRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-controls="more-menu"
                onClick={() => setMoreOpen((open) => !open)}
                onKeyDown={handleMoreTriggerKeyDown}
                className={`inline-flex items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] focus-visible:ring-offset-2 transition-colors ${
                  secondaryLinks.some((link) => isPageActive(link.href))
                    ? "text-[#2C2A29] font-semibold"
                    : "text-[#5C5A59] hover:text-[#2C2A29]"
                }`}
              >
                More
                <ChevronDown
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>
              {moreOpen && (
                <div
                  id="more-menu"
                  role="menu"
                  aria-label="More"
                  className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200 motion-reduce:animate-none absolute left-1/2 top-full z-50 mt-3 w-48 -translate-x-1/2 rounded-2xl border border-[#EBE6DC] bg-white p-2 shadow-xl shadow-[#2C2A29]/10"
                  onKeyDown={handleMoreMenuKeyDown}
                >
                  {secondaryLinks.map((link, index) => {
                    const active = isPageActive(link.href);
                    return (
                      <a
                        key={link.href}
                        ref={(node) => {
                          moreItemRefs.current[index] = node;
                        }}
                        href={link.href}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMoreOpen(false)}
                        style={{ animationDelay: `${Math.min(index * 45, 135)}ms` }}
                        className={`motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-reduce:animate-none block rounded-xl px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] focus-visible:ring-inset transition-colors ${
                          active
                            ? "bg-[#7E9A85]/15 text-[#2C2A29] shadow-sm"
                            : "text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <link.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7E9A85]" />
                          {link.label}
                        </span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            <a href="/pricing" className="hover:text-[#2C2A29] transition-colors text-[#D48C70] font-semibold">Pricing</a>
            <a href={SUPER_KIDS_PDF} download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf" onClick={trackSuperKidsPdfTextLinkClick} aria-label="Your Super Kid Activity Pack, 19 pages, completely free" className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#BFD0C0] bg-white/80 px-3 py-2 text-xs font-bold text-[#58705E] shadow-sm transition-colors hover:border-[#D27F5D] hover:bg-[#FFF6E6] hover:text-[#D27F5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AFC7B2] focus-visible:ring-offset-2"><FileText aria-hidden="true" className="h-3.5 w-3.5 text-[#6F8D78] transition-colors group-hover:text-[#D27F5D]" /><span>Your Super Kid Activity Pack</span><span className="hidden 2xl:inline text-[10px] font-medium text-[#8A978D] group-hover:text-[#A36E43]">19 pages · free</span></a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden xl:flex items-center gap-3">
            <div
              className="relative hidden xl:block"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  closeHeaderSearch();
                }
              }}
            >
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7E9A85]" />
              <input
                ref={headerSearchInputRef}
                role="combobox"
                aria-label="Search resources and features"
                aria-autocomplete="list"
                aria-expanded={headerSearchOpen}
                aria-controls="desktop-header-search-results"
                aria-activedescendant={
                  headerSearchOpen && headerSearchResults.length > 0
                    ? `desktop-header-search-option-${activeHeaderSearchIndex}`
                    : undefined
                }
                value={headerSearch}
                onFocus={openHeaderSearch}
                onChange={(event) => {
                  updateHeaderSearch(event.target.value, "desktop");
                }}
                onKeyDown={handleHeaderSearchKeyDown}
                placeholder="Search resources"
                className="h-9 w-40 rounded-xl border border-[#D4E2D6] bg-white pl-9 pr-8 text-xs text-[#2C2A29] placeholder:text-[#9E9A90] outline-none transition focus:border-[#7E9A85] focus:ring-2 focus:ring-[#7E9A85]/20"
              />
              {isSearchTyping && (
                <Loader2 aria-hidden="true" className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-[#7E9A85]" />
              )}
              {headerSearchOpen && (
                <div
                  id="desktop-header-search-results"
                  role="listbox"
                  aria-label="Search results"
                  className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#EBE6DC] bg-white p-2 shadow-xl shadow-[#2C2A29]/10"
                >
                  <p aria-live="polite" className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E9A85]">
                    {!headerSearch.trim()
                      ? "Explore resources"
                      : headerSearchResults.length === headerSearchMatches.length
                      ? `${headerSearchResults.length} ${headerSearchResults.length === 1 ? "result" : "results"}`
                      : `Showing ${headerSearchResults.length} of ${headerSearchMatches.length} results`}
                  </p>
                  {!headerSearch.trim() && recentHeaderSearches.length > 0 ? (
                    <div className="space-y-1 px-1 pb-1">
                      <div className="flex items-center justify-between px-2 pb-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E9A85]">Recent searches</p>
                        <button
                          type="button"
                          onClick={() => clearRecentHeaderSearches("desktop")}
                          className="rounded px-1 py-0.5 text-[11px] font-semibold text-[#6B6966] underline underline-offset-2 transition-colors hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                        >
                          Clear
                        </button>
                      </div>
                      {recentHeaderSearches.map((search) => (
                        <button
                          key={search}
                          type="button"
                          onClick={() => {
                            setHeaderSearch(search);
                            setHeaderSearchActiveIndex(0);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                        >
                          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5 text-[#7E9A85]" />
                          <span className="truncate">{search}</span>
                        </button>
                      ))}
                    </div>
                  ) : !headerSearch.trim() && popularArticles && popularArticles.length > 0 ? (
                    <div className="space-y-1 px-1 pb-1">
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E9A85]">Popular articles</p>
                      {popularArticles.map((article) => (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => navigateFromHeaderSearch(`/blog/${article.slug}`)}
                          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                        >
                          <FileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#7E9A85]" />
                          <span className="min-w-0 flex-1 truncate">{article.title}</span>
                          <span className="text-[11px] font-medium text-[#8B8780]">{article.readingTimeMinutes} min</span>
                        </button>
                      ))}
                    </div>
                  ) : headerSearchResults.length > 0 ? (
                    headerSearchResults.map((result, index) => {
                      const Icon = result.icon;
                      const active = index === activeHeaderSearchIndex;
                      const keywordMatchContext = getKeywordMatchContext(result, headerSearch);
                      return (
                        <button
                          id={`desktop-header-search-option-${index}`}
                          key={result.href}
                          type="button"
                          role="option"
                          aria-selected={active}
                          onMouseEnter={() => setHeaderSearchActiveIndex(index)}
                          onClick={() => navigateFromHeaderSearch(result.href)}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] ${
                            active
                              ? "bg-[#7E9A85]/15 text-[#2C2A29]"
                              : "text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29]"
                          }`}
                        >
                          <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7E9A85]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{renderSearchHighlight(result.label)}</span>
                            <span className="block text-[11px] font-medium text-[#8B8780]">
                              {renderSearchHighlight(result.category)}
                              {keywordMatchContext && (
                                <span className="ml-1 text-[#6B6966]">· matches {renderSearchHighlight(keywordMatchContext)}</span>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm font-semibold text-[#2C2A29]">No results found</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#6B6966]">
                        Check your spelling or browse the Resources menu.
                      </p>
                    </div>
                  )}
                  {synonymUsed && headerSearch.trim() && headerSearchResults.length > 0 && (
                    <p role="status" className="mx-2 mt-2 rounded-lg bg-[#F4D7CA]/45 px-2 py-1.5 text-[11px] leading-relaxed text-[#6B5349]">
                      Showing results related to “{headerSearch.trim()}”.
                    </p>
                  )}
                  {headerSearch.trim() && headerSearchResults.length > 0 && (
                    <div className="mx-2 mt-2 flex items-center justify-between border-t border-[#F0ECE6] pt-2">
                      <span className="text-[11px] text-[#6B6966]">
                        {searchFeedback ? "Thanks for the feedback." : "Were these results helpful?"}
                      </span>
                      <div className="flex items-center gap-1" role="group" aria-label="Rate search results">
                        <button
                          type="button"
                          aria-label="Results were helpful"
                          aria-pressed={searchFeedback === "helpful"}
                          onClick={() => handleSearchFeedback("helpful", "desktop")}
                          className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] ${searchFeedback === "helpful" ? "bg-[#7E9A85]/20 text-[#51715B]" : "text-[#77736D] hover:bg-[#EBE6DC] hover:text-[#2C2A29]"}`}
                        >
                          <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Results were not helpful"
                          aria-pressed={searchFeedback === "not_helpful"}
                          onClick={() => handleSearchFeedback("not_helpful", "desktop")}
                          className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] ${searchFeedback === "not_helpful" ? "bg-[#D48C70]/20 text-[#9A604B]" : "text-[#77736D] hover:bg-[#EBE6DC] hover:text-[#2C2A29]"}`}
                        >
                          <ThumbsDown aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {isAuthenticated ? (
              <>
                <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 rounded-xl text-xs" onClick={() => window.location.href = "/dashboard"}>
                  Update Dashboard
                </Button>
                {!hasPro && (
                  <Button variant="outline" className="border-[#D48C70] text-[#D48C70] hover:bg-[#D48C70]/10 rounded-xl text-xs" onClick={() => window.location.href = "/pricing"}>
                    Upgrade to Pro
                  </Button>
                )}
                <Button variant="outline" className="border-[#EBE6DC] text-[#5C5A59] hover:bg-[#EBE6DC]/40 rounded-xl text-xs" onClick={() => logout()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 rounded-xl text-xs" onClick={() => window.location.href = "/signup"}>
                  Sign Up
                </Button>
                <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-xs" onClick={() => window.location.href = "/signin"}>
                  Sign In
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="xl:hidden p-2 rounded-xl text-[#5C5A59] hover:bg-[#EBE6DC]/40 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#EBE6DC] bg-[#F9F6F0]/98 backdrop-blur-md">
            <nav className="container max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              <div className="relative mb-2">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#7E9A85]" />
                <input
                  ref={mobileSearchInputRef}
                  role="combobox"
                  aria-label="Search resources and features"
                  aria-autocomplete="list"
                  aria-expanded={headerSearchOpen && (headerSearch.trim().length > 0 || recentHeaderSearches.length > 0 || Boolean(popularArticles?.length))}
                  aria-controls="mobile-header-search-results"
                  aria-activedescendant={
                    headerSearch.trim().length > 0 && headerSearchResults.length > 0
                      ? `mobile-header-search-option-${activeHeaderSearchIndex}`
                      : undefined
                  }
                  value={headerSearch}
                  onFocus={() => {
                    headerSearchSurfaceRef.current = "mobile";
                    if (!headerSearch.trim()) zeroResultsTrackedRef.current = false;
                    setHeaderSearchOpen(true);
                  }}
                  onChange={(event) => {
                    updateHeaderSearch(event.target.value, "mobile");
                  }}
                  onKeyDown={handleHeaderSearchKeyDown}
                  placeholder="Search resources and features"
                  className="h-11 w-full rounded-xl border border-[#D4E2D6] bg-white pl-9 pr-10 text-sm text-[#2C2A29] placeholder:text-[#9E9A90] outline-none transition focus:border-[#7E9A85] focus:ring-2 focus:ring-[#7E9A85]/20"
                />
                {isSearchTyping ? (
                  <Loader2 aria-hidden="true" className="pointer-events-none absolute right-2.5 top-3.5 h-4 w-4 animate-spin text-[#7E9A85]" />
                ) : headerSearch ? (
                  <button
                    type="button"
                    onClick={clearMobileSearch}
                    className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-[#77736D] transition-colors hover:bg-[#EBE6DC] hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                    aria-label="Clear search"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                {headerSearchOpen && (headerSearch.trim().length > 0 || recentHeaderSearches.length > 0 || Boolean(popularArticles?.length)) && (
                  <div
                    id="mobile-header-search-results"
                    role="listbox"
                    aria-label="Search results"
                    className="mt-2 overflow-hidden rounded-xl border border-[#EBE6DC] bg-white shadow-sm"
                  >
                    <p aria-live="polite" className="border-b border-[#F0ECE6] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E9A85]">
                      {!headerSearch.trim()
                        ? "Explore resources"
                        : headerSearchResults.length === headerSearchMatches.length
                        ? `${headerSearchResults.length} ${headerSearchResults.length === 1 ? "result" : "results"}`
                        : `Showing ${headerSearchResults.length} of ${headerSearchMatches.length} results`}
                    </p>
                    {!headerSearch.trim() && recentHeaderSearches.length > 0 ? (
                      <div className="space-y-1 px-2 py-2">
                        <div className="flex items-center justify-between px-1 pb-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E9A85]">Recent searches</p>
                          <button
                            type="button"
                            onClick={() => clearRecentHeaderSearches("mobile")}
                            className="rounded px-1 py-0.5 text-[11px] font-semibold text-[#6B6966] underline underline-offset-2 transition-colors hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                          >
                            Clear
                          </button>
                        </div>
                        {recentHeaderSearches.map((search) => (
                          <button
                            key={search}
                            type="button"
                            onClick={() => {
                              setHeaderSearch(search);
                              setHeaderSearchActiveIndex(0);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm font-semibold text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                          >
                            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5 text-[#7E9A85]" />
                            <span className="truncate">{search}</span>
                          </button>
                        ))}
                      </div>
                    ) : !headerSearch.trim() && popularArticles && popularArticles.length > 0 ? (
                      <div className="space-y-1 px-2 py-2">
                        <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E9A85]">Popular articles</p>
                        {popularArticles.map((article) => (
                          <button
                            key={article.id}
                            type="button"
                            onClick={() => navigateFromHeaderSearch(`/blog/${article.slug}`)}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left text-sm font-semibold text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                          >
                            <FileText aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#7E9A85]" />
                            <span className="min-w-0 flex-1 truncate">{article.title}</span>
                            <span className="text-[11px] font-medium text-[#8B8780]">{article.readingTimeMinutes} min</span>
                          </button>
                        ))}
                      </div>
                    ) : headerSearchResults.length > 0 ? (
                      headerSearchResults.map((result, index) => {
                        const Icon = result.icon;
                        const active = index === activeHeaderSearchIndex;
                        const keywordMatchContext = getKeywordMatchContext(result, headerSearch);
                        return (
                          <button
                            id={`mobile-header-search-option-${index}`}
                            key={result.href}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setHeaderSearchActiveIndex(index)}
                            onClick={() => navigateFromHeaderSearch(result.href)}
                            className={`flex w-full items-center gap-2 border-b border-[#F0ECE6] px-3 py-2.5 text-left text-sm font-semibold last:border-b-0 ${
                              active
                                ? "bg-[#7E9A85]/15 text-[#2C2A29]"
                                : "text-[#5C5A59] hover:bg-[#7E9A85]/10 hover:text-[#2C2A29]"
                            }`}
                          >
                            <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7E9A85]" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{renderSearchHighlight(result.label)}</span>
                              <span className="block text-[11px] font-medium text-[#8B8780]">
                                {renderSearchHighlight(result.category)}
                                {keywordMatchContext && (
                                  <span className="ml-1 text-[#6B6966]">· matches {renderSearchHighlight(keywordMatchContext)}</span>
                                )}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-4 text-center">
                        <p className="text-sm font-semibold text-[#2C2A29]">No results found</p>
                        <p className="mt-1 text-xs leading-relaxed text-[#6B6966]">
                          Check your spelling or browse the Resources menu.
                        </p>
                      </div>
                    )}
                    {synonymUsed && headerSearch.trim() && headerSearchResults.length > 0 && (
                      <p role="status" className="mx-3 mt-2 rounded-lg bg-[#F4D7CA]/45 px-2 py-1.5 text-[11px] leading-relaxed text-[#6B5349]">
                        Showing results related to “{headerSearch.trim()}”.
                      </p>
                    )}
                    {headerSearch.trim() && headerSearchResults.length > 0 && (
                      <div className="mx-3 mt-2 flex items-center justify-between border-t border-[#F0ECE6] pt-2">
                        <span className="text-[11px] text-[#6B6966]">
                          {searchFeedback ? "Thanks for the feedback." : "Were these results helpful?"}
                        </span>
                        <div className="flex items-center gap-1" role="group" aria-label="Rate search results">
                          <button
                            type="button"
                            aria-label="Results were helpful"
                            aria-pressed={searchFeedback === "helpful"}
                            onClick={() => handleSearchFeedback("helpful", "mobile")}
                            className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] ${searchFeedback === "helpful" ? "bg-[#7E9A85]/20 text-[#51715B]" : "text-[#77736D] hover:bg-[#EBE6DC] hover:text-[#2C2A29]"}`}
                          >
                            <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Results were not helpful"
                            aria-pressed={searchFeedback === "not_helpful"}
                            onClick={() => handleSearchFeedback("not_helpful", "mobile")}
                            className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] ${searchFeedback === "not_helpful" ? "bg-[#D48C70]/20 text-[#9A604B]" : "text-[#77736D] hover:bg-[#EBE6DC] hover:text-[#2C2A29]"}`}
                          >
                            <ThumbsDown aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {navLinks.map(link => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-2 border-t border-[#EBE6DC] pt-3">
                <button
                  id="mobile-resources-trigger"
                  type="button"
                  aria-expanded={mobileResourcesOpen}
                  aria-controls="mobile-resources-panel"
                  onClick={() => setMobileResourcesOpen((open) => !open)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#5C5A59] hover:bg-[#EBE6DC]/40 hover:text-[#2C2A29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85] transition-colors"
                >
                  Resources
                  <ChevronDown
                    aria-hidden="true"
                    className={`w-4 h-4 transition-transform duration-150 ${mobileResourcesOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileResourcesOpen && (
                  <div
                    id="mobile-resources-panel"
                    role="region"
                    aria-labelledby="mobile-resources-trigger"
                    className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200 motion-reduce:animate-none mt-1 ml-3 space-y-1 border-l border-[#EBE6DC] pl-2"
                  >
                    {resourceLinks.map((link) => {
                      const active = isResourceActive(link.href);
                      return (
                        <a
                          key={link.href}
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => {
                            setMobileResourcesOpen(false);
                            setMobileMenuOpen(false);
                          }}
                          className={`block rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                            active
                              ? "bg-[#7E9A85]/15 text-[#2C2A29]"
                              : "text-[#5C5A59] hover:bg-[#EBE6DC]/40 hover:text-[#2C2A29]"
                          }`}
                        >
                          {link.label}
                        </a>
                      );
                    })}
                    <a
                      href={SUPER_KIDS_PDF}
                      download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf"
                      onClick={() => { setMobileResourcesOpen(false); setMobileMenuOpen(false); trackSuperKidsPdfTextLinkClick(); }}
                      aria-label="Your Super Kid Activity Pack, 19 pages, completely free"
                      className="group mt-1 flex items-center gap-2 rounded-xl border-t border-[#EBE6DC] px-3 py-2.5 pt-3 text-left text-sm font-semibold text-[#58705E] transition-colors hover:bg-[#FFF6E6] hover:text-[#D27F5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E9A85]"
                    >
                      <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-[#6F8D78] transition-colors group-hover:text-[#D27F5D]" /><span className="min-w-0 flex-1">Your Super Kid Activity Pack</span><span className="text-[11px] font-medium text-[#8A978D] group-hover:text-[#A36E43]">19 pages · free</span>
                    </a>
                  </div>
                )}
              </div>
              <a
                href="/medical-assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left text-sm font-semibold text-[#A39EBA] hover:text-[#8A85A8] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors"
              >
                🩺 AI Assistant
              </a>
              <a
                href={SUPER_KIDS_PDF}
                download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf"
                onClick={() => { setMobileMenuOpen(false); trackSuperKidsPdfTextLinkClick(); }}
                aria-label="Your Super Kid Activity Pack, 19 pages, completely free"
                className="group flex items-center gap-2 rounded-xl border border-[#BFD0C0] bg-white/80 px-3 py-2.5 text-left text-sm font-bold text-[#58705E] transition-colors hover:border-[#D27F5D] hover:bg-[#FFF6E6] hover:text-[#D27F5D]"
              >
                <FileText aria-hidden="true" className="h-4 w-4 text-[#6F8D78] transition-colors group-hover:text-[#D27F5D]" />
                <span className="min-w-0 flex-1">Your Super Kid Activity Pack</span>
                <span className="text-[11px] font-medium text-[#8A978D] group-hover:text-[#A36E43]">19 pages · free</span>
              </a>
              <a
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left text-sm font-semibold text-[#7E9A85] hover:text-[#6A8571] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors"
              >
                Features
              </a>
              <a
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left text-sm font-semibold text-[#D48C70] hover:text-[#C27A5B] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors"
              >
                Pricing
              </a>
              <a
                href="/support"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left text-sm font-semibold text-[#A39EBA] hover:text-[#8A85AA] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors"
              >
                Help
              </a>
              {isAuthenticated && (
                <a
                  href="/referrals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left text-sm font-semibold text-[#D48C70] hover:text-[#C27A5B] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors"
                >
                  💰 Referrals
                </a>
              )}
              <div className="border-t border-[#EBE6DC] pt-3 mt-2 flex flex-col gap-2">
                <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 rounded-xl w-full justify-center" onClick={() => { setMobileMenuOpen(false); window.location.href = "/books"; }}>
                  Browse All Books
                </Button>
                {isAuthenticated ? (
                  <>
                    <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 rounded-xl w-full justify-center text-xs" onClick={() => { setMobileMenuOpen(false); window.location.href = "/dashboard"; }}>
                      My Dashboard
                    </Button>
                    {!hasPro && (
                      <Button variant="outline" className="border-[#D48C70] text-[#D48C70] hover:bg-[#D48C70]/10 rounded-xl w-full justify-center text-xs" onClick={() => { setMobileMenuOpen(false); window.location.href = "/pricing"; }}>
                        Upgrade to Pro
                      </Button>
                    )}
                    <Button variant="outline" className="border-[#EBE6DC] text-[#5C5A59] hover:bg-[#EBE6DC]/40 rounded-xl w-full justify-center text-xs" onClick={() => { setMobileMenuOpen(false); logout(); }}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 rounded-xl w-full justify-center text-xs" onClick={() => { setMobileMenuOpen(false); window.location.href = "/signup"; }}>
                      Sign Up
                    </Button>
                    <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl w-full justify-center text-xs" onClick={() => { setMobileMenuOpen(false); window.location.href = "/signin"; }}>
                      Sign In
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="about" className="relative overflow-hidden py-16 lg:py-24 border-b border-[#EBE6DC]">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(126,154,133,0.15),transparent_45%)] pointer-events-none">
          <img
            src={IMAGES.hero}
            alt=""
            width={1600}
            height={900}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover opacity-35 mix-blend-multiply"
            onError={(event) => event.currentTarget.remove()}
          />
        </div>
        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#7E9A85]/10 border border-[#7E9A85]/20 text-[#7E9A85] px-3 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Patient's Compass Health Intelligence System</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#2C2A29] leading-tight tracking-tight">
                Turn confusing lab results into a <span className="text-[#D48C70] italic">structured doctor conversation</span>.
              </h1>
              <p className="text-lg text-[#5C5A59] leading-relaxed max-w-2xl">
                Built by a Clinical Laboratory Scientist — not just software engineers. We help you map standard "normal" lab ranges to optimal functional wellness zones and build the ultimate clinical preparation system for your doctor visits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white px-8 py-6 rounded-2xl text-base font-semibold shadow-md shadow-[#7E9A85]/20 flex items-center gap-2" onClick={() => document.getElementById("quiz")?.scrollIntoView({ behavior: "smooth" })}>
                  <span>Take the Start Here Quiz</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" className="border-[#EBE6DC] bg-white hover:bg-[#F5F1E9] text-[#2C2A29] px-8 py-6 rounded-2xl text-base font-semibold" onClick={() => document.getElementById("upload-demo")?.scrollIntoView({ behavior: "smooth" })}>
                  Try AI Lab Scanner
                </Button>
              </div>

              {/* Live waitlist ticker */}
              {lastJoinedLabel && (
                <div className="flex items-center gap-2 text-xs text-[#9A9896]">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#7E9A85] animate-pulse" />
                  <span>Someone joined the waitlist <span className="font-semibold text-[#6B6560]">{lastJoinedLabel}</span></span>
                </div>
              )}
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#EBE6DC]">
                <div className="space-y-1">
                  <p className="text-3xl font-serif font-bold text-[#7E9A85]">20+</p>
                  <p className="text-xs text-[#5C5A59] font-medium uppercase tracking-wider">Years Clinical Experience</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-serif font-bold text-[#D48C70]">19+</p>
                  <p className="text-xs text-[#5C5A59] font-medium uppercase tracking-wider">Published Books</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-serif font-bold text-[#A39EBA]">100%</p>
                  <p className="text-xs text-[#5C5A59] font-medium uppercase tracking-wider">Educational & Secure</p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative max-w-sm w-full">
                {/* Decorative blob */}
                <div className="absolute -inset-4 bg-[#7E9A85]/10 rounded-full blur-3xl -z-10"></div>
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#EBE6DC] relative">
                  <div className="relative mb-6">
                    <video
                      ref={heroVideoRef}
                      autoPlay
                      muted={heroVideoMuted}
                      loop
                      playsInline
                      preload="metadata"
                      poster={HERO_VIDEO_POSTER}
                      aria-label="Patients Compass health intelligence system introduction"
                      className="aspect-[4/5] h-auto w-full rounded-2xl object-cover shadow-inner"
                    >
                      <source src={HERO_VIDEO} type="video/mp4" />
                      Your browser does not support the hero video. Explore the Patients Compass health intelligence system below.
                    </video>
                    <button
                      type="button"
                      onClick={() => {
                        const nextMuted = !heroVideoMuted;
                        setHeroVideoMuted(nextMuted);
                        if (heroVideoRef.current) {
                          heroVideoRef.current.muted = nextMuted;
                          void heroVideoRef.current.play().catch(() => undefined);
                        }
                      }}
                      aria-pressed={!heroVideoMuted}
                      aria-label={heroVideoMuted ? "Turn on the hero video voice" : "Mute the hero video voice"}
                      title={heroVideoMuted ? "Turn voice on" : "Mute voice"}
                      className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#263b35]/90 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-[#1b2c27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#263b35]"
                    >
                      {heroVideoMuted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
                      <span>{heroVideoMuted ? "Voice off" : "Voice on"}</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#7E9A85] uppercase tracking-wider">
                      <BookOpen className="w-4 h-4" />
                      <span>Ecosystem Foundation</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold">The Core Health Moat</h3>
                    <p className="text-sm text-[#5C5A59] leading-relaxed">
                      We go beyond simple OCR & interpretation. Our system integrates published educational books, physical printable health trackers, personalized wellness plans, and active physician-prep systems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pro plans — Stripe checkout starts on /pricing (sign-in first, then checkout) */}
      {!hasPro && (
      <section id="plans" aria-labelledby="plans-title" className="border-b border-[#EBE6DC] bg-white py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#BFD0C0] bg-[#F3F8F3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6F8D78]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Secure Stripe checkout
            </div>
            <h2 id="plans-title" className="text-3xl font-serif font-bold text-[#2C2A29] sm:text-4xl">Choose the support that fits you</h2>
            <p className="mt-3 text-base leading-relaxed text-[#5C5A59]">Pro unlocks unlimited Health Companion questions, AI lab report analysis, trend tracking and your doctor's letter. Cancel any time.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-[#EBE6DC] bg-[#F9F6F0] p-6 shadow-sm sm:p-8">
              <h3 className="text-xl font-serif font-bold text-[#2C2A29]">Pro Monthly</h3>
              <p className="mt-2 flex items-end gap-1"><span className="text-4xl font-serif font-bold text-[#2C2A29]">$9</span><span className="mb-1 text-sm text-[#9E9A90]">/ month</span></p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-[#2C2A29]">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#7E9A85]" aria-hidden="true" /> Unlimited Health Companion</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#7E9A85]" aria-hidden="true" /> AI lab report analysis</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#7E9A85]" aria-hidden="true" /> Cancel any time</li>
              </ul>
              <Link href="/pricing?plan=monthly">
                <Button className="mt-6 w-full rounded-xl bg-[#7E9A85] py-5 text-sm font-semibold text-white hover:bg-[#6A8571]">Choose monthly <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="flex flex-col rounded-3xl border-2 border-[#D48C70]/45 bg-[#FFF9F5] p-6 shadow-md sm:p-8">
              <div className="mb-3 inline-flex w-fit rounded-full bg-[#D48C70] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Best annual value</div>
              <h3 className="text-xl font-serif font-bold text-[#2C2A29]">Pro Yearly</h3>
              <p className="mt-2 flex items-end gap-1"><span className="text-4xl font-serif font-bold text-[#2C2A29]">$99.99</span><span className="mb-1 text-sm text-[#9E9A90]">/ year</span></p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-[#2C2A29]">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#7E9A85]" aria-hidden="true" /> Everything in Monthly</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#7E9A85]" aria-hidden="true" /> Just $8.33 a month, billed yearly</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#7E9A85]" aria-hidden="true" /> Save $8.01 a year</li>
              </ul>
              <Link href="/pricing?plan=yearly">
                <Button className="mt-6 w-full rounded-xl bg-[#D48C70] py-5 text-sm font-semibold text-white hover:bg-[#C27A5F]">Choose yearly <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-[#7A756E]">Patients Compass provides educational support and preparation tools. It does not diagnose, treat, or replace a licensed healthcare professional.</p>
        </div>
      </section>
      )}

      {/* Featured family resource */}
      <section aria-labelledby="super-kids-resource-title" className="border-b border-[#EBE6DC] bg-[#FFF9F0] py-10 sm:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-[#D9CDBA] bg-gradient-to-br from-[#FFFDF8] via-[#F8F0E3] to-[#E4EFE5] shadow-[0_18px_45px_rgba(73,99,79,.12)]">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#D48C70]/15 blur-3xl" aria-hidden="true" />
            <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_220px] lg:p-10">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#BFD0C0] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6F8D78]"><FileText className="h-3.5 w-3.5" aria-hidden="true" /> Featured family resource</div>
                <h2 id="super-kids-resource-title" className="max-w-2xl text-2xl font-serif font-bold text-[#2C2A29] sm:text-3xl">Healthy Habits for Super Kids</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C5A59] sm:text-base">A playful, printable activity pack to help families explore healthy habits together. It includes 19 pages and is completely free—no registration required.</p>
                <a href={SUPER_KIDS_PDF} download="Healthy-Habits-for-Super-Kids-Free-Printables.pdf" onClick={trackSuperKidsPdfTextLinkClick} aria-label="Your Super Kid Activity Pack, 19 pages, completely free" className="group mt-5 inline-flex items-center gap-2 rounded-full bg-[#6F8D78] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#6F8D78]/20 transition-colors hover:bg-[#58705E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#BFD0C0]"><FileText className="h-4 w-4 transition-colors group-hover:text-[#F6D6C7]" aria-hidden="true" /><span>Your Super Kid Activity Pack</span><span className="text-xs font-medium text-white/75 group-hover:text-[#F6D6C7]">19 pages · free</span></a>
              </div>
              <div className="mx-auto w-full max-w-[220px] rotate-2 rounded-2xl border-4 border-white bg-white p-2 shadow-xl transition-transform duration-200 hover:rotate-0" aria-hidden="true"><img src={SUPER_KIDS_PREVIEW} alt="" loading="lazy" decoding="async" className="aspect-[3/4] w-full rounded-xl object-cover object-top" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Health Companion Section */}
      <section className="py-20 bg-gradient-to-br from-[#2C2A29] to-[#3D3B39] border-b border-[#EBE6DC] overflow-hidden">
        <div className="container max-w-5xl mx-auto px-4">
          <RevealSection direction="up">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              {/* Avatar column */}
              <div className="relative shrink-0 flex flex-col items-center">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-[#7E9A85]/20 blur-2xl scale-125" />
                <img
                  src={avatarUrl}
                  alt="Health Companion, AI health educator"
                  loading="lazy"
                  style={portraitPosition}
                  className="relative w-48 h-48 md:w-56 md:h-56 rounded-full object-cover object-[50%_22%] md:object-[50%_25%] border-4 border-[#7E9A85]/60 shadow-2xl"
                />
                {/* Online badge */}
                <div className="mt-3 flex items-center gap-1.5 bg-[#7E9A85]/20 border border-[#7E9A85]/40 rounded-full px-3 py-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-[#7E9A85]">AI Online — Available 24/7</span>
                </div>
              </div>

              {/* Text column */}
              <div className="flex-1 text-center md:text-left space-y-5">
                <div className="space-y-1">
                  <p className="text-[#7E9A85] text-sm font-semibold uppercase tracking-widest">Meet Your AI Health Guide</p>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
                    Health Companion
                  </h2>
                  <p className="text-white/60 text-base leading-relaxed max-w-lg">
                    Your personal AI health educator — trained on clinical lab science, nutrition research, and functional medicine. Ask anything about your labs, symptoms, or wellness goals.
                  </p>
                </div>

                {/* Mode cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: "🩺", label: "Health Assistant", desc: "General health questions & guidance" },
                    { icon: "🔬", label: "Lab Analyzer", desc: "Understand your biomarker results" },
                    { icon: "🥗", label: "Nutrition Coach", desc: "Evidence-based dietary advice" },
                  ].map((mode) => (
                    <div key={mode.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-left hover:bg-white/10 transition-colors">
                      <div className="text-xl mb-1">{mode.icon}</div>
                      <p className="text-white text-xs font-semibold leading-tight">{mode.label}</p>
                      <p className="text-white/50 text-[10px] leading-snug mt-0.5">{mode.desc}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link to="/medical-assistant" className="inline-flex items-center justify-center gap-2 bg-[#7E9A85] hover:bg-[#6A8571] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-[#7E9A85]/30">
                    <span>Chat with Health Companion</span>
                    <span>→</span>
                  </Link>
                  <button
                    onClick={() => {
                      // Open the widget
                      const btn = document.querySelector('[aria-label="Open Medical Assistant"]') as HTMLButtonElement;
                      btn?.click();
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm border border-white/20"
                  >
                    <span>💬 Quick Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* 1. "Start Here" Interactive Quiz Section */}
      <section id="quiz" className="py-20 bg-white border-b border-[#EBE6DC]">
        <div className="container max-w-4xl mx-auto px-4">
          <RevealSection direction="up" className="text-center space-y-4 mb-12">
            <Badge className="bg-[#D48C70]/10 hover:bg-[#D48C70]/10 text-[#D48C70] border-none px-3 py-1 rounded-full text-xs font-semibold">
              Interactive Symptom Quiz
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
              What do your symptoms suggest?
            </h2>
            <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
              Select the subtle signs your body is sending to find out which key laboratory biomarkers you should analyze.
            </p>
          </RevealSection>

          <Card className="border border-[#EBE6DC] shadow-lg rounded-3xl overflow-hidden bg-[#F9F6F0]/40">
            <CardContent className="p-8 sm:p-10">
              {quizStep === 0 && (
                <div className="space-y-8 text-center py-6">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="bg-[#7E9A85]/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-[#7E9A85]">
                      <HelpCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-serif font-semibold">Ready to map your bio-clues?</h3>
                    <p className="text-sm text-[#5C5A59]">
                      This quick 1-minute assessment analyzes your daily energy, mood, and physiological signals to recommend precise diagnostic pathways.
                    </p>
                  </div>
                  <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white px-8 py-6 rounded-2xl text-base font-semibold" onClick={() => setQuizStep(1)}>
                    Start Free Assessment
                  </Button>
                </div>
              )}

              {quizStep === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm font-semibold text-[#5C5A59] border-b border-[#EBE6DC] pb-3">
                    <span>Step 1 of 2: Select all that apply</span>
                    <span className="text-[#7E9A85]">{selectedSymptoms.length} Selected</span>
                  </div>
                  <div className="grid gap-3 pt-2">
                    {symptomsList.map((symptom, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSymptomToggle(symptom)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          selectedSymptoms.includes(symptom) 
                            ? "bg-white border-[#7E9A85] shadow-sm text-[#2C2A29]" 
                            : "bg-white/50 border-[#EBE6DC] hover:border-[#7E9A85]/50 text-[#5C5A59]"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          selectedSymptoms.includes(symptom) ? "bg-[#7E9A85] border-[#7E9A85] text-white" : "border-[#C5C0B5]"
                        }`}>
                          {selectedSymptoms.includes(symptom) && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm font-medium">{symptom}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-6">
                    <Button variant="ghost" className="text-[#5C5A59] hover:bg-[#EBE6DC]/40 rounded-xl" onClick={resetQuiz}>
                      Reset
                    </Button>
                    <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white px-6 py-5 rounded-xl text-sm font-semibold flex items-center gap-2" onClick={runQuizAnalysis}>
                      <span>Analyze My Symptoms</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {quizStep === 2 && (
                <div className="text-center py-12 space-y-4">
                  <div className="relative w-12 h-12 mx-auto">
                    <RefreshCw className="w-12 h-12 text-[#7E9A85] animate-spin" />
                  </div>
                  <h4 className="text-lg font-semibold font-serif">Mapping biomarkers to clinical database...</h4>
                  <p className="text-xs text-[#5C5A59]">Analyzing clinical laboratory scientist guidelines & functional ranges</p>
                </div>
              )}

              {quizStep === 3 && quizResult && (
                <div className="space-y-8">
                  <div className="text-center space-y-2 border-b border-[#EBE6DC] pb-6">
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#2C2A29]">Your Health Intelligence Report</h3>
                    <p className="text-sm text-[#5C5A59] max-w-md mx-auto">{quizResult.message}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#7E9A85] uppercase tracking-wider">Recommended Biomarker Focus:</h4>
                    <div className="grid gap-4">
                      {BIOMARKERS.filter(b => quizResult.recommendedBiomarkers.includes(b.name)).map((biomarker, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-[#EBE6DC] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none text-[10px] font-semibold">{biomarker.category}</Badge>
                              <h5 className="font-serif font-bold text-lg">{biomarker.name}</h5>
                            </div>
                            <p className="text-xs text-[#5C5A59] leading-relaxed max-w-xl">{biomarker.description}</p>
                          </div>
                          <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-[#EBE6DC] flex flex-row md:flex-col justify-between md:justify-center gap-2">
                            <div>
                              <p className="text-[10px] text-[#5C5A59] uppercase tracking-wider font-semibold">Standard Range</p>
                              <p className="text-sm font-semibold line-through text-[#9E9A90]">{biomarker.normalRange}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#D48C70] uppercase tracking-wider font-bold">Optimal Range</p>
                              <p className="text-sm font-bold text-[#D48C70]">{biomarker.optimalRange}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#7E9A85]/10 p-5 rounded-2xl border border-[#7E9A85]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="font-bold text-sm">Want to track these metrics over time?</p>
                      <p className="text-xs text-[#5C5A59]">Get our comprehensive, print-ready lab tracker PDF instantly.</p>
                    </div>
                    <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-xs font-semibold flex items-center gap-2 w-full sm:w-auto justify-center" onClick={() => { document.getElementById("newsletter")?.scrollIntoView({ behavior: "smooth" }); }}>
                      <Download className="w-4 h-4" />
                      <span>Download Free Tracker PDF</span>
                    </Button>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button variant="outline" className="border-[#EBE6DC] hover:bg-[#EBE6DC]/20 text-[#5C5A59] rounded-xl text-sm" onClick={resetQuiz}>
                      Retake Quiz
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. Interactive Lab Report Upload Section (AI Centerpiece) */}
      <section id="upload-demo" className="py-20 bg-[#F9F6F0] border-b border-[#EBE6DC]">
        <div className="container max-w-5xl mx-auto px-4">
          <RevealSection direction="up" className="text-center space-y-4 mb-12">
            <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
              AI Health Intelligence Core
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
              Try the AI Lab Report Scanner Demo
            </h2>
            <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
              Experience how our platform automatically parses your PDF, JPG, or text lab results and maps standard markers to functional medicine guidelines.
            </p>
          </RevealSection>

          <div className="grid lg:grid-cols-12 gap-12 items-stretch">
            {/* Left: Upload Interaction Area */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <Card className="border border-[#EBE6DC] shadow-md rounded-3xl bg-white p-6 sm:p-8 flex-grow flex flex-col justify-center">
                {uploadStep === "idle" && (
                  <div className="space-y-6 text-center py-8">
                    <div 
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-[#C5C0B5] hover:border-[#7E9A85] rounded-2xl p-8 cursor-pointer transition-all duration-200 bg-[#F9F6F0]/30 hover:bg-[#7E9A85]/5 flex flex-col items-center justify-center gap-4"
                    >
                      <div className="bg-[#7E9A85]/15 w-12 h-12 rounded-full flex items-center justify-center text-[#7E9A85]">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">Upload Your Lab Report</p>
                        <p className="text-xs text-[#9E9A90]">Supports PDF, JPG, PNG or TXT files</p>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".pdf,.jpg,.jpeg,.png,.txt" 
                      className="hidden" 
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-[#9E9A90] font-semibold">
                      <ShieldCheck className="w-4 h-4 text-[#7E9A85]" />
                      <span>HIPAA-aligned & 100% Secure Local Parsing</span>
                    </div>
                  </div>
                )}

                {uploadStep === "scanning" && (
                  <div className="text-center py-12 space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <RefreshCw className="w-16 h-16 text-[#7E9A85] animate-spin" />
                    </div>
                    <h4 className="text-lg font-semibold font-serif">Scanning and Extracting Lab Report...</h4>
                    <p className="text-xs text-[#9E9A90]">Parsing document text, units, and biomarker levels</p>
                    <div className="max-w-xs mx-auto pt-2">
                      <Progress value={66} className="h-1.5 bg-[#EBE6DC]" />
                    </div>
                  </div>
                )}

                {uploadStep === "parsed" && (
                  <div className="space-y-6 py-4">
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>AI analysis complete: {uploadedFile}</span>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#7E9A85] uppercase tracking-wider">Biomarkers Analyzed ({parsedBiomarkers.length}):</h4>
                      <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                        {parsedBiomarkers.map((b, i) => (
                          <div key={i} className={`p-3 border rounded-xl flex justify-between items-center text-xs ${b.statusColor}`}>
                            <span className="font-bold">{b.name}: {b.value} {b.unit || ''}</span>
                            <span className="font-semibold">{b.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        className="flex-grow bg-[#7E9A85] hover:bg-[#6A8571] text-white py-5 rounded-xl text-xs font-semibold"
                        onClick={() => setUploadStep("insights")}
                      >
                        View Full AI Insights
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-[#EBE6DC] hover:bg-[#F5F1E9] text-xs font-semibold rounded-xl"
                        onClick={() => {
                          setUploadedFile(null);
                          setUploadStep("idle");
                          setAiAnalysisResult(null);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}

                {uploadStep === "insights" && (
                  <div className="space-y-6 py-4">
                    {aiAnalysisResult && (
                      <>
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-[#7E9A85] uppercase tracking-wider">Overall Assessment:</h4>
                          <p className="text-xs text-[#5C5A59] leading-relaxed p-3 bg-[#F9F6F0] rounded-xl border border-[#EBE6DC]">{aiAnalysisResult.overallAssessment}</p>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-[#7E9A85] uppercase tracking-wider">Key Findings:</h4>
                          <div className="space-y-2">
                            {aiAnalysisResult.keyFindings.map((finding: string, i: number) => (
                              <div key={i} className="flex gap-2 text-xs text-[#5C5A59]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#7E9A85] shrink-0 mt-0.5" />
                                <span>{finding}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-[#D48C70] uppercase tracking-wider">Discuss with Your Doctor:</h4>
                          <div className="space-y-2">
                            {aiAnalysisResult.doctorDiscussionPoints.map((point: string, i: number) => (
                              <div key={i} className="flex gap-2 text-xs text-[#5C5A59]">
                                <FileText className="w-3.5 h-3.5 text-[#D48C70] shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-[#9E9A90] italic border-t border-[#EBE6DC] pt-3">{aiAnalysisResult.disclaimer}</p>
                      </>
                    )}
                    <div className="flex gap-3">
                      <Button 
                        className="flex-grow bg-[#7E9A85] hover:bg-[#6A8571] text-white py-5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                        onClick={() => setUploadStep("parsed")}
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Back to Biomarkers</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-[#EBE6DC] hover:bg-[#F5F1E9] text-xs font-semibold rounded-xl"
                        onClick={() => {
                          setUploadedFile(null);
                          setUploadStep("idle");
                          setAiAnalysisResult(null);
                        }}
                      >
                        New Report
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Simulated Platform Dashboard Screenshot Mockup */}
            <div className="lg:col-span-7">
              <div className="bg-[#2C2A29] text-white p-6 rounded-3xl border border-[#3D3A39] shadow-xl space-y-6 relative overflow-hidden">
                {/* Simulated browser window header */}
                <div className="flex items-center justify-between border-b border-[#3D3A39] pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D48C70]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7E9A85]"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#A39EBA]"></div>
                  </div>
                  <span className="text-[10px] text-[#9E9A90] font-mono tracking-wider">thepatientscompass.com/dashboard</span>
                  <div className="w-4"></div>
                </div>

                {/* Simulated Dashboard Content */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#7E9A85] font-bold uppercase tracking-wider">Patient Portal Mockup</span>
                      <h3 className="text-xl font-serif font-bold text-white">Your Health Intelligence Dashboard</h3>
                    </div>
                    <Badge className="bg-[#7E9A85]/20 text-[#7E9A85] border border-[#7E9A85]/30">Active System</Badge>
                  </div>

                  {/* Trend Graph Simulator */}
                  <div className="bg-[#3D3A39] p-5 rounded-2xl border border-[#4E4B4A] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#C5C0B5]">Ferritin Trend Over 12 Months</span>
                      <span className="text-xs text-[#7E9A85] font-bold">Goal: 50 - 100 ng/mL</span>
                    </div>
                    {/* Simulated SVG Graph */}
                    <div className="h-28 flex items-end justify-between gap-2 pt-4 relative">
                      {/* Grid Lines */}
                      <div className="absolute inset-x-0 top-0 h-px bg-[#4E4B4A]/40"></div>
                      <div className="absolute inset-x-0 top-1/2 h-px bg-[#4E4B4A]/40"></div>
                      <div className="absolute inset-x-0 bottom-0 h-px bg-[#4E4B4A]/40"></div>
                      
                      {/* Optimal range overlay block */}
                      <div className="absolute inset-x-0 bottom-1/3 top-1/3 bg-[#7E9A85]/5 border-y border-dashed border-[#7E9A85]/20 flex items-center justify-center">
                        <span className="text-[9px] text-[#7E9A85] font-semibold tracking-widest uppercase">Optimal Wellness Zone</span>
                      </div>

                      {/* Data Points */}
                      <div className="flex-1 flex flex-col items-center gap-1 z-10">
                        <span className="text-[10px] text-[#D48C70] font-bold">18</span>
                        <div className="w-3 bg-[#D48C70] rounded-t-sm h-8"></div>
                        <span className="text-[9px] text-[#9E9A90] font-medium">Jan</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1 z-10">
                        <span className="text-[10px] text-[#D48C70] font-bold">24</span>
                        <div className="w-3 bg-[#D48C70] rounded-t-sm h-11"></div>
                        <span className="text-[9px] text-[#9E9A90] font-medium">Apr</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1 z-10">
                        <span className="text-[10px] text-[#7E9A85] font-bold">52</span>
                        <div className="w-3 bg-[#7E9A85] rounded-t-sm h-20"></div>
                        <span className="text-[9px] text-[#9E9A90] font-medium">Jul</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1 z-10">
                        <span className="text-[10px] text-[#7E9A85] font-bold">68</span>
                        <div className="w-3 bg-[#7E9A85] rounded-t-sm h-24"></div>
                        <span className="text-[9px] text-[#9E9A90] font-medium">Oct</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual before / after interpretation block */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#3D3A39] p-4 rounded-xl border border-[#4E4B4A] space-y-1">
                      <span className="text-[9px] text-[#9E9A90] font-bold uppercase tracking-wider">Before (Standard Portal)</span>
                      <p className="font-bold text-white">Ferritin: 18 ng/mL</p>
                      <p className="text-[#D48C70] font-semibold">"Normal — No action needed"</p>
                    </div>
                    <div className="bg-[#7E9A85]/10 p-4 rounded-xl border border-[#7E9A85]/20 space-y-1">
                      <span className="text-[9px] text-[#7E9A85] font-bold uppercase tracking-wider">After (The Patient's Compass)</span>
                      <p className="font-bold text-[#7E9A85]">Ferritin: 18 ng/mL</p>
                      <p className="text-emerald-400 font-bold">"Suboptimal — Fatigue Link Detected"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Range Slider & Biomarkers */}
      <section id="biomarkers" className="py-20 bg-white border-b border-[#EBE6DC]">
        <div className="container max-w-6xl mx-auto px-4">
          <RevealSection direction="up" className="text-center space-y-4 mb-16">
            <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
              Interactive Functional Ranges
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
              Normal Ranges vs. Optimal Wellness Zones
            </h2>
            <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
              Standard clinical ranges only flag disease. Our functional medicine guidelines pinpoint early subclinical shifts before they become chronic conditions.
            </p>
          </RevealSection>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left: Interactive Range Visualizer */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-[#EBE6DC] shadow-md rounded-3xl bg-white p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none text-[10px] font-semibold">{activeBiomarker.category}</Badge>
                    <h3 className="text-2xl font-serif font-bold">{activeBiomarker.name}</h3>
                  </div>
                  <p className="text-sm text-[#5C5A59] leading-relaxed">{activeBiomarker.description}</p>
                </div>

                {/* Range Slider Tool */}
                <div className="space-y-6 bg-[#F9F6F0]/50 p-6 rounded-2xl border border-[#EBE6DC]/60">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Simulated Lab Value</span>
                    <span className="text-2xl font-serif font-bold text-[#2C2A29]">{userSliderVal} <span className="text-xs font-sans text-[#5C5A59]">ng/mL</span></span>
                  </div>

                  <div className="space-y-2">
                    <input 
                      type="range" 
                      min="5" 
                      max="160" 
                      value={userSliderVal}
                      onChange={(e) => setUserSliderVal(Number(e.target.value))}
                      className="w-full h-2 bg-[#EBE6DC] rounded-lg appearance-none cursor-pointer accent-[#7E9A85]"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-[#9E9A90] uppercase tracking-wider">
                      <span>5 (Very Low)</span>
                      <span>50 (Optimal Start)</span>
                      <span>100 (Optimal End)</span>
                      <span>160 (Very High)</span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className={`p-4 rounded-xl border text-center font-semibold text-sm transition-all duration-300 ${sliderStatus.color}`}>
                    {sliderStatus.label}
                  </div>
                </div>

                {/* Optimal vs Standard comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#EBE6DC] space-y-1">
                    <span className="text-[10px] text-[#5C5A59] uppercase tracking-wider font-semibold">Standard Lab Range</span>
                    <p className="text-lg font-serif font-bold text-[#5C5A59]">{activeBiomarker.normalRange}</p>
                    <p className="text-[10px] text-[#9E9A90]">Only flags severe disease or clinical deficiency.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#D48C70]/30 space-y-1">
                    <span className="text-[10px] text-[#D48C70] uppercase tracking-wider font-bold">Optimal Functional Range</span>
                    <p className="text-lg font-serif font-bold text-[#D48C70]">{activeBiomarker.optimalRange}</p>
                    <p className="text-[10px] text-[#D48C70]/80">Optimized for daily vitality and early longevity prevention.</p>
                  </div>
                </div>

                {/* Suboptimal symptoms box */}
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-800">Common Symptoms When Suboptimal:</span>
                    <p className="text-xs text-amber-700 leading-relaxed">{activeBiomarker.symptomsSuboptimal}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Biomarkers List selector */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-bold text-[#7E9A85] uppercase tracking-wider mb-2">Select a Biomarker to Analyze:</h3>
              <div className="grid gap-3">
                {BIOMARKERS.map((biomarker, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      setActiveBiomarker(biomarker);
                      if (biomarker.name.includes("Ferritin")) setUserSliderVal(35);
                      if (biomarker.name.includes("Thyroid")) setUserSliderVal(3.2);
                      if (biomarker.name.includes("HbA1c")) setUserSliderVal(5.5);
                      if (biomarker.name.includes("CRP")) setUserSliderVal(2.1);
                      if (biomarker.name.includes("ALT")) setUserSliderVal(32);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 ${
                      activeBiomarker.name === biomarker.name 
                        ? "bg-white border-[#7E9A85] shadow-md translate-x-1" 
                        : "bg-[#F9F6F0]/40 border-[#EBE6DC] hover:bg-white/80"
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#5C5A59] font-semibold uppercase tracking-wider">{biomarker.category}</span>
                      <h4 className="font-serif font-bold text-base text-[#2C2A29]">{biomarker.name}</h4>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      activeBiomarker.name === biomarker.name ? "text-[#7E9A85] translate-x-0.5" : "text-[#C5C0B5]"
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Doctor's Letter Generator */}
      <section id="letter" className="w-full overflow-x-clip py-20 bg-[#F9F6F0] border-b border-[#EBE6DC]">
        <div className="container max-w-5xl mx-auto px-4 min-w-0">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: Input parameters */}
            <RevealSection direction="left" className="min-w-0 lg:col-span-5 space-y-6">
              <Badge className="bg-[#A39EBA]/10 hover:bg-[#A39EBA]/10 text-[#A39EBA] border-none px-3 py-1 rounded-full text-xs font-semibold">
                Physician-Prep Systems
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
                Interactive Doctor's Letter Generator
              </h2>
              <p className="text-base text-[#5C5A59] leading-relaxed">
                Most clinical visits last only 15 minutes. Use our interactive tool to build a concise, professional letter for your next doctor's visit, highlighting your biomarker concerns in language physicians trust.
              </p>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Your Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sarah Jenkins"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#EBE6DC] bg-white focus:border-[#7E9A85] focus:outline-none text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Primary Biomarker of Concern</label>
                  <select 
                    value={concernBiomarker}
                    onChange={(e) => setConcernBiomarker(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#EBE6DC] bg-white focus:border-[#7E9A85] focus:outline-none text-sm font-medium"
                  >
                    {BIOMARKERS.map((b, idx) => (
                      <option key={idx} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Your Specific Symptoms</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Chronic afternoon fatigue, cold hands and feet, unexplained sluggishness."
                    value={userSymptomsText}
                    onChange={(e) => setUserSymptomsText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#EBE6DC] bg-white focus:border-[#7E9A85] focus:outline-none text-sm font-medium resize-none"
                  />
                </div>

                <Button 
                  className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white py-6 rounded-2xl font-semibold flex items-center justify-center gap-2"
                  onClick={() => {
                    if (!patientName || !userSymptomsText) {
                      toast.error("Please fill in your name and symptoms first.");
                      return;
                    }
                    setIsLetterGenerated(true);
                    toast.success("Doctor's Letter generated successfully!");
                  }}
                >
                  <FileText className="w-5 h-5" />
                  <span>Generate Custom Letter</span>
                </Button>
              </div>
            </RevealSection>

            {/* Right: Printable Letter Preview */}
            <RevealSection direction="right" delay={150} className="min-w-0 lg:col-span-7">
              <div className="bg-[#EBE6DC]/40 p-4 rounded-3xl border border-[#EBE6DC] shadow-inner relative">
                <div className="absolute top-6 right-6 flex gap-2 z-10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-[#EBE6DC] hover:bg-[#F5F1E9] text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                    onClick={handleDownloadPDF}
                    disabled={!isLetterGenerated}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white border-[#EBE6DC] hover:bg-[#F5F1E9] text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                    onClick={handlePrintLetter}
                    disabled={!isLetterGenerated}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Letter</span>
                  </Button>
                </div>

                {/* Paper sheet */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EBE6DC] shadow-sm min-h-[420px] flex flex-col justify-between font-serif relative overflow-hidden">
                  {!isLetterGenerated ? (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="bg-[#A39EBA]/15 w-12 h-12 rounded-full flex items-center justify-center text-[#A39EBA]">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <p className="font-bold text-lg text-[#2C2A29]">Generate Your Letter</p>
                        <p className="text-xs text-[#5C5A59] font-sans">Fill in the fields on the left to live-preview your professional prep-sheet.</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-6 text-sm text-[#2C2A29] leading-relaxed">
                    <div className="border-b border-[#EBE6DC] pb-4 space-y-1 font-sans text-xs text-[#5C5A59] font-medium uppercase tracking-wider">
                      <p>The Patient's Compass — Physician Consultation Prep</p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-4">
                      <p>Dear Doctor,</p>
                      <p>
                        I am writing to prepare for our upcoming clinical consultation. To help maximize our limited time together, I have compiled my current symptoms and a specific laboratory biomarker concern based on clinical laboratory science guidelines.
                      </p>
                      <p>
                        <strong>Patient Name:</strong> {patientName || "[Your Name]"} <br />
                        <strong>Biomarker Focus:</strong> {concernBiomarker} <br />
                        <strong>Reported Symptoms:</strong> {userSymptomsText || "[Your symptoms]"}
                      </p>
                      <p>
                        Based on evidence-backed health optimization frameworks, while my upcoming lab results may fall within standard pathological "normal" reference ranges, I am interested in evaluating if they sit within the <strong>optimal functional medicine wellness zone</strong>.
                      </p>
                      <p>
                        <strong>Key Questions I'd Like to Discuss:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-2 text-xs font-sans text-[#5C5A59] font-medium">
                        <li>Could my reported symptoms correlate with a suboptimal level of {concernBiomarker}?</li>
                        <li>What are your thoughts on tracking my levels of this marker over the next 3 to 6 months?</li>
                        <li>Are there any safe, evidence-based lifestyle or nutritional adjustments we can initiate to optimize this marker?</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-[#EBE6DC] pt-4 mt-6 flex justify-between items-center text-[10px] font-sans text-[#9E9A90] uppercase tracking-wider font-semibold">
                    <span>Educational Support Prep Sheet</span>
                    <span>The Patient's Compass</span>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 5. Dedicated Authority & Credibility Section */}
      <section id="authority" className="py-20 bg-white border-b border-[#EBE6DC]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: Author Image & Credentials */}
            <RevealSection direction="left" className="lg:col-span-5 flex justify-center">
              <div className="relative max-w-sm w-full">
                <div className="absolute -inset-4 bg-[#7E9A85]/10 rounded-full blur-3xl -z-10"></div>
                <div className="bg-white p-4 rounded-3xl shadow-lg border border-[#EBE6DC]">
                  <img 
                    src={IMAGES.author} 
                    alt="Patients Compass founder portrait" 
                    loading="lazy"
                    className="w-full h-80 object-cover object-[50%_22%] sm:object-[50%_24%] lg:object-[50%_26%] rounded-2xl mb-4"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="text-center space-y-1">
                    <h4 className="font-serif font-bold text-xl">Sonya M.</h4>
                    <p className="text-xs text-[#7E9A85] font-semibold uppercase tracking-wider">Clinical Laboratory Scientist</p>
                    <p className="text-[10px] text-[#9E9A90] font-medium">Founder, The Patient's Compass Method™</p>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Right: Authority Text & Mission */}
            <RevealSection direction="right" delay={150} className="lg:col-span-7 space-y-6">
              <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
                Expert Authority
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
                Clinical Expertise You Can Trust
              </h2>
              <div className="space-y-4 text-sm text-[#5C5A59] leading-relaxed">
                <p>
                  As a certified <strong>Clinical Laboratory Scientist</strong> with over two decades of hands-on experience in diagnostic medicine, I have spent my career behind the microscope analyzing blood chemistry. I know exactly how reference ranges are calculated, and more importantly, how they are misunderstood.
                </p>
                <p>
                  Standard "normal" lab ranges are calculated using a statistical average of the population. But here is the problem: <em>the average person getting lab work done is not necessarily healthy.</em>
                </p>
                <p>
                  I founded <strong>The Patient's Compass Health Intelligence System</strong> to translate clinical, complex laboratory data into warm, actionable wellness frameworks. We bridge the gap between diagnostic science and functional medicine, giving you the literacy to advocate for your health.
                </p>
              </div>

              {/* Credential badges */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#EBE6DC]">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#7E9A85] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-sm text-[#2C2A29]">CLS Certified</h5>
                    <p className="text-xs text-[#9E9A90]">20+ years medical laboratory experience.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-[#D48C70] shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-sm text-[#2C2A29]">Published Author</h5>
                    <p className="text-xs text-[#9E9A90]">2 best-selling health literacy manuals.</p>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* 6. Case Studies & Examples Section */}
      <section id="cases" className="py-20 bg-[#F9F6F0] border-b border-[#EBE6DC]">
        <div className="container max-w-6xl mx-auto px-4">
          <RevealSection direction="up" className="text-center space-y-4 mb-16">
            <Badge className="bg-[#D48C70]/10 hover:bg-[#D48C70]/10 text-[#D48C70] border-none px-3 py-1 rounded-full text-xs font-semibold">
              Clinical Examples
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
              Real Cases: Why "Normal" Isn't Always Optimal
            </h2>
            <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
              Explore real-world examples of how tracking functional ranges and subtle biomarker trends helped patients find answers.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-8">
            {CASE_STUDIES.map((caseStudy, idx) => (
              <Card key={idx} className="border border-[#EBE6DC] shadow-sm rounded-3xl bg-white p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none text-[10px] font-semibold mb-1">Case #{idx+1}</Badge>
                    <h3 className="font-serif font-bold text-xl text-[#2C2A29]">{caseStudy.title}</h3>
                  </div>

                  <div className="space-y-2 text-xs text-[#5C5A59] leading-relaxed">
                    <p><strong>Marker Analyzed:</strong> {caseStudy.biomarker}</p>
                    <p><strong>Clinical Normal:</strong> <span className="line-through text-[#9E9A90]">{caseStudy.clinicalNormal}</span></p>
                    <p><strong>Optimal Target:</strong> <span className="text-[#7E9A85] font-bold">{caseStudy.optimalWellness}</span></p>
                    <p><strong>Reported Symptoms:</strong> {caseStudy.symptoms}</p>
                    <p className="pt-2 border-t border-[#EBE6DC]"><strong>Resolution:</strong> {caseStudy.resolution}</p>
                  </div>
                </div>

                <div className="bg-[#F9F6F0] p-4 rounded-2xl border border-[#EBE6DC]/60 italic text-xs text-[#5C5A59] relative">
                  <span className="absolute top-2 left-2 text-2xl text-[#7E9A85]/20 font-serif leading-none">“</span>
                  <p className="pl-4">{caseStudy.quote}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Ecosystem & Books Funnel */}
      <section className="py-20 bg-white border-b border-[#EBE6DC]">
        <div className="container max-w-6xl mx-auto px-4">
          <RevealSection direction="up" className="text-center space-y-4 mb-16">
            <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
              The Health Intelligence Ecosystem
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
              The Core Educational Modules
            </h2>
            <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
              Our books are not standalone products — they are modular pathways within the larger Patient's Compass Health Intelligence System.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Book 1 */}
            <Card className="border border-[#EBE6DC] shadow-md rounded-3xl bg-white p-6 sm:p-8 space-y-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-[#7E9A85]/10 text-[#7E9A85] w-12 h-12 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-[#7E9A85] uppercase tracking-wider font-bold">Module 1: General Labs</span>
                  <h3 className="text-2xl font-serif font-bold">THE PATIENT’S COMPASS</h3>
                  <p className="text-xs text-[#5C5A59] italic">Understand Your Blood Tests, Track Hidden Health Clues, and Ask Better Questions</p>
                  <p className="text-sm text-[#5C5A59] leading-relaxed pt-2">
                    The ultimate handbook for demystifying standard lab panels. Learn the exact science of blood biomarkers, understand the difference between normal and optimal, and take full control of your health diagnostics.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white py-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" onClick={() => window.open(withAmazonTag("https://www.amazon.com/dp/B0H1N9N7H8"), "_blank")}>
                  <span>Order on Amazon</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full border-[#EBE6DC] hover:bg-[#F5F1E9] text-xs font-semibold rounded-xl" onClick={() => {
                  setActiveExcerptIdx(0);
                  document.getElementById("excerpt-previewer")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  Read Sample Chapter
                </Button>
              </div>
            </Card>

            {/* Book 2 */}
            <Card className="border border-[#EBE6DC] shadow-md rounded-3xl bg-white p-6 sm:p-8 space-y-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-[#D48C70]/10 text-[#D48C70] w-12 h-12 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-[#D48C70] uppercase tracking-wider font-bold">Module 2: Chronic Disease</span>
                  <h3 className="text-2xl font-serif font-bold">Your Chronic Disease Lab Guide</h3>
                  <p className="text-xs text-[#5C5A59] italic">Tracking What Matters for Long-Term Health Using The Patient’s Compass Method™</p>
                  <p className="text-sm text-[#5C5A59] leading-relaxed pt-2">
                    A specialized manual for patients managing long-term metabolic, cardiovascular, or hormonal conditions. Includes custom printable trackers, symptom maps, and actionable wellness frameworks.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Button className="w-full bg-[#D48C70] hover:bg-[#C27A5B] text-white py-5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" onClick={() => window.open(withAmazonTag("https://www.amazon.com/s?k=the+patients+compass+Sonya+M+lab+results"), "_blank")}>
                  <span>Explore on Amazon</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full border-[#EBE6DC] hover:bg-[#F5F1E9] text-xs font-semibold rounded-xl" onClick={() => {
                  setActiveExcerptIdx(1);
                  document.getElementById("excerpt-previewer")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  Read Sample Chapter
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Book Excerpt Previewer */}
      <section id="excerpt-previewer" className="py-20 bg-[#F9F6F0] border-b border-[#EBE6DC]">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
              Interactive Previewer
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
              Read Sample Chapters Directly
            </h2>
            <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
              Get an instant preview of our expert-backed health literacy guides. Select a book below to begin reading.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left: Book Selectors */}
            <div className="lg:col-span-4 space-y-3">
              {BOOK_EXCERPTS.map((excerpt, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveExcerptIdx(idx)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col gap-2 ${
                    activeExcerptIdx === idx 
                      ? "bg-white border-[#7E9A85] shadow-md" 
                      : "bg-[#F9F6F0]/40 border-[#EBE6DC] hover:bg-white/80"
                  }`}
                >
                  <span className="text-[10px] text-[#7E9A85] font-bold uppercase tracking-wider">{excerpt.chapterNumber}</span>
                  <h4 className="font-serif font-bold text-base text-[#2C2A29] leading-snug">{excerpt.chapterTitle}</h4>
                  <p className="text-xs text-[#5C5A59] font-medium italic">{excerpt.bookTitle}</p>
                </div>
              ))}
            </div>

            {/* Right: Chapter Reader Screen */}
            <div className="lg:col-span-8">
              <Card className="border border-[#EBE6DC] shadow-lg rounded-3xl bg-white p-8 sm:p-10 space-y-6 relative overflow-hidden">
                {/* Book styling overlay */}
                <div className="absolute top-0 inset-x-0 h-2 bg-[#7E9A85]"></div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-[#EBE6DC] pb-4">
                    <div>
                      <span className="text-xs text-[#7E9A85] font-bold uppercase tracking-wider">{BOOK_EXCERPTS[activeExcerptIdx].chapterNumber}</span>
                      <h3 className="text-2xl font-serif font-bold text-[#2C2A29] mt-1">{BOOK_EXCERPTS[activeExcerptIdx].chapterTitle}</h3>
                      <p className="text-xs text-[#9E9A90] italic mt-0.5">{BOOK_EXCERPTS[activeExcerptIdx].bookTitle}</p>
                    </div>
                  </div>

                  {/* Chapter Paragraphs */}
                  <div className="space-y-4 font-serif text-sm text-[#4E4B4A] leading-relaxed">
                    {BOOK_EXCERPTS[activeExcerptIdx].paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>

                  {/* Key Takeaways Highlight Box */}
                  <div className="bg-[#7E9A85]/5 p-5 rounded-2xl border border-[#7E9A85]/15 space-y-3">
                    <h5 className="font-sans font-bold text-xs text-[#7E9A85] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Chapter Takeaways</span>
                    </h5>
                    <ul className="space-y-2 text-xs font-sans text-[#5C5A59] font-medium">
                      {BOOK_EXCERPTS[activeExcerptIdx].keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#7E9A85] shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Email Capture Newsletter Lead Magnet */}
      <section id="newsletter" className="py-20 bg-[#F9F6F0] border-b border-[#EBE6DC]">
        <div className="container max-w-4xl mx-auto px-4">
          <RevealSection direction="up">
          <Card className="border border-[#7E9A85]/30 shadow-xl rounded-3xl overflow-hidden bg-white relative">
            {/* Subtle decorative background blob */}
            <div className="absolute -top-12 -right-12 bg-[#7E9A85]/5 w-40 h-40 rounded-full blur-2xl"></div>
            
            <CardContent className="p-8 sm:p-12 grid md:grid-cols-12 gap-8 items-center relative z-10">
              <div className="md:col-span-7 space-y-4">
                <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Free Health Toolkit
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2A29]">
                  Get Your Free Biomarker & Lab Tracker PDF
                </h3>
                <p className="text-sm text-[#5C5A59] leading-relaxed">
                  Join 10,000+ patients using our certified Clinical Laboratory Scientist templates to track trends, log daily symptoms, and optimize their functional health.
                </p>
                <ul className="space-y-2 text-xs text-[#5C5A59] font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7E9A85]" />
                    <span>Printable 12-month trend tracking sheets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7E9A85]" />
                    <span>Symptoms correlation mapping guide</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#7E9A85]" />
                    <span>Optimal ranges cheat sheet for standard panels</span>
                  </li>
                </ul>
              </div>

              <div className="md:col-span-5 bg-[#F9F6F0] p-6 rounded-2xl border border-[#EBE6DC]">
                {!isSubscribed ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Your Best Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#9E9A90] absolute left-3 top-3.5" />
                        <input 
                          type="email" 
                          placeholder="e.g. sarah@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-3 rounded-xl border border-[#EBE6DC] bg-white focus:border-[#7E9A85] focus:outline-none text-xs font-medium"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white py-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                      disabled={emailSubscribeMutation.isPending}
                    >
                      {emailSubscribeMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileDown className="w-4 h-4" />
                      )}
                      <span>Get Free Tracker PDF</span>
                    </Button>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[#9E9A90] font-semibold">
                      <Lock className="w-3 h-3 text-[#7E9A85]" />
                      <span>Zero Spam. 100% Privacy Protected.</span>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Toolkit Sent!</p>
                      <p className="text-xs text-[#5C5A59]">Check your inbox shortly to download your printable files.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </RevealSection>
        </div>
      </section>

      {/* 9. Competitive Matrix Section */}
      <section id="comparison" className="py-20 bg-white border-b border-[#EBE6DC]">
        <div className="container max-w-6xl mx-auto px-4">
          <RevealSection direction="up" className="text-center space-y-4 mb-16">
            <Badge className="bg-[#7E9A85]/10 hover:bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
              Market Positioning
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2C2A29]">
              How We Position in the 2026 AI Health Landscape
            </h2>
            <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
              The Patient's Compass is uniquely positioned to bridge the gap between patient literacy, evidence-based books, and structured physician conversations.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPETITORS.map((competitor, idx) => (
              <Card 
                key={idx} 
                className={`border rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all duration-200 ${
                  competitor.name.includes("The Patient's Compass") 
                    ? "border-[#7E9A85] bg-[#7E9A85]/5 shadow-[#7E9A85]/10" 
                    : "border-[#EBE6DC] bg-white"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-serif font-bold text-xl text-[#2C2A29]">{competitor.name}</h3>
                    <Badge className={`text-[10px] font-bold border-none px-2.5 py-0.5 rounded-full ${
                      competitor.name.includes("The Patient's Compass") 
                        ? "bg-[#7E9A85] text-white" 
                        : "bg-[#EBE6DC] text-[#5C5A59]"
                    }`}>
                      {competitor.badge}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <p className="text-[#5C5A59] leading-relaxed"><strong className="text-[#2C2A29] font-semibold">Target Audience:</strong> {competitor.targetAudience}</p>
                    <p className="text-[#5C5A59] leading-relaxed"><strong className="text-[#2C2A29] font-semibold">Pricing:</strong> {competitor.pricingModel}</p>
                    <p className="text-[#5C5A59] leading-relaxed"><strong className="text-[#2C2A29] font-semibold">Privacy/Safety:</strong> {competitor.privacySafety}</p>
                  </div>

                  <div className="space-y-1.5 border-t border-[#EBE6DC] pt-4">
                    <p className="text-[10px] font-bold text-[#7E9A85] uppercase tracking-wider">Key Capabilities:</p>
                    <ul className="space-y-1 text-xs text-[#5C5A59] font-medium">
                      {competitor.keyFeatures.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#7E9A85] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border-t border-[#EBE6DC] pt-4 text-xs italic text-[#5C5A59] leading-relaxed">
                  {competitor.marketPositioning}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-20 bg-[#F9F6F0] border-b border-[#EBE6DC] overflow-hidden">
        <div className="container max-w-6xl mx-auto px-4">
          <RevealSection direction="up">
            <div className="flex items-end justify-between mb-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#7E9A85] text-sm font-semibold uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" />
                  <span>By Sonya M., CLS</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-serif font-bold text-[#2C2A29]">
                  Books That Educate &amp; Empower
                </h2>
                <p className="text-[#5C5A59] max-w-xl">
                  19+ titles spanning lab science, nutrition, wellness, children's health, and AI — written by a Clinical Laboratory Scientist with 20+ years of experience.
                </p>
              </div>
              <Link
                href="/books"
                className="hidden md:flex items-center gap-2 text-[#7E9A85] font-semibold hover:text-[#6A8571] transition-colors whitespace-nowrap"
              >
                View All 19 Books
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </RevealSection>

          {/* Horizontal scroll carousel */}
          <div className="relative">
            <div
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {[
                { id: "your-lab-tests", title: "Your Lab Tests", cover: "/manus-storage/your-lab-tests_B0GZ83WG53_82baabd8.jpg", url: "https://www.amazon.com/YOUR-LAB-TESTS-Understanding-Laboratory-ebook/dp/B0GZ83WG53", badge: "New" },
                { id: "patients-compass", title: "The Patient's Compass", cover: "/manus-storage/the-patient-s-compass_B0H1GZMB6K_2b45b9a1.jpg", url: "https://www.amazon.com/PATIENTS-COMPASS-Understand-Hidden-Questions-ebook/dp/B0H1GZMB6K", badge: "Featured" },
                { id: "ai-for-everyday-life", title: "AI for Everyday Life", cover: "/manus-storage/ai-for-everyday-life_B0GX2WRFBF_385d6be2.jpg", url: "https://www.amazon.com/Everyday-Life-Artificial-Intelligence-Productivity-ebook/dp/B0GX2WRFBF", badge: "New" },
                { id: "decode-blood-work-after-40", title: "Decode Your Blood Work After 40", cover: "/manus-storage/decode-your-blood-work-after-40_B0GZS1C6VR_1533b867.jpg", url: "https://www.amazon.com/Decode-Your-Blood-Work-After-ebook/dp/B0GZS1C6VR", badge: "Featured" },
                { id: "blood-test-knowledge-book", title: "Your Blood Test Knowledge Book", cover: "/manus-storage/your-blood-test-knowledge-book_B0GW62KNZZ_bd377673.jpg", url: "https://www.amazon.com/dp/B0GW62KNZZ", badge: "New" },
                { id: "bio-marker-buffet-seasonal", title: "Bio-Marker Buffet: Seasonal", cover: "/manus-storage/bio-marker-buffet-seasonal-cover_9aa8d634.jpg", url: "https://www.amazon.com/Bio-Marker-Buffet-Seasonal-Stabilize-Inflammation-ebook/dp/B0GX2X9KLG", badge: "Featured" },
                { id: "my-healthy-child", title: "My Healthy Child", cover: "/manus-storage/my-healthy-child_B0H14BP3FQ_8173c60e.jpg", url: "https://www.amazon.com/My-Healthy-Child-Sonya-M-ebook/dp/B0H14BP3FQ", badge: null },
                { id: "my-body-is-amazing", title: "MY BODY IS AMAZING!", cover: "/manus-storage/my-body-is-amazing_B0H2S2P494_0706c5d8.jpg", url: "https://www.amazon.com/MY-BODY-AMAZING-Magical-Introduction-ebook/dp/B0H2S2P494", badge: null },
              ].map((book, idx) => (
                <a
                  key={book.id}
                  href={withAmazonTag(book.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex-none w-44 snap-start"
                  style={{
                    animation: `wellness-card-in 450ms cubic-bezier(0.23,1,0.32,1) both`,
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  <div className="relative rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <img
                      src={book.cover}
                      alt={book.title}
                      loading="eager"
                      decoding="async"
                      className="w-full h-64 object-cover"
                    />
                    {book.badge && (
                      <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                        book.badge === "New"
                          ? "bg-[#D48C70] text-white"
                          : "bg-[#7E9A85] text-white"
                      }`}>
                        {book.badge}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <span className="text-white text-xs font-semibold leading-tight">{book.title}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#2C2A29] leading-tight line-clamp-2 group-hover:text-[#7E9A85] transition-colors">{book.title}</p>
                </a>
              ))}
            </div>
          </div>

          <RevealSection direction="up" delay={200}>
            <div className="mt-8 text-center md:hidden">
              <Link
                href="/books"
                className="inline-flex items-center gap-2 text-[#7E9A85] font-semibold hover:text-[#6A8571] transition-colors"
              >
                View All 19 Books
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer & Disclaimers */}
      <footer className="bg-[#2C2A29] text-[#EBE6DC] py-12 border-t border-[#3D3A39]">
        <div className="container max-w-6xl mx-auto px-4 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#3D3A39] pb-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#7E9A85] text-white p-2 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="font-bold text-lg tracking-tight text-white">The Patient's Compass</span>
                <p className="text-[10px] text-[#7E9A85] font-semibold tracking-wider uppercase">Health Intelligence System</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-[#C5C0B5]">
              <a href="#about" className="hover:text-white transition-colors">Ecosystem</a>
              <a href="#quiz" className="hover:text-white transition-colors">Symptom Quiz</a>
              <a href="#biomarkers" className="hover:text-white transition-colors">Optimal Ranges</a>
              <a href="#letter" className="hover:text-white transition-colors">Doctor Prep</a>
            </div>
          </div>

          {/* Regulatory Disclaimer Box */}
          <div className="bg-[#3D3A39] p-5 rounded-2xl border border-[#4E4B4A] flex gap-4">
            <ShieldCheck className="w-6 h-6 text-[#7E9A85] shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Educational Support & Compliance Disclaimer</span>
              <p className="text-xs text-[#C5C0B5] leading-relaxed">
                This platform is educational and informational only and is not intended to diagnose, treat, cure, or replace professional medical care. All information, interactive range visualizers, and generated physician letters are designed to support and optimize your relationship with your licensed healthcare provider, not replace it. Always consult with your doctor before initiating any diet, lifestyle, or supplement modifications.
              </p>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex justify-center gap-4 py-6 border-t border-[#3D3A39]">
            <a href="https://facebook.com/thepatientscompass" target="_blank" rel="noopener noreferrer" className="text-[#9E9A90] hover:text-[#7E9A85] transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://twitter.com/patientscompass" target="_blank" rel="noopener noreferrer" className="text-[#9E9A90] hover:text-[#7E9A85] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://instagram.com/thepatientscompass" target="_blank" rel="noopener noreferrer" className="text-[#9E9A90] hover:text-[#7E9A85] transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com/company/thepatientscompass" target="_blank" rel="noopener noreferrer" className="text-[#9E9A90] hover:text-[#7E9A85] transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="https://youtube.com/@thepatientscompass" target="_blank" rel="noopener noreferrer" className="text-[#9E9A90] hover:text-[#7E9A85] transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
          </div>

          {/* Legal & Support Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#9E9A90] border-t border-[#3D3A39] pt-6">
            <Link href="/faq"><span className="hover:text-white cursor-pointer transition-colors">FAQ</span></Link>
            <Link href="/support"><span className="hover:text-white cursor-pointer transition-colors">Help Center</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer transition-colors">Contact</span></Link>
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span></Link>
            {user?.role === "admin" && (
              <Link href="/admin/waitlist">
                <span className="hover:text-[#7E9A85] cursor-pointer transition-colors text-[#7E9A85]/60 flex items-center gap-1">
                  <span>⚙</span> Admin: Waitlist
                </span>
              </Link>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-[#9E9A90] uppercase tracking-wider font-semibold">
            <p>© {new Date().getFullYear()} The Patient's Compass Health Intelligence System. All rights reserved.</p>
            <p>Educational Content Only — Not Medical Advice</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
