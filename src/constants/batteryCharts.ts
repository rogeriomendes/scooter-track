export type BatteryChart = {
	label: string;
	nominalVoltage: number;
	cells: number;
	maxVoltage: number; // 100%
	minVoltage: number; // 0%
};

export const BATTERY_CHARTS: Record<string, BatteryChart> = {
	"36V": {
		label: "36V (10S)",
		nominalVoltage: 36,
		cells: 10,
		maxVoltage: 42.0,
		minVoltage: 30.0,
	},
	"48V": {
		label: "48V (13S)",
		nominalVoltage: 48,
		cells: 13,
		maxVoltage: 54.6,
		minVoltage: 39.0,
	},
	"52V": {
		label: "52V (14S)",
		nominalVoltage: 52,
		cells: 14,
		maxVoltage: 58.8,
		minVoltage: 42.0,
	},
	"60V": {
		label: "60V (16S)",
		nominalVoltage: 60,
		cells: 16,
		maxVoltage: 67.2,
		minVoltage: 48.0,
	},
	"72V": {
		label: "72V (20S)",
		nominalVoltage: 72,
		cells: 20,
		maxVoltage: 84.0,
		minVoltage: 60.0,
	},
};

/**
 * Calculates battery percentage linearly based on voltage.
 */
export function calculateBatteryPercentage(
	voltage: number,
	chartKey: string,
): number {
	const chart = BATTERY_CHARTS[chartKey];
	if (!chart) return 0;
	if (voltage >= chart.maxVoltage) return 100;
	if (voltage <= chart.minVoltage) return 0;

	const range = chart.maxVoltage - chart.minVoltage;
	const current = voltage - chart.minVoltage;
	return Math.round((current / range) * 100);
}
