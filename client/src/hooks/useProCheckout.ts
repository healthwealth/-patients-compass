import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export type ProPlan = "monthly" | "yearly";

/**
 * Starts a Stripe Checkout for The Patient's Compass Pro.
 *
 * Visitors who aren't signed in go to sign-in first and come back to
 * /pricing?plan=…, which resumes checkout. That way every purchase is linked
 * to an account and the Stripe webhook can switch that account to Pro.
 */
export function useProCheckout() {
  const { isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<ProPlan | null>(null);

  const mutation = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to secure Stripe checkout…");
        window.location.href = data.url;
        return;
      }
      toast.error("Checkout could not start. Please try again.");
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    },
  });

  const startCheckout = (plan: ProPlan) => {
    if (!isAuthenticated) {
      toast.info("Sign in or create a free account first. You'll go straight to checkout afterwards.");
      window.location.href = getLoginUrl(`/pricing?plan=${plan}`);
      return;
    }
    setLoadingPlan(plan);
    mutation.mutate({ plan, origin: window.location.origin });
  };

  return { startCheckout, loadingPlan, isPending: mutation.isPending };
}
