import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

// Abre ou cria o banco de dados local
export const sqliteDb = SQLite.openDatabaseSync("scootertrack.db");

// Cria a instância do ORM vinculada ao banco e ao schema
export const db = drizzle(sqliteDb, { schema });
