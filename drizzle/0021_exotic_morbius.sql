CREATE TABLE `collection_cover_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`altText` varchar(255) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_cover_assets_id` PRIMARY KEY(`id`)
);
