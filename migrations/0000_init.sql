CREATE TABLE `analytics_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshotDate` integer NOT NULL,
	`totalUsers` integer DEFAULT 0 NOT NULL,
	`newUsersToday` integer DEFAULT 0 NOT NULL,
	`activeUsersToday` integer DEFAULT 0 NOT NULL,
	`activeTrials` integer DEFAULT 0 NOT NULL,
	`trialsExpiredToday` integer DEFAULT 0 NOT NULL,
	`trialConversionRate` real DEFAULT 0 NOT NULL,
	`activeSubscriptions` integer DEFAULT 0 NOT NULL,
	`newSubscriptionsToday` integer DEFAULT 0 NOT NULL,
	`canceledSubscriptionsToday` integer DEFAULT 0 NOT NULL,
	`monthlyRecurringRevenue` integer DEFAULT 0 NOT NULL,
	`annualRecurringRevenue` integer DEFAULT 0 NOT NULL,
	`emailsSentToday` integer DEFAULT 0 NOT NULL,
	`emailOpenRate` real DEFAULT 0 NOT NULL,
	`emailClickRate` real DEFAULT 0 NOT NULL,
	`newReferralsToday` integer DEFAULT 0 NOT NULL,
	`referralConversionsToday` integer DEFAULT 0 NOT NULL,
	`totalReferralCreditsIssued` integer DEFAULT 0 NOT NULL,
	`totalRevenueToday` integer DEFAULT 0 NOT NULL,
	`averageOrderValue` integer DEFAULT 0 NOT NULL,
	`churnRate` real DEFAULT 0 NOT NULL,
	`aiQueriesTotal` integer DEFAULT 0 NOT NULL,
	`labReportsAnalyzed` integer DEFAULT 0 NOT NULL,
	`booksViewed` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `article_collection_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collectionId` integer NOT NULL,
	`blogPostId` integer NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_collection_items_collection_post_unique` ON `article_collection_items` (`collectionId`,`blogPostId`);--> statement-breakpoint
CREATE TABLE `article_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`title` text(160) NOT NULL,
	`description` text(500) NOT NULL,
	`coverImage` text(1024),
	`published` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_collections_slug_unique` ON `article_collections` (`slug`);--> statement-breakpoint
CREATE TABLE `assistant_appearance_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`portraitKey` text(80) DEFAULT 'european_executive' NOT NULL,
	`cropPositionX` integer DEFAULT 50 NOT NULL,
	`cropPositionY` integer DEFAULT 22 NOT NULL,
	`updatedBy` integer,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assistant_portrait_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`portraitKey` text(80) NOT NULL,
	`label` text(120) NOT NULL,
	`description` text(255) NOT NULL,
	`imageUrl` text(1024) NOT NULL,
	`altText` text(255) NOT NULL,
	`createdBy` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assistant_portrait_assets_portraitKey_unique` ON `assistant_portrait_assets` (`portraitKey`);--> statement-breakpoint
CREATE TABLE `assistant_portrait_crop_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`portraitKey` text(80) NOT NULL,
	`cropPositionX` integer DEFAULT 50 NOT NULL,
	`cropPositionY` integer DEFAULT 22 NOT NULL,
	`updatedBy` integer,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assistant_portrait_crop_presets_portraitKey_unique` ON `assistant_portrait_crop_presets` (`portraitKey`);--> statement-breakpoint
CREATE TABLE `biomarker_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`labReportId` integer,
	`biomarkerName` text(255) NOT NULL,
	`value` real NOT NULL,
	`unit` text(64),
	`readingDate` integer DEFAULT (unixepoch()) NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(255) NOT NULL,
	`title` text(255) NOT NULL,
	`description` text(160) NOT NULL,
	`content` text NOT NULL,
	`featuredImage` text(1024),
	`author` text(255) DEFAULT 'The Patient''s Compass Team' NOT NULL,
	`keywords` text(500),
	`category` text(255) DEFAULT 'health-education' NOT NULL,
	`tags` text(500),
	`readingTimeMinutes` integer DEFAULT 5 NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`publishedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE TABLE `collection_cover_assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text(160) NOT NULL,
	`category` text(80) DEFAULT 'general' NOT NULL,
	`imageUrl` text(1024) NOT NULL,
	`altText` text(255) NOT NULL,
	`createdBy` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_automation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`trialExpirationEmailScheduled` integer DEFAULT 0 NOT NULL,
	`trialExpirationEmailSent` integer DEFAULT 0 NOT NULL,
	`trialExpirationEmailSentAt` integer,
	`trialExpirationEmailOpened` integer DEFAULT 0 NOT NULL,
	`onboardingEmail1Sent` integer DEFAULT 0 NOT NULL,
	`onboardingEmail1SentAt` integer,
	`onboardingEmail1Opened` integer DEFAULT 0 NOT NULL,
	`onboardingEmail2Sent` integer DEFAULT 0 NOT NULL,
	`onboardingEmail2SentAt` integer,
	`onboardingEmail2Opened` integer DEFAULT 0 NOT NULL,
	`onboardingEmail3Sent` integer DEFAULT 0 NOT NULL,
	`onboardingEmail3SentAt` integer,
	`onboardingEmail3Opened` integer DEFAULT 0 NOT NULL,
	`reEngagementEmailSent` integer DEFAULT 0 NOT NULL,
	`reEngagementEmailSentAt` integer,
	`reEngagementEmailOpened` integer DEFAULT 0 NOT NULL,
	`weeklyDigestEmailSent` integer DEFAULT 0 NOT NULL,
	`weeklyDigestEmailSentAt` integer,
	`weeklyDigestEmailOpened` integer DEFAULT 0 NOT NULL,
	`emailPreferences` text DEFAULT '{"marketing":true,"transactional":true,"digests":true}',
	`trialExpirationCronTaskUid` text(65),
	`onboardingCronTaskUid` text(65),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_automation_userId_unique` ON `email_automation` (`userId`);--> statement-breakpoint
CREATE TABLE `email_sequences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`sequenceType` text(64) DEFAULT 'welcome' NOT NULL,
	`email1Sent` integer DEFAULT 0 NOT NULL,
	`email1SentAt` integer,
	`email1Opened` integer DEFAULT 0 NOT NULL,
	`email2Sent` integer DEFAULT 0 NOT NULL,
	`email2SentAt` integer,
	`email2Opened` integer DEFAULT 0 NOT NULL,
	`email3Sent` integer DEFAULT 0 NOT NULL,
	`email3SentAt` integer,
	`email3Opened` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`unsubscribed` integer DEFAULT 0 NOT NULL,
	`unsubscribeReason` text(255),
	`unsubscribeAt` integer,
	`emailPreferences` text DEFAULT '{"marketing":true,"transactional":true,"digests":true}' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_sequences_userId_unique` ON `email_sequences` (`userId`);--> statement-breakpoint
CREATE TABLE `email_subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text(320) NOT NULL,
	`name` text(255),
	`source` text(64) DEFAULT 'landing_page',
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_subscribers_email_unique` ON `email_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `email_verification_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`newEmail` text(320) NOT NULL,
	`verificationCode` text(6) NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `health_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`noteDate` integer DEFAULT (unixepoch()) NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`title` text(255) NOT NULL,
	`content` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lab_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`fileName` text(255) NOT NULL,
	`fileKey` text(512),
	`fileUrl` text(1024),
	`rawText` text,
	`analysisResult` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referrerId` integer NOT NULL,
	`referredUserId` integer,
	`referralCode` text(64) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`creditAmount` integer DEFAULT 1000 NOT NULL,
	`creditApplied` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`convertedAt` integer,
	`expiresAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_referralCode_unique` ON `referrals` (`referralCode`);--> statement-breakpoint
CREATE TABLE `saved_certificates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`childName` text(120) NOT NULL,
	`title` text(160) NOT NULL,
	`fileKey` text(512) NOT NULL,
	`fileUrl` text(1024) NOT NULL,
	`previewKey` text(512),
	`previewUrl` text(1024),
	`archivedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shopify_webhook_events` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`topic` text(255) NOT NULL,
	`shopDomain` text(255) NOT NULL,
	`receivedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`processedAt` integer
);
--> statement-breakpoint
CREATE TABLE `telehealth_partner_consents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`partnerId` integer NOT NULL,
	`consentVersion` text(32) NOT NULL,
	`acceptedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `telehealth_partner_specialties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`partnerId` integer NOT NULL,
	`specialty` text(120) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `telehealth_partner_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`partnerId` integer NOT NULL,
	`stateCode` text(2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `telehealth_partners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text(120) NOT NULL,
	`name` text(180) NOT NULL,
	`description` text(600) NOT NULL,
	`websiteUrl` text(1024) NOT NULL,
	`logoUrl` text(1024),
	`licensingAuthority` text(180),
	`licenseNumber` text(120),
	`licenseUrl` text(1024),
	`licenseStatus` text(32) DEFAULT 'pending' NOT NULL,
	`licenseExpiresAt` integer,
	`verificationNote` text(255),
	`verifiedAt` integer,
	`published` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telehealth_partners_slug_unique` ON `telehealth_partners` (`slug`);--> statement-breakpoint
CREATE TABLE `user_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`eventType` text NOT NULL,
	`title` text(160) NOT NULL,
	`summary` text(300),
	`sourceRef` text(64),
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_collection_follows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`collectionId` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_collection_follows_user_collection_unique` ON `user_collection_follows` (`userId`,`collectionId`);--> statement-breakpoint
CREATE TABLE `user_favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`resourceType` text NOT NULL,
	`resourceId` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_favorites_user_resource_unique` ON `user_favorites` (`userId`,`resourceType`,`resourceId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text(64) NOT NULL,
	`name` text,
	`email` text(320),
	`loginMethod` text(64),
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL,
	`stripeCustomerId` text(255),
	`stripeSubscriptionId` text(255),
	`shopifyCustomerId` text(255),
	`shopifySubscriptionContractId` text(255),
	`shopifyOrderId` text(255),
	`shopifyShopDomain` text(255),
	`subscriptionStatus` text DEFAULT 'free' NOT NULL,
	`subscriptionPlan` text,
	`aiQueryCount` integer DEFAULT 0 NOT NULL,
	`aiQueryDate` text(10),
	`passwordHash` text(255),
	`emailVerified` integer DEFAULT 0 NOT NULL,
	`verificationToken` text(255),
	`resetToken` text(255),
	`resetTokenExpiry` integer,
	`emailLoginToken` text(255),
	`emailLoginTokenExpiry` integer,
	`lastPasswordlessDeviceHash` text(64),
	`lastPasswordlessLoginAt` integer,
	`trialStartDate` integer,
	`trialEndDate` integer,
	`isTrialActive` integer DEFAULT 0 NOT NULL,
	`trialStatus` text DEFAULT 'none' NOT NULL,
	`googleId` text(255),
	`profileImageUrl` text(1024),
	`appleId` text(255)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_googleId_unique` ON `users` (`googleId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_appleId_unique` ON `users` (`appleId`);--> statement-breakpoint
CREATE TABLE `wellness_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text(255) NOT NULL,
	`inputs` text NOT NULL,
	`planOutput` text NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
