import { format, startOfMonth, subDays } from "date-fns";
import { Card } from "heroui-native/card";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	Pressable,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { BadgesSheet } from "@/components/BadgesSheet";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { useBadges } from "@/hooks/useBadges";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { DistanceChart } from "./components/DistanceChart";
import { ReportFilters } from "./components/ReportFilters";
import { ReportStatsGrid } from "./components/ReportStatsGrid";

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, maintenanceList, stats, isLoading } =
		useScooterData(activeScooterId);
	const [isBadgesOpen, setIsBadgesOpen] = useState(false);
	const [viewMode, setViewMode] = useState<"day" | "cycle">("day");

	const badgeData = useBadges(allLogs, stats, maintenanceList, scooter);
	const [timeframe, setTimeframe] = useState<"7d" | "30d" | "month" | "all">(
		"30d",
	);

	const theme = useAppStore((s) => s.theme);
	const colorScheme = useColorScheme();
	const isDark =
		theme === "dark" || (theme === "system" && colorScheme === "dark");

	const mutedColor = isDark ? "#71717a" : "#a1a1aa";
	const gridColor = isDark ? "#27272a" : "#e4e4e7"; // zinc-800 or zinc-200
	const primaryLineColor = "#17C964"; // success neon

	// For reports we need ascending order (oldest to newest left to right)
	const logsList = useMemo(() => [...allLogs].reverse(), [allLogs]);

	const tripsOnly = useMemo(
		() => logsList.filter((l) => l.type === "trip"),
		[logsList],
	);

	const filteredTrips = useMemo(() => {
		const now = new Date();
		if (timeframe === "7d") {
			const limit = subDays(now, 7);
			return tripsOnly.filter((t) => t.date >= limit);
		}
		if (timeframe === "30d") {
			const limit = subDays(now, 30);
			return tripsOnly.filter((t) => t.date >= limit);
		}
		if (timeframe === "month") {
			const limit = startOfMonth(now);
			return tripsOnly.filter((t) => t.date >= limit);
		}
		return tripsOnly;
	}, [tripsOnly, timeframe]);

	const chartData = useMemo(() => {
		if (viewMode === "day") {
			// Group trips by day to show daily distance
			const dailyMap = new Map<string, number>();
			filteredTrips.forEach((t) => {
				const d = format(t.date, "dd/MM");
				dailyMap.set(d, (dailyMap.get(d) || 0) + t.distance);
			});
			return Array.from(dailyMap.entries()).map(([label, value]) => ({
				label,
				value,
				date: label,
			}));
		} else {
			// Por ciclo
			const cyclesList = (stats?.cycles || []).filter((c) => c.distance > 0);
			const now = new Date();
			let filteredCycles = cyclesList;
			if (timeframe === "7d") {
				const limit = subDays(now, 7);
				filteredCycles = cyclesList.filter((c) => new Date(c.endDate) >= limit);
			} else if (timeframe === "30d") {
				const limit = subDays(now, 30);
				filteredCycles = cyclesList.filter((c) => new Date(c.endDate) >= limit);
			} else if (timeframe === "month") {
				const limit = startOfMonth(now);
				filteredCycles = cyclesList.filter((c) => new Date(c.endDate) >= limit);
			}
			return filteredCycles.map((c, i: number) => ({
				value: c.distance,
				label: `C${i + 1}`,
				date: `Ciclo ${i + 1}`,
			}));
		}
	}, [filteredTrips, stats?.cycles, viewMode, timeframe]);

	const chartStats = useMemo(() => {
		if (viewMode === "day") {
			let total = 0;
			let maxTrip = 0;
			const uniqueDays = new Set<string>();

			for (const t of filteredTrips) {
				total += t.distance;
				if (t.distance > maxTrip) maxTrip = t.distance;
				uniqueDays.add(format(new Date(t.date), "yyyy-MM-dd"));
			}

			const avg = uniqueDays.size > 0 ? total / uniqueDays.size : 0;
			const realAvgCycle =
				stats?.averageCycleKm && stats.averageCycleKm > 0
					? `${stats.averageCycleKm.toFixed(1)}`
					: scooter?.autonomyGoal
						? `${scooter.autonomyGoal.toFixed(0)}`
						: "0";

			return {
				mainValue: total,
				mainLabel: timeframe === "all" ? "Total Geral" : "Total Período",
				avgValue: avg,
				avgLabel: "Média / Dia",
				maxValue: maxTrip,
				maxLabel: "Maior Viagem",
				countValue: realAvgCycle,
				countLabel: "Autonomia Média",
			};
		}

		const cyclesList = stats?.cycles || [];
		const cyclesCount = cyclesList.length;
		const totalCyclesDist = cyclesList.reduce(
			(sum: number, c) => sum + c.distance,
			0,
		);
		const avg = cyclesCount > 0 ? totalCyclesDist / cyclesCount : 0;
		const max = stats?.bestCycleKm || 0;

		return {
			mainValue: totalCyclesDist,
			mainLabel: "Total Ciclos",
			avgValue: avg,
			avgLabel: "Média / Ciclo",
			maxValue: max,
			maxLabel: "Melhor Ciclo",
			countValue: cyclesCount.toString(),
			countLabel: "Ciclos Concluídos",
		};
	}, [filteredTrips, stats, scooter, viewMode, timeframe]);

	if (isLoading && !scooter) {
		return (
			<ScreenWrapper className="p-6 justify-center items-center">
				<ActivityIndicator size="large" color="#17C964" />
			</ScreenWrapper>
		);
	}

	if (!activeScooterId || !scooter) {
		return (
			<EmptyScooterState
				title="Insights"
				description="Adicione uma scooter primeiro para visualizar análises inteligentes."
			/>
		);
	}

	return (
		<ScreenWrapper scrollable contentContainerClassName="px-4 pb-10">
			<Text className="text-3xl font-bold text-foreground py-2">Insights</Text>

			{/* TOGGLE SEGMENTADO E FILTRO DE TEMPO */}
			<ReportFilters
				viewMode={viewMode}
				onViewModeChange={setViewMode}
				timeframe={timeframe}
				onTimeframeChange={setTimeframe}
			/>

			{/* GRÁFICO NEON */}
			<DistanceChart
				chartData={chartData}
				screenWidth={screenWidth}
				primaryLineColor={primaryLineColor}
				gridColor={gridColor}
				mutedColor={mutedColor}
			/>

			{/* INSIGHTS GRID 2x2 CARDS */}
			<ReportStatsGrid chartStats={chartStats} />

			{/* CARD DE AUTONOMIA REAL & EFICIÊNCIA */}
			<View className="mb-3">
				<Card
					variant="default"
					className="p-3.5 bg-surface border border-border shadow-sm rounded-2xl flex-row items-center gap-3"
				>
					<View className="w-9 h-9 rounded-xl bg-success/15 items-center justify-center shrink-0">
						<StyledIcon
							name="battery-charging"
							size={18}
							className="text-success"
						/>
					</View>
					<View className="flex-1">
						<Text className="text-xs font-bold text-foreground mb-0.5">
							Eficiência & Autonomia Real
						</Text>
						<Text className="text-xs text-muted leading-4">
							{stats?.averageCycleKm && stats.averageCycleKm > 0
								? `Autonomia média calculada de ${stats.averageCycleKm.toFixed(1)} km por carga completa.`
								: scooter.autonomyGoal && scooter.autonomyGoal > 0
									? `Meta de autonomia cadastrada em ${scooter.autonomyGoal.toFixed(0)} km por recarga.`
									: "Registre viagens e recargas para calcular a autonomia média real por ciclo."}
						</Text>
					</View>
				</Card>
			</View>

			{/* CARD DE GAMIFICAÇÃO & CONQUISTAS */}
			<View>
				<Pressable onPress={() => setIsBadgesOpen(true)}>
					<Card
						variant="default"
						className="p-3.5 bg-surface border border-border shadow-sm rounded-2xl flex-row items-center justify-between gap-3 active:opacity-80"
					>
						<View className="flex-row items-center gap-3 flex-1">
							<View className="w-9 h-9 rounded-xl bg-warning/15 items-center justify-center shrink-0">
								<StyledIcon name="award" size={18} className="text-warning" />
							</View>
							<View className="flex-1">
								<Text className="text-xs font-bold text-foreground mb-0.5">
									Conquistas & Marcos ({badgeData.unlockedCount}/
									{badgeData.totalCount})
								</Text>
								<Text className="text-xs text-muted leading-4">
									{badgeData.co2SavedKg > 0
										? `Você já economizou ~${badgeData.co2SavedKg.toFixed(1)} kg de CO₂!`
										: "Acumule quilômetros e recargas para desbloquear insígnias."}
								</Text>
							</View>
						</View>

						<View className="bg-warning/10 px-2 py-1 rounded-lg border border-warning/20 flex-row items-center gap-1">
							<Text className="text-[10px] font-bold text-warning uppercase">
								Ver todas
							</Text>
							<StyledIcon
								name="chevron-right"
								size={10}
								className="text-warning"
							/>
						</View>
					</Card>
				</Pressable>
			</View>

			<BadgesSheet
				isOpen={isBadgesOpen}
				onOpenChange={setIsBadgesOpen}
				badges={badgeData.badges}
				unlockedCount={badgeData.unlockedCount}
				totalCount={badgeData.totalCount}
				co2SavedKg={badgeData.co2SavedKg}
			/>
		</ScreenWrapper>
	);
}
