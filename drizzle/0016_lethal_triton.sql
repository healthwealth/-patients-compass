ALTER TABLE `users` ADD `subscriptionPlan` enum('monthly','yearly');--> statement-breakpoint
ALTER TABLE `users` ADD `profileImageUrl` varchar(1024);