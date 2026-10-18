import SEO from "@/components/SEO";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, Search, ChevronDown, ChevronUp, ArrowLeft, HelpCircle, BookOpen, FlaskConical, Shield, CreditCard, MessageCircle } from "lucide-react";

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQ_CATEGORIES = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    color: "text-[#7E9A85]",
    bg: "bg-[#7E9A85]/10",
    questions: [
      {
        q: "What is The Patient's Compass?",
        a: "The Patient's Compass is a health intelligence platform built by a Clinical Laboratory Scientist with 20+ years of experience. It helps you understand your lab results, track biomarker trends over time, and prepare for more productive doctor visits — all through an educational lens.",
      },
      {
        q: "Who is this platform designed for?",
        a: "Anyone who wants to take a more active role in understanding their health. Whether you have received lab results that confused you, manage a chronic condition, or simply want to optimize your wellness, The Patient's Compass gives you the tools to become a more informed patient.",
      },
      {
        q: "Do I need to create an account to use the platform?",
        a: "Many features — including the Symptom Quiz, Biomarker Directory, AI Lab Scanner demo, and Doctor's Letter Generator — are available without signing in. Creating a free account unlocks your personal Dashboard, saved lab history, biomarker trend tracking, and personalized AI recommendations.",
      },
      {
        q: "Is this platform a substitute for medical advice?",
        a: "No. The Patient's Compass is strictly educational. All content, AI responses, and tools are designed to support your understanding and help you have better conversations with your licensed healthcare provider — not to diagnose, treat, or replace professional medical care.",
      },
    ],
  },
  {
    id: "lab-results",
    label: "Lab Results & Analysis",
    icon: FlaskConical,
    color: "text-[#D48C70]",
    bg: "bg-[#D48C70]/10",
    questions: [
      {
        q: "How does the AI Lab Scanner work?",
        a: "You paste or upload the text from your lab report. Our AI — guided by clinical laboratory science principles — reads the values, identifies which markers fall outside optimal functional ranges (not just standard 'normal' ranges), and provides plain-language explanations of what each result may mean for your wellness.",
      },
      {
        q: "What is the difference between a 'standard normal range' and an 'optimal wellness zone'?",
        a: "Standard reference ranges are calculated using statistical averages from the general population — which includes many people who are not in peak health. Optimal wellness zones are narrower ranges associated with peak vitality and early prevention, based on functional medicine and clinical research. A result can be 'normal' yet still suboptimal for your long-term health.",
      },
      {
        q: "What types of lab reports can I upload?",
        a: "You can paste plain text from any standard blood panel. Common panels include CBC (Complete Blood Count), CMP (Comprehensive Metabolic Panel), thyroid panels, lipid panels, iron studies, and hormone panels. The AI is trained to recognize hundreds of biomarker names and abbreviations.",
      },
      {
        q: "Are my lab results stored securely?",
        a: "Yes. When you save a lab report to your account, it is stored in an encrypted database. We never sell, share, or use your health data for advertising. You can delete your data at any time from your Dashboard. See our Privacy Policy for full details.",
      },
      {
        q: "Can I track my biomarker values over time?",
        a: "Yes. After saving a lab report, you can log individual biomarker readings to your history. Your Dashboard displays interactive trend charts with optimal zone overlays, trend direction arrows, improvement percentages, and AI-generated insights about your progress.",
      },
    ],
  },
  {
    id: "medical-assistant",
    label: "Medical Assistant Widget",
    icon: MessageCircle,
    color: "text-[#A39EBA]",
    bg: "bg-[#A39EBA]/10",
    questions: [
      {
        q: "What is the Medical Assistant widget?",
        a: "The floating chat icon in the bottom-right corner of every page opens the Medical Assistant — an AI-powered health education chatbot. It operates in three modes: Health Assistant (general health questions), Lab Analyzer (biomarker interpretation), and Nutrition Coach (food and lifestyle guidance).",
      },
      {
        q: "How do I use voice input with the Medical Assistant?",
        a: "Click the microphone button (🎤) in the widget's message input area. Speak your question clearly — the widget uses your browser's built-in speech recognition to transcribe your words and send them automatically when you stop speaking. Voice input works best in Chrome and Edge.",
      },
      {
        q: "How do I enable text-to-speech so the AI reads responses aloud?",
        a: "Click the speaker icon (🔊) in the widget header. When enabled, the header shows a 'Voice readout ON' banner and the footer confirms the status. Every new AI response will be read aloud automatically. You can also click 'Read aloud' under any individual message to replay it.",
      },
      {
        q: "Does the Medical Assistant give medical diagnoses?",
        a: "No. The Medical Assistant is an educational tool only. It provides health information, explains biomarker concepts, and offers general wellness guidance — but it cannot diagnose conditions, prescribe treatments, or replace a consultation with a licensed healthcare provider.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy & Security",
    icon: Shield,
    color: "text-[#7E9A85]",
    bg: "bg-[#7E9A85]/10",
    questions: [
      {
        q: "Is my health data private?",
        a: "Absolutely. Your lab reports and biomarker history are stored in an encrypted database accessible only to your account. We do not sell, share, or monetize your personal health data. You retain full ownership of your data at all times.",
      },
      {
        q: "Can I delete my account and data?",
        a: "Yes. You can request full account and data deletion by contacting us at privacy@thepatientscompass.com. We will permanently remove all your stored data within 30 days of your request.",
      },
      {
        q: "Is The Patient's Compass HIPAA compliant?",
        a: "The Patient's Compass is an educational platform, not a covered healthcare entity under HIPAA. However, we apply HIPAA-aligned best practices including encrypted data storage, minimal data collection, and strict access controls. We never share your health information with third parties.",
      },
      {
        q: "What data do you collect when I use the platform?",
        a: "We collect only what is necessary to provide the service: your account email, saved lab reports (if you choose to save them), biomarker readings you manually log, and anonymized usage analytics. We do not collect sensitive personal identifiers beyond what you voluntarily provide.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & Access",
    icon: CreditCard,
    color: "text-[#D48C70]",
    bg: "bg-[#D48C70]/10",
    questions: [
      {
        q: "How do I sign in?",
        a: "Sign-in is temporarily unavailable while we resolve a platform issue. We apologize for the inconvenience. You can join our waitlist at thepatientscompass.com/signin to be notified by email the moment authentication is restored. In the meantime, all free features — including the Symptom Quiz, Biomarker Directory, AI Lab Scanner, and Doctor's Letter Generator — remain fully accessible without an account.",
      },
      {
        q: "Is there a cost to use The Patient's Compass?",
        a: "Core features including the Symptom Quiz, Biomarker Directory, Doctor's Letter Generator, and AI Lab Scanner demo are free. Premium features including full lab history, trend tracking, and personalized AI recommendations are available to registered users.",
      },
      {
        q: "What happens to my data if I sign out?",
        a: "Your data remains safely stored in your account. Signing out simply ends your session — all your saved lab reports, biomarker readings, and history will be waiting for you when you sign back in.",
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FAQ() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return FAQ_CATEGORIES.map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          (activeCategory === "all" || activeCategory === cat.id) &&
          (!q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
      ),
    })).filter((cat) => cat.questions.length > 0);
  }, [search, activeCategory]);

  const totalResults = filtered.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Frequently Asked Questions"
        description="Find answers to common questions about lab interpretation, optimal ranges, our books, and The Patient's Compass platform."
        path="/faq"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="bg-[#7E9A85] text-white p-2 rounded-xl shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight">The Patient's Compass</span>
                <p className="text-[10px] text-[#7E9A85] font-semibold tracking-wider uppercase">Health Intelligence System</p>
              </div>
            </div>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-[#5C5A59] hover:text-[#2C2A29] transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 border-b border-[#EBE6DC] bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <div className="bg-[#7E9A85]/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-[#7E9A85]">
            <HelpCircle className="w-7 h-7" />
          </div>
          <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
            Help Center
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-[#2C2A29]">Frequently Asked Questions</h1>
          <p className="text-base text-[#5C5A59] leading-relaxed max-w-xl mx-auto">
            Find answers to the most common questions about The Patient's Compass platform, lab analysis, privacy, and your account.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="w-4 h-4 text-[#9E9A90] absolute left-3.5 top-3.5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="pl-10 bg-white border-[#EBE6DC] rounded-xl focus-visible:ring-[#7E9A85] text-sm"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 border-b border-[#EBE6DC] bg-[#F9F6F0]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeCategory === "all"
                  ? "bg-[#2C2A29] text-white"
                  : "bg-white border border-[#EBE6DC] text-[#5C5A59] hover:border-[#7E9A85]"
              }`}
            >
              All Topics
            </button>
            {FAQ_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    activeCategory === cat.id
                      ? "bg-[#2C2A29] text-white"
                      : "bg-white border border-[#EBE6DC] text-[#5C5A59] hover:border-[#7E9A85]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
          {search && (
            <p className="text-center text-xs text-[#9E9A90] mt-3 font-medium">
              {totalResults} result{totalResults !== 1 ? "s" : ""} for "{search}"
            </p>
          )}
        </div>
      </section>

      {/* FAQ Accordions */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 space-y-10">
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <HelpCircle className="w-10 h-10 text-[#C5C0B5] mx-auto" />
              <p className="text-[#5C5A59] font-medium">No questions match your search.</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("all"); }}
                className="text-[#7E9A85] text-sm font-semibold hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.bg}`}>
                      <Icon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <h2 className="font-serif font-bold text-lg text-[#2C2A29]">{cat.label}</h2>
                  </div>
                  {cat.questions.map((item, idx) => {
                    const itemId = `${cat.id}-${idx}`;
                    const isOpen = openItems.has(itemId);
                    return (
                      <div
                        key={itemId}
                        className="bg-white border border-[#EBE6DC] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
                        >
                          <span className="font-semibold text-sm text-[#2C2A29] leading-snug">{item.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[#7E9A85] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#9E9A90] shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5 border-t border-[#EBE6DC]">
                            <p className="text-sm text-[#5C5A59] leading-relaxed pt-4">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Still have questions CTA */}
      <section className="py-12 border-t border-[#EBE6DC]">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4">
          <h3 className="text-2xl font-serif font-bold text-[#2C2A29]">Still have questions?</h3>
          <p className="text-sm text-[#5C5A59]">Our support team typically responds within 24 hours on business days.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/contact">
              <button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors">
                Contact Support
              </button>
            </Link>
            <Link href="/support">
              <button className="bg-white border border-[#EBE6DC] hover:bg-[#F5F1E9] text-[#2C2A29] px-6 py-3 rounded-xl text-sm font-semibold transition-colors">
                Visit Help Center
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2A29] text-[#EBE6DC] py-8 border-t border-[#3D3A39]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#9E9A90]">
          <p>© {new Date().getFullYear()} The Patient's Compass. All rights reserved.</p>
          <p>Educational Content Only — Not Medical Advice</p>
          <div className="flex gap-4 font-medium">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms</span></Link>
            <Link href="/contact"><span className="hover:text-white cursor-pointer transition-colors">Contact</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
