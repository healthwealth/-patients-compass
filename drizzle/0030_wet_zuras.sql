CREATE TABLE `assistant_portrait_crop_presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portraitKey` varchar(80) NOT NULL,
	`cropPositionX` int NOT NULL DEFAULT 50,
	`cropPositionY` int NOT NULL DEFAULT 22,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assistant_portrait_crop_presets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistant_portrait_crop_presets_portraitKey_unique` UNIQUE(`portraitKey`)
);
