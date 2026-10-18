import SEO from "@/components/SEO";
import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Mail, MessageSquare, Clock, CheckCircle2, Send, Phone, MapPin, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const notify = trpc.system.notifyOwner.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await notify.mutateAsync({
        title: `New Contact Form: ${form.subject}`,
        content: `From: ${form.name} <${form.email}>\n\nSubject: ${form.subject}\n\n${form.message}`,
      });
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you within 24 hours.");
    } catch {
      toast.error("Failed to send message. Please try emailing us directly.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Contact Us"
        description="Get in touch with The Patient's Compass team. Questions about lab interpretation, our books, or the platform — we're here to help."
        path="/contact"
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
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#5C5A59]">
            <Link href="/" className="hover:text-[#2C2A29] transition-colors">Home</Link>
            <Link href="/books" className="hover:text-[#2C2A29] transition-colors">Books</Link>
            <Link href="/biomarkers" className="hover:text-[#2C2A29] transition-colors">Biomarkers</Link>
            <Link href="/features" className="hover:text-[#2C2A29] transition-colors">Features</Link>
            <Link href="/medical-assistant" className="hover:text-[#2C2A29] transition-colors">Health Companion</Link>
            <Link href="/blog" className="hover:text-[#2C2A29] transition-colors">Blog</Link>
            <Link href="/pricing" className="hover:text-[#2C2A29] transition-colors">Pricing</Link>
          </nav>
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-[#7E9A85] text-[#7E9A85] hover:bg-[#7E9A85]/10 rounded-xl text-xs">My Dashboard</Button>
              </Link>
            ) : (
              <Link href="/signin">
                <Button size="sm" className="bg-[#7E9A85] hover:bg-[#6A8571] text-white rounded-xl text-xs">Sign In</Button>
              </Link>
            )}
          </div>
          <button
            className="md:hidden p-2 rounded-xl text-[#5C5A59] hover:bg-[#EBE6DC]/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#EBE6DC] bg-[#F9F6F0]/98 backdrop-blur-md">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Home</Link>
              <Link href="/books" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Books</Link>
              <Link href="/biomarkers" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Biomarkers</Link>
              <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Features</Link>
              <Link href="/medical-assistant" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Health Companion</Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Blog</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Pricing</Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#2C2A29] bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl">Contact</Link>
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#7E9A85] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">My Dashboard</Link>
              ) : (
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#7E9A85] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Sign In</Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="py-16 border-b border-[#EBE6DC] bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <div className="bg-[#7E9A85]/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-[#7E9A85]">
            <MessageSquare className="w-7 h-7" />
          </div>
          <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
            Get in Touch
          </Badge>
          <h1 className="text-4xl font-serif font-bold text-[#2C2A29]">Contact Us</h1>
          <p className="text-base text-[#5C5A59] leading-relaxed max-w-xl mx-auto">
            Have a question, feedback, or need help? We're here for you. Our team typically responds within one business day.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-12 gap-12">

          {/* Left: Contact Info */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#2C2A29] mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#EBE6DC] shadow-sm">
                  <div className="bg-[#7E9A85]/10 p-2 rounded-lg text-[#7E9A85] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider mb-0.5">General Support</p>
                    <a href="mailto:support@thepatientscompass.com" className="text-sm font-semibold text-[#7E9A85] hover:underline">
                      support@thepatientscompass.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#EBE6DC] shadow-sm">
                  <div className="bg-[#D48C70]/10 p-2 rounded-lg text-[#D48C70] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider mb-0.5">Privacy & Data</p>
                    <a href="mailto:privacy@thepatientscompass.com" className="text-sm font-semibold text-[#D48C70] hover:underline">
                      privacy@thepatientscompass.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#EBE6DC] shadow-sm">
                  <div className="bg-[#A39EBA]/10 p-2 rounded-lg text-[#A39EBA] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider mb-0.5">Response Time</p>
                    <p className="text-sm font-semibold text-[#2C2A29]">Within 24 hours</p>
                    <p className="text-xs text-[#9E9A90]">Monday – Friday, 9am – 5pm EST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[#7E9A85]/5 p-5 rounded-2xl border border-[#7E9A85]/15 space-y-3">
              <h3 className="text-xs font-bold text-[#7E9A85] uppercase tracking-wider">Quick Links</h3>
              <div className="space-y-2 text-sm">
                <Link href="/faq"><span className="block text-[#5C5A59] hover:text-[#7E9A85] cursor-pointer transition-colors font-medium">→ Frequently Asked Questions</span></Link>
                <Link href="/support"><span className="block text-[#5C5A59] hover:text-[#7E9A85] cursor-pointer transition-colors font-medium">→ Help Center & Guides</span></Link>
                <Link href="/privacy"><span className="block text-[#5C5A59] hover:text-[#7E9A85] cursor-pointer transition-colors font-medium">→ Privacy Policy</span></Link>
                <Link href="/terms"><span className="block text-[#5C5A59] hover:text-[#7E9A85] cursor-pointer transition-colors font-medium">→ Terms of Service</span></Link>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="bg-white rounded-3xl border border-[#EBE6DC] shadow-md p-10 text-center space-y-5">
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#2C2A29]">Message Received!</h3>
                <p className="text-sm text-[#5C5A59] max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out. We'll review your message and respond to <strong>{form.email}</strong> within one business day.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="text-[#7E9A85] text-sm font-semibold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#EBE6DC] shadow-md p-8 sm:p-10">
                <h2 className="text-xl font-serif font-bold text-[#2C2A29] mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Your Name *</label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Sarah Jenkins"
                        className="border-[#EBE6DC] rounded-xl focus-visible:ring-[#7E9A85]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Email Address *</label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="sarah@example.com"
                        className="border-[#EBE6DC] rounded-xl focus-visible:ring-[#7E9A85]"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Subject *</label>
                    <Input
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Question about my lab results"
                      className="border-[#EBE6DC] rounded-xl focus-visible:ring-[#7E9A85]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#5C5A59] uppercase tracking-wider">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={6}
                      placeholder="Tell us how we can help you..."
                      className="w-full p-3 rounded-xl border border-[#EBE6DC] bg-white focus:border-[#7E9A85] focus:outline-none text-sm font-medium resize-none"
                      required
                    />
                  </div>
                  <div className="bg-[#F9F6F0] p-4 rounded-xl border border-[#EBE6DC] text-xs text-[#9E9A90] leading-relaxed">
                    <strong className="text-[#5C5A59]">Important:</strong> Please do not include personal medical information, diagnoses, or specific lab values in this form. For health questions, use the Medical Assistant widget or consult your healthcare provider.
                  </div>
                  <Button
                    type="submit"
                    disabled={notify.isPending}
                    className="w-full bg-[#7E9A85] hover:bg-[#6A8571] text-white py-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  >
                    <Send className="w-4 h-4" />
                    {notify.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            )}
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
            <Link href="/faq"><span className="hover:text-white cursor-pointer transition-colors">FAQ</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
