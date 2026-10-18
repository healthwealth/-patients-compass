CREATE TABLE `health_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`noteDate` timestamp NOT NULL DEFAULT (now()),
	`category` enum('symptom','supplement','lifestyle','medication','stress','sleep','other') NOT NULL DEFAULT 'other',
	`title` varchar(255) NOT NULL,
	`content` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `health_notes_id` PRIMARY KEY(`id`)
);
