import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, json, tinyint, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  /** Shopify customer identifier used by the checkout/webhook adapter. */
  shopifyCustomerId: varchar("shopifyCustomerId", { length: 255 }),
  /** Shopify subscription contract identifier for recurring Pro access. */
  shopifySubscriptionContractId: varchar("shopifySubscriptionContractId", { length: 255 }),
  /** Most recent Shopify order associated with the subscription. */
  shopifyOrderId: varchar("shopifyOrderId", { length: 255 }),
  /** Shopify shop domain that issued the identifiers. */
  shopifyShopDomain: varchar("shopifyShopDomain", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["free", "active", "canceled", "past_due"]).default("free").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["monthly", "yearly"]),
  /** Daily AI query counter for free-tier rate limiting (resets each UTC day) */
  aiQueryCount: int("aiQueryCount").default(0).notNull(),
  /** The UTC date (YYYY-MM-DD) when aiQueryCount was last reset */
  aiQueryDate: varchar("aiQueryDate", { length: 10 }),
  /** Email/password auth: hashed password (null if OAuth user) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Email/password auth: email verification status */
  emailVerified: int("emailVerified").default(0).notNull(),
  /** Email/password auth: verification token */
  verificationToken: varchar("verificationToken", { length: 255 }),
  /** Email/password auth: password reset token */
  resetToken: varchar("resetToken", { length: 255 }),
  /** Email/password auth: password reset token expiry */
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  /** Passwordless fallback: hashed email-login token */
  emailLoginToken: varchar("emailLoginToken", { length: 255 }),
  /** Passwordless fallback: email-login token expiry (15 minutes) */
  emailLoginTokenExpiry: timestamp("emailLoginTokenExpiry"),
  /** Passwordless fallback: hash of the last browser/device signature; never store raw user-agent data */
  lastPasswordlessDeviceHash: varchar("lastPasswordlessDeviceHash", { length: 64 }),
  /** Passwordless fallback: timestamp of the last successful link login */
  lastPasswordlessLoginAt: timestamp("lastPasswordlessLoginAt"),
  /** Trial start date (UTC) - when user started their 7-day trial */
  trialStartDate: timestamp("trialStartDate"),
  /** Trial end date (UTC) - when trial expires and subscription begins */
  trialEndDate: timestamp("trialEndDate"),
  /** Whether user is currently in trial period */
  isTrialActive: int("isTrialActive").default(0).notNull(),
  /** Trial conversion status: 'pending' (waiting), 'converted' (paid), 'expired' (no payment) */
  trialStatus: mysqlEnum("trialStatus", ["none", "active", "converted", "expired"]).default("none").notNull(),
  /** Google OAuth ID (unique per user) */
  googleId: varchar("googleId", { length: 255 }).unique(),
  /** Verified profile image URL supplied by the active identity provider */
  profileImageUrl: varchar("profileImageUrl", { length: 1024 }),
  /** Apple OAuth ID (unique per user) */
  appleId: varchar("appleId", { length: 255 }).unique(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Idempotency record for Shopify webhook deliveries. */
export const shopifyWebhookEvents = mysqlTable("shopify_webhook_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  topic: varchar("topic", { length: 255 }).notNull(),
  shopDomain: varchar("shopDomain", { length: 255 }).notNull(),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

/**
 * Private, non-clinical user activity used by the dashboard timeline.
 * Event labels are controlled server-side; health content and identifiers are never copied here.
 */
export const userActivities = mysqlTable("user_activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", [
    "lab_report_saved",
    "wellness_plan_saved",
    "profile_image_updated",
    "profile_image_removed",
    "subscription_portal_opened",
    "content_saved",
    "content_unsaved",
    "certificate_saved",
    "collection_followed",
    "collection_unfollowed",
  ]).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  summary: varchar("summary", { length: 300 }),
  sourceRef: varchar("sourceRef", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;

/**
 * Private references to public content a user has chosen to save.
 * Content remains canonical in its original table; no health or article body is copied here.
 */
export const userFavorites = mysqlTable("user_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resourceType: mysqlEnum("resourceType", ["blog_post"]).notNull(),
  resourceId: int("resourceId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userResourceUnique: uniqueIndex("user_favorites_user_resource_unique").on(table.userId, table.resourceType, table.resourceId),
}));

export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = typeof userFavorites.$inferInsert;

/** Private, file-backed completion certificates generated by the authenticated user. */
export const savedCertificates = mysqlTable("saved_certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  childName: varchar("childName", { length: 120 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  previewKey: varchar("previewKey", { length: 512 }),
  previewUrl: varchar("previewUrl", { length: 1024 }),
  archivedAt: timestamp("archivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SavedCertificate = typeof savedCertificates.$inferSelect;
export type InsertSavedCertificate = typeof savedCertificates.$inferInsert;

/** Public editorial collections made from references to published blog posts. */
export const articleCollections = mysqlTable("article_collections", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  coverImage: varchar("coverImage", { length: 1024 }),
  published: tinyint("published").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const articleCollectionItems = mysqlTable("article_collection_items", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull(),
  blogPostId: int("blogPostId").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  collectionPostUnique: uniqueIndex("article_collection_items_collection_post_unique").on(table.collectionId, table.blogPostId),
}));

/** Private relationship only; following does not copy collection or article content. */
export const userCollectionFollows = mysqlTable("user_collection_follows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  collectionId: int("collectionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userCollectionUnique: uniqueIndex("user_collection_follows_user_collection_unique").on(table.userId, table.collectionId),
}));

/**
 * Lab reports uploaded and analyzed by users.
 */
export const labReports = mysqlTable("lab_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  rawText: text("rawText"),
  analysisResult: json("analysisResult"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabReport = typeof labReports.$inferSelect;
export type InsertLabReport = typeof labReports.$inferInsert;

/**
 * Email subscribers for the newsletter / lead magnet.
 */
export const emailSubscribers = mysqlTable("email_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  source: varchar("source", { length: 64 }).default("landing_page"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = typeof emailSubscribers.$inferInsert;

/**
 * Individual biomarker readings tracked over time.
 */
export const biomarkerReadings = mysqlTable("biomarker_readings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  labReportId: int("labReportId"),
  biomarkerName: varchar("biomarkerName", { length: 255 }).notNull(),
  value: float("value").notNull(),
  unit: varchar("unit", { length: 64 }),
  readingDate: timestamp("readingDate").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BiomarkerReading = typeof biomarkerReadings.$inferSelect;
export type InsertBiomarkerReading = typeof biomarkerReadings.$inferInsert;

/**
 * Health timeline notes — symptoms, supplements, lifestyle changes, etc.
 */
export const healthNotes = mysqlTable("health_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  noteDate: timestamp("noteDate").defaultNow().notNull(),
  category: mysqlEnum("category", ["symptom", "supplement", "lifestyle", "medication", "stress", "sleep", "other"]).default("other").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HealthNote = typeof healthNotes.$inferSelect;
export type InsertHealthNote = typeof healthNotes.$inferInsert;

/**
 * Saved wellness plans generated by the Lifestyle Customizer.
 * Stores the user's input selections and the AI-generated plan output.
 */
export const wellnessPlans = mysqlTable("wellness_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Human-readable name the user gives the plan, or auto-generated */
  title: varchar("title", { length: 255 }).notNull(),
  /** The user's input selections (goals, biomarkers, lifestyle factors) stored as JSON */
  inputs: json("inputs").notNull(),
  /** The full AI-generated plan output stored as JSON */
  planOutput: json("planOutput").notNull(),
  /** Optional user notes about this plan */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WellnessPlan = typeof wellnessPlans.$inferSelect;
export type InsertWellnessPlan = typeof wellnessPlans.$inferInsert;

/**
 * Tracks welcome email sequence delivery for new users.
 * Each user gets a 3-email sequence over 7 days.
 */
export const emailSequences = mysqlTable("email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  sequenceType: varchar("sequenceType", { length: 64 }).default("welcome").notNull(),
  
  // Email 1: Welcome + Popular Books (Day 0)
  email1Sent: tinyint("email1Sent").default(0).notNull(),
  email1SentAt: timestamp("email1SentAt"),
  email1Opened: tinyint("email1Opened").default(0).notNull(),
  
  // Email 2: Biomarker Guides Deep Dive (Day 2)
  email2Sent: tinyint("email2Sent").default(0).notNull(),
  email2SentAt: timestamp("email2SentAt"),
  email2Opened: tinyint("email2Opened").default(0).notNull(),
  
  // Email 3: AI Assistant + Lab Analysis (Day 5)
  email3Sent: tinyint("email3Sent").default(0).notNull(),
  email3SentAt: timestamp("email3SentAt"),
  email3Opened: tinyint("email3Opened").default(0).notNull(),
  
  // Overall sequence status
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "paused", "failed"]).default("pending").notNull(),
  
  // Unsubscribe tracking
  unsubscribed: tinyint("unsubscribed").default(0).notNull(),
  unsubscribeReason: varchar("unsubscribeReason", { length: 255 }),
  unsubscribeAt: timestamp("unsubscribeAt"),
  
  // Email preferences
  emailPreferences: json("emailPreferences").default(JSON.stringify({ marketing: true, transactional: true, digests: true })).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;

/**
 * Blog posts for SEO-optimized healthcare content.
 * Public-facing articles to drive organic traffic.
 */
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 160 }).notNull(),
  content: text("content").notNull(),
  featuredImage: varchar("featuredImage", { length: 1024 }),
  author: varchar("author", { length: 255 }).default("The Patient's Compass Team").notNull(),
  keywords: varchar("keywords", { length: 500 }),
  category: varchar("category", { length: 255 }).default("health-education").notNull(),
  tags: varchar("tags", { length: 500 }),
  readingTimeMinutes: int("readingTimeMinutes").default(5).notNull(),
  published: tinyint("published").default(0).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

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
  
  // Re-engagement emails (sent to inactive users)
  reEngagementEmailSent: tinyint("reEngagementEmailSent").default(0).notNull(),
  reEngagementEmailSentAt: timestamp("reEngagementEmailSentAt"),
  reEngagementEmailOpened: tinyint("reEngagementEmailOpened").default(0).notNull(),
  
  // Weekly digest emails (sent every Sunday)
  weeklyDigestEmailSent: tinyint("weeklyDigestEmailSent").default(0).notNull(),
  weeklyDigestEmailSentAt: timestamp("weeklyDigestEmailSentAt"),
  weeklyDigestEmailOpened: tinyint("weeklyDigestEmailOpened").default(0).notNull(),
  
  // Email preferences (JSON: { marketing, transactional, digests })
  emailPreferences: json("emailPreferences").default(JSON.stringify({ marketing: true, transactional: true, digests: true })),
  
  // Heartbeat cron task UIDs for scheduled jobs
  trialExpirationCronTaskUid: varchar("trialExpirationCronTaskUid", { length: 65 }),
  onboardingCronTaskUid: varchar("onboardingCronTaskUid", { length: 65 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailAutomation = typeof emailAutomation.$inferSelect;
export type InsertArticleCollection = typeof articleCollections.$inferInsert;

/** Reusable managed visual assets available to administrators for collection covers. */
export const collectionCoverAssets = mysqlTable("collection_cover_assets", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).default("general").notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  altText: varchar("altText", { length: 255 }).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CollectionCoverAsset = typeof collectionCoverAssets.$inferSelect;
export type InsertCollectionCoverAsset = typeof collectionCoverAssets.$inferInsert;

/** Singleton appearance setting for the public Health Companion assistant. */
export const assistantAppearanceSettings = mysqlTable("assistant_appearance_settings", {
  id: int("id").primaryKey(),
  portraitKey: varchar("portraitKey", { length: 80 }).default("european_executive").notNull(),
  cropPositionX: int("cropPositionX").default(50).notNull(),
  cropPositionY: int("cropPositionY").default(22).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssistantAppearanceSetting = typeof assistantAppearanceSettings.$inferSelect;

/** Administrator-uploaded managed portraits for the Health Companion library. */
export const assistantPortraitAssets = mysqlTable("assistant_portrait_assets", {
  id: int("id").autoincrement().primaryKey(),
  portraitKey: varchar("portraitKey", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 1024 }).notNull(),
  altText: varchar("altText", { length: 255 }).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AssistantPortraitAsset = typeof assistantPortraitAssets.$inferSelect;

/** Persisted focal-point settings keyed to each Health Companion portrait. */
export const assistantPortraitCropPresets = mysqlTable("assistant_portrait_crop_presets", {
  id: int("id").autoincrement().primaryKey(),
  portraitKey: varchar("portraitKey", { length: 80 }).notNull().unique(),
  cropPositionX: int("cropPositionX").default(50).notNull(),
  cropPositionY: int("cropPositionY").default(22).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssistantPortraitCropPreset = typeof assistantPortraitCropPresets.$inferSelect;

/**
 * Independently operated telehealth organizations approved for public directory display.
 * Partners remain unpublished until verification and contractual review are complete.
 */
export const telehealthPartners = mysqlTable("telehealth_partners", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  description: varchar("description", { length: 600 }).notNull(),
  websiteUrl: varchar("websiteUrl", { length: 1024 }).notNull(),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  licensingAuthority: varchar("licensingAuthority", { length: 180 }),
  licenseNumber: varchar("licenseNumber", { length: 120 }),
  licenseUrl: varchar("licenseUrl", { length: 1024 }),
  licenseStatus: varchar("licenseStatus", { length: 32 }).default("pending").notNull(),
  licenseExpiresAt: timestamp("licenseExpiresAt"),
  verificationNote: varchar("verificationNote", { length: 255 }),
  verifiedAt: timestamp("verifiedAt"),
  published: tinyint("published").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const telehealthPartnerStates = mysqlTable("telehealth_partner_states", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  stateCode: varchar("stateCode", { length: 2 }).notNull(),
});

export const telehealthPartnerSpecialties = mysqlTable("telehealth_partner_specialties", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  specialty: varchar("specialty", { length: 120 }).notNull(),
});

/** Minimal audit record proving that the required partner-handoff notice was accepted. */
export const telehealthPartnerConsents = mysqlTable("telehealth_partner_consents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  partnerId: int("partnerId").notNull(),
  consentVersion: varchar("consentVersion", { length: 32 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
});

export type TelehealthPartner = typeof telehealthPartners.$inferSelect;
export type InsertTelehealthPartner = typeof telehealthPartners.$inferInsert;
export type TelehealthPartnerConsent = typeof telehealthPartnerConsents.$inferSelect;

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

/**
 * Email verification codes for email change verification
 * When users update their email, a verification code is sent to the new email
 */
export const emailVerificationCodes = mysqlTable("email_verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  newEmail: varchar("newEmail", { length: 320 }).notNull(),
  verificationCode: varchar("verificationCode", { length: 6 }).notNull(),
  attempts: int("attempts").default(0).notNull(),
  verified: tinyint("verified").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;
