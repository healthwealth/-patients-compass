import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Share2, TrendingUp, Users, DollarSign } from "lucide-react";
import SEO from "@/components/SEO";

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Fetch referral code
  const { data: codeData, isLoading: codeLoading } = trpc.referral.getOrCreateCode.useQuery(undefined, {
    enabled: !!user?.id,
  });

  // Fetch referral earnings
  const { data: earningsData, isLoading: earningsLoading } = trpc.referral.getEarnings.useQuery(undefined, {
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (codeData?.code) {
      setReferralCode(codeData.code);
    }
  }, [codeData]);

  const handleCopyCode = () => {
    if (referralCode) {
      const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    if (referralCode && navigator.share) {
      const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
      try {
        await navigator.share({
          title: "Join The Patient's Compass",
          text: "Get $10 credit when you sign up with my referral code!",
          url: referralUrl,
        });
        toast.success("Referral link shared!");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Failed to share referral link");
        }
      }
    } else {
      handleCopyCode();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-foreground/70">You must be logged in to view your referral dashboard.</p>
        </Card>
      </div>
    );
  }

  const isLoading = codeLoading || earningsLoading;
  const totalEarnings = earningsData?.totalEarned || 0;
  const successfulReferrals = earningsData?.referralCount || 0;
  const pendingReferrals = earningsData?.pendingCredits || 0;

  return (
    <>
      <SEO
        title="Referral Dashboard - The Patient's Compass"
        description="Share your referral code and earn $10 credit for each successful referral"
        keywords="referral, earn credit, share"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-background/50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">Referral Program</h1>
            <p className="text-lg text-foreground/70">
              Share The Patient's Compass with friends and earn $10 credit for each successful referral.
            </p>
          </div>

          {/* Referral Code Section */}
          <Card className="p-8 mb-8 border-2 border-primary/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-primary" />
              Your Referral Link
            </h2>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-foreground/70">Loading your referral code...</p>
              </div>
            ) : referralCode ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={`${window.location.origin}/signup?ref=${referralCode}`}
                    readOnly
                    className="bg-background/50 border-border"
                  />
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="gap-2 whitespace-nowrap"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    onClick={handleShareCode}
                    className="gap-2 whitespace-nowrap bg-primary hover:bg-primary/90"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
                <p className="text-sm text-foreground/60">
                  Your referral code: <span className="font-mono font-bold text-primary">{referralCode}</span>
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-foreground/70 mb-4">No referral code found</p>
                <Button className="bg-primary hover:bg-primary/90">Generate Referral Code</Button>
              </div>
            )}
          </Card>

          {/* Earnings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Earnings Card */}
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70 mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-foreground">${totalEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </Card>

            {/* Successful Referrals Card */}
            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70 mb-1">Successful Referrals</p>
                  <p className="text-3xl font-bold text-foreground">{successfulReferrals}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </Card>

            {/* Pending Referrals Card */}
            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/70 mb-1">Pending Referrals</p>
                  <p className="text-3xl font-bold text-foreground">{pendingReferrals}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Share Your Link</h3>
                  <p className="text-foreground/70">
                    Copy your unique referral link and share it with friends, family, or on social media.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">They Sign Up</h3>
                  <p className="text-foreground/70">
                    When someone clicks your link and creates an account, they're automatically linked to your referral.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">You Earn Credit</h3>
                  <p className="text-foreground/70">
                    Once they complete their first purchase or subscription, you earn $10 credit instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Redeem Your Earnings</h3>
                  <p className="text-foreground/70">
                    Use your earned credits toward your subscription or any premium features.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Terms */}
          <Card className="p-6 bg-background/50 border-border/50">
            <p className="text-sm text-foreground/60">
              <span className="font-semibold">Referral Terms:</span> Each successful referral earns you $10 credit. Credits are applied after the referred user completes their first purchase. Referral codes expire after 90 days of inactivity. Referrals must be genuine—no self-referrals or fraudulent accounts.
            </p>
          </Card>

          {/* Educational Disclaimer */}
          <div className="mt-12 text-center">
            <p className="text-sm text-foreground/50 font-semibold">EDUCATIONAL CONTENT ONLY</p>
            <p className="text-xs text-foreground/40 mt-2">
              This referral program is provided for educational purposes. Earnings are in the form of account credits, not monetary compensation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
