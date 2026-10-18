import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2, Gift } from "lucide-react";
import { TrialCountdown } from "@/components/TrialCountdown";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import * as gtm from "@/lib/gtm";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Access to basic health tools",
      "Symptom Quiz",
      "Basic Biomarker Library",
      "Limited lab report analysis",
      "Community support",
    ],
    cta: "Current Plan",
    current: true,
    plan: undefined as undefined,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For serious health tracking",
    plan: "monthly" as const,
    features: [
      "Everything in Free",
      "Unlimited lab report analysis",
      "Advanced AI insights",
      "Personalized health recommendations",
      "Doctor's letter generation",
      "Priority email support",
      "Ad-free experience",
      "Export reports as PDF",
    ],
    cta: "Upgrade to Pro",
    current: false,
    highlighted: true,
  },
  {
    name: "Pro Annual",
    price: "$99.99",
    period: "/year",
    description: "Annual billing — save $8.01",
    plan: "yearly" as const,
    features: [
      "Everything in Pro",
      "Annual billing discount",
      "Early access to new features",
      "VIP support channel",
      "Custom health reports",
    ],
    cta: "Upgrade to Pro Annual",
    current: false,
  },
];

export default function UpgradePro() {
  const { user, isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | null>(null);
  
  const createCheckout = trpc.shopifyCheckout.createCart.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
      setLoadingPlan(null);
    },
  });

  const createGuestCheckout = trpc.shopifyCheckout.createCart.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
      setLoadingPlan(null);
    },
  });

  const startTrialMutation = trpc.trial.startTrial.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const handleStartTrial = async () => {
    gtm.trackFeatureUsage("pricing", "trial_started");
    if (isAuthenticated) {
      startTrialMutation.mutate();
    } else {
      // For guests, show email form then start trial
      setSelectedPlan("monthly");
      setShowEmailForm(true);
    }
  };

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    gtm.trackFeatureUsage("pricing", `upgrade_${plan}`);
    if (isAuthenticated) {
      setLoadingPlan(plan);
      createCheckout.mutate({ plan, origin: window.location.origin });
    } else {
      setSelectedPlan(plan);
      setShowEmailForm(true);
    }
  };

  const handleGuestCheckout = async () => {
    if (!selectedPlan) {
      toast.error("Please select a subscription plan");
      return;
    }
    if (!guestEmail.trim() || !guestEmail.includes("@")) {
      toast.error("Please enter the email used for your Shopify subscription.");
      return;
    }

    gtm.trackFeatureUsage("pricing", `guest_checkout_${selectedPlan}`);
    setLoadingPlan(selectedPlan);
    createGuestCheckout.mutate({ plan: selectedPlan, origin: window.location.origin, email: guestEmail.trim() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6F0] to-[#EBE6DC] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <TrialCountdown />
        <Link href="/" className="flex items-center gap-2 text-[#7E9A85] hover:text-[#6A8571] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C2A29] mb-4">Upgrade to Pro</h1>
          <p className="text-lg text-[#5C5A59] max-w-2xl mx-auto">
            Unlock advanced health tracking, personalized insights, and premium features to take control of your wellness journey.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleStartTrial}
              disabled={startTrialMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg flex items-center gap-2"
            >
              <Gift className="w-5 h-5" />
              {startTrialMutation.isPending ? "Starting Trial..." : "Start 7-Day Free Trial"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`border-2 transition-all ${
                plan.highlighted
                  ? "border-[#D48C70] shadow-xl scale-105"
                  : "border-[#EBE6DC]"
              }`}
            >
              <CardHeader className={plan.highlighted ? "bg-gradient-to-r from-[#D48C70] to-[#C27A5B] text-white rounded-t-lg" : ""}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className={plan.highlighted ? "text-white" : "text-[#2C2A29]"}>
                      {plan.name}
                    </CardTitle>
                    <CardDescription className={plan.highlighted ? "text-[#FFF5F0]" : ""}>
                      {plan.description}
                    </CardDescription>
                  </div>
                  {plan.current && (
                    <Badge className="bg-[#7E9A85] text-white">Current</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="mb-6">
                  <span className="text-3xl font-bold text-[#2C2A29]">{plan.price}</span>
                  {plan.period && (
                    <span className="text-[#5C5A59]">{plan.period}</span>
                  )}
                </div>

                <Button
                  className={`w-full mb-6 ${
                    plan.current
                      ? "bg-[#EBE6DC] text-[#5C5A59] cursor-default hover:bg-[#EBE6DC]"
                      : plan.highlighted
                      ? "bg-[#D48C70] hover:bg-[#C27A5B] text-white"
                      : "bg-[#7E9A85] hover:bg-[#6A8571] text-white"
                  }`}
                  disabled={plan.current || (plan.plan && loadingPlan === plan.plan)}
                  onClick={() => plan.plan && handleUpgrade(plan.plan)}
                >
                  {plan.plan && loadingPlan === plan.plan ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#7E9A85] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[#5C5A59]">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Guest Checkout Modal */}
        {showEmailForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border-[#EBE6DC] bg-white">
                <CardHeader>
                  <CardTitle className="text-[#2C2A29]">Complete Your Purchase</CardTitle>
                  <CardDescription>
                  Continue to Shopify's secure checkout, where you will provide the email used for your subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="shopify-guest-email" className="text-sm font-medium text-[#2C2A29]">Email for your subscription</label>
                  <Input
                    id="shopify-guest-email"
                    type="email"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loadingPlan !== null}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-[#EBE6DC] text-[#2C2A29] hover:bg-[#F9F6F0]"
                      onClick={() => {
                        setShowEmailForm(false);
                        setSelectedPlan(null);
                      setLoadingPlan(null);
                    }}
                    disabled={loadingPlan !== null}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-[#D48C70] hover:bg-[#C27A5B] text-white"
                    onClick={handleGuestCheckout}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Continue to Payment"
                    )}
                  </Button>
                </div>

                <p className="text-xs text-[#5C5A59] text-center pt-2">
                  Your payment is secure and processed by Shopify Payments. We'll never store your full payment details.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-[#EBE6DC] bg-white">
          <CardHeader>
            <CardTitle className="text-[#2C2A29]">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-[#2C2A29] mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-[#5C5A59]">Yes, you can cancel your subscription at any time. No questions asked, no penalties.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2A29] mb-2">What payment methods do you accept?</h3>
              <p className="text-[#5C5A59]">We accept supported payment methods through Shopify Payments. Payment details are handled by Shopify.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2A29] mb-2">Is there a free trial?</h3>
              <p className="text-[#5C5A59]">Yes! Get 7 days of Pro features completely free. No credit card required. After the trial, your account reverts to Free unless you choose to upgrade.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2A29] mb-2">Do you offer refunds?</h3>
              <p className="text-[#5C5A59]">We offer a 30-day money-back guarantee on all Pro subscriptions. If you're not satisfied, we'll refund your payment.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2A29] mb-2">How do I manage my subscription?</h3>
              <p className="text-[#5C5A59]">You can manage your subscription, update billing information, and cancel anytime from your account dashboard.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2A29] mb-2">Do I need to create an account to upgrade?</h3>
              <p className="text-[#5C5A59]">No! You can checkout as a guest with just your email. We'll create your account after payment so you can immediately access Pro features.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
