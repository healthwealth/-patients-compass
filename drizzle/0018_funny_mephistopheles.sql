CREATE TABLE `user_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceType` enum('blog_post') NOT NULL,
	`resourceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_favorites_user_resource_unique` UNIQUE(`userId`,`resourceType`,`resourceId`)
);
--> statement-breakpoint
ALTER TABLE `user_activities` MODIFY COLUMN `eventType` enum('lab_report_saved','wellness_plan_saved','profile_image_updated','profile_image_removed','subscription_portal_opened','content_saved','content_unsaved') NOT NULL;