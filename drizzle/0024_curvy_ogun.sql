CREATE TABLE `assistant_portrait_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portraitKey` varchar(80) NOT NULL,
	`label` varchar(120) NOT NULL,
	`description` varchar(255) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`altText` varchar(255) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistant_portrait_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assistant_portrait_assets_portraitKey_unique` UNIQUE(`portraitKey`)
);
