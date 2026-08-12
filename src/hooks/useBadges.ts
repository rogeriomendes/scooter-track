import { useMemo } from "react";
import type { logs, maintenance } from "@/db/schema";
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
) {
	return useMemo(() => {
		const totalKm = stats?.totalKm || 0;
		const tripsCount = allLogs.filter((l) => l.type === "trip").length;
		const chargesCount = allLogs.filter((l) => l.type === "charge").length;

		// CO2 saved: ~0.12 kg CO2 per km compared to gasoline car
		const co2SavedKg = totalKm * 0.12;

		const hasRisk = maintenanceList.some((item) => {
			if (item.isCompleted || !(item.hasWear ?? true)) return false;
			const currentTotalKm = totalKm;
			const wornKm = currentTotalKm - item.lastMaintenanceKm;
			return item.intervalKm > 0 && wornKm / item.intervalKm >= 0.7;
		});

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
				id: "charges_10",
				title: "Mestre das Recargas",
				description: "Registre 10 recargas completadas com sucesso.",
				icon: "battery-charging",
				isUnlocked: chargesCount >= 10,
				progress: Math.min(1, chargesCount / 10),
				progressText: `${chargesCount}/10 recargas`,
				color: "text-cyan-400",
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
				id: "trips_50",
				title: "Super Piloto",
				description: "Complete 50 viagens com a sua scooter.",
				icon: "map-pin",
				isUnlocked: tripsCount >= 50,
				progress: Math.min(1, tripsCount / 50),
				progressText: `${tripsCount}/50 viagens`,
				color: "text-indigo-400",
			},
		];

		const unlockedCount = list.filter((b) => b.isUnlocked).length;

		return {
			badges: list,
			unlockedCount,
			totalCount: list.length,
			co2SavedKg,
		};
	}, [allLogs, stats, maintenanceList]);
}
