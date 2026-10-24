import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import * as gtm from "@/lib/gtm";

/**
 * Subscription & billing.
 *
 * Billing details (card, invoices, plan changes, cancellation) live in the
 * Stripe customer portal, so this page shows only what we know for certain
 * and hands everything else to Stripe.
 */
export default function SubscriptionManagement() {
  const { user } = useAuth();
  const { data: status, isLoading } = trpc.subscription.getStatus.useQuery(undefined, { enabled: !!user });

  const createPortal = trpc.subscription.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message || "Could not open billing settings. Please try again.");
      gtm.trackError("billing", "portal_failed");
    },
  });

  const handleManage = () => {
    gtm.trackFeatureUsage("billing", "portal_opened");
    createPortal.mutate({ origin: window.location.origin });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const isPro = status?.isPro ?? false;
  const isOwner = status?.isOwner ?? false;
  const currentPlan = isOwner ? "Owner" : isPro ? "Pro" : "Free";
  const planPrice = isOwner
    ? "Everything unlocked, no billing"
    : isPro
      ? (status?.plan === "yearly" ? "$99.99/year" : "$9/month")
      : "Free";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
          <p className="text-gray-600">Your plan, and secure billing through Stripe</p>
        </div>

        <Card className="mb-6 border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{currentPlan} Plan</CardTitle>
                <CardDescription className="text-base mt-1">{planPrice}</CardDescription>
              </div>
              <Badge className={isPro ? "bg-green-100 text-green-800 text-base px-4 py-2" : "bg-gray-100 text-gray-800 text-base px-4 py-2"}>
                {isPro ? "Active" : "Free"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isPro ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Your Pro benefits:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                      Unlimited AI health insights
                    </li>
                    <li className="flex items-center text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                      Advanced lab analysis
                    </li>
                    <li className="flex items-center text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                      Personalized wellness recommendations
                    </li>
                    <li className="flex items-center text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                      Priority email support
                    </li>
                  </ul>
                </div>

                {!isOwner && (
                  <div className="space-y-2 pt-2">
                    <Button className="w-full" size="lg" onClick={handleManage} disabled={createPortal.isPending}>
                      {createPortal.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      Manage billing in Stripe
                    </Button>
                    <p className="text-sm text-gray-600 text-center">
                      Change your plan, update your card, download invoices or cancel, all on Stripe's secure page.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">Upgrade to Pro to unlock premium features</p>
                <Button
                  onClick={() => {
                    gtm.trackFeatureUsage("billing", "upgrade_initiated");
                    window.location.href = "/pricing";
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  See Pro plans
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4" />
                  Secure checkout by Stripe. Cancel any time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600">
              Have questions about your subscription or billing? Our support team is here to help.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <a href="/support">Visit Support</a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href="/contact">Contact Us</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}
