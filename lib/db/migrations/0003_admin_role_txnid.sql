ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_request` ADD `txn_id` text;
