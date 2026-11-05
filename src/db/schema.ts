import { relations } from "drizzle-orm";
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const scooters = sqliteTable("scooters", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	batteryType: text("batteryType").notNull(), // e.g., '36V', '48V' from BATTERY_CHARTS
	trackingMode: text("trackingMode", { enum: ["voltage", "percent"] })
		.notNull()
		.default("percent"),
	initialKm: real("initialKm").notNull().default(0),
	autonomyGoal: real("autonomyGoal").notNull().default(0),
	batteryCapacityWh: real("batteryCapacityWh").default(0), // Wh ou (V x Ah), ex: 36V 10.4Ah = 374.4Wh
	showMaintenance: integer("showMaintenance", { mode: "boolean" })
		.notNull()
		.default(true),
	motorPower: integer("motorPower").default(0), // watts
	purchaseDate: integer("purchaseDate", { mode: "timestamp" }),
	serialNumber: text("serialNumber"),
	motorNumber: text("motorNumber"),
	invoicePdfPath: text("invoicePdfPath"),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export const logs = sqliteTable(
	"logs",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		scooterId: integer("scooterId")
			.notNull()
			.references(() => scooters.id, { onDelete: "cascade" }),
		type: text("type", { enum: ["trip", "charge", "initial"] }).notNull(),
		distance: real("distance").notNull().default(0), // km ridden (trip) or 0 (charge)
		batteryLevel: real("batteryLevel").notNull(), // voltage or percent
		notes: text("notes"),
		date: integer("date", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		index("idx_logs_scooter_date").on(table.scooterId, table.date),
		index("idx_logs_scooter_type").on(table.scooterId, table.type),
	],
);

export const maintenance = sqliteTable(
	"maintenance",
	{
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
		isCompleted: integer("isCompleted", { mode: "boolean" })
			.notNull()
			.default(false),
		completedAt: integer("completedAt", { mode: "timestamp" }),
		hasWear: integer("hasWear", { mode: "boolean" }).notNull().default(true),
		createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		index("idx_maintenance_scooter_completed").on(
			table.scooterId,
			table.isCompleted,
		),
	],
);

export const batteryConfigs = sqliteTable("battery_configs", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	key: text("key").notNull().unique(), // ex: '36V', '48V', 'CUSTOM_54V'
	label: text("label").notNull(), // ex: '36V (10S)'
	nominalVoltage: real("nominalVoltage").notNull(), // 36
	cells: integer("cells").notNull().default(0), // 10
	maxVoltage: real("maxVoltage").notNull(), // 42.0
	minVoltage: real("minVoltage").notNull(), // 30.0
	isDefault: integer("isDefault", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

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
