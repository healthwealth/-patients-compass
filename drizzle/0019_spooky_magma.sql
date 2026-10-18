CREATE TABLE `article_collection_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`blogPostId` int NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `article_collection_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `article_collection_items_collection_post_unique` UNIQUE(`collectionId`,`blogPostId`)
);
--> statement-breakpoint
CREATE TABLE `article_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` varchar(500) NOT NULL,
	`coverImage` varchar(1024),
	`published` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `article_collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `article_collections_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_collection_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`collectionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_collection_follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_collection_follows_user_collection_unique` UNIQUE(`userId`,`collectionId`)
);
