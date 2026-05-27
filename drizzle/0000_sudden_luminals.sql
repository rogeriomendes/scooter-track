CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scooterId` integer NOT NULL,
	`type` text NOT NULL,
	`distance` real DEFAULT 0 NOT NULL,
	`batteryLevel` real NOT NULL,
	`notes` text,
	`date` integer NOT NULL,
	FOREIGN KEY (`scooterId`) REFERENCES `scooters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `scooters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`batteryType` text NOT NULL,
	`trackingMode` text DEFAULT 'percent' NOT NULL,
	`initialKm` real DEFAULT 0 NOT NULL,
	`autonomyGoal` real DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL
);
