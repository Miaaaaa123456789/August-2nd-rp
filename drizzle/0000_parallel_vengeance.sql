CREATE TABLE `requirements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`priority` text DEFAULT 'P1' NOT NULL,
	`status` text DEFAULT '待评估' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`progress_note` text DEFAULT '' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
