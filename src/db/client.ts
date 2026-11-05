import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

// Abre ou cria o banco de dados local
export const sqliteDb = SQLite.openDatabaseSync("scootertrack.db");

// Auto-migra colunas novas com segurança
try {
	sqliteDb.execSync(
		"ALTER TABLE maintenance ADD COLUMN isCompleted INTEGER NOT NULL DEFAULT 0;",
	);
} catch {
	// A coluna já existe
}

try {
	sqliteDb.execSync("ALTER TABLE maintenance ADD COLUMN completedAt INTEGER;");
} catch {
	// A coluna já existe
}

try {
	sqliteDb.execSync(
		"ALTER TABLE maintenance ADD COLUMN hasWear INTEGER NOT NULL DEFAULT 1;",
	);
} catch {
	// A coluna já existe
}

try {
	sqliteDb.execSync(
		"ALTER TABLE scooters ADD COLUMN batteryCapacityWh REAL DEFAULT 0;",
	);
} catch {
	// A coluna já existe
}

// Cria tabela de configurações de bateria / voltagens se não existir
try {
	sqliteDb.execSync(`
		CREATE TABLE IF NOT EXISTS battery_configs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			key TEXT NOT NULL UNIQUE,
			label TEXT NOT NULL,
			nominalVoltage REAL NOT NULL,
			cells INTEGER NOT NULL DEFAULT 0,
			maxVoltage REAL NOT NULL,
			minVoltage REAL NOT NULL,
			isDefault INTEGER NOT NULL DEFAULT 0,
			createdAt INTEGER NOT NULL
		);
	`);
} catch {
	// Tabela já existe
}

// Cria índices para consultas rápidas
try {
	sqliteDb.execSync(
		"CREATE INDEX IF NOT EXISTS idx_logs_scooter_date ON logs (scooterId, date);",
	);
	sqliteDb.execSync(
		"CREATE INDEX IF NOT EXISTS idx_logs_scooter_type ON logs (scooterId, type);",
	);
	sqliteDb.execSync(
		"CREATE INDEX IF NOT EXISTS idx_maintenance_scooter_completed ON maintenance (scooterId, isCompleted);",
	);
} catch {
	// Índices já existem ou não puderam ser criados
}

// Cria a instância do ORM vinculada ao banco e ao schema
export const db = drizzle(sqliteDb, { schema });
