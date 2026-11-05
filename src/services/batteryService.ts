import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { batteryConfigs } from "@/db/schema";

export type BatteryConfig = typeof batteryConfigs.$inferSelect;

export const DEFAULT_BATTERY_CHARTS: Array<{
	key: string;
	label: string;
	nominalVoltage: number;
	cells: number;
	maxVoltage: number;
	minVoltage: number;
	isDefault: boolean;
}> = [
	{
		key: "36V",
		label: "36V (10S)",
		nominalVoltage: 36,
		cells: 10,
		maxVoltage: 42.0,
		minVoltage: 30.0,
		isDefault: true,
	},
	{
		key: "48V",
		label: "48V (13S)",
		nominalVoltage: 48,
		cells: 13,
		maxVoltage: 54.6,
		minVoltage: 39.0,
		isDefault: true,
	},
	{
		key: "52V",
		label: "52V (14S)",
		nominalVoltage: 52,
		cells: 14,
		maxVoltage: 58.8,
		minVoltage: 42.0,
		isDefault: true,
	},
	{
		key: "60V",
		label: "60V (16S)",
		nominalVoltage: 60,
		cells: 16,
		maxVoltage: 67.2,
		minVoltage: 48.0,
		isDefault: true,
	},
	{
		key: "72V",
		label: "72V (20S)",
		nominalVoltage: 72,
		cells: 20,
		maxVoltage: 84.0,
		minVoltage: 60.0,
		isDefault: true,
	},
];

// Map em memória para lookup O(1) instantâneo sem iterar arrays
const defaultConfigsMap = new Map<string, BatteryConfig>(
	DEFAULT_BATTERY_CHARTS.map((item, index) => [
		item.key,
		{ id: index + 1, ...item, createdAt: new Date(0) },
	]),
);

let cachedConfigsMap = new Map<string, BatteryConfig>(defaultConfigsMap);
let cachedConfigsList: BatteryConfig[] = Array.from(defaultConfigsMap.values());
let initPromise: Promise<BatteryConfig[]> | null = null;
let isInitialized = false;

function updateCache(items: BatteryConfig[]) {
	cachedConfigsList = items;
	cachedConfigsMap = new Map();
	// Primeiro adiciona os defaults
	for (const [k, v] of defaultConfigsMap.entries()) {
		cachedConfigsMap.set(k, v);
	}
	// Depois sobrescreve com o banco (incluindo customizadas)
	for (const item of items) {
		cachedConfigsMap.set(item.key, item);
	}
}

/**
 * Inicialização com debounce de Promise: evita chamadas concorrentes duplicadas ao banco
 */
export async function initBatteryConfigs(): Promise<BatteryConfig[]> {
	if (isInitialized) return cachedConfigsList;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		try {
			const existing = await db.select().from(batteryConfigs);
			if (existing.length === 0) {
				const now = new Date();
				await db.insert(batteryConfigs).values(
					DEFAULT_BATTERY_CHARTS.map((def) => ({
						...def,
						createdAt: now,
					})),
				);
				const seeded = await db.select().from(batteryConfigs);
				updateCache(seeded);
			} else {
				updateCache(existing);
			}
			isInitialized = true;
			return cachedConfigsList;
		} catch (error) {
			console.error("Erro ao inicializar battery_configs:", error);
			return cachedConfigsList;
		} finally {
			initPromise = null;
		}
	})();

	return initPromise;
}

/**
 * Retorna lista de configurações. Se já estiver em memória, retorna instantâneo sem travar UI
 */
export async function getBatteryConfigs(): Promise<BatteryConfig[]> {
	if (!isInitialized) {
		return await initBatteryConfigs();
	}
	return cachedConfigsList;
}

/**
 * Busca síncrona O(1) pelo Key da voltagem
 */
export function getBatteryConfigByKey(key: string): BatteryConfig | undefined {
	return cachedConfigsMap.get(key) || defaultConfigsMap.get(key);
}

/**
 * Retorna as keys conhecidas (para o Proxy Object.keys)
 */
export function getBatteryConfigKeys(): string[] {
	return Array.from(cachedConfigsMap.keys());
}

/**
 * Calcula porcentagem de bateria linear com lookup O(1)
 */
export function calculateBatteryPercentage(
	voltage: number,
	chartKey: string,
): number {
	const config = getBatteryConfigByKey(chartKey);
	if (!config) return 0;
	if (voltage >= config.maxVoltage) return 100;
	if (voltage <= config.minVoltage) return 0;

	const range = config.maxVoltage - config.minVoltage;
	if (range <= 0) return 0;
	const current = voltage - config.minVoltage;
	return Math.round((current / range) * 100);
}

/**
 * Adiciona uma nova voltagem personalizada
 */
export async function addCustomBatteryConfig(data: {
	label: string;
	nominalVoltage: number;
	cells?: number;
	maxVoltage: number;
	minVoltage: number;
}): Promise<BatteryConfig> {
	await initBatteryConfigs();

	const key = `CUSTOM_${Date.now()}`;
	const [inserted] = await db
		.insert(batteryConfigs)
		.values({
			key,
			label: data.label.trim(),
			nominalVoltage: data.nominalVoltage,
			cells: data.cells ?? 0,
			maxVoltage: data.maxVoltage,
			minVoltage: data.minVoltage,
			isDefault: false,
			createdAt: new Date(),
		})
		.returning();

	const updated = await db.select().from(batteryConfigs);
	updateCache(updated);
	return inserted;
}

/**
 * Atualiza uma voltagem personalizada existente (não permite alterar chave nem padrões)
 */
export async function updateCustomBatteryConfig(
	id: number,
	data: {
		label: string;
		nominalVoltage: number;
		cells?: number;
		maxVoltage: number;
		minVoltage: number;
	},
): Promise<BatteryConfig | null> {
	await initBatteryConfigs();

	const found = cachedConfigsList.find((c) => c.id === id);
	if (!found || found.isDefault) return null;

	const [updated] = await db
		.update(batteryConfigs)
		.set({
			label: data.label.trim(),
			nominalVoltage: data.nominalVoltage,
			cells: data.cells ?? 0,
			maxVoltage: data.maxVoltage,
			minVoltage: data.minVoltage,
		})
		.where(eq(batteryConfigs.id, id))
		.returning();

	const all = await db.select().from(batteryConfigs);
	updateCache(all);
	return updated;
}

/**
 * Remove uma voltagem personalizada (protegendo as de fábrica)
 */
export async function deleteBatteryConfig(id: number): Promise<boolean> {
	await initBatteryConfigs();

	const found = cachedConfigsList.find((c) => c.id === id);
	if (!found || found.isDefault) return false;

	await db.delete(batteryConfigs).where(eq(batteryConfigs.id, id));
	const updated = await db.select().from(batteryConfigs);
	updateCache(updated);
	return true;
}
