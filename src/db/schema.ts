import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const scooters = sqliteTable("scooters", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	batteryType: text("batteryType").notNull(), // e.g., '36V', '48V' from BATTERY_CHARTS
	trackingMode: text("trackingMode", { enum: ["voltage", "percent"] })
		.notNull()
		.default("percent"),
	initialKm: real("initialKm").notNull().default(0),
	autonomyGoal: real("autonomyGoal").notNull().default(0),
	showMaintenance: integer("showMaintenance", { mode: "boolean" })
		.notNull()
		.default(true),
	purchaseDate: integer("purchaseDate", { mode: "timestamp" }),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const logs = sqliteTable("logs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	scooterId: integer("scooterId")
		.notNull()
		.references(() => scooters.id, { onDelete: "cascade" }),
	type: text("type", { enum: ["trip", "charge", "initial"] }).notNull(),
	distance: real("distance").notNull().default(0), // km ridden (trip) or 0 (charge)
	batteryLevel: real("batteryLevel").notNull(), // voltage or percent
	notes: text("notes"),
	date: integer("date", { mode: "timestamp" }).notNull(),
});

export const maintenance = sqliteTable("maintenance", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	scooterId: integer("scooterId")
		.notNull()
		.references(() => scooters.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	type: text("type", { enum: ["km", "months", "date", "mixed"] })
		.notNull()
		.default("km"),
	intervalKm: real("intervalKm").notNull().default(0), // Interval for this maintenance (e.g., 1000km)
	lastMaintenanceKm: real("lastMaintenanceKm").notNull().default(0), // Scooter's total KM when this was last performed
	intervalMonths: integer("intervalMonths"), // Interval in months
	lastMaintenanceDate: integer("lastMaintenanceDate", { mode: "timestamp" }), // Last time it was performed
	targetDate: integer("targetDate", { mode: "timestamp" }), // Target fixed date for 'date' mode
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

import { relations } from "drizzle-orm";

export const scootersRelations = relations(scooters, ({ many }) => ({
	logs: many(logs),
	maintenance: many(maintenance),
}));

export const logsRelations = relations(logs, ({ one }) => ({
	scooter: one(scooters, {
		fields: [logs.scooterId],
		references: [scooters.id],
	}),
}));

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
	scooter: one(scooters, {
		fields: [maintenance.scooterId],
		references: [scooters.id],
	}),
}));
