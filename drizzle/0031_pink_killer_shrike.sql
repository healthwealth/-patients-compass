CREATE TABLE `saved_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`childName` varchar(120) NOT NULL,
	`title` varchar(160) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_activities` MODIFY COLUMN `eventType` enum('lab_report_saved','wellness_plan_saved','profile_image_updated','profile_image_removed','subscription_portal_opened','content_saved','content_unsaved','certificate_saved','collection_followed','collection_unfollowed') NOT NULL;