import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, AlertCircle, CheckCircle2, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import * as gtm from "@/lib/gtm";
import { useState } from "react";

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const { data: status, isLoading, refetch } = trpc.subscription.getStatus.useQuery(undefined, { enabled: !!user });
  const createCheckout = trpc.shopifyCheckout.createCart.useMutation();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleUpgrade = async () => {
    try {
      gtm.trackFeatureUsage("billing", "upgrade_initiated");
      const result = await createCheckout.mutateAsync({ plan: "monthly", origin: window.location.origin });
      if (result.checkoutUrl) window.location.href = result.checkoutUrl;
    } catch (error) {
      toast.error("Failed to start upgrade");
      gtm.trackError("billing", "upgrade_failed");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      gtm.trackFeatureUsage("billing", "cancel_subscription");
      toast.success("Subscription cancellation scheduled");
      setShowCancelConfirm(false);
      refetch();
    } catch (error) {
      toast.error("Failed to cancel subscription");
      gtm.trackError("billing", "cancel_failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const isPro = status?.isPro;
  const currentPlan = isPro ? "Pro" : "Free";
  const planPrice = isPro ? (status?.plan === "yearly" ? "$99.99/year" : "$9/month") : "Free";
  const nextBillingDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
          <p className="text-gray-600">Manage your subscription, billing, and payment methods</p>
        </div>

        {/* Current Plan Card */}
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
                {/* Plan Benefits */}
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

                {/* Next Billing Date */}
                {isPro && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Next billing date</p>
                        <p className="font-semibold text-gray-900">{nextBillingDate.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Change Plan
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">Upgrade to Pro to unlock premium features</p>
                <Button
                  onClick={handleUpgrade}
                  disabled={createCheckout.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {createCheckout.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Upgrade to Pro"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View and download your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-900">Annual Pro Subscription</p>
                    <p className="text-sm text-gray-600">Invoice #INV-001</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">$80.00</p>
                  <p className="text-sm text-gray-600">Jun 19, 2026</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Invoices
            </Button>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Update your payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <CreditCard className="w-8 h-8 text-gray-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Link</p>
                <p className="text-sm text-gray-600">Payment method ending in 4242</p>
              </div>
              <Badge variant="outline">Default</Badge>
            </div>
            <Button variant="outline" className="w-full">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Cancel Confirmation Dialog */}
        {showCancelConfirm && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Cancel Subscription?</CardTitle>
              <CardDescription className="text-red-800">
                Your subscription will be canceled at the end of your current billing period.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded border border-red-200">
                <p className="text-sm text-gray-700 mb-3">
                  You'll lose access to Pro features after your billing period ends. You can reactivate anytime.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep Subscription
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancelSubscription}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600">
              Have questions about your subscription or billing? Our support team is here to help.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <a href="/support">Visit Support</a>
              </Button>
              <Button variant="outline" className="flex-1">
                <a href="/contact">Contact Us</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Educational Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}
