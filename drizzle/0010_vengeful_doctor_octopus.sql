ALTER TABLE `users` ADD `trialStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `trialEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `isTrialActive` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialStatus` enum('none','active','converted','expired') DEFAULT 'none' NOT NULL;