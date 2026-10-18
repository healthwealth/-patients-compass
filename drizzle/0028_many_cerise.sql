ALTER TABLE `users` ADD `lastPasswordlessDeviceHash` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `lastPasswordlessLoginAt` timestamp;