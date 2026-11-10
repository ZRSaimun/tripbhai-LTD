CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'client' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`epoch` integer DEFAULT 0 NOT NULL,
	`mfa_secret` text,
	`last_totp` integer DEFAULT 0,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_subject_unique` ON `accounts` (`subject`);--> statement-breakpoint
CREATE TABLE `applicants` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`name` text NOT NULL,
	`account_id` text,
	`minor` integer DEFAULT 0 NOT NULL,
	`authority_record` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`staff_id` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`timezone` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`format` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`case_id` text,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`detail` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_case` ON `audit_events` (`case_id`);--> statement-breakpoint
CREATE TABLE `case_access` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`account_id` text NOT NULL,
	`scope` text NOT NULL,
	`granted_by` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`reference` text NOT NULL,
	`client_id` text NOT NULL,
	`service` text NOT NULL,
	`kind` text NOT NULL,
	`destination` text NOT NULL,
	`status` text NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`mutation_key` text,
	`assignee` text,
	`due_at` integer,
	`revision` integer DEFAULT 1 NOT NULL,
	`authority_at` integer,
	`privacy_at` integer NOT NULL,
	`external_reference` text,
	`outcome` text,
	`checklist_version` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assignee`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cases_request_id_unique` ON `cases` (`request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cases_reference_unique` ON `cases` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_cases_client` ON `cases` (`client_id`);--> statement-breakpoint
CREATE INDEX `idx_cases_assignee_status` ON `cases` (`assignee`,`status`);--> statement-breakpoint
CREATE TABLE `checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`applicant_id` text NOT NULL,
	`category` text NOT NULL,
	`requirement` text NOT NULL,
	`explanation` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`template_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`applicant_id`) REFERENCES `applicants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_checklist_case` ON `checklist_items` (`case_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_clients_account` ON `clients` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_clients_email` ON `clients` (`email`);--> statement-breakpoint
CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`draft` text NOT NULL,
	`published` text,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `document_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`item_id` text NOT NULL,
	`parent_id` text,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`digest` text NOT NULL,
	`scan` text NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`source` text NOT NULL,
	`received_at` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`client_visible` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `checklist_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_documents_case_item` ON `document_versions` (`case_id`,`item_id`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`client_id` text,
	`requested_by` text,
	`accepted_subject` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_hash_unique` ON `invitations` (`token_hash`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`author` text NOT NULL,
	`visibility` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_messages_case` ON `messages` (`case_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`case_id` text,
	`label` text NOT NULL,
	`read_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`reference` text NOT NULL,
	`method` text DEFAULT 'manual' NOT NULL,
	`recorded_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `privacy_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`kind` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `publication_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`account_id` text NOT NULL,
	`scope` text NOT NULL,
	`withdrawn_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`agency_minor` integer NOT NULL,
	`external_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`expires_at` integer NOT NULL,
	`conditions` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_authorisations` (
	`id` text PRIMARY KEY NOT NULL,
	`service` text NOT NULL,
	`professional` text NOT NULL,
	`register_url` text NOT NULL,
	`registration` text NOT NULL,
	`scope` text NOT NULL,
	`verified_by` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `staff_sessions` (
	`hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`epoch` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `success_stories` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`document_id` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`destination` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reviewed_by` text,
	`redaction_verified_at` integer,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`title` text NOT NULL,
	`assignee` text NOT NULL,
	`due_at` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `checklist_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`destination` text NOT NULL,
	`version` integer NOT NULL,
	`reviewer` text,
	`sources` text NOT NULL,
	`last_reviewed` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`items` text NOT NULL,
	`created_at` integer NOT NULL
);
