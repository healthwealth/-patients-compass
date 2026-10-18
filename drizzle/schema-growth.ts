import { mysqlTable, varchar, int, timestamp, mysqlEnum, text, json, tinyint } from "drizzle-orm/mysql-core";

/**
 * Referral program tracking — users earn $10 credit per successful referral
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // User who created the referral code
  referredUserId: int("referredUserId"), // User who signed up via referral (null if not yet converted)
  referralCode: varchar("referralCode", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "converted", "expired"]).default("pending").notNull(),
  creditAmount: int("creditAmount").default(1000).notNull(), // $10 in cents
  creditApplied: tinyint("creditApplied").default(0).notNull(), // Whether credit was added to referrer's account
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  convertedAt: timestamp("convertedAt"),
  expiresAt: timestamp("expiresAt"), // Referral link expires after 90 days
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Email automation tracking — tracks trial expiration and onboarding emails
 */
export const emailAutomation = mysqlTable("email_automation", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Trial expiration emails (sent 1 day before trial ends)
  trialExpirationEmailScheduled: tinyint("trialExpirationEmailScheduled").default(0).notNull(),
  trialExpirationEmailSent: tinyint("trialExpirationEmailSent").default(0).notNull(),
  trialExpirationEmailSentAt: timestamp("trialExpirationEmailSentAt"),
  trialExpirationEmailOpened: tinyint("trialExpirationEmailOpened").default(0).notNull(),
  
  // Onboarding sequence (days 1, 3, 5)
  onboardingEmail1Sent: tinyint("onboardingEmail1Sent").default(0).notNull(),
  onboardingEmail1SentAt: timestamp("onboardingEmail1SentAt"),
  onboardingEmail1Opened: tinyint("onboardingEmail1Opened").default(0).notNull(),
  
  onboardingEmail2Sent: tinyint("onboardingEmail2Sent").default(0).notNull(),
  onboardingEmail2SentAt: timestamp("onboardingEmail2SentAt"),
  onboardingEmail2Opened: tinyint("onboardingEmail2Opened").default(0).notNull(),
  
  onboardingEmail3Sent: tinyint("onboardingEmail3Sent").default(0).notNull(),
  onboardingEmail3SentAt: timestamp("onboardingEmail3SentAt"),
  onboardingEmail3Opened: tinyint("onboardingEmail3Opened").default(0).notNull(),
  
  // Heartbeat cron task UIDs for scheduled jobs
  trialExpirationCronTaskUid: varchar("trialExpirationCronTaskUid", { length: 65 }),
  onboardingCronTaskUid: varchar("onboardingCronTaskUid", { length: 65 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailAutomation = typeof emailAutomation.$inferSelect;
export type InsertEmailAutomation = typeof emailAutomation.$inferInsert;

/**
 * Analytics snapshots for dashboard reporting
 * Captures daily metrics for conversion, revenue, and user growth
 */
export const analyticsSnapshots = mysqlTable("analytics_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotDate: timestamp("snapshotDate").notNull(), // UTC date of snapshot
  
  // User metrics
  totalUsers: int("totalUsers").default(0).notNull(),
  newUsersToday: int("newUsersToday").default(0).notNull(),
  activeUsersToday: int("activeUsersToday").default(0).notNull(),
  
  // Trial metrics
  activeTrials: int("activeTrials").default(0).notNull(),
  trialsExpiredToday: int("trialsExpiredToday").default(0).notNull(),
  trialConversionRate: float("trialConversionRate").default(0).notNull(),
  
  // Subscription metrics
  activeSubscriptions: int("activeSubscriptions").default(0).notNull(),
  newSubscriptionsToday: int("newSubscriptionsToday").default(0).notNull(),
  canceledSubscriptionsToday: int("canceledSubscriptionsToday").default(0).notNull(),
  monthlyRecurringRevenue: int("monthlyRecurringRevenue").default(0).notNull(), // In cents
  annualRecurringRevenue: int("annualRecurringRevenue").default(0).notNull(), // In cents
  
  // Email metrics
  emailsSentToday: int("emailsSentToday").default(0).notNull(),
  emailOpenRate: float("emailOpenRate").default(0).notNull(),
  emailClickRate: float("emailClickRate").default(0).notNull(),
  
  // Referral metrics
  newReferralsToday: int("newReferralsToday").default(0).notNull(),
  referralConversionsToday: int("referralConversionsToday").default(0).notNull(),
  totalReferralCreditsIssued: int("totalReferralCreditsIssued").default(0).notNull(), // In cents
  
  // Revenue metrics
  totalRevenueToday: int("totalRevenueToday").default(0).notNull(), // In cents
  averageOrderValue: int("averageOrderValue").default(0).notNull(), // In cents
  churnRate: float("churnRate").default(0).notNull(),
  
  // Engagement metrics
  aiQueriesTotal: int("aiQueriesTotal").default(0).notNull(),
  labReportsAnalyzed: int("labReportsAnalyzed").default(0).notNull(),
  booksViewed: int("booksViewed").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;
