ALTER TABLE `saved_certificates` ADD `previewKey` varchar(512);--> statement-breakpoint
ALTER TABLE `saved_certificates` ADD `previewUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `saved_certificates` ADD `archivedAt` timestamp;