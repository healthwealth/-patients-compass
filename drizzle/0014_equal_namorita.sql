ALTER TABLE `email_automation` ADD `reEngagementEmailSent` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_automation` ADD `reEngagementEmailSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `email_automation` ADD `reEngagementEmailOpened` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_automation` ADD `weeklyDigestEmailSent` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_automation` ADD `weeklyDigestEmailSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `email_automation` ADD `weeklyDigestEmailOpened` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_automation` ADD `emailPreferences` json DEFAULT ('{"marketing":true,"transactional":true,"digests":true}');