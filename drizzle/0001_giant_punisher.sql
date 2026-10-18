CREATE TABLE `biomarker_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`labReportId` int,
	`biomarkerName` varchar(255) NOT NULL,
	`value` float NOT NULL,
	`unit` varchar(64),
	`readingDate` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biomarker_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`source` varchar(64) DEFAULT 'landing_page',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `lab_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512),
	`fileUrl` varchar(1024),
	`rawText` text,
	`analysisResult` json,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_reports_id` PRIMARY KEY(`id`)
);
