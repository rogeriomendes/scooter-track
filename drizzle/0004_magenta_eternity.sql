PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_maintenance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scooterId` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'km' NOT NULL,
	`intervalKm` real DEFAULT 0 NOT NULL,
	`lastMaintenanceKm` real DEFAULT 0 NOT NULL,
	`intervalMonths` integer,
	`lastMaintenanceDate` integer,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`scooterId`) REFERENCES `scooters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_maintenance`("id", "scooterId", "name", "type", "intervalKm", "lastMaintenanceKm", "intervalMonths", "lastMaintenanceDate", "createdAt") SELECT "id", "scooterId", "name", "type", "intervalKm", "lastMaintenanceKm", "intervalMonths", "lastMaintenanceDate", "createdAt" FROM `maintenance`;--> statement-breakpoint
DROP TABLE `maintenance`;--> statement-breakpoint
ALTER TABLE `__new_maintenance` RENAME TO `maintenance`;--> statement-breakpoint
PRAGMA foreign_keys=ON;