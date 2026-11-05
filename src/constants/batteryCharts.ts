import {
	addCustomBatteryConfig,
	type BatteryConfig,
	calculateBatteryPercentage,
	DEFAULT_BATTERY_CHARTS,
	deleteBatteryConfig,
	getBatteryConfigByKey,
	getBatteryConfigs,
	initBatteryConfigs,
	updateCustomBatteryConfig,
} from "@/services/batteryService";

export type { BatteryConfig };
export {
	addCustomBatteryConfig,
	calculateBatteryPercentage,
	DEFAULT_BATTERY_CHARTS,
	deleteBatteryConfig,
	getBatteryConfigByKey,
	getBatteryConfigs,
	initBatteryConfigs,
	updateCustomBatteryConfig,
};

/**
 * Mapa retrocompatível padrão para acesso seguro síncrono
 * Suporta BATTERY_CHARTS[key] diretamente sem Proxy (compatível com Hermes / React Native)
 */
export const BATTERY_CHARTS: Record<string, BatteryConfig> = new Proxy(
	{} as Record<string, BatteryConfig>,
	{
		get: (_target, prop: string) => {
			return getBatteryConfigByKey(prop);
		},
	},
);
