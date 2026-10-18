import SEO from "@/components/SEO";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ArrowLeft, LifeBuoy, BookOpen, FlaskConical, TrendingUp,
  MessageCircle, FileText, Download, Mic, Volume2, Shield, ChevronRight
} from "lucide-react";

const GUIDE_SECTIONS = [
  {
    icon: FlaskConical,
    color: "text-[#D48C70]",
    bg: "bg-[#D48C70]/10",
    title: "Uploading & Analyzing Lab Results",
    steps: [
      "From the home page, scroll to the AI Lab Scanner section.",
      "Paste the text from your lab report into the upload area, or upload a PDF/image file.",
      "Click 'Analyze' — the AI will extract biomarker values and compare them to optimal ranges.",
      "Sign in to save your results to your personal Dashboard for trend tracking.",
    ],
  },
  {
    icon: TrendingUp,
    color: "text-[#7E9A85]",
    bg: "bg-[#7E9A85]/10",
    title: "Tracking Biomarker Trends Over Time",
    steps: [
      "Sign in and navigate to your Dashboard from the top navigation.",
      "Click 'Log New Reading' on any biomarker card to add a manual entry.",
      "The trend chart will update automatically with optimal zone shading and a trend arrow.",
      "Use the 3M / 6M / All selector to filter the time window.",
      "Click 'Export PDF' on any chart to download a branded trend summary.",
    ],
  },
  {
    icon: FileText,
    color: "text-[#A39EBA]",
    bg: "bg-[#A39EBA]/10",
    title: "Generating a Doctor's Letter",
    steps: [
      "Scroll to the 'Doctor Prep' section on the home page.",
      "Enter your name, select your primary biomarker of concern, and describe your symptoms.",
      "Click 'Generate Custom Letter' to preview your personalized physician prep sheet.",
      "Click 'Download PDF' to save a professionally branded letter to bring to your appointment.",
    ],
  },
  {
    icon: Mic,
    color: "text-[#7E9A85]",
    bg: "bg-[#7E9A85]/10",
    title: "Using Voice Input in the Medical Assistant",
    steps: [
      "Open the Medical Assistant widget (chat bubble, bottom-right corner).",
      "Click the microphone button (🎤) in the message input area.",
      "Speak your question clearly — the widget will transcribe and send it automatically.",
      "Voice input works best in Chrome and Edge browsers.",
    ],
  },
  {
    icon: Volume2,
    color: "text-[#D48C70]",
    bg: "bg-[#D48C70]/10",
    title: "Enabling Text-to-Speech Readout",
    steps: [
      "Open the Medical Assistant widget.",
      "Click the speaker icon (🔊) in the widget header.",
      "The footer will confirm 'Voice readout ON' — all new AI responses will be read aloud.",
      "Click 'Stop' in the status bar to pause speech at any time.",
      "Click the speaker icon again to turn voice readout off.",
    ],
  },
  {
    icon: Download,
    color: "text-[#A39EBA]",
    bg: "bg-[#A39EBA]/10",
    title: "Exporting Reports as PDF",
    steps: [
      "Doctor's Letter: Use the 'Download PDF' button in the Doctor Prep section.",
      "Biomarker Report: Open your Dashboard and click 'Export PDF' on any saved lab report.",
      "AI Recommendations: On the Lifestyle AI page, click 'Export PDF' after generating a plan.",
      "Trend Chart: Click the PDF icon in the header of any biomarker trend chart.",
    ],
  },
];

const QUICK_LINKS = [
  { label: "Frequently Asked Questions", href: "/faq", icon: BookOpen },
  { label: "Contact Support", href: "/contact", icon: MessageCircle },
  { label: "Privacy Policy", href: "/privacy", icon: Shield },
  { label: "Terms of Service", href: "/terms", icon: FileText },
];

export default function Support() {
  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Help Center & Support"
        description="Get help with The Patient's Compass. Find guides, troubleshooting tips, and answers to common support questions."
        path="/support"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="bg-[#7E9A85] text-white p-2 rounded-xl shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">The Patient's Compass</span>
              <p className="text-[10px] text-[#7E9A85] font-semibold tracking-wider uppercase">Health Intelligence System</p>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-[#5C5A59] hover:text-[#2C2A29] transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 border-b border-[#EBE6DC] bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <div className="bg-[#7E9A85]/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-[#7E9A85]">
            <LifeBuoy className="w-7 h-7" />
          </div>
          <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
            Help Center
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-[#2C2A29]">How Can We Help?</h1>
          <p className="text-base text-[#5C5A59] leading-relaxed max-w-xl mx-auto">
            Step-by-step guides for every feature on The Patient's Compass platform. Find what you need below or contact our support team.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 border-b border-[#EBE6DC]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-[#EBE6DC] shadow-sm hover:shadow-md hover:border-[#7E9A85] transition-all cursor-pointer text-center">
                    <Icon className="w-5 h-5 text-[#7E9A85]" />
                    <span className="text-xs font-semibold text-[#2C2A29] leading-snug">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step-by-Step Guides */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-serif font-bold text-[#2C2A29]">Step-by-Step Guides</h2>
            <p className="text-sm text-[#5C5A59]">Everything you need to get the most out of the platform.</p>
          </div>

          {GUIDE_SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-white rounded-3xl border border-[#EBE6DC] shadow-sm p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.bg}`}>
                    <Icon className={`w-5 h-5 ${section.color}`} />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#2C2A29]">{section.title}</h3>
                </div>
                <ol className="space-y-3">
                  {section.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-start gap-3">
                      <span className="bg-[#7E9A85]/10 text-[#7E9A85] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {stepIdx + 1}
                      </span>
                      <p className="text-sm text-[#5C5A59] leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>
      </section>

      {/* Still need help — enhanced CTA card */}
      <section className="py-16 border-t border-[#EBE6DC] bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-gradient-to-br from-[#7E9A85]/10 to-[#A39EBA]/10 border border-[#7E9A85]/20 rounded-3xl p-8 sm:p-10 text-center space-y-6">
            <div className="bg-[#7E9A85]/15 text-[#7E9A85] w-14 h-14 rounded-2xl flex items-center justify-center mx-auto">
              <LifeBuoy className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C2A29]">Still need help?</h3>
              <p className="text-sm text-[#5C5A59] max-w-md mx-auto leading-relaxed">
                Our support team typically responds within 24 hours on business days. You can also reach us directly by email.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              <a
                href="mailto:support@thepatientscompass.com"
                className="flex items-center gap-2 bg-white border border-[#EBE6DC] hover:bg-[#F5F1E9] text-[#2C2A29] px-5 py-3 rounded-xl font-semibold transition-colors shadow-sm"
              >
                <Shield className="w-4 h-4 text-[#7E9A85]" />
                support@thepatientscompass.com
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/contact">
                <button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-[#7E9A85]/20 active:scale-[0.97]">
                  Open Contact Form
                </button>
              </Link>
              <Link href="/faq">
                <button className="bg-white border border-[#EBE6DC] hover:bg-[#F5F1E9] text-[#2C2A29] px-7 py-3 rounded-xl text-sm font-semibold transition-colors">
                  Browse FAQ
                </button>
              </Link>
            </div>
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
