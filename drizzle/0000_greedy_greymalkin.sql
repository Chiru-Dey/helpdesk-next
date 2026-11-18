CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`comment_id` int,
	`file_name` varchar(255) NOT NULL,
	`mime_type` varchar(120) NOT NULL,
	`size_bytes` bigint NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`uploaded_by` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_id` int,
	`action` varchar(80) NOT NULL,
	`entity_type` varchar(40) NOT NULL,
	`entity_id` varchar(40) NOT NULL,
	`metadata` json,
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`author_id` int NOT NULL,
	`body` text NOT NULL,
	`is_internal` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`to_email` varchar(255) NOT NULL,
	`subject` varchar(300) NOT NULL,
	`status` enum('queued','sent','failed') NOT NULL DEFAULT 'queued',
	`provider_message_id` varchar(255),
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`sent_at` timestamp,
	CONSTRAINT `email_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`family_id` varchar(36) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp,
	`replaced_by_id` int,
	`user_agent` varchar(512),
	`ip_address` varchar(45),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(20) NOT NULL,
	`subject` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`customer_id` int NOT NULL,
	`assignee_id` int,
	`resolved_at` timestamp,
	`closed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` enum('admin','agent','customer') NOT NULL DEFAULT 'customer',
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`display_name` varchar(120) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_comment_id_comments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_uploaded_by_users_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_replaced_by_id_refresh_tokens_id_fk` FOREIGN KEY (`replaced_by_id`) REFERENCES `refresh_tokens`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_customer_id_users_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_assignee_id_users_id_fk` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `attachments_ticket_idx` ON `attachments` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `comments_ticket_idx` ON `comments` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_user_idx` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_family_idx` ON `refresh_tokens` (`family_id`);--> statement-breakpoint
CREATE INDEX `tickets_customer_idx` ON `tickets` (`customer_id`);--> statement-breakpoint
CREATE INDEX `tickets_assignee_idx` ON `tickets` (`assignee_id`);--> statement-breakpoint
CREATE INDEX `tickets_status_idx` ON `tickets` (`status`);