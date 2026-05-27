CREATE TABLE `maintenance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scooterId` integer NOT NULL,
	`name` text NOT NULL,
	`intervalKm` real NOT NULL,
	`lastMaintenanceKm` real DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`scooterId`) REFERENCES `scooters`(`id`) ON UPDATE no action ON DELETE cascade
);
