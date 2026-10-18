export type SubscriptionStatus = "free" | "active" | "canceled" | "past_due";
export type SubscriptionPlan = "monthly" | "yearly" | null | undefined;

export function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split("@")[0]?.trim() || "Patient";
  const words = source.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "P";
}

export function getSubscriptionBadge(status: SubscriptionStatus, plan: SubscriptionPlan) {
  if (status === "active") {
    return plan === "yearly"
      ? { label: "Yearly Pro", tone: "sage" as const }
      : plan === "monthly"
        ? { label: "Monthly Pro", tone: "sage" as const }
        : { label: "Pro", tone: "sage" as const };
  }

  if (status === "past_due") return { label: "Payment due", tone: "coral" as const };
  if (status === "canceled") return { label: "Canceled", tone: "neutral" as const };
  return { label: "Free plan", tone: "neutral" as const };
}
