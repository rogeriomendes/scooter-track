import { useMemo } from "react";
import type { logs, maintenance, scooters } from "@/db/schema";
import { calculateMaintenanceWear } from "@/utils/maintenance";
import type { calculateScooterStats } from "@/utils/stats";

export interface Badge {
	id: string;
	title: string;
	description: string;
	icon: string;
	isUnlocked: boolean;
	progress: number; // 0 to 1
	progressText: string;
	color: string;
}

export function useBadges(
	allLogs: (typeof logs.$inferSelect)[],
	stats: ReturnType<typeof calculateScooterStats> | null,
	maintenanceList: (typeof maintenance.$inferSelect)[],
	scooter?: typeof scooters.$inferSelect | null,
) {
	return useMemo(() => {
		const totalKm = stats?.totalKm || 0;
		let tripsCount = 0;
		let chargesCount = 0;
		for (const l of allLogs) {
			if (l.type === "trip") tripsCount++;
			else if (l.type === "charge") chargesCount++;
		}

		// CO2 saved: ~0.12 kg CO2 per km compared to gasoline car
		const co2SavedKg = totalKm * 0.12;

		let completedMaintenanceCount = 0;
		let hasRisk = false;
		for (const item of maintenanceList) {
			if (item.isCompleted) {
				completedMaintenanceCount++;
			} else if (item.hasWear ?? true) {
				if (
					!hasRisk &&
					calculateMaintenanceWear(item, totalKm).wearPercentage >= 70
				) {
					hasRisk = true;
				}
			}
		}

		const bestCycleKm = stats?.bestCycleKm || 0;
		const autonomyGoal = scooter?.autonomyGoal || 30;

		const list: Badge[] = [
			{
				id: "first_trip",
				title: "Primeiro Passo",
				description: "Registre seu primeiro uso de scooter no app.",
				icon: "navigation",
				isUnlocked: tripsCount >= 1,
				progress: Math.min(1, tripsCount / 1),
				progressText: `${tripsCount}/1 viagem`,
				color: "text-success",
			},
			{
				id: "first_charge",
				title: "Bateria Renovada",
				description: "Registre sua primeira recarga de energia.",
				icon: "battery-charging",
				isUnlocked: chargesCount >= 1,
				progress: Math.min(1, chargesCount / 1),
				progressText: `${chargesCount}/1 recarga`,
				color: "text-lime-400",
			},
			{
				id: "km_100",
				title: "Centenário",
				description: "Acumule 100 km rodados na scooter.",
				icon: "award",
				isUnlocked: totalKm >= 100,
				progress: Math.min(1, totalKm / 100),
				progressText: `${totalKm.toFixed(0)}/100 km`,
				color: "text-info",
			},
			{
				id: "km_500",
				title: "Meio Milhar",
				description: "Alcance a marca de 500 km rodados.",
				icon: "zap",
				isUnlocked: totalKm >= 500,
				progress: Math.min(1, totalKm / 500),
				progressText: `${totalKm.toFixed(0)}/500 km`,
				color: "text-warning",
			},
			{
				id: "km_1000",
				title: "Clube dos 1.000 KM",
				description: "Conquiste 1.000 km percorridos com a scooter.",
				icon: "shield",
				isUnlocked: totalKm >= 1000,
				progress: Math.min(1, totalKm / 1000),
				progressText: `${totalKm.toFixed(0)}/1.000 km`,
				color: "text-amber-400",
			},
			{
				id: "km_5000",
				title: "Lenda das Ruas",
				description: "Alcance a impressionante marca de 5.000 km rodados.",
				icon: "globe",
				isUnlocked: totalKm >= 5000,
				progress: Math.min(1, totalKm / 5000),
				progressText: `${totalKm.toFixed(0)}/5.000 km`,
				color: "text-purple-400",
			},
			{
				id: "charges_10",
				title: "Mestre das Recargas",
				description: "Registre 10 recargas completadas com sucesso.",
				icon: "battery",
				isUnlocked: chargesCount >= 10,
				progress: Math.min(1, chargesCount / 10),
				progressText: `${chargesCount}/10 recargas`,
				color: "text-cyan-400",
			},
			{
				id: "charges_50",
				title: "Usina Portátil",
				description: "Complete 50 recargas para manter tudo pronto.",
				icon: "zap",
				isUnlocked: chargesCount >= 50,
				progress: Math.min(1, chargesCount / 50),
				progressText: `${chargesCount}/50 recargas`,
				color: "text-amber-500",
			},
			{
				id: "trips_50",
				title: "Super Piloto",
				description: "Complete 50 viagens com a sua scooter.",
				icon: "map-pin",
				isUnlocked: tripsCount >= 50,
				progress: Math.min(1, tripsCount / 50),
				progressText: `${tripsCount}/50 viagens`,
				color: "text-indigo-400",
			},
			{
				id: "trips_100",
				title: "Centurião de Asfalto",
				description: "Alcance a marca de 100 viagens registradas.",
				icon: "compass",
				isUnlocked: tripsCount >= 100,
				progress: Math.min(1, tripsCount / 100),
				progressText: `${tripsCount}/100 viagens`,
				color: "text-blue-400",
			},
			{
				id: "eco_50co2",
				title: "Eco Piloto",
				description: "Evite a emissão de 50 kg de CO₂ na atmosfera.",
				icon: "sun",
				isUnlocked: co2SavedKg >= 50,
				progress: Math.min(1, co2SavedKg / 50),
				progressText: `${co2SavedKg.toFixed(1)}/50 kg CO₂`,
				color: "text-success",
			},
			{
				id: "eco_200co2",
				title: "Guardião do Planeta",
				description: "Evite a emissão de 200 kg de CO₂ com mobilidade limpa.",
				icon: "sun",
				isUnlocked: co2SavedKg >= 200,
				progress: Math.min(1, co2SavedKg / 200),
				progressText: `${co2SavedKg.toFixed(1)}/200 kg CO₂`,
				color: "text-emerald-500",
			},
			{
				id: "maintenance_ok",
				title: "Manutenção Nota 10",
				description: "Mantenha todas as suas peças sem risco mecânico.",
				icon: "tool",
				isUnlocked: maintenanceList.length > 0 && !hasRisk,
				progress: maintenanceList.length > 0 && !hasRisk ? 1 : 0,
				progressText:
					maintenanceList.length === 0
						? "Sem peças"
						: hasRisk
							? "Peça em risco"
							: "Tudo em dia!",
				color: "text-emerald-400",
			},
			{
				id: "first_maintenance",
				title: "Prevenção em Dia",
				description: "Marque sua primeira revisão como realizada.",
				icon: "tool",
				isUnlocked: completedMaintenanceCount >= 1,
				progress: Math.min(1, completedMaintenanceCount / 1),
				progressText: `${completedMaintenanceCount}/1 revisão`,
				color: "text-sky-400",
			},
			{
				id: "maintenance_master",
				title: "Frota Protegida",
				description: "Cadastre 3 ou mais peças para controle preventivo.",
				icon: "shield",
				isUnlocked: maintenanceList.length >= 3,
				progress: Math.min(1, maintenanceList.length / 3),
				progressText: `${maintenanceList.length}/3 peças`,
				color: "text-teal-400",
			},
			{
				id: "best_cycle",
				title: "Recordista de Autonomia",
				description: `Alcance ${autonomyGoal.toFixed(0)} km rodados em um único ciclo de bateria.`,
				icon: "award",
				isUnlocked: bestCycleKm >= autonomyGoal && bestCycleKm > 0,
				progress: Math.min(1, bestCycleKm / autonomyGoal),
				progressText: `${bestCycleKm.toFixed(1)}/${autonomyGoal.toFixed(0)} km`,
				color: "text-rose-400",
			},
		];

		let unlockedCount = 0;
		for (const b of list) {
			if (b.isUnlocked) unlockedCount++;
		}

		return {
			badges: list,
			unlockedCount,
			totalCount: list.length,
			co2SavedKg,
		};
	}, [
		allLogs,
		stats?.totalKm,
		stats?.bestCycleKm,
		maintenanceList,
		scooter?.autonomyGoal,
	]);
}
