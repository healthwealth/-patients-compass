ALTER TABLE `users` ADD `emailLoginToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailLoginTokenExpiry` timestamp;