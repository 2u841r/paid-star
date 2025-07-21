CREATE TABLE `payment_request` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`mobile_number` text NOT NULL,
	`payment_method` text NOT NULL,
	`github_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_notes` text,
	`requested_at` integer NOT NULL,
	`verified_at` integer,
	`paid_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`target` text NOT NULL,
	`description` text NOT NULL,
	`action` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_task_completion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`task_id` integer NOT NULL,
	`completed_at` integer NOT NULL,
	`proof` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_task_completion_user_id_task_id_idx` ON `user_task_completion` (`user_id`,`task_id`);