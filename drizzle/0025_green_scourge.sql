CREATE TABLE `telehealth_partner_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`partnerId` int NOT NULL,
	`consentVersion` varchar(32) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telehealth_partner_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telehealth_partner_specialties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`specialty` varchar(120) NOT NULL,
	CONSTRAINT `telehealth_partner_specialties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telehealth_partner_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`stateCode` varchar(2) NOT NULL,
	CONSTRAINT `telehealth_partner_states_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telehealth_partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` varchar(600) NOT NULL,
	`websiteUrl` varchar(1024) NOT NULL,
	`logoUrl` varchar(1024),
	`verificationNote` varchar(255),
	`verifiedAt` timestamp,
	`published` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telehealth_partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `telehealth_partners_slug_unique` UNIQUE(`slug`)
);
