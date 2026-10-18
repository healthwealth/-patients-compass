import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = sqliteTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: text("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: text("email", { length: 320 }),
  loginMethod: text("loginMethod", { length: 64 }),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  stripeCustomerId: text("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: text("stripeSubscriptionId", { length: 255 }),
  /** Shopify customer identifier used by the checkout/webhook adapter. */
  shopifyCustomerId: text("shopifyCustomerId", { length: 255 }),
  /** Shopify subscription contract identifier for recurring Pro access. */
  shopifySubscriptionContractId: text("shopifySubscriptionContractId", { length: 255 }),
  /** Most recent Shopify order associated with the subscription. */
  shopifyOrderId: text("shopifyOrderId", { length: 255 }),
  /** Shopify shop domain that issued the identifiers. */
  shopifyShopDomain: text("shopifyShopDomain", { length: 255 }),
  subscriptionStatus: text("subscriptionStatus", { enum: ["free", "active", "canceled", "past_due"] }).default("free").notNull(),
  subscriptionPlan: text("subscriptionPlan", { enum: ["monthly", "yearly"] }),
  /** Daily AI query counter for free-tier rate limiting (resets each UTC day) */
  aiQueryCount: integer("aiQueryCount").default(0).notNull(),
  /** The UTC date (YYYY-MM-DD) when aiQueryCount was last reset */
  aiQueryDate: text("aiQueryDate", { length: 10 }),
  /** Email/password auth: hashed password (null if OAuth user) */
  passwordHash: text("passwordHash", { length: 255 }),
  /** Email/password auth: email verification status */
  emailVerified: integer("emailVerified").default(0).notNull(),
  /** Email/password auth: verification token */
  verificationToken: text("verificationToken", { length: 255 }),
  /** Email/password auth: password reset token */
  resetToken: text("resetToken", { length: 255 }),
  /** Email/password auth: password reset token expiry */
  resetTokenExpiry: integer("resetTokenExpiry", { mode: "timestamp" }),
  /** Passwordless fallback: hashed email-login token */
  emailLoginToken: text("emailLoginToken", { length: 255 }),
  /** Passwordless fallback: email-login token expiry (15 minutes) */
  emailLoginTokenExpiry: integer("emailLoginTokenExpiry", { mode: "timestamp" }),
  /** Passwordless fallback: hash of the last browser/device signature; never store raw user-agent data */
  lastPasswordlessDeviceHash: text("lastPasswordlessDeviceHash", { length: 64 }),
  /** Passwordless fallback: timestamp of the last successful link login */
  lastPasswordlessLoginAt: integer("lastPasswordlessLoginAt", { mode: "timestamp" }),
  /** Trial start date (UTC) - when user started their 7-day trial */
  trialStartDate: integer("trialStartDate", { mode: "timestamp" }),
  /** Trial end date (UTC) - when trial expires and subscription begins */
  trialEndDate: integer("trialEndDate", { mode: "timestamp" }),
  /** Whether user is currently in trial period */
  isTrialActive: integer("isTrialActive").default(0).notNull(),
  /** Trial conversion status: 'pending' (waiting), 'converted' (paid), 'expired' (no payment) */
  trialStatus: text("trialStatus", { enum: ["none", "active", "converted", "expired"] }).default("none").notNull(),
  /** Google OAuth ID (unique per user) */
  googleId: text("googleId", { length: 255 }).unique(),
  /** Verified profile image URL supplied by the active identity provider */
  profileImageUrl: text("profileImageUrl", { length: 1024 }),
  /** Apple OAuth ID (unique per user) */
  appleId: text("appleId", { length: 255 }).unique(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Idempotency record for Shopify webhook deliveries. */
export const shopifyWebhookEvents = sqliteTable("shopify_webhook_events", {
  id: text("id", { length: 255 }).primaryKey(),
  topic: text("topic", { length: 255 }).notNull(),
  shopDomain: text("shopDomain", { length: 255 }).notNull(),
  receivedAt: integer("receivedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  processedAt: integer("processedAt", { mode: "timestamp" }),
});

/**
 * Private, non-clinical user activity used by the dashboard timeline.
 * Event labels are controlled server-side; health content and identifiers are never copied here.
 */
export const userActivities = sqliteTable("user_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  eventType: text("eventType", { enum: [
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
  ] }).notNull(),
  title: text("title", { length: 160 }).notNull(),
  summary: text("summary", { length: 300 }),
  sourceRef: text("sourceRef", { length: 64 }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;

/**
 * Private references to public content a user has chosen to save.
 * Content remains canonical in its original table; no health or article body is copied here.
 */
export const userFavorites = sqliteTable("user_favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  resourceType: text("resourceType", { enum: ["blog_post"] }).notNull(),
  resourceId: integer("resourceId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userResourceUnique: uniqueIndex("user_favorites_user_resource_unique").on(table.userId, table.resourceType, table.resourceId),
}));

export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = typeof userFavorites.$inferInsert;

/** Private, file-backed completion certificates generated by the authenticated user. */
export const savedCertificates = sqliteTable("saved_certificates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  childName: text("childName", { length: 120 }).notNull(),
  title: text("title", { length: 160 }).notNull(),
  fileKey: text("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl", { length: 1024 }).notNull(),
  previewKey: text("previewKey", { length: 512 }),
  previewUrl: text("previewUrl", { length: 1024 }),
  archivedAt: integer("archivedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type SavedCertificate = typeof savedCertificates.$inferSelect;
export type InsertSavedCertificate = typeof savedCertificates.$inferInsert;

/** Public editorial collections made from references to published blog posts. */
export const articleCollections = sqliteTable("article_collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug", { length: 120 }).notNull().unique(),
  title: text("title", { length: 160 }).notNull(),
  description: text("description", { length: 500 }).notNull(),
  coverImage: text("coverImage", { length: 1024 }),
  published: integer("published").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export const articleCollectionItems = sqliteTable("article_collection_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  collectionId: integer("collectionId").notNull(),
  blogPostId: integer("blogPostId").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  collectionPostUnique: uniqueIndex("article_collection_items_collection_post_unique").on(table.collectionId, table.blogPostId),
}));

/** Private relationship only; following does not copy collection or article content. */
export const userCollectionFollows = sqliteTable("user_collection_follows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  collectionId: integer("collectionId").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userCollectionUnique: uniqueIndex("user_collection_follows_user_collection_unique").on(table.userId, table.collectionId),
}));

