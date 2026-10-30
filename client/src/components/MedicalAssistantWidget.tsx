import React, { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  X,
  Mic,
  MicOff,
  Send,
  Trash2,
  Loader2,
  Stethoscope,
  FlaskConical,
  Salad,
  ChevronDown,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Zap,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Download,
  FileText,
  Paperclip,
} from "lucide-react";
import { exportChatTranscriptPDF } from "@/lib/pdfExport";
import { DocumentAttachmentControl } from "@/components/DocumentAttachmentControl";
import { useDocumentAttachment } from "@/hooks/useDocumentAttachment";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_URL =
  "/manus-storage/sonya-professional-portrait_c5acc8f2.webp";

const STORAGE_KEY_PREFIX = "dr_compass_history_";

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
  greeting: string;
}[] = [
  {
    id: "health_assistant",
    label: "Health Assistant",
    shortLabel: "Health",
    icon: <Stethoscope className="w-3.5 h-3.5" />,
    color: "text-[#7E9A85]",
    bgColor: "bg-[#7E9A85]",
    borderColor: "border-[#7E9A85]",
    greeting:
      "Hello! I'm Health Companion, your health assistant. I can help you understand lab results, provide nutrition advice, or answer health questions. How can I help you today?",
  },
  {
    id: "lab_analyzer",
    label: "Lab Analyzer",
    shortLabel: "Lab",
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    color: "text-[#A39EBA]",
    bgColor: "bg-[#A39EBA]",
    borderColor: "border-[#A39EBA]",
    greeting:
      "Hello! I'm Health Companion, your lab result educator. Share your lab values and I'll help you understand what they mean, the difference between standard and optimal ranges, and what questions to ask your doctor.",
  },
  {
    id: "nutrition_coach",
    label: "Nutrition Coach",
    shortLabel: "Nutrition",
    icon: <Salad className="w-3.5 h-3.5" />,
    color: "text-[#D48C70]",
    bgColor: "bg-[#D48C70]",
    borderColor: "border-[#D48C70]",
    greeting:
      "Hello! I'm Health Companion, your nutrition coach. Tell me about your health goals or biomarker concerns and I'll provide evidence-based nutritional guidance to support your wellness journey.",
  },
];

const FREE_DAILY_LIMIT = 3;

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadHistory(mode: Mode): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + mode);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    // Keep only last 10 messages
    return Array.isArray(parsed) ? parsed.slice(-10) : [];
  } catch {
    return [];
  }
}

function saveHistory(mode: Mode, messages: Message[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY_PREFIX + mode,
      JSON.stringify(messages.slice(-10).map(({ attachmentName: _attachmentName, ...message }) => message))
    );
  } catch {
    // localStorage may be unavailable in some environments
  }
}

function clearHistory(mode: Mode) {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + mode);
  } catch {}
}

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

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
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
      className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9E9A90] hover:text-[#7E9A85] transition-colors"
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
          <span>Share</span>
        </>
      )}
    </button>
  );
}

// ─── Usage Indicator ──────────────────────────────────────────────────────────

