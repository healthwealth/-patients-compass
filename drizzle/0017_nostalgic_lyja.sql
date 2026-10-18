CREATE TABLE `user_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('lab_report_saved','wellness_plan_saved','profile_image_updated','profile_image_removed','subscription_portal_opened') NOT NULL,
	`title` varchar(160) NOT NULL,
	`summary` varchar(300),
	`sourceRef` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_activities_id` PRIMARY KEY(`id`)
);
