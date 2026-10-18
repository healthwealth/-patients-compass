import SEO from "@/components/SEO";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  X,
  Zap,
  Crown,
  Activity,
  ArrowRight,
  Loader2,
  Star,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { Menu, X as XIcon } from "lucide-react";
import { useState as useMenuState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import ShopifyProductEmbed from "@/components/ShopifyProductEmbed";

const FREE_FEATURES = [
  { text: "Symptom Quiz & Biomarker Recommendations", included: true },
  { text: "Interactive Biomarker Range Explorer", included: true },
  { text: "Biomarker Directory (25+ markers)", included: true },
  { text: "Basic Medical Assistant (3 queries/day)", included: true },
  { text: "Sample Book Chapters", included: true },
  { text: "FAQ & Help Center Access", included: true },
  { text: "AI Lab Report Upload & Analysis", included: false },
  { text: "Unlimited Medical Assistant", included: false },
  { text: "Biomarker Trend Tracking & Charts", included: false },
  { text: "AI Trend Intelligence Summaries", included: false },
  { text: "Health Timeline & Notes", included: false },
  { text: "Personalized Lifestyle AI", included: false },
  { text: "PDF Export (Letters, Reports, Charts)", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "AI Lab Report Upload & Analysis", included: true },
  { text: "Unlimited Medical Assistant (all 3 modes)", included: true },
  { text: "Biomarker Trend Tracking & Charts", included: true },
  { text: "AI Trend Intelligence Summaries", included: true },
  { text: "Health Timeline & Notes", included: true },
  { text: "Personalized Lifestyle AI Recommendations", included: true },
  { text: "PDF Export (Doctor's Letter, Reports, Charts)", included: true },
  { text: "Doctor's Letter Generator (AI-powered)", included: true },
  { text: "Priority Email Support", included: true },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useMenuState(false);

  const { data: subStatus } = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckout = trpc.shopifyCheckout.createCart.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to secure Shopify checkout…");
        window.location.href = data.checkoutUrl;
      }
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    },
  });

  // Guest checkout — works without login
  const createGuestCheckout = trpc.shopifyCheckout.createCart.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to secure Shopify checkout…");
        window.location.href = data.checkoutUrl;
      }
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    },
  });

  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err) => {
      toast.error(err.message || "Could not open billing portal.");
    },
  });

  const subscribeNewsletter = trpc.email.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Thank you for subscribing! Check your email for updates.");
      setNewsletterEmail("");
      setNewsletterLoading(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to subscribe. Please try again.");
      setNewsletterLoading(false);
    },
  });

  const handleNewsletterSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setNewsletterLoading(true);
    subscribeNewsletter.mutate({
      email: newsletterEmail,
      name: "",
    });
  };

  const handleUpgrade = (plan: "monthly" | "yearly") => {
    setLoadingPlan(plan);
    if (isAuthenticated) {
      createCheckout.mutate({ plan, origin: window.location.origin });
    } else {
      createGuestCheckout.mutate({ plan, origin: window.location.origin });
    }
  };

  const handleManage = () => {
    createPortal.mutate({ origin: window.location.origin });
  };

  const isPro = subStatus?.isPro;

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#2C2A29]">
      <SEO
        title="Pricing & Plans"
        description="Compare Patients Compass Free and Pro plans for lab education, biomarker tools, doctor-visit preparation, and expanded Health Companion access."
        path="/pricing"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-[#7E9A85] text-white p-2 rounded-xl shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight">The Patient's Compass</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#5C5A59]">
            <Link href="/" className="hover:text-[#2C2A29] transition-colors">Home</Link>
            <Link href="/books" className="hover:text-[#2C2A29] transition-colors">Books</Link>
            <Link href="/biomarkers" className="hover:text-[#2C2A29] transition-colors">Biomarkers</Link>
            <Link href="/features" className="hover:text-[#2C2A29] transition-colors">Features</Link>
            <Link href="/medical-assistant" className="hover:text-[#2C2A29] transition-colors">Health Companion</Link>
            <Link href="/blog" className="hover:text-[#2C2A29] transition-colors">Blog</Link>
            <Link href="/pricing" className="text-[#2C2A29] font-semibold border-b-2 border-[#7E9A85] pb-0.5">Pricing</Link>
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
          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-[#5C5A59] hover:bg-[#EBE6DC]/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#EBE6DC] bg-[#F9F6F0]/98 backdrop-blur-md">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Home</Link>
              <Link href="/books" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Books</Link>
              <Link href="/biomarkers" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Biomarkers</Link>
              <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Features</Link>
              <Link href="/medical-assistant" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Health Companion</Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Blog</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#2C2A29] bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl">Pricing</Link>
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#7E9A85] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">My Dashboard</Link>
              ) : (
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#7E9A85] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Sign In</Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center space-y-4 mb-14">
          <Badge className="bg-[#7E9A85]/10 text-[#7E9A85] border-none px-3 py-1 rounded-full text-xs font-semibold">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#2C2A29]">
            Choose Your Health Intelligence Plan
          </h1>
          <p className="text-base text-[#5C5A59] max-w-xl mx-auto">
            Start free and upgrade when you are ready to unlock the full power of your lab data.
          </p>

          {/* Billing toggle — Monthly vs Yearly */}
          <div className="flex flex-col items-center gap-2 mt-4">
            {/* Floating save badge — always visible above the toggle */}
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                billingCycle === "yearly"
                  ? "bg-[#D48C70] text-white shadow-md scale-105"
                  : "bg-[#D48C70]/15 text-[#D48C70] border border-[#D48C70]/30"
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1l1.12 2.27 2.5.36-1.81 1.76.43 2.49L6 6.75l-2.24 1.13.43-2.49L2.38 3.63l2.5-.36L6 1z"/>
              </svg>
              Save $8.01 — Annual Value
            </div>

            <div className="inline-flex items-center bg-white border border-[#EBE6DC] rounded-2xl p-1 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-[#7E9A85] text-white shadow-sm"
                    : "text-[#5C5A59] hover:text-[#2C2A29]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-[#7E9A85] text-white shadow-sm"
                    : "text-[#5C5A59] hover:text-[#2C2A29]"
                }`}
              >
                Yearly
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all duration-200 ${
                    billingCycle === "yearly"
                      ? "bg-white/25 text-white"
                      : "bg-[#D48C70] text-white"
                  }`}
                >
                  −7%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="border border-[#EBE6DC] rounded-3xl bg-white shadow-sm">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#EBE6DC] text-[#5C5A59] p-2.5 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif font-bold">Free</CardTitle>
                  <p className="text-xs text-[#9E9A90] font-medium">Get started, no credit card needed</p>
                </div>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-serif font-bold text-[#2C2A29]">$0</span>
                <span className="text-sm text-[#9E9A90] mb-1">/ forever</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-3">
                {FREE_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-[#7E9A85] shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-[#C5C0B5] shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? "text-[#2C2A29]" : "text-[#C5C0B5]"}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
              {isAuthenticated && !isPro ? (
                <div className="bg-[#7E9A85]/10 border border-[#7E9A85]/20 text-[#7E9A85] text-sm font-semibold text-center py-3 rounded-xl">
                  ✓ Your Current Plan
                </div>
              ) : (
                <Link href="/">
                  <Button variant="outline" className="w-full border-[#EBE6DC] hover:bg-[#F5F1E9] rounded-xl py-5 text-sm font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-2 border-[#7E9A85] rounded-3xl bg-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#7E9A85] to-[#A3C4A8]" />
            <div className="absolute top-4 right-4">
              <Badge className="bg-[#7E9A85] text-white border-none text-xs font-bold px-2.5 py-1 flex items-center gap-1">
                <Star className="w-3 h-3" />
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#7E9A85]/15 text-[#7E9A85] p-2.5 rounded-xl">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-serif font-bold">Pro</CardTitle>
                  <p className="text-xs text-[#9E9A90] font-medium">Full health intelligence system</p>
                </div>
              </div>
              <div className="flex items-end gap-1">
                {billingCycle === "monthly" ? (
                  <>
                    <span className="text-4xl font-serif font-bold text-[#2C2A29]">$9</span>
                    <span className="text-sm text-[#9E9A90] mb-1">/ month</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-serif font-bold text-[#2C2A29]">$99.99</span>
                    <span className="text-sm text-[#9E9A90] mb-1">/ year</span>
                    <span className="ml-2 text-xs text-[#D48C70] font-bold bg-[#D48C70]/10 px-2 py-0.5 rounded-full">
                      Save $8.01/yr
                    </span>
                  </>
                )}
              </div>
              {billingCycle === "yearly" && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#7E9A85] font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Billed annually — just $8.33/month</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              <div className="space-y-3">
                {PRO_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#7E9A85] shrink-0" />
                    <span className="text-sm text-[#2C2A29]">{feature.text}</span>
                  </div>
                ))}
              </div>

              {isPro ? (
                <div className="space-y-3">
                  <div className="bg-[#7E9A85]/10 border border-[#7E9A85]/20 text-[#7E9A85] text-sm font-semibold text-center py-3 rounded-xl">
                    ✓ You are a Pro Member
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-[#EBE6DC] hover:bg-[#F5F1E9] rounded-xl py-5 text-sm font-semibold"
                    onClick={handleManage}
                    disabled={createPortal.isPending}
                  >
                    {createPortal.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Manage Subscription
                  </Button>
                </div>
              ) : (
                billingCycle === "monthly" ? (
                  <ShopifyProductEmbed
                    productId="10818193850533"
                    ariaLabel="Monthly Pro Shopify checkout"
                  />
                ) : (
                  <ShopifyProductEmbed
                    productId="10818195357861"
                    ariaLabel="Yearly Pro Shopify checkout"
                  />
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#5C5A59] border-t border-[#EBE6DC] pt-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#7E9A85]" />
            <span>Secure checkout via Shopify Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#7E9A85]" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-[#7E9A85]" />
            <span>7-day money-back guarantee</span>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Card className="border border-[#EBE6DC] rounded-3xl bg-gradient-to-br from-[#7E9A85]/5 to-[#D48C70]/5 shadow-sm">
            <CardContent className="p-8">
              <div className="text-center space-y-4 mb-6">
                <h3 className="text-2xl font-serif font-bold text-[#2C2A29]">Stay Updated</h3>
                <p className="text-sm text-[#5C5A59]">
                  Get weekly health insights, biomarker tips, and exclusive updates delivered to your inbox.
                </p>
              </div>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#EBE6DC] bg-white text-[#2C2A29] placeholder-[#9E9A90] focus:outline-none focus:ring-2 focus:ring-[#7E9A85]/50 text-sm"
                  disabled={newsletterLoading}
                />
                <Button
                  type="submit"
                  className="bg-[#7E9A85] hover:bg-[#6A8571] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md shadow-[#7E9A85]/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-150 whitespace-nowrap"
                  disabled={newsletterLoading}
                >
                  {newsletterLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
              <p className="text-xs text-[#9E9A90] text-center mt-4">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ teaser */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-sm text-[#5C5A59]">Have questions about the plans?</p>
          <Link href="/faq">
            <Button variant="link" className="text-[#7E9A85] font-semibold text-sm">
              Read our FAQ →
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#EBE6DC] py-8 text-center text-xs text-[#9E9A90]">
        <p>© {new Date().getFullYear()} The Patient's Compass. All rights reserved.</p>
          <p>Educational Content Only — Not Medical Advice</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:text-[#5C5A59] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#5C5A59] transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-[#5C5A59] transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
