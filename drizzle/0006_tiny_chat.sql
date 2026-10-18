CREATE TABLE `email_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sequenceType` varchar(64) NOT NULL DEFAULT 'welcome',
	`email1Sent` tinyint NOT NULL DEFAULT 0,
	`email1SentAt` timestamp,
	`email1Opened` tinyint NOT NULL DEFAULT 0,
	`email2Sent` tinyint NOT NULL DEFAULT 0,
	`email2SentAt` timestamp,
	`email2Opened` tinyint NOT NULL DEFAULT 0,
	`email3Sent` tinyint NOT NULL DEFAULT 0,
	`email3SentAt` timestamp,
	`email3Opened` tinyint NOT NULL DEFAULT 0,
	`status` enum('pending','in_progress','completed','paused','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_sequences_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_sequences_userId_unique` UNIQUE(`userId`)
);
