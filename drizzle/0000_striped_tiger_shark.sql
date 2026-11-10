CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`service` text NOT NULL,
	`destination` text NOT NULL,
	`travel_month` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`consent` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_enquiries_email_created_at` ON `enquiries` (`email`,`created_at`);