function UsageIndicator({
  queriesUsed,
  queriesRemaining,
  isPro,
  dailyLimit,
}: {
  queriesUsed: number;
  queriesRemaining: number;
  isPro: boolean;
  dailyLimit: number;
}) {
  if (isPro) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7E9A85]">
        <Zap className="w-3 h-3" />
        <span>Pro — Unlimited queries</span>
      </div>
    );
  }

  const dots = Array.from({ length: dailyLimit }, (_, i) => i < queriesUsed);
  const isExhausted = queriesRemaining === 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {dots.map((used, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              used ? "bg-[#D48C70]" : "bg-[#EBE6DC]"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-[10px] font-semibold ${
          isExhausted ? "text-[#D48C70]" : "text-[#9E9A90]"
        }`}
      >
        {isExhausted
          ? "Daily limit reached"
          : `${queriesUsed}/${dailyLimit} queries used`}
      </span>
    </div>
  );
}

// ─── Upgrade Prompt ───────────────────────────────────────────────────────────

function UpgradePrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10 rounded-b-2xl">
      <div className="text-center space-y-4 max-w-[280px]">
        <div className="w-12 h-12 bg-[#D48C70]/15 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-[#D48C70]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-serif font-bold text-lg text-[#2C2A29]">
            Daily Limit Reached
          </h3>
          <p className="text-xs text-[#5C5A59] leading-relaxed">
            You've used all <strong>{FREE_DAILY_LIMIT} free AI queries</strong>{" "}
            for today. Your limit resets at midnight UTC.
          </p>
        </div>

        <div className="bg-[#7E9A85]/8 border border-[#7E9A85]/20 rounded-xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7E9A85] uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Upgrade to Pro</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[#5C5A59]">
            <li className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7E9A85] shrink-0" />
              Unlimited AI queries every day
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7E9A85] shrink-0" />
              All 3 AI modes (Health, Lab, Nutrition)
            </li>
            <li className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7E9A85] shrink-0" />
              Priority AI response quality
            </li>
          </ul>
        </div>

        <div className="space-y-2 w-full">
          <Link
            to="/pricing"
            onClick={onClose}
            className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            View Pro Plans
          </Link>
          <button
            onClick={onClose}
            className="w-full text-xs text-[#9E9A90] hover:text-[#5C5A59] transition-colors py-1"
          >
            Come back tomorrow (free)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MedicalAssistantWidget() {
  const { user, isAuthenticated } = useAuth();
  const assistantAppearance = trpc.assistantAppearance.get.useQuery();
  const avatarUrl = assistantAppearance.data?.url ?? AVATAR_URL;
  const portraitPosition = { objectPosition: `${assistantAppearance.data?.cropPositionX ?? 50}% ${assistantAppearance.data?.cropPositionY ?? 22}%` };
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<Mode>("health_assistant");

  // Initialize messages from localStorage
  const [messages, setMessages] = useState<Record<Mode, Message[]>>(() => ({
    health_assistant: loadHistory("health_assistant"),
    lab_analyzer: loadHistory("lab_analyzer"),
    nutrition_coach: loadHistory("nutrition_coach"),
  }));

  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const documentAttachment = useDocumentAttachment(isAuthenticated);
  const pendingAttachment = documentAttachment.attachment;

  // Local query tracking for unauthenticated users (session-based)
  const [localQueriesUsed, setLocalQueriesUsed] = useState(0);

  // Server-side query status for authenticated users
  const queryStatus = trpc.medicalAssistant.getQueryStatus.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentMode = MODES.find((m) => m.id === activeMode)!;
  const currentMessages = messages[activeMode];

  // Derive usage info
  const isPro = queryStatus.data?.isPro ?? false;
  const queriesUsed = isAuthenticated
    ? (queryStatus.data?.queriesUsed ?? 0)
    : localQueriesUsed;
  const queriesRemaining = isAuthenticated
    ? (queryStatus.data?.queriesRemaining ?? FREE_DAILY_LIMIT)
    : Math.max(0, FREE_DAILY_LIMIT - localQueriesUsed);
  const isLimitReached = !isPro && queriesRemaining === 0;

  // ─── Persist messages to localStorage whenever they change ──────────────────
  useEffect(() => {
    saveHistory("health_assistant", messages.health_assistant);
  }, [messages.health_assistant]);

  useEffect(() => {
    saveHistory("lab_analyzer", messages.lab_analyzer);
  }, [messages.lab_analyzer]);

  useEffect(() => {
    saveHistory("nutrition_coach", messages.nutrition_coach);
  }, [messages.nutrition_coach]);

  // ─── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isOpen]);

  // ─── Auto-focus input when opened ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ─── Stop speech when widget closes ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      setIsSpeaking(false);
      setShowUpgradePrompt(false);
    }
  }, [isOpen]);

  // ─── Track speaking state ───────────────────────────────────────────────────
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const interval = setInterval(() => {
      setIsSpeaking(window.speechSynthesis.speaking);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // ─── tRPC mutation ──────────────────────────────────────────────────────────
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

      // Update local query count for unauthenticated users
      if (!isAuthenticated) {
        setLocalQueriesUsed((prev) => prev + 1);
      }

      // Refresh server-side query status for authenticated users
      if (isAuthenticated) {
        queryStatus.refetch();
      }

      // Auto-read aloud if TTS is enabled
      if (ttsEnabled) {
        speakText(data.content);
      }
    },
    onError: (err) => {
      // Handle rate limit error
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

  // ─── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if ((!trimmed && !pendingAttachment) || chatMutation.isPending) return;

      // Check limit before sending (for unauthenticated users)
      if (!isAuthenticated && localQueriesUsed >= FREE_DAILY_LIMIT) {
        setShowUpgradePrompt(true);
        return;
      }

      // Stop any ongoing speech when user sends a new message
      stopSpeech();
      setIsSpeaking(false);

      const userMsg: Message = {
        id: `${Date.now()}-user`,
        role: "user",
        content: trimmed || "Please explain this document in clear educational language.",
        attachmentName: pendingAttachment?.fileName,
      };

      const updatedMessages = [...currentMessages, userMsg];
      setMessages((prev) => ({
        ...prev,
        [activeMode]: updatedMessages,
      }));
      setInputText("");

      // Build history for LLM (last 10 messages for context)
      const historyForLLM = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      chatMutation.mutate({
        mode: activeMode,
        messages: historyForLLM,
        attachment: pendingAttachment ?? undefined,
      });
      documentAttachment.clear();
    },
    [activeMode, currentMessages, chatMutation, isAuthenticated, localQueriesUsed, pendingAttachment, documentAttachment]
  );

  // ─── Handle Enter key ───────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // ─── Rate message ───────────────────────────────────────────────────────────
  const rateMessage = (msgId: string, rating: "up" | "down") => {
    setMessages((prev) => ({
      ...prev,
      [activeMode]: prev[activeMode].map((m) =>
        m.id === msgId ? { ...m, rating: m.rating === rating ? null : rating } : m
      ),
    }));
    toast.success(rating === "up" ? "Thanks for the feedback! 👍" : "Thanks — we'll use this to improve.");
  };

  // ─── Export PDF ─────────────────────────────────────────────────────────────
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

  // ─── Clear conversation ─────────────────────────────────────────────────────
  const clearConversation = () => {
    if (currentMessages.length > 0) {
      setShowSessionSummary(true);
    } else {
      stopSpeech();
      setMessages((prev) => ({ ...prev, [activeMode]: [] }));
      clearHistory(activeMode);
      setShowUpgradePrompt(false);
    }
  };

  // ─── Confirm clear ──────────────────────────────────────────────────────────
  const confirmClear = () => {
    stopSpeech();
    setMessages((prev) => ({ ...prev, [activeMode]: [] }));
    clearHistory(activeMode);
    setShowUpgradePrompt(false);
    setShowSessionSummary(false);
  };

  // ─── Toggle TTS ─────────────────────────────────────────────────────────────
  const toggleTts = () => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (ttsEnabled) {
      stopSpeech();
    }
    setTtsEnabled((prev) => !prev);
  };

  // ─── Stop speaking button ───────────────────────────────────────────────────
  const handleStopSpeaking = () => {
    stopSpeech();
    setIsSpeaking(false);
  };

  // ─── Web Speech API (browser-native, no server needed) ─────────────────────
  const toggleVoiceInput = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Voice input is not supported in this browser. Try Chrome or Edge."
      );
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

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join("");
      setInputText(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInputText((current) => {
        if (current.trim()) {
          setTimeout(() => sendMessage(current), 100);
        }
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

  // ─── Mode switch ────────────────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating toggle button with avatar ── */}
      <button
        onClick={() => {
          if (isOpen && currentMessages.length > 0 && !showSessionSummary) {
            setShowSessionSummary(true);
          } else if (isOpen && showSessionSummary) {
            setIsOpen(false);
            setShowSessionSummary(false);
          } else {
            setIsOpen((o) => !o);
          }
        }}
        className={`fixed bottom-6 right-6 z-50 rounded-full shadow-xl transition-all duration-200 active:scale-95 focus:outline-none ${
          isOpen ? "w-14 h-14" : "w-16 h-16"
        }`}
        aria-label={isOpen ? "Close Medical Assistant" : "Open Medical Assistant"}
        title={isOpen ? "Close Health Companion" : "Chat with Health Companion"}
      >
        {isOpen ? (
          /* Close state — dark circle with X */
          <div className="w-full h-full rounded-full bg-[#2C2A29] flex items-center justify-center shadow-lg">
            <ChevronDown className="w-6 h-6 text-white" />
          </div>
        ) : (
          /* Open state — avatar with online indicator ring */
          <div className="relative w-full h-full">
            {/* Pulsing outer ring */}
            <div className="absolute inset-0 rounded-full bg-[#7E9A85]/30 animate-ping" />
            {/* Avatar image */}
            <img
              src={avatarUrl}
              alt="Health Companion, AI health educator"
              style={portraitPosition}
              className="w-full h-full rounded-full object-cover object-[50%_22%] sm:object-[50%_24%] border-2 border-[#7E9A85] shadow-lg relative z-10"
            />
            {/* Online dot */}
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full z-20" />
          </div>
        )}
      </button>

      {/* ── Widget panel ── */}
      <div
        className={`fixed bottom-24 right-3 sm:bottom-28 sm:right-6 z-50 w-[380px] max-w-[calc(100vw-1.5rem)] bg-[#F3EBDD] rounded-2xl shadow-[0_24px_70px_rgba(44,42,41,.28)] border border-[#C9BFAF] flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{ maxHeight: "calc(100vh - 8rem)" }}
      >
        {/* ── Header with avatar ── */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#2C2A29] via-[#435A4B] to-[#7E9A85] text-white shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar in header */}
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt="Health Companion, AI health educator"
                style={portraitPosition}
                className="w-10 h-10 rounded-full object-cover object-[50%_22%] border-2 border-[#7E9A85]/60"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#2C2A29] rounded-full" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Health Companion</p>
              <p className="text-[10px] text-white/60 leading-tight">
                {currentMode.label} · AI Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* TTS toggle */}
            <button
              onClick={toggleTts}
              className={`p-1.5 rounded-lg transition-colors ${
                ttsEnabled
                  ? "bg-white/20 text-white"
                  : "hover:bg-white/10 text-white/60"
              }`}
              title={ttsEnabled ? "Disable voice readout" : "Enable voice readout"}
            >
              {ttsEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={clearConversation}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={() => {
                if (currentMessages.length > 0 && !showSessionSummary) {
                  setShowSessionSummary(true);
                } else {
                  setIsOpen(false);
                  setShowSessionSummary(false);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* ── Usage indicator bar ── */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#F9F6F0] border-b border-[#EBE6DC] shrink-0">
          {queryStatus.isLoading && isAuthenticated ? (
            <div className="flex items-center gap-1.5 text-[10px] text-[#9E9A90]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Loading usage...</span>
            </div>
          ) : (
            <UsageIndicator
              queriesUsed={queriesUsed}
              queriesRemaining={queriesRemaining}
              isPro={isPro}
              dailyLimit={FREE_DAILY_LIMIT}
            />
          )}
          {!isPro && (
            <Link
              to="/pricing"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-semibold text-[#7E9A85] hover:text-[#6A8571] flex items-center gap-0.5 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Upgrade
            </Link>
          )}
        </div>

        {/* ── TTS status bar ── */}
        {ttsEnabled && (
          <div
            className={`flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold shrink-0 ${
              isSpeaking
                ? "bg-[#7E9A85]/15 text-[#7E9A85]"
                : "bg-[#F9F6F0] text-[#9E9A90]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3 h-3" />
              {isSpeaking
                ? "Speaking..."
                : "Voice readout ON — AI responses will be read aloud"}
            </span>
            {isSpeaking && (
              <button
                onClick={handleStopSpeaking}
                className="text-[#D48C70] hover:text-[#C27A5B] font-bold uppercase tracking-wider"
              >
                Stop
              </button>
            )}
          </div>
        )}

        {/* ── Mode tabs ── */}
        <div className="flex border-b border-[#EBE6DC] shrink-0 bg-[#F9F6F0]">
          {MODES.map((mode) => (
            <div key={mode.id} className="flex-1 relative">
              <button
                onClick={() => switchMode(mode.id)}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all duration-150 border-b-2 ${
                  activeMode === mode.id
                    ? `${mode.color} border-current bg-white`
                    : "text-[#9E9A90] border-transparent hover:text-[#5C5A59]"
                }`}
              >
                {mode.icon}
                <span>{mode.shortLabel}</span>
              </button>
              {/* Per-mode clear button — only on active tab with messages */}
              {activeMode === mode.id && messages[mode.id].length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearConversation(); }}
                  className="absolute top-1 right-1 p-0.5 rounded text-[#C5C0B5] hover:text-[#D48C70] transition-colors"
                  title="Clear this conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── Session summary modal ── */}
        {showSessionSummary && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50 rounded-2xl">
            <div className="text-center space-y-4 max-w-[280px]">
              <div className="w-12 h-12 bg-[#7E9A85]/15 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-[#7E9A85]" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2C2A29] mb-1">Session Summary</h3>
                <p className="text-xs text-[#5C5A59] leading-relaxed">
                  You had <strong>{currentMessages.length} messages</strong> with Health Companion in{" "}
                  <strong>{currentMode.label}</strong> mode.
                </p>
              </div>
              <div className="flex gap-3 text-center">
                <div className="flex-1 bg-[#7E9A85]/10 rounded-xl p-3">
                  <div className="text-lg font-bold text-[#7E9A85]">{currentMessages.filter((m) => m.rating === "up").length}</div>
                  <div className="text-[10px] text-[#9E9A90]">Helpful</div>
                </div>
                <div className="flex-1 bg-[#D48C70]/10 rounded-xl p-3">
                  <div className="text-lg font-bold text-[#D48C70]">{currentMessages.filter((m) => m.rating === "down").length}</div>
                  <div className="text-[10px] text-[#9E9A90]">Not helpful</div>
                </div>
              </div>
              <div className="space-y-2 w-full">
                <button
                  onClick={handleExportPDF}
                  className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Save Transcript as PDF
                </button>
                <button
                  onClick={confirmClear}
                  className="w-full text-xs text-[#D48C70] hover:text-[#C27A5B] transition-colors py-1 font-semibold"
                >
                  Clear conversation
                </button>
                <button
                  onClick={() => {
                    setShowSessionSummary(false);
                    setIsOpen(true);
                  }}
                  className="w-full text-xs text-[#9E9A90] hover:text-[#5C5A59] transition-colors py-1"
                >
                  Keep chatting
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 relative">
          {/* Upgrade overlay */}
          {showUpgradePrompt && (
            <UpgradePrompt onClose={() => setShowUpgradePrompt(false)} />
          )}

          {/* Greeting if no messages */}
          {currentMessages.length === 0 && (
            <div className="flex gap-2.5">
              <img
                src={avatarUrl}
                alt="Health Companion, AI health educator"
                style={portraitPosition}
                className="w-8 h-8 rounded-full object-cover object-[50%_22%] shrink-0 mt-0.5 border border-[#EBE6DC]"
              />
              <div className="bg-[#F9F6F0] rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-[#2C2A29] leading-relaxed max-w-[85%]">
                {currentMode.greeting}
              </div>
            </div>
          )}

          {/* Message history */}
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && (
                <img
                  src={avatarUrl}
                  alt="Health Companion, AI health educator"
                  style={portraitPosition}
                  className="w-8 h-8 rounded-full object-cover object-[50%_22%] shrink-0 mt-0.5 border border-[#EBE6DC]"
                />
              )}
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[82%] ${
                  msg.role === "user"
                    ? "bg-[#2C2A29] text-white rounded-tr-sm"
                    : "bg-[#F9F6F0] text-[#2C2A29] rounded-tl-sm"
                }`}
              >
                {msg.content}
                {msg.attachmentName && <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px]"><FileText className="h-3 w-3 shrink-0" /><span className="truncate">{msg.attachmentName}</span></div>}
                {/* Action row for assistant messages */}
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <CopyButton text={msg.content} />
                    {ttsEnabled && (
                      <button
                        onClick={() => speakText(msg.content)}
                        className="flex items-center gap-1 text-[10px] text-[#9E9A90] hover:text-[#7E9A85] transition-colors"
                        title="Read this message aloud"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Read aloud</span>
                      </button>
                    )}
                    {/* Thumbs rating */}
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        onClick={() => rateMessage(msg.id, "up")}
                        className={`p-0.5 rounded transition-colors ${
                          msg.rating === "up"
                            ? "text-[#7E9A85]"
                            : "text-[#C5C0B5] hover:text-[#7E9A85]"
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => rateMessage(msg.id, "down")}
                        className={`p-0.5 rounded transition-colors ${
                          msg.rating === "down"
                            ? "text-[#D48C70]"
                            : "text-[#C5C0B5] hover:text-[#D48C70]"
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Follow-up chips — shown after last assistant message when not loading */}
          {!chatMutation.isPending && currentMessages.length > 0 && (() => {
            const lastMsg = currentMessages[currentMessages.length - 1];
            if (lastMsg.role !== "assistant") return null;
            const followUps: Record<Mode, string[]> = {
              health_assistant: ["What lifestyle changes help?", "Should I see a doctor?", "Tell me more"],
              lab_analyzer: ["What's the optimal range?", "What affects this value?", "What should I ask my doctor?"],
              nutrition_coach: ["What foods should I eat?", "Are there supplements?", "How long until I see results?"],
            };
            return (
              <div className="ml-10 flex flex-wrap gap-1.5 mt-1">
                {followUps[activeMode].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    disabled={isLimitReached}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-[#EBE6DC] text-[#5C5A59] hover:border-[#7E9A85] hover:text-[#2C2A29] hover:bg-[#F9F6F0] transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Loading indicator with typing label */}
          {chatMutation.isPending && (
            <div className="flex gap-2.5 items-center">
              <img
                src={avatarUrl}
                alt="Health Companion, AI health educator"
                style={portraitPosition}
                className="w-8 h-8 rounded-full object-cover object-[50%_22%] shrink-0 border border-[#EBE6DC]"
              />
              <div className="bg-[#F9F6F0] rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#7E9A85] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#7E9A85] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[#7E9A85] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[10px] text-[#9E9A90] italic">Health Companion is typing…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="border-t border-[#EBE6DC] p-3 shrink-0 bg-white">
          {isLimitReached && !showUpgradePrompt ? (
            <div className="flex items-center justify-between bg-[#D48C70]/10 border border-[#D48C70]/20 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D48C70] shrink-0" />
                <span className="text-xs font-semibold text-[#D48C70]">
                  Daily limit reached — resets at midnight UTC
                </span>
              </div>
              <Link
                to="/pricing"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-[#7E9A85] hover:text-[#6A8571] whitespace-nowrap ml-2"
              >
                Go Pro →
              </Link>
            </div>
          ) : (
            <div>
              <DocumentAttachmentControl controller={documentAttachment} compact disabled={chatMutation.isPending || isLimitReached} />
              <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLimitReached
                    ? "Upgrade to Pro for unlimited queries..."
                    : "Ask Health Companion anything..."
                }
                rows={1}
                className="flex-1 resize-none rounded-xl border border-[#EBE6DC] bg-[#F9F6F0] px-3 py-2 text-sm text-[#2C2A29] placeholder:text-[#9E9A90] focus:outline-none focus:border-[#7E9A85] transition-colors leading-relaxed"
                style={{ maxHeight: "80px", overflowY: "auto" }}
                disabled={chatMutation.isPending || isLimitReached}
              />
              {/* Mic button */}
              <button
                onClick={toggleVoiceInput}
                disabled={isLimitReached}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : isLimitReached
                    ? "bg-[#F9F6F0] text-[#C5C0B5] cursor-not-allowed"
                    : "bg-[#F9F6F0] text-[#9E9A90] hover:text-[#7E9A85] hover:bg-[#EBE6DC]"
                }`}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
              {/* Send button */}
              <button
                onClick={() => sendMessage(inputText)}
                disabled={(!inputText.trim() && !pendingAttachment) || chatMutation.isPending || isLimitReached}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 ${
                  (inputText.trim() || pendingAttachment) && !chatMutation.isPending && !isLimitReached
                    ? `${currentMode.bgColor} text-white hover:opacity-90 active:scale-95`
                    : "bg-[#EBE6DC] text-[#C5C0B5] cursor-not-allowed"
                }`}
                title="Send message"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
              </div>
              <p className="mt-2 text-[11px] leading-tight text-[#9E9A90]">Attached files are used for this question only, not saved with chat history.</p>
            </div>
          )}

          {/* Voice / TTS status row */}
          {!isLimitReached && (
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-[10px] font-medium ${
                  isRecording ? "text-red-500" : "text-[#9E9A90]"
                }`}
              >
                {isRecording ? "🔴 Listening... (speak now)" : "🎤 Tap mic to speak"}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  ttsEnabled ? "text-[#7E9A85]" : "text-[#C5C0B5]"
                }`}
              >
                {ttsEnabled ? "🔊 Voice readout ON" : "🔇 Voice readout OFF"}
              </span>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[9px] text-[#C5C0B5] text-center mt-1.5 leading-tight">
            Educational only — not medical advice. Consult your healthcare provider.
          </p>
        </div>
      </div>
    </>
  );
}
