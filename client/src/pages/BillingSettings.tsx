import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import * as gtm from "@/lib/gtm";

export default function BillingSettings() {
  const { user } = useAuth();
  const { data: status, isLoading } = trpc.subscription.getStatus.useQuery(undefined, { enabled: !!user });
  const createCheckout = trpc.shopifyCheckout.createCart.useMutation();

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



  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.isPro ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">{status?.plan === "yearly" ? "$99.99/year" : "$9/month"}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <Button variant="outline" onClick={() => { window.location.href = "/pricing"; }}>
                Review Shopify Billing
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">Free Plan</p>
                  <p className="text-sm text-muted-foreground">Limited features</p>
                </div>
                <Badge variant="outline">Free</Badge>
              </div>
              <Button onClick={handleUpgrade} disabled={createCheckout.isPending} className="w-full">
                {createCheckout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Upgrade to Pro
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted rounded">
            <CreditCard className="w-5 h-5" />
            <div>
              <p className="font-semibold">Visa ending in 4242</p>
              <p className="text-sm text-muted-foreground">Expires 12/2025</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded">
        <p className="text-sm text-amber-800"><strong>EDUCATIONAL CONTENT ONLY</strong></p>
      </div>
    </div>
  );
}