/**
 * Lab reports uploaded and analyzed by users.
 */
export const labReports = sqliteTable("lab_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  fileName: text("fileName", { length: 255 }).notNull(),
  fileKey: text("fileKey", { length: 512 }),
  fileUrl: text("fileUrl", { length: 1024 }),
  rawText: text("rawText"),
  analysisResult: text("analysisResult", { mode: "json" }),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export type LabReport = typeof labReports.$inferSelect;
export type InsertLabReport = typeof labReports.$inferInsert;

/**
 * Email subscribers for the newsletter / lead magnet.
 */
export const emailSubscribers = sqliteTable("email_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email", { length: 320 }).notNull().unique(),
  name: text("name", { length: 255 }),
  source: text("source", { length: 64 }).default("landing_page"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = typeof emailSubscribers.$inferInsert;

/**
 * Individual biomarker readings tracked over time.
 */
export const biomarkerReadings = sqliteTable("biomarker_readings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  labReportId: integer("labReportId"),
  biomarkerName: text("biomarkerName", { length: 255 }).notNull(),
  value: real("value").notNull(),
  unit: text("unit", { length: 64 }),
  readingDate: integer("readingDate", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type BiomarkerReading = typeof biomarkerReadings.$inferSelect;
export type InsertBiomarkerReading = typeof biomarkerReadings.$inferInsert;

/**
 * Health timeline notes — symptoms, supplements, lifestyle changes, etc.
 */
export const healthNotes = sqliteTable("health_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  noteDate: integer("noteDate", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  category: text("category", { enum: ["symptom", "supplement", "lifestyle", "medication", "stress", "sleep", "other"] }).default("other").notNull(),
  title: text("title", { length: 255 }).notNull(),
  content: text("content"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type HealthNote = typeof healthNotes.$inferSelect;
export type InsertHealthNote = typeof healthNotes.$inferInsert;

/**
 * Saved wellness plans generated by the Lifestyle Customizer.
 * Stores the user's input selections and the AI-generated plan output.
 */
export const wellnessPlans = sqliteTable("wellness_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  /** Human-readable name the user gives the plan, or auto-generated */
  title: text("title", { length: 255 }).notNull(),
  /** The user's input selections (goals, biomarkers, lifestyle factors) stored as JSON */
  inputs: text("inputs", { mode: "json" }).notNull(),
  /** The full AI-generated plan output stored as JSON */
  planOutput: text("planOutput", { mode: "json" }).notNull(),
  /** Optional user notes about this plan */
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export type WellnessPlan = typeof wellnessPlans.$inferSelect;
export type InsertWellnessPlan = typeof wellnessPlans.$inferInsert;

/**
 * Tracks welcome email sequence delivery for new users.
 * Each user gets a 3-email sequence over 7 days.
 */
export const emailSequences = sqliteTable("email_sequences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  sequenceType: text("sequenceType", { length: 64 }).default("welcome").notNull(),
  
  // Email 1: Welcome + Popular Books (Day 0)
  email1Sent: integer("email1Sent").default(0).notNull(),
  email1SentAt: integer("email1SentAt", { mode: "timestamp" }),
  email1Opened: integer("email1Opened").default(0).notNull(),
  
  // Email 2: Biomarker Guides Deep Dive (Day 2)
  email2Sent: integer("email2Sent").default(0).notNull(),
  email2SentAt: integer("email2SentAt", { mode: "timestamp" }),
  email2Opened: integer("email2Opened").default(0).notNull(),
  
  // Email 3: AI Assistant + Lab Analysis (Day 5)
  email3Sent: integer("email3Sent").default(0).notNull(),
  email3SentAt: integer("email3SentAt", { mode: "timestamp" }),
  email3Opened: integer("email3Opened").default(0).notNull(),
  
  // Overall sequence status
  status: text("status", { enum: ["pending", "in_progress", "completed", "paused", "failed"] }).default("pending").notNull(),
  
  // Unsubscribe tracking
  unsubscribed: integer("unsubscribed").default(0).notNull(),
  unsubscribeReason: text("unsubscribeReason", { length: 255 }),
  unsubscribeAt: integer("unsubscribeAt", { mode: "timestamp" }),
  
  // Email preferences
  emailPreferences: text("emailPreferences", { mode: "json" }).default({ marketing: true, transactional: true, digests: true }).notNull(),
  
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;

/**
 * Blog posts for SEO-optimized healthcare content.
 * Public-facing articles to drive organic traffic.
 */
export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug", { length: 255 }).notNull().unique(),
  title: text("title", { length: 255 }).notNull(),
  description: text("description", { length: 160 }).notNull(),
  content: text("content").notNull(),
  featuredImage: text("featuredImage", { length: 1024 }),
  author: text("author", { length: 255 }).default("The Patient's Compass Team").notNull(),
  keywords: text("keywords", { length: 500 }),
  category: text("category", { length: 255 }).default("health-education").notNull(),
  tags: text("tags", { length: 500 }),
  readingTimeMinutes: integer("readingTimeMinutes").default(5).notNull(),
  published: integer("published").default(0).notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  publishedAt: integer("publishedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

/**
 * Referral program tracking — users earn $10 credit per successful referral
 */
export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referrerId: integer("referrerId").notNull(), // User who created the referral code
  referredUserId: integer("referredUserId"), // User who signed up via referral (null if not yet converted)
  referralCode: text("referralCode", { length: 64 }).notNull().unique(),
  status: text("status", { enum: ["pending", "converted", "expired"] }).default("pending").notNull(),
  creditAmount: integer("creditAmount").default(1000).notNull(), // $10 in cents
  creditApplied: integer("creditApplied").default(0).notNull(), // Whether credit was added to referrer's account
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  convertedAt: integer("convertedAt", { mode: "timestamp" }),
  expiresAt: integer("expiresAt", { mode: "timestamp" }), // Referral link expires after 90 days
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Email automation tracking — tracks trial expiration and onboarding emails
 */
export const emailAutomation = sqliteTable("email_automation", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  
  // Trial expiration emails (sent 1 day before trial ends)
  trialExpirationEmailScheduled: integer("trialExpirationEmailScheduled").default(0).notNull(),
  trialExpirationEmailSent: integer("trialExpirationEmailSent").default(0).notNull(),
  trialExpirationEmailSentAt: integer("trialExpirationEmailSentAt", { mode: "timestamp" }),
  trialExpirationEmailOpened: integer("trialExpirationEmailOpened").default(0).notNull(),
  
  // Onboarding sequence (days 1, 3, 5)
  onboardingEmail1Sent: integer("onboardingEmail1Sent").default(0).notNull(),
  onboardingEmail1SentAt: integer("onboardingEmail1SentAt", { mode: "timestamp" }),
  onboardingEmail1Opened: integer("onboardingEmail1Opened").default(0).notNull(),
  
  onboardingEmail2Sent: integer("onboardingEmail2Sent").default(0).notNull(),
  onboardingEmail2SentAt: integer("onboardingEmail2SentAt", { mode: "timestamp" }),
  onboardingEmail2Opened: integer("onboardingEmail2Opened").default(0).notNull(),
  
  onboardingEmail3Sent: integer("onboardingEmail3Sent").default(0).notNull(),
  onboardingEmail3SentAt: integer("onboardingEmail3SentAt", { mode: "timestamp" }),
  onboardingEmail3Opened: integer("onboardingEmail3Opened").default(0).notNull(),
  
  // Re-engagement emails (sent to inactive users)
  reEngagementEmailSent: integer("reEngagementEmailSent").default(0).notNull(),
  reEngagementEmailSentAt: integer("reEngagementEmailSentAt", { mode: "timestamp" }),
  reEngagementEmailOpened: integer("reEngagementEmailOpened").default(0).notNull(),
  
  // Weekly digest emails (sent every Sunday)
  weeklyDigestEmailSent: integer("weeklyDigestEmailSent").default(0).notNull(),
  weeklyDigestEmailSentAt: integer("weeklyDigestEmailSentAt", { mode: "timestamp" }),
  weeklyDigestEmailOpened: integer("weeklyDigestEmailOpened").default(0).notNull(),
  
  // Email preferences (JSON: { marketing, transactional, digests })
  emailPreferences: text("emailPreferences", { mode: "json" }).default({ marketing: true, transactional: true, digests: true }),
  
  // Heartbeat cron task UIDs for scheduled jobs
  trialExpirationCronTaskUid: text("trialExpirationCronTaskUid", { length: 65 }),
  onboardingCronTaskUid: text("onboardingCronTaskUid", { length: 65 }),
  
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export type EmailAutomation = typeof emailAutomation.$inferSelect;
export type InsertArticleCollection = typeof articleCollections.$inferInsert;

/** Reusable managed visual assets available to administrators for collection covers. */
export const collectionCoverAssets = sqliteTable("collection_cover_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title", { length: 160 }).notNull(),
  category: text("category", { length: 80 }).default("general").notNull(),
  imageUrl: text("imageUrl", { length: 1024 }).notNull(),
  altText: text("altText", { length: 255 }).notNull(),
  createdBy: integer("createdBy").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type CollectionCoverAsset = typeof collectionCoverAssets.$inferSelect;
export type InsertCollectionCoverAsset = typeof collectionCoverAssets.$inferInsert;

/** Singleton appearance setting for the public Health Companion assistant. */
export const assistantAppearanceSettings = sqliteTable("assistant_appearance_settings", {
  id: integer("id").primaryKey(),
  portraitKey: text("portraitKey", { length: 80 }).default("european_executive").notNull(),
  cropPositionX: integer("cropPositionX").default(50).notNull(),
  cropPositionY: integer("cropPositionY").default(22).notNull(),
  updatedBy: integer("updatedBy"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export type AssistantAppearanceSetting = typeof assistantAppearanceSettings.$inferSelect;

/** Administrator-uploaded managed portraits for the Health Companion library. */
export const assistantPortraitAssets = sqliteTable("assistant_portrait_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  portraitKey: text("portraitKey", { length: 80 }).notNull().unique(),
  label: text("label", { length: 120 }).notNull(),
  description: text("description", { length: 255 }).notNull(),
  imageUrl: text("imageUrl", { length: 1024 }).notNull(),
  altText: text("altText", { length: 255 }).notNull(),
  createdBy: integer("createdBy").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type AssistantPortraitAsset = typeof assistantPortraitAssets.$inferSelect;

/** Persisted focal-point settings keyed to each Health Companion portrait. */
export const assistantPortraitCropPresets = sqliteTable("assistant_portrait_crop_presets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  portraitKey: text("portraitKey", { length: 80 }).notNull().unique(),
  cropPositionX: integer("cropPositionX").default(50).notNull(),
  cropPositionY: integer("cropPositionY").default(22).notNull(),
  updatedBy: integer("updatedBy"),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export type AssistantPortraitCropPreset = typeof assistantPortraitCropPresets.$inferSelect;

/**
 * Independently operated telehealth organizations approved for public directory display.
 * Partners remain unpublished until verification and contractual review are complete.
 */
export const telehealthPartners = sqliteTable("telehealth_partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug", { length: 120 }).notNull().unique(),
  name: text("name", { length: 180 }).notNull(),
  description: text("description", { length: 600 }).notNull(),
  websiteUrl: text("websiteUrl", { length: 1024 }).notNull(),
  logoUrl: text("logoUrl", { length: 1024 }),
  licensingAuthority: text("licensingAuthority", { length: 180 }),
  licenseNumber: text("licenseNumber", { length: 120 }),
  licenseUrl: text("licenseUrl", { length: 1024 }),
  licenseStatus: text("licenseStatus", { length: 32 }).default("pending").notNull(),
  licenseExpiresAt: integer("licenseExpiresAt", { mode: "timestamp" }),
  verificationNote: text("verificationNote", { length: 255 }),
  verifiedAt: integer("verifiedAt", { mode: "timestamp" }),
  published: integer("published").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).$onUpdate(() => new Date()).notNull(),
});

export const telehealthPartnerStates = sqliteTable("telehealth_partner_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partnerId").notNull(),
  stateCode: text("stateCode", { length: 2 }).notNull(),
});

export const telehealthPartnerSpecialties = sqliteTable("telehealth_partner_specialties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  partnerId: integer("partnerId").notNull(),
  specialty: text("specialty", { length: 120 }).notNull(),
});

/** Minimal audit record proving that the required partner-handoff notice was accepted. */
export const telehealthPartnerConsents = sqliteTable("telehealth_partner_consents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId"),
  partnerId: integer("partnerId").notNull(),
  consentVersion: text("consentVersion", { length: 32 }).notNull(),
  acceptedAt: integer("acceptedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type TelehealthPartner = typeof telehealthPartners.$inferSelect;
export type InsertTelehealthPartner = typeof telehealthPartners.$inferInsert;
export type TelehealthPartnerConsent = typeof telehealthPartnerConsents.$inferSelect;

/**
 * Analytics snapshots for dashboard reporting
 * Captures daily metrics for conversion, revenue, and user growth
 */
export const analyticsSnapshots = sqliteTable("analytics_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotDate: integer("snapshotDate", { mode: "timestamp" }).notNull(), // UTC date of snapshot
  
  // User metrics
  totalUsers: integer("totalUsers").default(0).notNull(),
  newUsersToday: integer("newUsersToday").default(0).notNull(),
  activeUsersToday: integer("activeUsersToday").default(0).notNull(),
  
  // Trial metrics
  activeTrials: integer("activeTrials").default(0).notNull(),
  trialsExpiredToday: integer("trialsExpiredToday").default(0).notNull(),
  trialConversionRate: real("trialConversionRate").default(0).notNull(),
  
  // Subscription metrics
  activeSubscriptions: integer("activeSubscriptions").default(0).notNull(),
  newSubscriptionsToday: integer("newSubscriptionsToday").default(0).notNull(),
  canceledSubscriptionsToday: integer("canceledSubscriptionsToday").default(0).notNull(),
  monthlyRecurringRevenue: integer("monthlyRecurringRevenue").default(0).notNull(), // In cents
  annualRecurringRevenue: integer("annualRecurringRevenue").default(0).notNull(), // In cents
  
  // Email metrics
  emailsSentToday: integer("emailsSentToday").default(0).notNull(),
  emailOpenRate: real("emailOpenRate").default(0).notNull(),
  emailClickRate: real("emailClickRate").default(0).notNull(),
  
  // Referral metrics
  newReferralsToday: integer("newReferralsToday").default(0).notNull(),
  referralConversionsToday: integer("referralConversionsToday").default(0).notNull(),
  totalReferralCreditsIssued: integer("totalReferralCreditsIssued").default(0).notNull(), // In cents
  
  // Revenue metrics
  totalRevenueToday: integer("totalRevenueToday").default(0).notNull(), // In cents
  averageOrderValue: integer("averageOrderValue").default(0).notNull(), // In cents
  churnRate: real("churnRate").default(0).notNull(),
  
  // Engagement metrics
  aiQueriesTotal: integer("aiQueriesTotal").default(0).notNull(),
  labReportsAnalyzed: integer("labReportsAnalyzed").default(0).notNull(),
  booksViewed: integer("booksViewed").default(0).notNull(),
  
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;

/**
 * Email verification codes for email change verification
 * When users update their email, a verification code is sent to the new email
 */
export const emailVerificationCodes = sqliteTable("email_verification_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  newEmail: text("newEmail", { length: 320 }).notNull(),
  verificationCode: text("verificationCode", { length: 6 }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  verified: integer("verified").default(0).notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;
