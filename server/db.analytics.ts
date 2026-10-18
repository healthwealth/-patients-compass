import { eq, and, gte, lte } from "drizzle-orm";
import { analyticsSnapshots, users, referrals } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Create a daily analytics snapshot
 * This should be called once per day to capture metrics
 */
export async function createDailySnapshot() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all users
  const allUsers = await db.select().from(users);

  // Get active subscriptions
  const activeSubscriptions = allUsers.filter(
    (u) => u.subscriptionStatus === "active"
  );

  // Get active trials
  const activeTrials = allUsers.filter((u) => u.isTrialActive === 1);

  // Get new users today
  const newUsersToday = allUsers.filter((u) => {
    const createdAt = new Date(u.createdAt);
    return createdAt >= today && createdAt < tomorrow;
  });

  // Get referral stats
  const allReferrals = await db.select().from(referrals);
  const newReferralsToday = allReferrals.filter((r) => {
    const createdAt = new Date(r.createdAt);
    return createdAt >= today && createdAt < tomorrow;
  });

  const referralConversionsToday = allReferrals.filter((r) => {
    const convertedAt = r.convertedAt ? new Date(r.convertedAt) : null;
    return convertedAt && convertedAt >= today && convertedAt < tomorrow;
  });

  const totalReferralCreditsIssued = allReferrals
    .filter((r) => r.status === "converted")
    .reduce((sum, r) => sum + r.creditAmount, 0);

  // Calculate MRR (Monthly Recurring Revenue).
  // This remains a simplified estimate because the current user record does not
  // retain each subscriber's selected billing interval.
  const monthlySubscriptions = activeSubscriptions.filter(
    (u) => u.subscriptionStatus === "active"
  );
  const monthlyRecurringRevenue = monthlySubscriptions.length * 900; // $9.00 in cents

  // Calculate ARR (Annual Recurring Revenue)
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;

  // Calculate trial conversion rate
  const trialConversionRate =
    activeTrials.length > 0
      ? (activeSubscriptions.filter((u) => u.trialStatus === "converted").length /
          activeTrials.length) *
        100
      : 0;

  // Calculate churn rate (simplified: users who canceled this month)
  const canceledSubscriptionsToday = allUsers.filter(
    (u) => u.subscriptionStatus === "canceled"
  ).length;

  const churnRate =
    activeSubscriptions.length > 0
      ? (canceledSubscriptionsToday / activeSubscriptions.length) * 100
      : 0;

  // Create snapshot
  const snapshot = await db.insert(analyticsSnapshots).values({
    snapshotDate: today,
    totalUsers: allUsers.length,
    newUsersToday: newUsersToday.length,
    activeUsersToday: allUsers.filter((u) => {
      const lastSignedIn = new Date(u.lastSignedIn);
      return lastSignedIn >= today;
    }).length,
    activeTrials: activeTrials.length,
    trialsExpiredToday: 0, // Would need to calculate based on trial end dates
    trialConversionRate,
    activeSubscriptions: activeSubscriptions.length,
    newSubscriptionsToday: newUsersToday.filter(
      (u) => u.subscriptionStatus === "active"
    ).length,
    canceledSubscriptionsToday,
    monthlyRecurringRevenue,
    annualRecurringRevenue,
    emailsSentToday: 0, // Would need to track from email logs
    emailOpenRate: 0, // Would need to track from email service
    emailClickRate: 0, // Would need to track from email service
    newReferralsToday: newReferralsToday.length,
    referralConversionsToday: referralConversionsToday.length,
    totalReferralCreditsIssued,
    totalRevenueToday: 0, // Would need to calculate from Stripe
    averageOrderValue: 0, // Would need to calculate from Stripe
    churnRate,
    aiQueriesTotal: 0, // Would need to track from AI usage logs
    labReportsAnalyzed: 0, // Would need to track from lab reports
    booksViewed: 0, // Would need to track from page views
  });

  return snapshot;
}

/**
 * Get analytics data for a date range
 */
export async function getAnalyticsForDateRange(
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  const snapshots = await db
    .select()
    .from(analyticsSnapshots)
    .where(
      and(
        gte(analyticsSnapshots.snapshotDate, startDate),
        lte(analyticsSnapshots.snapshotDate, endDate)
      )
    );

  return snapshots;
}

/**
 * Get latest analytics snapshot
 */
export async function getLatestSnapshot() {
  const db = await getDb();
  if (!db) return null;

  const [snapshot] = await db
    .select()
    .from(analyticsSnapshots)
    .orderBy((table) => table.snapshotDate)
    .limit(1);

  return snapshot || null;
}

/**
 * Calculate conversion metrics
 */
export async function getConversionMetrics() {
  const db = await getDb();
  if (!db)
    return {
      trialToProConversionRate: 0,
      freeToProConversionRate: 0,
      referralConversionRate: 0,
    };

  const allUsers = await db.select().from(users);
  const allReferrals = await db.select().from(referrals);

  const usersWithTrials = allUsers.filter((u) => u.trialStatus !== "none");
  const trialConversions = allUsers.filter(
    (u) => u.trialStatus === "converted"
  );

  const freeUsers = allUsers.filter((u) => u.subscriptionStatus === "free");
  const proUsers = allUsers.filter((u) => u.subscriptionStatus === "active");

  const totalReferrals = allReferrals.length;
  const convertedReferrals = allReferrals.filter(
    (r) => r.status === "converted"
  );

  return {
    trialToProConversionRate:
      usersWithTrials.length > 0
        ? (trialConversions.length / usersWithTrials.length) * 100
        : 0,
    freeToProConversionRate:
      freeUsers.length > 0 ? (proUsers.length / freeUsers.length) * 100 : 0,
    referralConversionRate:
      totalReferrals > 0
        ? (convertedReferrals.length / totalReferrals) * 100
        : 0,
  };
}

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics() {
  const db = await getDb();
  if (!db)
    return {
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    };

  const allUsers = await db.select().from(users);
  const activeSubscriptions = allUsers.filter(
    (u) => u.subscriptionStatus === "active"
  );

  // Simplified calculation (would need real Stripe invoice data)
  const monthlyRecurringRevenue = activeSubscriptions.length * 900; // $9.00 in cents
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;

  return {
    monthlyRecurringRevenue,
    annualRecurringRevenue,
    totalRevenue: annualRecurringRevenue,
    averageOrderValue: activeSubscriptions.length > 0 ? 900 : 0,
  };
}

/**
 * Get user growth metrics
 */
export async function getUserGrowthMetrics() {
  const db = await getDb();
  if (!db)
    return {
      totalUsers: 0,
      activeUsers: 0,
      trialUsers: 0,
      proUsers: 0,
      freeUsers: 0,
    };

  const allUsers = await db.select().from(users);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter((u) => {
      const lastSignedIn = new Date(u.lastSignedIn);
      return lastSignedIn >= today;
    }).length,
    trialUsers: allUsers.filter((u) => u.isTrialActive === 1).length,
    proUsers: allUsers.filter((u) => u.subscriptionStatus === "active").length,
    freeUsers: allUsers.filter((u) => u.subscriptionStatus === "free").length,
  };
}
