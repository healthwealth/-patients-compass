import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Brain,
  BarChart3,
  Zap,
  FileText,
  Leaf,
  MessageCircle,
  Lock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Mic,
  Download,
  Share2,
  Menu,
  X,
  Settings2,
  FileChartColumn,
  Users,
  TrendingUp,
  PlugZap,
  HeartHandshake,
  ShieldCheck,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Features() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const freeFeatures = [
    {
      icon: BookOpen,
      title: "19 Published Books",
      description: "Access sample chapters from our comprehensive lab guides and health education resources",
      details: ["Real Amazon covers", "Full sample chapters", "Searchable catalog", "Category filtering"],
    },
    {
      icon: BarChart3,
      title: "Biomarker Library",
      description: "Explore 25+ lab markers with optimal ranges and functional medicine guidelines",
      details: ["Standard vs optimal ranges", "Symptom mapping", "Lifestyle factors", "Doctor questions"],
    },
    {
      icon: Leaf,
      title: "Lifestyle AI",
      description: "Get personalized nutrition and wellness recommendations based on your biomarkers",
      details: ["AI-powered analysis", "Nutrition focus", "Lifestyle habits", "PDF export"],
    },
    {
      icon: Brain,
      title: "AI Lab Scanner (Demo)",
      description: "Try our AI lab report analyzer with sample data",
      details: ["Upload demo PDFs", "See AI analysis", "Understand biomarkers", "Limited to demo mode"],
    },
    {
      icon: MessageCircle,
      title: "Health Companion AI Assistant",
      description: "Chat with our AI health educator (3 queries/day limit)",
      details: ["Health questions", "Lab analysis mode", "Nutrition coaching", "Daily reset"],
    },
    {
      icon: FileText,
      title: "Doctor's Letter Generator",
      description: "Create professional letters to prepare for doctor visits",
      details: ["Biomarker selection", "Symptom tracking", "PDF export", "Physician-ready format"],
    },
  ];

  const proFeatures = [
    {
      icon: Zap,
      title: "Unlimited AI Queries",
      description: "Use Health Companion AI assistant unlimited times per day",
      details: ["No daily limits", "All 3 AI modes", "Full conversation history", "Priority responses"],
    },
    {
      icon: BarChart3,
      title: "Full Lab Report Analysis",
      description: "Upload and analyze your actual lab reports with AI",
      details: ["PDF/JPG upload", "Automatic parsing", "AI interpretation", "Trend tracking"],
    },
    {
      icon: Download,
      title: "Advanced PDF Exports",
      description: "Export comprehensive health reports and analyses",
      details: ["Lab reports", "Trend summaries", "AI recommendations", "Branded headers"],
    },
    {
      icon: Share2,
      title: "Share Insights",
      description: "Share AI responses and analyses with healthcare providers",
      details: ["Copy-to-clipboard", "Professional formatting", "Email-ready", "HIPAA-aligned"],
    },
    {
      icon: Sparkles,
      title: "Priority Support",
      description: "Get faster responses to your questions and issues",
      details: ["Email support", "Faster response times", "Feature requests", "Beta access"],
    },
    {
      icon: Lock,
      title: "Advanced Privacy",
      description: "Enhanced data security and privacy controls",
      details: ["Encrypted storage", "Data retention control", "Export all data", "Account deletion"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC]">
      <SEO
        title="Features & Capabilities"
        description="Explore free and Pro features of The Patient's Compass — AI lab analysis, biomarker education, Health Companion AI, and personalized health insights."
        path="/features"
      />
      {/* Site Nav */}
      <header className="sticky top-0 z-50 bg-[#F9F6F0]/90 backdrop-blur-md border-b border-[#EBE6DC]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="bg-[#7E9A85] text-white p-2 rounded-xl shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#2C2A29]">The Patient's Compass</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#5C5A59]">
            <Link href="/" className="hover:text-[#2C2A29] transition-colors">Home</Link>
            <Link href="/books" className="hover:text-[#2C2A29] transition-colors">Books</Link>
            <Link href="/biomarkers" className="hover:text-[#2C2A29] transition-colors">Biomarkers</Link>
            <Link href="/features" className="text-[#2C2A29] font-semibold border-b-2 border-[#7E9A85] pb-0.5">Features</Link>
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
          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-[#5C5A59] hover:bg-[#EBE6DC]/40 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#EBE6DC] bg-[#F9F6F0]/98 backdrop-blur-md">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Home</Link>
              <Link href="/books" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Books</Link>
              <Link href="/biomarkers" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Biomarkers</Link>
              <Link href="/features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#2C2A29] bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl">Features</Link>
              <Link href="/medical-assistant" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Health Companion</Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Blog</Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-[#5C5A59] hover:text-[#2C2A29] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Pricing</Link>
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#7E9A85] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">My Dashboard</Link>
              ) : (
                <Link href="/signin" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-[#7E9A85] hover:bg-[#EBE6DC]/40 px-3 py-2.5 rounded-xl transition-colors">Sign In</Link>
              )}
            </nav>
          </div>
        )}
      </header>
      {/* Hero Banner */}
      <div className="bg-[#7E9A85] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Features & Capabilities</h1>
          <p className="text-lg text-[#E8E4DC] max-w-2xl">
            Discover everything The Patient's Compass offers — from free educational tools to premium AI-powered health intelligence.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-[#EBE6DC] border-[#D1C7BD]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upgrade">Upgrade Guide</TabsTrigger>
            <TabsTrigger value="ai-guide">AI Features</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Pricing Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Tier */}
              <Card className="border-[#D1C7BD] relative">
                <CardHeader className="bg-gradient-to-r from-[#F9F6F0] to-[#EBE6DC]">
                  <CardTitle className="text-[#2C2A29] flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    Free Tier
                  </CardTitle>
                  <CardDescription>Perfect for learning and exploration</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-[#7E9A85]">$0</p>
                    <p className="text-[#5C5A59]">Forever free access</p>
                  </div>
                  <Button className="w-full mb-6 bg-[#7E9A85] hover:bg-[#6A8571] text-white">
                    You're on Free Tier
                  </Button>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#2C2A29] mb-4">What's Included:</h4>
                    {freeFeatures.map((feature, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <CheckCircle className="w-5 h-5 text-[#7E9A85] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#2C2A29]">{feature.title}</p>
                          <p className="text-sm text-[#5C5A59]">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pro Tier */}
              <Card className="border-[#D4A574] relative ring-2 ring-[#D4A574]">
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-[#D4A574] text-white">RECOMMENDED</Badge>
                </div>
                <CardHeader className="bg-gradient-to-r from-[#FFF8F0] to-[#FFF0E6]">
                  <CardTitle className="text-[#2C2A29] flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    Pro Tier
                  </CardTitle>
                  <CardDescription>For serious health optimization</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-[#D4A574]">$9</p>
                      <p className="text-[#5C5A59]">/month</p>
                    </div>
                    <p className="text-sm text-[#5C5A59] mt-1">or $99.99/year (save $8.01)</p>
                  </div>
                  <Link href="/pricing">
                  <Button className="w-full mb-6 bg-[#D4A574] hover:bg-[#C49560] text-white">
                    Upgrade to Pro <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#2C2A29] mb-4">Everything in Free, Plus:</h4>
                    {proFeatures.map((feature, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <CheckCircle className="w-5 h-5 text-[#D4A574] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#2C2A29]">{feature.title}</p>
                          <p className="text-sm text-[#5C5A59]">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coming Soon Roadmap */}
            <div className="mt-16 pt-12 border-t border-[#D1C7BD]">
              <div className="mb-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#7E9A85]/30 bg-[#7E9A85]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#687D6D]">
                  <Sparkles className="h-3.5 w-3.5" /> Product roadmap
                </div>
                <h2 className="text-3xl font-bold text-[#2C2A29] mb-2">Coming Soon</h2>
                <p className="text-[#5C5A59] text-lg">Planned capabilities designed around education, preparation, and safer care navigation.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "API Access",
                    description: "Integrate Patient's Compass with your own apps and workflows",
                    timeline: "Q3 2026",
                    icon: Settings2,
                  },
                  {
                    title: "Custom Reports",
                    description: "Generate branded health reports with your clinic logo and letterhead",
                    timeline: "Q3 2026",
                    icon: FileChartColumn,
                  },
                  {
                    title: "Team Sharing",
                    description: "Share health data securely with family members or healthcare providers",
                    timeline: "Q4 2026",
                    icon: Users,
                  },
                  {
                    title: "Biomarker Trends",
                    description: "Track biomarker changes over time with interactive charts and AI insights",
                    timeline: "Q3 2026",
                    icon: TrendingUp,
                  },
                  {
                    title: "Integration Hub",
                    description: "Connect with Fitbit, Apple Health, Oura Ring, and other wearables",
                    timeline: "Q4 2026",
                    icon: PlugZap,
                  },
                  {
                    title: "Licensed Care Connections",
                    description: "Connect with independent, licensed healthcare professionals through secure telehealth partners",
                    timeline: "Q1 2027",
                    icon: HeartHandshake,
                    featured: true,
                  },
                ].map((feature, idx) => (
                  <Card key={idx} className={`transition-all hover:-translate-y-0.5 hover:shadow-lg ${feature.featured ? "border-[#7E9A85]/45 bg-gradient-to-br from-[#F2F7F2] to-[#FFFDFC] shadow-[0_12px_32px_rgba(79,105,86,0.10)]" : "border-[#D4A574]/30 bg-gradient-to-br from-[#FFF8F0]/50 to-[#FFF0E6]/30"}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.featured ? "bg-[#7E9A85]/15 text-[#687D6D]" : "bg-[#D4A574]/12 text-[#B37B4D]"}`}><feature.icon className="h-5 w-5" /></span>
                        <Badge className={feature.featured ? "border border-[#7E9A85]/45 bg-[#7E9A85]/10 text-[#687D6D]" : "bg-[#D4A574]/20 text-[#B87946] border border-[#D4A574]"}>
                          {feature.timeline}
                        </Badge>
                      </div>
                      <CardTitle className="text-[#2C2A29]">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#5C5A59]">{feature.description}</p>
                      {feature.title === "Integration Hub" && <Link href="/integrations" className="mt-4 inline-flex"><Button variant="outline" className="border-[#BFCFBE] text-[#58705E] hover:bg-[#F1F6F1]">View connection status <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>}
                      {feature.featured && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#687D6D]"><ShieldCheck className="h-4 w-4" /> Education and navigation—not clinical care</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="mt-8 overflow-hidden rounded-3xl border border-[#7E9A85]/35 bg-[#FCFDFB] shadow-[0_18px_50px_rgba(61,81,68,0.08)]">
                <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#7E9A85]/12 px-3 py-1 text-xs font-semibold text-[#687D6D]"><HeartHandshake className="h-4 w-4" /> Licensed Care Connections · directory</div>
                    <h3 className="font-serif text-2xl font-bold text-[#2C2A29] sm:text-3xl">A clear handoff to independent care</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5C5A59] sm:text-base">Patients Compass would help users discover an eligible partner and then continue in that partner's secure environment. The partner—not Patients Compass—would provide any consultation, clinical records, consent, billing, or treatment.</p>
                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                      {[
                        { step: "01", title: "Choose a need", copy: "Select a general care category and confirm your location." },
                        { step: "02", title: "Review the partner", copy: "See provider independence, availability, privacy, and eligibility notices." },
                        { step: "03", title: "Continue securely", copy: "Open the partner service; no health content is shared by default." },
                      ].map((item) => <div key={item.step} className="rounded-2xl border border-[#DCE5DD] bg-white p-4"><p className="text-[11px] font-bold tracking-[0.16em] text-[#7E9A85]">{item.step}</p><p className="mt-2 font-semibold text-[#2C2A29]">{item.title}</p><p className="mt-1 text-xs leading-5 text-[#6E716D]">{item.copy}</p></div>)}
                    </div>
                  </div>
                  <div className="border-t border-[#DCE5DD] bg-[#EDF3EE] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#687D6D]">Planned safety boundary</p>
                    <div className="mt-5 space-y-4">
                      <p className="flex gap-3 text-sm leading-6 text-[#465047]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#6F8D78]" /> No lab results, documents, symptoms, or AI conversations shared by default.</p>
                      <p className="flex gap-3 text-sm leading-6 text-[#465047]"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#6F8D78]" /> Availability depends on the user's location and the provider's license.</p>
                      <p className="flex gap-3 text-sm leading-6 text-[#465047]"><ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-[#6F8D78]" /> Partner terms, privacy practices, consent, billing, and clinical policies apply after handoff.</p>
                    </div>
                    <div className="mt-6 rounded-2xl border border-[#C9D8CB] bg-white/80 p-4 text-xs leading-5 text-[#5C665D]"><strong className="text-[#38453B]">Not for emergencies.</strong> Licensed Care Connections does not provide urgent response, diagnosis, treatment, or continuous monitoring.</div>
                    <Link href="/care-connections" className="mt-5 inline-flex"><Button className="bg-[#71917A] text-white hover:bg-[#607A68]">Browse the directory <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-[#FFF8F0] rounded-lg border border-[#D4A574] text-center">
                <p className="text-[#5C5A59] mb-4">
                  Want to influence our roadmap? <strong>Vote on features</strong> you'd like to see first.
                </p>
                <Link href="/contact">
                  <Button className="bg-[#D4A574] hover:bg-[#C49560] text-white">
                    Share Your Feedback
                  </Button>
                </Link>
              </div>
            </div>

            {/* Feature Details Grid */}
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-[#2C2A29] mb-8">Free Features in Detail</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {freeFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={idx} className="border-[#D1C7BD] hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Icon className="w-8 h-8 text-[#7E9A85]" />
                          <Badge variant="outline" className="border-[#D1C7BD]">Free</Badge>
                        </div>
                        <CardTitle className="text-[#2C2A29]">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[#5C5A59] mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                          {feature.details.map((detail, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-[#5C5A59]">
                              <span className="w-1.5 h-1.5 bg-[#7E9A85] rounded-full" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Pro Features Grid */}
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-[#2C2A29] mb-8">Pro Features in Detail</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proFeatures.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={idx} className="border-[#D4A574] hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <Icon className="w-8 h-8 text-[#D4A574]" />
                          <Badge className="bg-[#D4A574] text-white">Pro</Badge>
                        </div>
                        <CardTitle className="text-[#2C2A29]">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[#5C5A59] mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                          {feature.details.map((detail, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-[#5C5A59]">
                              <span className="w-1.5 h-1.5 bg-[#D4A574] rounded-full" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Upgrade Guide Tab */}
          <TabsContent value="upgrade" className="space-y-8">
            <div className="bg-white border border-[#D1C7BD] rounded-lg p-8">
              <h2 className="text-3xl font-bold text-[#2C2A29] mb-6">How to Upgrade to Pro</h2>

              {/* Step-by-step guide */}
              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: "Click the Upgrade Button",
                    description: "Navigate to the Pricing page or click 'Upgrade to Pro' anywhere on the site.",
                    action: "You can start from any page",
                  },
                  {
                    step: 2,
                    title: "Choose Your Plan",
                    description: "Select between monthly ($9/month) or yearly ($99.99/year — save $8.01).",
                    action: "Use the toggle to compare prices",
                  },
                  {
                    step: 3,
                    title: "Enter Payment Details",
                    description: "You'll be redirected to our secure Stripe checkout page.",
                    action: "No account sign-in required",
                  },
                  {
                    step: 4,
                    title: "Complete Payment",
                    description: "Enter your card information and complete the transaction.",
                    action: "Instant activation after payment",
                  },
                  {
                    step: 5,
                    title: "Start Using Pro Features",
                    description: "Your Pro status is activated immediately. All premium features are now available.",
                    action: "No confirmation email needed",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-6 pb-6 border-b border-[#EBE6DC] last:border-0">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#7E9A85] text-white font-bold">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#2C2A29] mb-2">{item.title}</h3>
                      <p className="text-[#5C5A59] mb-2">{item.description}</p>
                      <p className="text-sm text-[#7E9A85] font-medium">{item.action}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-8 p-6 bg-gradient-to-r from-[#FFF8F0] to-[#FFF0E6] rounded-lg border border-[#D4A574]">
                <h3 className="text-xl font-bold text-[#2C2A29] mb-3">Ready to Upgrade?</h3>
                <p className="text-[#5C5A59] mb-4">
                  Get unlimited AI queries, full lab report analysis, and all premium features.
                </p>
                <Link href="/pricing">
                  <Button className="bg-[#D4A574] hover:bg-[#C49560] text-white">
                    Upgrade Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* FAQ */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-[#2C2A29] mb-6">Upgrade FAQ</h3>
                <div className="space-y-4">
                  {[
                    {
                      q: "Can I cancel anytime?",
                      a: "Yes! You can cancel your subscription at any time. No questions asked.",
                    },
                    {
                      q: "Do you offer refunds?",
                      a: "We offer a 7-day money-back guarantee if you're not satisfied.",
                    },
                    {
                      q: "Will my data be saved?",
                      a: "Yes, all your lab reports, notes, and preferences are saved in your account.",
                    },
                    {
                      q: "Can I switch between monthly and yearly?",
                      a: "Yes, you can upgrade or downgrade your plan anytime from your account settings.",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="border-l-4 border-[#7E9A85] pl-4 py-2">
                      <p className="font-semibold text-[#2C2A29] mb-1">{item.q}</p>
                      <p className="text-[#5C5A59]">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AI Features Guide Tab */}
          <TabsContent value="ai-guide" className="space-y-8">
            <div className="bg-white border border-[#D1C7BD] rounded-lg p-8">
              <h2 className="text-3xl font-bold text-[#2C2A29] mb-6">AI Features Guide</h2>

              {/* Health Companion Overview */}
              <div className="mb-8 p-6 bg-gradient-to-r from-[#F0F8F4] to-[#E8F4F0] rounded-lg border border-[#7E9A85]">
                <div className="flex items-start gap-4">
                  <MessageCircle className="w-8 h-8 text-[#7E9A85] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-[#2C2A29] mb-2">Meet Health Companion</h3>
                    <p className="text-[#5C5A59] mb-4">
                      Your AI health educator trained on clinical lab science, nutrition research, and functional medicine. Available 24/7 to answer your health questions.
                    </p>
                    <Link href="/medical-assistant">
                      <Button className="bg-[#7E9A85] hover:bg-[#6A8571] text-white">
                        Chat with Health Companion <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* AI Modes */}
              <h3 className="text-2xl font-bold text-[#2C2A29] mb-6">Three AI Modes</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    icon: Brain,
                    title: "Health Assistant",
                    description: "Ask general health questions, get evidence-based guidance on wellness topics.",
                    examples: ["What causes fatigue?", "Best foods for energy", "Sleep optimization tips"],
                    freeLimit: "3 queries/day",
                    proLimit: "Unlimited",
                  },
                  {
                    icon: BarChart3,
                    title: "Lab Analyzer",
                    description: "Understand your lab results, learn what biomarkers mean, get interpretation help.",
                    examples: ["What does TSH mean?", "Is my ferritin low?", "Explain my results"],
                    freeLimit: "3 queries/day",
                    proLimit: "Unlimited",
                  },
                  {
                    icon: Leaf,
                    title: "Nutrition Coach",
                    description: "Get personalized dietary advice, meal planning help, and supplement guidance.",
                    examples: ["Best diet for me", "Supplement recommendations", "Meal prep ideas"],
                    freeLimit: "3 queries/day",
                    proLimit: "Unlimited",
                  },
                ].map((mode, idx) => {
                  const Icon = mode.icon;
                  return (
                    <Card key={idx} className="border-[#D1C7BD] hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <Icon className="w-8 h-8 text-[#7E9A85] mb-2" />
                        <CardTitle className="text-[#2C2A29]">{mode.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-[#5C5A59]">{mode.description}</p>
                        <div>
                          <p className="font-semibold text-[#2C2A29] text-sm mb-2">Example Questions:</p>
                          <ul className="space-y-1">
                            {mode.examples.map((ex, i) => (
                              <li key={i} className="text-sm text-[#5C5A59] flex items-center gap-2">
                                <span className="w-1 h-1 bg-[#7E9A85] rounded-full" />
                                {ex}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-4 border-t border-[#EBE6DC]">
                          <p className="text-xs text-[#5C5A59] mb-2">
                            <span className="font-semibold">Free:</span> {mode.freeLimit}
                          </p>
                          <p className="text-xs text-[#D4A574] font-semibold">
                            <span className="font-semibold">Pro:</span> {mode.proLimit}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* How to Use */}
              <h3 className="text-2xl font-bold text-[#2C2A29] mb-6">How to Use AI Features</h3>
              <div className="space-y-4 mb-8">
                {[
                  {
                    title: "Access Health Companion",
                    steps: [
                      "Click the floating chat icon in the bottom-right corner",
                      "Or visit the full Medical Assistant page",
                      "The widget is available on every page",
                    ],
                  },
                  {
                    title: "Choose Your Mode",
                    steps: [
                      "Select from Health Assistant, Lab Analyzer, or Nutrition Coach tabs",
                      "Each mode has AI trained for specific topics",
                      "Switch modes anytime to ask different questions",
                    ],
                  },
                  {
                    title: "Ask Your Question",
                    steps: [
                      "Type your question in the message box",
                      "Or click the microphone to use voice input",
                      "Press Enter or click Send to submit",
                    ],
                  },
                  {
                    title: "Get Your Answer",
                    steps: [
                      "Health Companion will provide evidence-based guidance",
                      "Answers include citations and explanations",
                      "Use the copy button to save responses",
                    ],
                  },
                ].map((section, idx) => (
                  <div key={idx} className="border-l-4 border-[#7E9A85] pl-6 py-4">
                    <h4 className="font-bold text-[#2C2A29] mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-[#7E9A85] text-white text-sm rounded-full">
                        {idx + 1}
                      </span>
                      {section.title}
                    </h4>
                    <ul className="space-y-2">
                      {section.steps.map((step, i) => (
                        <li key={i} className="text-[#5C5A59] flex items-start gap-2">
                          <span className="text-[#7E9A85] font-bold mt-0.5">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Voice Features */}
              <div className="p-6 bg-gradient-to-r from-[#F0F8F4] to-[#E8F4F0] rounded-lg border border-[#7E9A85] mb-8">
                <h4 className="font-bold text-[#2C2A29] mb-3 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[#7E9A85]" />
                  Voice Features
                </h4>
                <ul className="space-y-2 text-[#5C5A59]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#7E9A85] font-bold mt-0.5">🎤</span>
                    <span><strong>Voice Input:</strong> Click the microphone button to speak your question</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#7E9A85] font-bold mt-0.5">🔊</span>
                    <span><strong>Voice Output:</strong> Toggle the speaker icon to hear Health Companion read responses aloud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#7E9A85] font-bold mt-0.5">🎯</span>
                    <span><strong>Hands-Free:</strong> Perfect for while cooking, exercising, or on-the-go</span>
                  </li>
                </ul>
              </div>

              {/* Query Limits */}
              <h3 className="text-2xl font-bold text-[#2C2A29] mb-6">Understanding Query Limits</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-[#D1C7BD]">
                  <CardHeader>
                    <CardTitle className="text-[#2C2A29] flex items-center gap-2">
                      <Lock className="w-5 h-5 text-[#7E9A85]" />
                      Free Tier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold text-[#2C2A29] mb-2">3 Queries Per Day</p>
                      <p className="text-[#5C5A59] text-sm mb-4">
                        You can ask Health Companion 3 questions per day across all modes combined.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C2A29] mb-2">Daily Reset</p>
                      <p className="text-[#5C5A59] text-sm">
                        Your query count resets at midnight (your local timezone).
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C2A29] mb-2">Upgrade Anytime</p>
                      <p className="text-[#5C5A59] text-sm">
                        Upgrade to Pro to remove limits and get unlimited queries.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-[#D4A574]">
                  <CardHeader>
                    <CardTitle className="text-[#2C2A29] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#D4A574]" />
                      Pro Tier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold text-[#2C2A29] mb-2">Unlimited Queries</p>
                      <p className="text-[#5C5A59] text-sm mb-4">
                        Ask Health Companion as many questions as you want, anytime.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C2A29] mb-2">All Modes Available</p>
                      <p className="text-[#5C5A59] text-sm">
                        Full access to Health Assistant, Lab Analyzer, and Nutrition Coach.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C2A29] mb-2">Full History</p>
                      <p className="text-[#5C5A59] text-sm">
                        Keep unlimited conversation history for reference.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tips */}
              <div className="mt-8 p-6 bg-[#FFF8F0] rounded-lg border border-[#D4A574]">
                <h4 className="font-bold text-[#2C2A29] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4A574]" />
                  Pro Tips for Better Results
                </h4>
                <ul className="space-y-3">
                  {[
                    "Be specific: Include your age, symptoms, and relevant health history",
                    "Use the right mode: Lab Analyzer for biomarker questions, Nutrition Coach for diet",
                    "Follow up: Ask clarifying questions to get more detailed guidance",
                    "Save responses: Use the copy button to save important information",
                    "Share with doctors: Export responses to PDF for your healthcare provider",
                  ].map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[#5C5A59]">
                      <span className="text-[#D4A574] font-bold mt-1">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-[#FFF8F0] border-t border-[#D1C7BD] py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-[#5C5A59] text-center">
            <span className="font-semibold">EDUCATIONAL CONTENT ONLY</span> — The Patient's Compass provides educational information only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider before making health decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
