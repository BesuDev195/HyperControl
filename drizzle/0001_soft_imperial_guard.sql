CREATE TABLE `focus_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer,
	`focus_title` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`duration_seconds` integer,
	`completed` integer DEFAULT false NOT NULL,
	`interrupted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`question` text,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'TODO' NOT NULL,
	`priority` text DEFAULT 'Medium' NOT NULL,
	`top_priority_rank` integer,
	`due_date` integer,
	`estimated_minutes` integer,
	`project_id` integer,
	`is_today` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	`completed_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "title", "description", "status", "priority", "top_priority_rank", "due_date", "estimated_minutes", "project_id", "is_today", "created_at", "updated_at", "completed_at") SELECT "id", "title", "description", "status", "priority", "top_priority_rank", "due_date", "estimated_minutes", "project_id", "is_today", "created_at", "updated_at", "completed_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `ideas` ADD `image_uri` text;--> statement-breakpoint
ALTER TABLE `ideas` ADD `color` text;--> statement-breakpoint
ALTER TABLE `ideas` ADD `updated_at` integer;