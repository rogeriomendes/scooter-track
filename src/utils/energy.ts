import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import type { Log, Scooter } from "@/utils/stats";

export interface EnergyStats {
	estimatedBatteryWh: number;
	totalKwhConsumed: number;
	totalEnergyCost: number;
	costPerKm: number;
	estimatedGasCost: number;
	totalSavings: number;
}

/**
 * Retorna a capacidade da bateria em Wh:
 * Usa o valor configurado na scooter ou estima com base na voltagem nominal (ex: 36V ~ 360Wh, 48V ~ 624Wh, etc.).
 */
export function getScooterBatteryWh(scooter: Scooter | null): number {
	if (!scooter) return 0;
	if (scooter.batteryCapacityWh && scooter.batteryCapacityWh > 0) {
		return scooter.batteryCapacityWh;
	}

	const chart = BATTERY_CHARTS[scooter.batteryType];
	if (chart) {
		// Estima uma bateria média típica de 10Ah - 13Ah de patinetes
		return chart.nominalVoltage * 10;
	}
	return 360; // padrão 360Wh
}

/**
 * Calcula métricas de consumo de energia e economia financeira:
 * @param scooter Scooter ativa
 * @param trips Lista de viagens
 * @param costPerKwh Custo de energia por kWh (R$)
 * @param gasPricePerLiter Preço da gasolina para comparação (R$/L)
 * @param gasCarKmPerLiter Média de consumo de um carro popular ou moto (padrão 12 km/L)
 */
export function calculateEnergyEconomyStats(
	scooter: Scooter | null,
	trips: Log[],
	costPerKwh: number,
	gasPricePerLiter: number,
	gasCarKmPerLiter = 12,
): EnergyStats {
	const batteryWh = getScooterBatteryWh(scooter);
	const totalKm = trips.reduce((acc, t) => acc + (t.distance || 0), 0);

	// Média de consumo de patinetes elétricos gira em torno de 15 Wh a 25 Wh por km.
	// Se tivermos meta de autonomia: batteryWh / autonomiaGoal
	const whPerKm =
		scooter?.autonomyGoal && scooter.autonomyGoal > 0
			? batteryWh / scooter.autonomyGoal
			: 20; // 20 Wh/km padrão da indústria para patinetes urbanos

	const totalWhConsumed = totalKm * whPerKm;
	const totalKwhConsumed = totalWhConsumed / 1000;

	// Adiciona ~15% de perda na conversão do carregador AC/DC
	const chargerEfficiencyFactor = 1.15;
	const gridKwh = totalKwhConsumed * chargerEfficiencyFactor;

	const totalEnergyCost = gridKwh * costPerKwh;
	const costPerKm = totalKm > 0 ? totalEnergyCost / totalKm : 0;

	// Comparativo com combustível (gasolina)
	const litersEquivalent = totalKm / gasCarKmPerLiter;
	const estimatedGasCost = litersEquivalent * gasPricePerLiter;
	const totalSavings = Math.max(0, estimatedGasCost - totalEnergyCost);

	return {
		estimatedBatteryWh: Math.round(batteryWh),
		totalKwhConsumed: gridKwh,
		totalEnergyCost,
		costPerKm,
		estimatedGasCost,
		totalSavings,
	};
}
