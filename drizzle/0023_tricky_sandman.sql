CREATE TABLE `assistant_appearance_settings` (
	`id` int NOT NULL,
	`portraitKey` varchar(80) NOT NULL DEFAULT 'european_executive',
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_appearance_settings_id` PRIMARY KEY(`id`)
);
