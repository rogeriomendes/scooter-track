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

// Cria a instância do ORM vinculada ao banco e ao schema
export const db = drizzle(sqliteDb, { schema });
