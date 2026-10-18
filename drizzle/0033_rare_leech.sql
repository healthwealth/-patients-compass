CREATE TABLE `shopify_webhook_events` (
	`id` varchar(255) NOT NULL,
	`topic` varchar(255) NOT NULL,
	`shopDomain` varchar(255) NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `shopify_webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `shopifyCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `shopifySubscriptionContractId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `shopifyOrderId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `shopifyShopDomain` varchar(255);