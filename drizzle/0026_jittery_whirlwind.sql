ALTER TABLE `telehealth_partners` ADD `licensingAuthority` varchar(180);--> statement-breakpoint
ALTER TABLE `telehealth_partners` ADD `licenseNumber` varchar(120);--> statement-breakpoint
ALTER TABLE `telehealth_partners` ADD `licenseUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `telehealth_partners` ADD `licenseStatus` varchar(32) DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `telehealth_partners` ADD `licenseExpiresAt` timestamp;