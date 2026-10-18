export type ConversionFunnelUser = {
  id: number;
  trialStatus: "none" | "active" | "expired" | "converted";
  subscriptionStatus: "free" | "active" | "past_due" | "canceled";
};

export function buildApplicationConversionFunnel(
  cohort: ConversionFunnelUser[],
  activityUserIds: Iterable<number>,
  periodDays: number
) {
  const engagedUserIds = new Set(activityUserIds);
  const counts = [
    cohort.length,
    cohort.filter((user) => engagedUserIds.has(user.id) || user.subscriptionStatus === "active").length,
    cohort.filter((user) => user.subscriptionStatus === "active").length,
  ];
  const labels = ["New accounts", "Engaged account", "Active subscription"];
  return {
    periodDays,
    stages: counts.map((count, index) => ({
      label: labels[index],
      count,
      conversionFromPrevious: index === 0 ? 100 : (counts[index - 1] ? Math.round((count / counts[index - 1]) * 1000) / 10 : 0),
      conversionFromStart: counts[0] ? Math.round((count / counts[0]) * 1000) / 10 : 0,
    })),
  };
}
