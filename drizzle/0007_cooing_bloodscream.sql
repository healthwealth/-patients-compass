ALTER TABLE `email_sequences` ADD `unsubscribed` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `email_sequences` ADD `unsubscribeReason` varchar(255);--> statement-breakpoint
ALTER TABLE `email_sequences` ADD `unsubscribeAt` timestamp;--> statement-breakpoint
ALTER TABLE `email_sequences` ADD `emailPreferences` json DEFAULT ('{"marketing":true,"transactional":true,"digests":true}') NOT NULL;