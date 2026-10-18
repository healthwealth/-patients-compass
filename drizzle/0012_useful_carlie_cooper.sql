CREATE TABLE `email_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`newEmail` varchar(320) NOT NULL,
	`verificationCode` varchar(6) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`verified` tinyint NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_codes_id` PRIMARY KEY(`id`)
);
