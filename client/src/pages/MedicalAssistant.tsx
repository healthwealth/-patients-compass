import SEO from "@/components/SEO";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Mic,
  MicOff,
  Send,
  Trash2,
  Loader2,
  Stethoscope,
  FlaskConical,
  Salad,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Zap,
  ArrowLeft,
  ChevronRight,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Download,
  Copy,
  Check,
  FileText,
  Paperclip,
  X,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { exportChatTranscriptPDF } from "@/lib/pdfExport";
import { DocumentAttachmentControl } from "@/components/DocumentAttachmentControl";
import { useDocumentAttachment } from "@/hooks/useDocumentAttachment";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "health_assistant" | "lab_analyzer" | "nutrition_coach";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachmentName?: string;
  mode?: Mode;
  rating?: "up" | "down" | null;
}

// ─── Mode Config ──────────────────────────────────────────────────────────────

const MODES: {
  id: Mode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  greeting: string;
  description: string;
  suggestedPrompts: string[];
}[] = [
  {
    id: "health_assistant",
    label: "Health Assistant",
    shortLabel: "Health",
    icon: <Stethoscope className="w-5 h-5" />,
    color: "text-[#7E9A85]",
    bgColor: "bg-[#7E9A85]",
    borderColor: "border-[#7E9A85]",
    accentColor: "#7E9A85",
    greeting:
      "Hello! I'm your personal health education assistant. I can help you understand lab results, explain health concepts, or answer wellness questions — all in plain language. How can I help you today?",
    description: "Get clear, evidence-based answers to your health questions.",
    suggestedPrompts: [
      "What does a high CRP level mean?",
      "How can I improve my sleep quality?",
      "What are optimal vitamin D levels?",
    ],
  },
  {
    id: "lab_analyzer",
    label: "Lab Analyzer",
    shortLabel: "Lab",
    icon: <FlaskConical className="w-5 h-5" />,
    color: "text-[#A39EBA]",
    bgColor: "bg-[#A39EBA]",
    borderColor: "border-[#A39EBA]",
    accentColor: "#A39EBA",
    greeting:
      "Hello! I'm your lab result educator. Share your lab values and I'll help you understand what they mean, the difference between standard and optimal ranges, and what questions to ask your doctor.",
    description: "Understand your lab values and what they mean for your health.",
    suggestedPrompts: [
      "My TSH is 3.2 — is that optimal?",
      "What do my cholesterol numbers mean?",
      "Explain the difference between standard and functional ranges",
    ],
  },
  {
    id: "nutrition_coach",
    label: "Nutrition Coach",
    shortLabel: "Nutrition",
    icon: <Salad className="w-5 h-5" />,
    color: "text-[#D48C70]",
    bgColor: "bg-[#D48C70]",
    borderColor: "border-[#D48C70]",
    accentColor: "#D48C70",
    greeting:
      "Hello! I'm your nutrition coach. Tell me about your health goals or biomarker concerns and I'll provide evidence-based nutritional guidance to support your wellness journey.",
    description: "Evidence-based nutrition guidance tailored to your biomarkers.",
    suggestedPrompts: [
      "What foods support healthy iron levels?",
      "Best diet for reducing inflammation?",
      "How does nutrition affect thyroid function?",
    ],
  },
];

const FREE_DAILY_LIMIT = 3;

const AVATAR_URL =
  "/manus-storage/sonya-professional-portrait_c5acc8f2.webp";

// ─── TTS Helper ───────────────────────────────────────────────────────────────

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("google"))
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ─── Copy Button (full-page variant) ────────────────────────────────────────

function FullPageCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Response copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[10px] text-[#9E9A90] hover:text-[#7E9A85] transition-colors"
      title="Copy response"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-[#7E9A85]" />
          <span className="text-[#7E9A85]">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MedicalAssistant() {
  const { isAuthenticated } = useAuth();
  const assistantAppearance = trpc.assistantAppearance.get.useQuery();
  const avatarUrl = assistantAppearance.data?.url ?? AVATAR_URL;
  const portraitPosition = { objectPosition: `${assistantAppearance.data?.cropPositionX ?? 50}% ${assistantAppearance.data?.cropPositionY ?? 22}%` };
  const [activeMode, setActiveMode] = useState<Mode>("health_assistant");
  const [messages, setMessages] = useState<Record<Mode, Message[]>>({
    health_assistant: [],
    lab_analyzer: [],
    nutrition_coach: [],
  });
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [localQueriesUsed, setLocalQueriesUsed] = useState(0);
  const documentAttachment = useDocumentAttachment(isAuthenticated);
  const pendingAttachment = documentAttachment.attachment;

  const queryStatus = trpc.medicalAssistant.getQueryStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentMode = MODES.find((m) => m.id === activeMode)!;
  const currentMessages = messages[activeMode];

  const isPro = queryStatus.data?.isPro ?? false;
  const queriesUsed = isAuthenticated
    ? (queryStatus.data?.queriesUsed ?? 0)
    : localQueriesUsed;
  const queriesRemaining = isAuthenticated
    ? (queryStatus.data?.queriesRemaining ?? FREE_DAILY_LIMIT)
    : Math.max(0, FREE_DAILY_LIMIT - localQueriesUsed);
  const isLimitReached = !isPro && queriesRemaining === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [activeMode]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const interval = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const chatMutation = trpc.medicalAssistant.chat.useMutation({
    onSuccess: (data) => {
      const assistantMsg: Message = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data.content,
        mode: data.mode,
      };
      setMessages((prev) => ({
        ...prev,
        [activeMode]: [...prev[activeMode], assistantMsg],
      }));
      if (!isAuthenticated) {
        setLocalQueriesUsed((prev) => prev + 1);
      }
      if (isAuthenticated) {
        queryStatus.refetch();
      }
      if (ttsEnabled) {
        speakText(data.content);
      }
    },
    onError: (err) => {
      if (err.message?.startsWith("FREE_LIMIT_REACHED:")) {
        setShowUpgradePrompt(true);
        if (isAuthenticated) {
          queryStatus.refetch();
        } else {
          setLocalQueriesUsed(FREE_DAILY_LIMIT);
        }
        return;
      }
      toast.error(err.message || "Failed to get a response. Please try again.");
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if ((!trimmed && !pendingAttachment) || chatMutation.isPending) return;
      if (!isAuthenticated && localQueriesUsed >= FREE_DAILY_LIMIT) {
        setShowUpgradePrompt(true);
        return;
      }
      stopSpeech();
      setIsSpeaking(false);
      const userMsg: Message = {
        id: `${Date.now()}-user`,
        role: "user",
        content: trimmed || "Please explain this document in clear educational language.",
        attachmentName: pendingAttachment?.fileName,
      };
      const updatedMessages = [...currentMessages, userMsg];
      setMessages((prev) => ({ ...prev, [activeMode]: updatedMessages }));
      setInputText("");
      const historyForLLM = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      chatMutation.mutate({ mode: activeMode, messages: historyForLLM, attachment: pendingAttachment ?? undefined });
      documentAttachment.clear();
    },
    [activeMode, currentMessages, chatMutation, isAuthenticated, localQueriesUsed, pendingAttachment, documentAttachment]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const clearConversation = () => {
    stopSpeech();
    setMessages((prev) => ({ ...prev, [activeMode]: [] }));
    setShowUpgradePrompt(false);
  };

  const rateMessage = (msgId: string, rating: "up" | "down") => {
    setMessages((prev) => ({
      ...prev,
      [activeMode]: prev[activeMode].map((m) =>
        m.id === msgId ? { ...m, rating: m.rating === rating ? null : rating } : m
      ),
    }));
    toast.success(rating === "up" ? "Thanks for the feedback! 👍" : "Thanks — we'll use this to improve.");
  };

  const handleExportPDF = () => {
    const msgs = currentMessages.map((m) => ({ role: m.role, content: m.content }));
    const thumbsUp = currentMessages.filter((m) => m.rating === "up").length;
    const thumbsDown = currentMessages.filter((m) => m.rating === "down").length;
    exportChatTranscriptPDF(msgs, currentMode.label, {
      totalMessages: msgs.length,
      thumbsUp,
      thumbsDown,
    });
    toast.success("Session transcript saved as PDF");
  };

  const toggleTts = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (ttsEnabled) stopSpeech();
    setTtsEnabled((prev) => !prev);
  };

  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setInputText(transcript);
    };
    recognition.onend = () => {
      setIsRecording(false);
      setInputText((current) => {
        if (current.trim()) setTimeout(() => sendMessage(current), 100);
        return current;
      });
    };
    recognition.onerror = (event: any) => {
      setIsRecording(false);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error(`Voice recognition error: ${event.error}`);
      }
    };
    recognition.start();
  }, [isRecording, sendMessage]);

  const switchMode = (mode: Mode) => {
    stopSpeech();
    setActiveMode(mode);
    setInputText("");
    setShowUpgradePrompt(false);
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex flex-col">
      <SEO
        title="AI Medical Assistant"
        description="Ask questions about your lab results, symptoms, and health goals. Get AI-powered guidance to prepare for your doctor visit."
        path="/medical-assistant"
      />
      {/* Top nav bar */}
      <div className="bg-white border-b border-[#EBE6DC] px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-[#5C5A59] hover:text-[#2C2A29] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7E9A85] animate-pulse" />
          <span className="text-xs font-semibold text-[#7E9A85]">AI Assistant Online</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

        {/* ── Left Panel: Avatar + Info ───────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-[340px] xl:w-[400px] bg-white border-r border-[#EBE6DC] shrink-0 overflow-y-auto">
          {/* Avatar section */}
          <div className="relative bg-gradient-to-b from-[#EBF0EC] to-white px-8 pt-10 pb-6 flex flex-col items-center text-center">
            {/* Decorative ring with ping animation */}
            <div className="relative mb-5">
              {/* Outer ping ring */}
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{
                  background: `radial-gradient(circle, ${currentMode.accentColor} 0%, transparent 70%)`,
                  transform: "scale(1.2)",
                  animationDuration: "2.5s",
                }}
              />
              {/* Solid accent border ring */}
              <div
                className="absolute inset-0 rounded-full opacity-30 animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${currentMode.accentColor} 0%, transparent 70%)`,
                  transform: "scale(1.12)",
                }}
              />
              <img
                src={avatarUrl}
              alt="Health Companion, AI health educator"
                style={{ ...portraitPosition, boxShadow: `0 0 0 5px ${currentMode.accentColor}50, 0 20px 40px rgba(0,0,0,0.12)` }}
                className="w-44 h-44 xl:w-52 xl:h-52 rounded-full object-cover object-[50%_22%] sm:object-[50%_24%] lg:object-[50%_26%] shadow-xl border-4 border-white relative z-10"
              />
              {/* Online indicator dot */}
              <div className="absolute bottom-2 right-2 z-20 w-5 h-5 bg-[#7E9A85] rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            {/* AI Online badge */}
            <div className="flex items-center gap-1.5 bg-[#7E9A85]/10 border border-[#7E9A85]/20 rounded-full px-3 py-1 mb-3">
              <span className="w-2 h-2 bg-[#7E9A85] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-[#7E9A85] uppercase tracking-widest">AI Online</span>
            </div>

            <h1 className="text-xl font-serif font-bold text-[#2C2A29] mb-1">
              Health Companion
            </h1>
            <p className="text-sm text-[#7E9A85] font-semibold mb-2">
              AI Health Education Assistant
            </p>
            <p className="text-xs text-[#9E9A90] leading-relaxed max-w-[260px]">
              Built on 20+ years of Clinical Laboratory Science expertise. Here to educate, not diagnose.
            </p>
          </div>

          {/* Mode selector */}
          <div className="px-5 py-4 border-t border-[#EBE6DC]">
            <p className="text-[10px] font-bold text-[#9E9A90] uppercase tracking-widest mb-3">
              Choose Mode
            </p>
            <div className="space-y-2">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => switchMode(mode.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 border ${
                    activeMode === mode.id
                      ? `${mode.bgColor} text-white border-transparent shadow-sm`
                      : "bg-[#F9F6F0] text-[#5C5A59] border-[#EBE6DC] hover:border-[#D5D0C8] hover:bg-[#F3EFE8]"
                  }`}
                >
                  <div className={`shrink-0 ${activeMode === mode.id ? "text-white" : mode.color}`}>
                    {mode.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${activeMode === mode.id ? "text-white" : "text-[#2C2A29]"}`}>
                      {mode.label}
                    </div>
                    <div className={`text-xs truncate ${activeMode === mode.id ? "text-white/80" : "text-[#9E9A90]"}`}>
                      {mode.description}
                    </div>
                  </div>
                  {activeMode === mode.id && (
                    <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Usage / upgrade */}
          <div className="px-5 py-4 border-t border-[#EBE6DC]">
            {isPro ? (
              <div className="flex items-center gap-2 bg-[#7E9A85]/10 rounded-xl px-4 py-3">
                <Zap className="w-4 h-4 text-[#7E9A85] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#7E9A85]">Pro Member</div>
                  <div className="text-[10px] text-[#9E9A90]">Unlimited daily queries</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#9E9A90] uppercase tracking-widest">
                    Daily Usage
                  </span>
                  <span className="text-[10px] text-[#9E9A90]">
                    {queriesUsed}/{FREE_DAILY_LIMIT} queries
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: FREE_DAILY_LIMIT }, (_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-colors ${
                        i < queriesUsed ? "bg-[#D48C70]" : "bg-[#EBE6DC]"
                      }`}
                    />
                  ))}
                </div>
                {isLimitReached ? (
                  <Link
                    to="/pricing"
                    className="flex items-center justify-center gap-2 w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Upgrade to Pro — Unlimited
                  </Link>
                ) : (
                  <p className="text-[10px] text-[#9E9A90] text-center">
                    {queriesRemaining} {queriesRemaining === 1 ? "query" : "queries"} remaining today
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="px-5 py-4 border-t border-[#EBE6DC] mt-auto">
            <div className="flex items-start gap-2 bg-[#FFF8F5] border border-[#EBE6DC] rounded-xl p-3">
              <Shield className="w-3.5 h-3.5 text-[#D48C70] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#9E9A90] leading-relaxed">
                <strong className="text-[#5C5A59]">Educational use only.</strong> This AI provides health education, not medical diagnosis or treatment. Always consult a licensed healthcare provider for personal medical decisions.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Chat ───────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F9F6F0]">

          {/* Chat header */}
          <div className="bg-white border-b border-[#EBE6DC] px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile avatar thumbnail */}
              <img
                src={avatarUrl}
                alt="Health Companion, AI health educator"
                style={{ ...portraitPosition, boxShadow: `0 0 0 2px ${currentMode.accentColor}40` }}
                className="w-9 h-9 rounded-full object-cover object-[50%_22%] border-2 border-white shadow-sm lg:hidden"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#2C2A29]">
                    Health Companion
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${currentMode.bgColor}`}
                  >
                    {currentMode.label}
                  </span>
                </div>
                <p className="text-[10px] text-[#9E9A90]">
                  AI Health Education Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Export PDF button — only shown when there are messages */}
              {currentMessages.length > 0 && (
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#7E9A85] hover:bg-[#7E9A85]/10 transition-colors border border-[#7E9A85]/30"
                  title="Export chat transcript as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              )}
              {/* TTS toggle */}
              <button
                onClick={toggleTts}
                className={`p-2 rounded-lg transition-colors ${
                  ttsEnabled
                    ? "bg-[#7E9A85]/15 text-[#7E9A85]"
                    : "text-[#9E9A90] hover:bg-[#EBE6DC] hover:text-[#5C5A59]"
                }`}
                title={ttsEnabled ? "Disable voice readout" : "Enable voice readout"}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              {/* Clear */}
              <button
                onClick={clearConversation}
                className="p-2 rounded-lg text-[#9E9A90] hover:bg-[#EBE6DC] hover:text-[#5C5A59] transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile mode tabs */}
          <div className="flex border-b border-[#EBE6DC] bg-white lg:hidden shrink-0">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => switchMode(mode.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all duration-150 border-b-2 ${
                  activeMode === mode.id
                    ? `${mode.color} border-current bg-[#F9F6F0]`
                    : "text-[#9E9A90] border-transparent hover:text-[#5C5A59]"
                }`}
              >
                {mode.icon}
                <span>{mode.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* TTS status bar */}
          {ttsEnabled && (
            <div
              className={`flex items-center justify-between px-4 py-1.5 text-[10px] font-semibold shrink-0 ${
                isSpeaking
                  ? "bg-[#7E9A85]/15 text-[#7E9A85]"
                  : "bg-[#F3EFE8] text-[#9E9A90]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3 h-3" />
                {isSpeaking ? "Speaking..." : "Voice readout ON — AI responses will be read aloud"}
              </span>
              {isSpeaking && (
                <button
                  onClick={() => { stopSpeech(); setIsSpeaking(false); }}
                  className="text-[#D48C70] hover:text-[#C27A5B] font-bold uppercase tracking-wider"
                >
                  Stop
                </button>
              )}
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5 relative min-h-0">
            {/* Upgrade overlay */}
            {showUpgradePrompt && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-10">
                <div className="text-center space-y-5 max-w-sm">
                  <div className="w-16 h-16 bg-[#D48C70]/15 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8 text-[#D48C70]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-2xl text-[#2C2A29] mb-2">
                      Daily Limit Reached
                    </h3>
                    <p className="text-sm text-[#5C5A59] leading-relaxed">
                      You've used all <strong>{FREE_DAILY_LIMIT} free AI queries</strong> for today.
                      Your limit resets at midnight UTC.
                    </p>
                  </div>
                  <div className="bg-[#7E9A85]/8 border border-[#7E9A85]/20 rounded-2xl p-5 text-left space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7E9A85] uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      <span>Upgrade to Pro</span>
                    </div>
                    <ul className="space-y-2 text-sm text-[#5C5A59]">
                      {["Unlimited AI queries every day", "All 3 AI modes (Health, Lab, Nutrition)", "Priority AI response quality"].map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7E9A85] shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 w-full">
                    <Link
                      to="/pricing"
                      className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      View Pro Plans
                    </Link>
                    <button
                      onClick={() => setShowUpgradePrompt(false)}
                      className="w-full text-sm text-[#9E9A90] hover:text-[#5C5A59] transition-colors py-2"
                    >
                      Come back tomorrow (free)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Greeting / empty state */}
            {currentMessages.length === 0 && (
              <div className="flex flex-col items-start gap-4 max-w-2xl">
                {/* Avatar + greeting bubble */}
                <div className="flex gap-4 items-start">
                  <img
                    src={avatarUrl}
                    alt="Health Companion, AI health educator"
                    style={{ ...portraitPosition, boxShadow: `0 0 0 2px ${currentMode.accentColor}40` }}
                    className="w-12 h-12 rounded-full object-cover object-[50%_22%] border-2 border-white shadow-md shrink-0"
                  />
                  <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-[#EBE6DC] text-sm text-[#2C2A29] leading-relaxed max-w-lg">
                    {currentMode.greeting}
                  </div>
                </div>

                {/* Suggested prompts */}
                <div className="ml-16 space-y-2">
                  <p className="text-[10px] font-bold text-[#9E9A90] uppercase tracking-widest">
                    Try asking:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentMode.suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        disabled={isLimitReached || chatMutation.isPending}
                        className={`text-xs px-3.5 py-2 rounded-full border transition-all duration-150 ${
                          isLimitReached
                            ? "border-[#EBE6DC] text-[#C5C0B5] cursor-not-allowed"
                            : `border-[#EBE6DC] text-[#5C5A59] hover:border-[${currentMode.accentColor}] hover:text-[#2C2A29] hover:bg-white active:scale-95`
                        }`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message history */}
            {currentMessages.map((msg, idx) => (
              <div key={msg.id}>
                <div
                  className={`flex gap-4 items-start ${msg.role === "user" ? "flex-row-reverse" : ""} max-w-3xl ${msg.role === "user" ? "ml-auto" : ""}`}
                >
                  {msg.role === "assistant" ? (
                    <img
                      src={avatarUrl}
                      alt="Health Companion, AI health educator"
                      style={{ ...portraitPosition, boxShadow: `0 0 0 2px ${currentMode.accentColor}40` }}
                      className="w-10 h-10 rounded-full object-cover object-[50%_22%] border-2 border-white shadow-sm shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#2C2A29] flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                      You
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed max-w-[75%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#2C2A29] text-white rounded-tr-sm"
                        : "bg-white text-[#2C2A29] rounded-tl-sm border border-[#EBE6DC]"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <>{msg.content}{msg.attachmentName && <div className="mt-2 flex max-w-full items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px]"><FileText className="h-3 w-3 shrink-0" /><span className="truncate">{msg.attachmentName}</span></div>}</>
                    )}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Copy button */}
                        <FullPageCopyButton text={msg.content} />
                        {ttsEnabled && (
                          <button
                            onClick={() => speakText(msg.content)}
                            className="flex items-center gap-1 text-[10px] text-[#9E9A90] hover:text-[#7E9A85] transition-colors"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Read aloud</span>
                          </button>
                        )}
                        {/* Thumbs rating */}
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => rateMessage(msg.id, "up")}
                            className={`p-1 rounded-lg transition-colors ${
                              msg.rating === "up"
                                ? "text-[#7E9A85] bg-[#7E9A85]/10"
                                : "text-[#C5C0B5] hover:text-[#7E9A85] hover:bg-[#7E9A85]/10"
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => rateMessage(msg.id, "down")}
                            className={`p-1 rounded-lg transition-colors ${
                              msg.rating === "down"
                                ? "text-[#D48C70] bg-[#D48C70]/10"
                                : "text-[#C5C0B5] hover:text-[#D48C70] hover:bg-[#D48C70]/10"
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Follow-up chips after the last assistant message */}
                {msg.role === "assistant" && idx === currentMessages.length - 1 && !chatMutation.isPending && (() => {
                  const followUps: Record<Mode, string[]> = {
                    health_assistant: ["What lifestyle changes help?", "Should I see a doctor?", "Tell me more"],
                    lab_analyzer: ["What's the optimal range?", "What affects this value?", "What should I ask my doctor?"],
                    nutrition_coach: ["What foods should I eat?", "Are there supplements?", "How long until I see results?"],
                  };
                  return (
                    <div className="ml-14 flex flex-wrap gap-2 mt-2">
                      {followUps[activeMode].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => sendMessage(chip)}
                          disabled={isLimitReached}
                          className="text-xs px-3.5 py-1.5 rounded-full border border-[#EBE6DC] text-[#5C5A59] hover:border-[#7E9A85] hover:text-[#2C2A29] hover:bg-white transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ))}

            {/* Enhanced loading indicator with typing label */}
            {chatMutation.isPending && (
              <div className="flex gap-4 items-start max-w-3xl">
                <img
                  src={avatarUrl}
                  alt="Health Companion, AI health educator"
                  style={{ ...portraitPosition, boxShadow: `0 0 0 2px ${currentMode.accentColor}40` }}
                  className="w-10 h-10 rounded-full object-cover object-[50%_22%] border-2 border-white shadow-sm shrink-0"
                />
                <div className="bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-[#EBE6DC] flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#7E9A85] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#7E9A85] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#7E9A85] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-[#9E9A90] italic">Health Companion is typing…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="bg-white border-t border-[#EBE6DC] px-4 md:px-8 py-4 shrink-0">
            {isLimitReached && !showUpgradePrompt ? (
              <div className="flex items-center justify-between bg-[#D48C70]/10 border border-[#D48C70]/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#D48C70] shrink-0" />
                  <span className="text-sm font-semibold text-[#D48C70]">
                    Daily limit reached — resets at midnight UTC
                  </span>
                </div>
                <Link
                  to="/pricing"
                  className="text-xs font-bold text-[#7E9A85] hover:text-[#6A8571] whitespace-nowrap ml-3"
                >
                  Go Pro →
                </Link>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <DocumentAttachmentControl controller={documentAttachment} disabled={chatMutation.isPending || isLimitReached} />
                <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isLimitReached
                      ? "Upgrade to Pro for unlimited queries..."
                      : `Ask Health Companion anything about ${currentMode.label.toLowerCase()}...`
                  }
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-[#EBE6DC] bg-[#F9F6F0] px-4 py-3 text-sm text-[#2C2A29] placeholder:text-[#9E9A90] focus:outline-none focus:border-[#7E9A85] transition-colors leading-relaxed"
                  style={{ maxHeight: "120px", overflowY: "auto" }}
                  disabled={chatMutation.isPending || isLimitReached}
                />
                <button
                  onClick={toggleVoiceInput}
                  disabled={isLimitReached}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : isLimitReached
                      ? "bg-[#F9F6F0] text-[#C5C0B5] cursor-not-allowed"
                      : "bg-[#F9F6F0] text-[#9E9A90] hover:text-[#7E9A85] hover:bg-[#EBE6DC]"
                  }`}
                  title={isRecording ? "Stop recording" : "Voice input"}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={(!inputText.trim() && !pendingAttachment) || chatMutation.isPending || isLimitReached}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 shrink-0 ${
                    (inputText.trim() || pendingAttachment) && !chatMutation.isPending && !isLimitReached
                      ? `${currentMode.bgColor} text-white hover:opacity-90`
                      : "bg-[#EBE6DC] text-[#C5C0B5] cursor-not-allowed"
                  }`}
                  title="Send message"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-[#B0AAA1]">TXT, DOCX, or text-based PDF · 5 MB max · processed for this question only.</p>
              </div>
            )}

            {/* Footer hint */}
            {!isLimitReached && (
              <p className="text-[10px] text-[#C5C0B5] text-center mt-2">
                Press Enter to send · Shift+Enter for new line · Educational use only — not medical advice
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
