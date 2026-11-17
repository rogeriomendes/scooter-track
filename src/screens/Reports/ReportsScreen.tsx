import {
	eachDayOfInterval,
	eachMonthOfInterval,
	format,
	isSameDay,
	startOfDay,
	startOfMonth,
	subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { calculateEnergyEconomyStats } from "@/utils/energy";
import { BatteryCyclesCard } from "./components/BatteryCyclesCard";
import { type ChartBarItem, DistanceChart } from "./components/DistanceChart";
import { EnergyEconomyCard } from "./components/EnergyEconomyCard";
import { ReportFilters, type Timeframe } from "./components/ReportFilters";
import { ReportStatsGrid } from "./components/ReportStatsGrid";

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, maintenanceList, stats, isLoading } =
		useScooterData(activeScooterId);
	const [isBadgesOpen, setIsBadgesOpen] = useState(false);
	const [timeframe, setTimeframe] = useState<Timeframe>("7d");

	const badgeData = useBadges(allLogs, stats, maintenanceList, scooter);

	const theme = useAppStore((s) => s.theme);
	const costPerKwh = useAppStore((s) => s.costPerKwh);
	const gasPricePerLiter = useAppStore((s) => s.gasPricePerLiter);
	const colorScheme = useColorScheme();
	const isDark =
		theme === "dark" || (theme === "system" && colorScheme === "dark");

	const mutedColor = isDark ? "#71717a" : "#a1a1aa";
	const gridColor = isDark ? "#27272a" : "#e4e4e7";

	// Viagens em ordem cronológica (antiga -> recente)
	const tripsOnly = useMemo(() => {
		const trips = allLogs.filter((l) => l.type === "trip");
		return [...trips].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}, [allLogs]);

	// Viagens agregadas por dia ("yyyy-MM-dd")
	const tripsByDayMap = useMemo(() => {
		const map = new Map<string, number>();
		for (const t of tripsOnly) {
			const d = t.date instanceof Date ? t.date : new Date(t.date);
			const key = format(d, "yyyy-MM-dd");
			map.set(key, (map.get(key) || 0) + t.distance);
		}
		return map;
	}, [tripsOnly]);

	// Gera os dados das barras preenchendo 100% dos dias do período (incluindo dias com 0 km)
	const { chartData, filteredTrips } = useMemo(() => {
		const now = new Date();
		let bars: ChartBarItem[] = [];
		let relevantTrips = tripsOnly;

		if (timeframe === "7d") {
			const startDate = startOfDay(subDays(now, 6));
			relevantTrips = tripsOnly.filter((t) => new Date(t.date) >= startDate);
			const days = eachDayOfInterval({
				start: startDate,
				end: startOfDay(now),
			});

			bars = days.map((d) => {
				const dateKey = format(d, "yyyy-MM-dd");
				const rawDist = tripsByDayMap.get(dateKey) || 0;
				const isToday = isSameDay(d, now);
				const label = isToday
					? "Hoje"
					: format(d, "EEE", { locale: ptBR })
							.replace(".", "")
							.slice(0, 3)
							.toUpperCase();

				const fullDateLabel = isToday
					? "Hoje"
					: format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });

				return {
					value: Number(rawDist.toFixed(1)),
					rawDistance: rawDist,
					dateKey,
					label,
					fullDateLabel,
				};
			});
		} else if (timeframe === "30d") {
			const startDate = startOfDay(subDays(now, 29));
			relevantTrips = tripsOnly.filter((t) => new Date(t.date) >= startDate);
			const days = eachDayOfInterval({
				start: startDate,
				end: startOfDay(now),
			});

			bars = days.map((d, index) => {
				const dateKey = format(d, "yyyy-MM-dd");
				const rawDist = tripsByDayMap.get(dateKey) || 0;
				const isToday = isSameDay(d, now);
				// Exibe label espaçada (a cada 5 dias e hoje) para não encavalar no mobile
				const showLabel =
					index % 5 === 0 || index === days.length - 1 || isToday;
				const label = showLabel ? (isToday ? "Hoje" : format(d, "dd")) : "";

				const fullDateLabel = format(d, "dd 'de' MMMM (EEE)", { locale: ptBR });

				return {
					value: Number(rawDist.toFixed(1)),
					rawDistance: rawDist,
					dateKey,
					label,
					fullDateLabel,
				};
			});
		} else if (timeframe === "month") {
			const startDate = startOfMonth(now);
			relevantTrips = tripsOnly.filter((t) => new Date(t.date) >= startDate);
			const days = eachDayOfInterval({
				start: startDate,
				end: startOfDay(now),
			});

			bars = days.map((d, index) => {
				const dateKey = format(d, "yyyy-MM-dd");
				const rawDist = tripsByDayMap.get(dateKey) || 0;
				const isToday = isSameDay(d, now);
				const showLabel =
					days.length <= 7 ||
					index % 4 === 0 ||
					index === days.length - 1 ||
					isToday;
				const label = showLabel ? (isToday ? "Hoje" : format(d, "dd")) : "";

				const fullDateLabel = format(d, "dd 'de' MMMM (EEE)", { locale: ptBR });

				return {
					value: Number(rawDist.toFixed(1)),
					rawDistance: rawDist,
					dateKey,
					label,
					fullDateLabel,
				};
			});
		} else {
			// timeframe === "all" (Agrupa por Mês para dar visão histórica clara)
			if (tripsOnly.length === 0) {
				bars = [];
			} else {
				const oldestDate = new Date(tripsOnly[0].date);
				let months = eachMonthOfInterval({
					start: startOfMonth(oldestDate),
					end: startOfMonth(now),
				});

				// Limita aos últimos 12 meses se for muito longo
				if (months.length > 12) {
					months = months.slice(months.length - 12);
				}

				// Agrupa viagens por "yyyy-MM"
				const tripsByMonth = new Map<string, number>();
				for (const t of tripsOnly) {
					const monthKey = format(new Date(t.date), "yyyy-MM");
					tripsByMonth.set(
						monthKey,
						(tripsByMonth.get(monthKey) || 0) + t.distance,
					);
				}

				bars = months.map((m) => {
					const monthKey = format(m, "yyyy-MM");
					const rawDist = tripsByMonth.get(monthKey) || 0;
					const label = format(m, "MMM", { locale: ptBR })
						.replace(".", "")
						.slice(0, 3)
						.toUpperCase();
					const fullDateLabel = format(m, "MMMM 'de' yyyy", { locale: ptBR });

					return {
						value: Number(rawDist.toFixed(1)),
						rawDistance: rawDist,
						dateKey: monthKey,
						label,
						fullDateLabel,
					};
				});
			}
		}

		// Destaca a barra com maior valor
		const maxDist = Math.max(...bars.map((b) => b.rawDistance), 0);
		const styledBars = bars.map((b) => {
			let frontColor = "rgba(23, 201, 100, 0.7)";
			if (b.rawDistance === maxDist && maxDist > 0) {
				frontColor = "#17C964"; // Destaque neon para o melhor dia/mês
			} else if (b.rawDistance === 0) {
				frontColor = "transparent";
			}
			return {
				...b,
				frontColor,
			};
		});

		return { chartData: styledBars, filteredTrips: relevantTrips };
	}, [tripsOnly, tripsByDayMap, timeframe]);

	// Estatísticas diretas do período (Hero Stats)
	const periodStats = useMemo(() => {
		const totalKm = chartData.reduce((acc, curr) => acc + curr.rawDistance, 0);
		const activeDays = chartData.filter((b) => b.rawDistance > 0).length;
		const totalDays = chartData.length;
		const avgPerActiveDay = activeDays > 0 ? totalKm / activeDays : 0;
		let maxTripKm = 0;
		for (const t of filteredTrips) {
			if (t.distance > maxTripKm) maxTripKm = t.distance;
		}

		let periodLabel = "Total Período";
		if (timeframe === "7d") periodLabel = "Total 7 Dias";
		else if (timeframe === "30d") periodLabel = "Total 30 Dias";
		else if (timeframe === "month") periodLabel = "Total do Mês";
		else if (timeframe === "all") periodLabel = "Total Geral";

		return {
			totalKm,
			totalDays,
			activeDays,
			avgPerActiveDay,
			maxTripKm,
			periodLabel,
		};
	}, [chartData, filteredTrips, timeframe]);

	// Estatísticas de Energia & Economia para o período selecionado
	const energyStats = useMemo(() => {
		return calculateEnergyEconomyStats(
			scooter,
			filteredTrips,
			costPerKwh,
			gasPricePerLiter,
		);
	}, [scooter, filteredTrips, costPerKwh, gasPricePerLiter]);

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
		<ScreenWrapper scrollable contentContainerClassName="px-4 pb-14">
			<Text className="text-3xl font-bold text-foreground py-2">Insights</Text>

			{/* 1. SELETOR DE PERÍODO */}
			<ReportFilters timeframe={timeframe} onTimeframeChange={setTimeframe} />

			{/* 2. GRÁFICO DE BARRAS (BARCHART) COM SELEÇÃO TÁTIL */}
			<DistanceChart
				chartData={chartData}
				screenWidth={screenWidth}
				gridColor={gridColor}
				mutedColor={mutedColor}
				totalPeriodKm={periodStats.totalKm}
				timeframe={timeframe}
			/>

			{/* 3. CARDS DE RESUMO EXECUTIVO DIRETOS (HERO STATS) */}
			<ReportStatsGrid stats={periodStats} />

			{/* 4. CARD DEDICADO: EFICIÊNCIA & CICLOS DE BATERIA */}
			<BatteryCyclesCard scooter={scooter} stats={stats} />

			{/* 5. CARD DE ENERGIA & ECONOMIA FINANCEIRA */}
			<EnergyEconomyCard stats={energyStats} totalKm={periodStats.totalKm} />

			{/* 6. CONQUISTAS & MARCOS */}
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
