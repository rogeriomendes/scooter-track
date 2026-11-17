import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

const DB_NAME = "scootertrack.db";

// Abre ou cria o banco de dados local com proteção contra corrupção e modo WAL ativo
function initDatabase(): SQLite.SQLiteDatabase {
	const openWithWal = () => {
		const db = SQLite.openDatabaseSync(DB_NAME);
		db.execSync("PRAGMA journal_mode = WAL;");
		return db;
	};

	let dbInstance: SQLite.SQLiteDatabase | null = null;
	try {
		dbInstance = openWithWal();
		// Testa integridade inicial dos arquivos/páginas do banco
		const check = dbInstance.getFirstSync<{
			integrity_check?: string;
			quick_check?: string;
		}>("PRAGMA quick_check;");
		const status = check?.quick_check || check?.integrity_check;
		if (status && status !== "ok") {
			throw new Error(`Integrity check failed: ${status}`);
		}
	} catch (error: unknown) {
		console.warn(
			"Banco de dados SQLite corrompido ou erro na integridade detectado. Recriando banco...",
			error,
		);
		try {
			if (dbInstance) {
				dbInstance.closeSync();
			}
		} catch {
			// Ignora se não puder fechar
		}
		try {
			SQLite.deleteDatabaseSync(DB_NAME);
		} catch (deleteErr) {
			console.error("Falha ao deletar banco corrompido:", deleteErr);
		}
		dbInstance = openWithWal();
	}

	return dbInstance;
}

export const sqliteDb = initDatabase();

// Aplica migrações e índices manuais com segurança
export function applyManualMigrations(
	dbInstance: SQLite.SQLiteDatabase = sqliteDb,
) {
	try {
		dbInstance.execSync(
			"ALTER TABLE maintenance ADD COLUMN isCompleted INTEGER NOT NULL DEFAULT 0;",
		);
	} catch {
		// A coluna já existe ou tabela ainda não criada
	}

	try {
		dbInstance.execSync(
			"ALTER TABLE maintenance ADD COLUMN completedAt INTEGER;",
		);
	} catch {
		// A coluna já existe ou tabela ainda não criada
	}

	try {
		dbInstance.execSync(
			"ALTER TABLE maintenance ADD COLUMN hasWear INTEGER NOT NULL DEFAULT 1;",
		);
	} catch {
		// A coluna já existe ou tabela ainda não criada
	}

	try {
		dbInstance.execSync(
			"ALTER TABLE scooters ADD COLUMN batteryCapacityWh REAL DEFAULT 0;",
		);
	} catch {
		// A coluna já existe ou tabela ainda não criada
	}

	try {
		dbInstance.execSync(`
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

	try {
		dbInstance.execSync(
			"CREATE INDEX IF NOT EXISTS idx_logs_scooter_date ON logs (scooterId, date);",
		);
		dbInstance.execSync(
			"CREATE INDEX IF NOT EXISTS idx_logs_scooter_type ON logs (scooterId, type);",
		);
		dbInstance.execSync(
			"CREATE INDEX IF NOT EXISTS idx_maintenance_scooter_completed ON maintenance (scooterId, isCompleted);",
		);
	} catch {
		// Índices já existem ou tabelas ainda não criadas
	}
}

// Executa na inicialização (para bases já migradas)
applyManualMigrations(sqliteDb);

// Cria a instância do ORM vinculada ao banco e ao schema
export const db = drizzle(sqliteDb, { schema });
