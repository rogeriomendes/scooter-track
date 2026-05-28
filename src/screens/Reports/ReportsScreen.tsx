import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { format } from "date-fns";
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
import { LineChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, stats, isLoading } =
		useScooterData(activeScooterId);
	const [viewMode, setViewMode] = useState<"day" | "cycle">("day");

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

	const chartData = useMemo(() => {
		if (viewMode === "day") {
			// Group trips by day to show daily distance
			const dailyMap = new Map<string, number>();
			tripsOnly.forEach((t) => {
				const d = format(t.date, "dd/MM");
				dailyMap.set(d, (dailyMap.get(d) || 0) + t.distance);
			});
			const arr = Array.from(dailyMap.entries()).map(([label, value]) => ({
				label,
				value,
				date: label,
			}));
			// Take last 14 days for the chart
			return arr.slice(-14).map((log) => ({
				value: log.value,
				label: log.label,
				date: log.date,
			}));
		} else {
			// Por ciclo
			return (
				stats?.cycles.slice(-14).map((c: any, i: number) => ({
					value: c.distance,
					label: `C${i + 1}`,
					date: `Ciclo ${i + 1}`,
				})) || []
			);
		}
	}, [tripsOnly, stats?.cycles, viewMode]);

	const chartStats = useMemo(() => {
		if (viewMode === "day") {
			const total = tripsOnly.reduce((sum, t) => sum + t.distance, 0);
			const uniqueDays = new Set(
				tripsOnly.map((t) => format(new Date(t.date), "yyyy-MM-dd")),
			).size;
			const maxTrip =
				tripsOnly.length > 0
					? Math.max(...tripsOnly.map((t) => t.distance))
					: 0;
			const avg = uniqueDays > 0 ? total / uniqueDays : 0;
			return {
				mainValue: total,
				mainLabel: "KM TOTAL (VIAGENS)",
				avgValue: avg,
				avgLabel: "MÉDIA DIÁRIA (KM)",
				maxValue: maxTrip,
				maxLabel: "MAIOR VIAGEM (KM)",
				countValue: uniqueDays,
				countLabel: "DIAS ATIVOS",
			};
		} else {
			const cyclesCount = stats?.cycles.length || 0;
			const totalCyclesDist =
				stats?.cycles.reduce((sum: number, c: any) => sum + c.distance, 0) || 0;
			const avg = cyclesCount > 0 ? totalCyclesDist / cyclesCount : 0;
			const max = stats?.bestCycleKm || 0;
			return {
				mainValue: totalCyclesDist,
				mainLabel: "KM TOTAL (CICLOS)",
				avgValue: avg,
				avgLabel: "MÉDIA POR CICLO (KM)",
				maxValue: max,
				maxLabel: "MELHOR CICLO (KM)",
				countValue: cyclesCount,
				countLabel: "CICLOS FECHADOS",
			};
		}
	}, [tripsOnly, stats, viewMode]);

	if (isLoading) {
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
		<ScreenWrapper scrollable contentContainerClassName="p-4 pb-20">
			<View className="mb-4">
				<Animated.Text
					entering={FadeInDown.delay(100).springify()}
					className="text-3xl font-bold text-foreground mb-1"
				>
					Insights
				</Animated.Text>
				<Animated.Text
					entering={FadeInDown.delay(200).springify()}
					className="text-xs font-bold text-muted uppercase tracking-wider"
				>
					{scooter.name}
				</Animated.Text>
			</View>

			{/* TOGGLE SEGMENTADO */}
			<Animated.View
				entering={FadeInDown.delay(300).springify()}
				className="mb-4"
			>
				<Card
					variant="secondary"
					className="border border-surface-secondary bg-surface p-1"
				>
					<View className="flex-row bg-surface-secondary/40 rounded-xl p-1">
						<Pressable
							onPress={() => setViewMode("day")}
							className={`flex-1 py-3 rounded-lg flex-row justify-center items-center gap-2 ${
								viewMode === "day" ? "bg-surface shadow-sm" : ""
							}`}
						>
							<Text
								className={`text-xs font-black uppercase tracking-widest ${viewMode === "day" ? "text-success" : "text-muted"}`}
							>
								Por Dia
							</Text>
						</Pressable>

						<Pressable
							onPress={() => setViewMode("cycle")}
							className={`flex-1 py-3 rounded-lg flex-row justify-center items-center gap-2 ${
								viewMode === "cycle" ? "bg-surface shadow-sm" : ""
							}`}
						>
							<Text
								className={`text-xs font-black uppercase tracking-widest ${viewMode === "cycle" ? "text-success" : "text-muted"}`}
							>
								Por Ciclo
							</Text>
						</Pressable>
					</View>
				</Card>
			</Animated.View>

			{/* GRÁFICO NEON */}
			<Animated.View entering={FadeInDown.delay(400).springify()}>
				<Card
					variant="secondary"
					className="mb-4 border border-surface-secondary bg-surface overflow-hidden p-0 pt-6 pb-2"
				>
					<View className="px-6 mb-4">
						<Text className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">
							Evolução de Distância
						</Text>
						<Text className="text-2xl font-black text-foreground">
							{chartData.length > 0 ? "Últimos Registros" : "Sem dados"}
						</Text>
					</View>

					{chartData.length > 0 ? (
						<View className="ml-2">
							<LineChart
								areaChart
								curved
								data={chartData}
								width={screenWidth - 80}
								height={180}
								hideDataPoints={false}
								dataPointsColor="#17C964"
								dataPointsRadius={4}
								color={primaryLineColor}
								thickness={3}
								startFillColor="#17C964"
								endFillColor="#17C964"
								startOpacity={0.4}
								endOpacity={0.05}
								initialSpacing={20}
								noOfSections={4}
								yAxisColor="transparent"
								yAxisThickness={0}
								rulesType="dashed"
								rulesColor={gridColor}
								yAxisTextStyle={{
									color: mutedColor,
									fontSize: 10,
									fontWeight: "bold",
								}}
								xAxisColor="transparent"
								xAxisLabelTextStyle={{
									color: mutedColor,
									fontSize: 10,
									fontWeight: "bold",
								}}
								pointerConfig={{
									pointerStripHeight: 160,
									pointerStripColor: primaryLineColor,
									pointerStripWidth: 2,
									pointerColor: primaryLineColor,
									radius: 6,
									pointerLabelWidth: 80,
									pointerLabelHeight: 60,
									activatePointersOnLongPress: false,
									autoAdjustPointerLabelPosition: true,
									pointerLabelComponent: (items: any) => {
										return (
											<View className="bg-surface-secondary/90 rounded-xl px-3 py-2 items-center justify-center border border-success/30 -ml-10 -mt-10">
												<Text className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">
													{items[0].date}
												</Text>
												<Text className="text-sm font-black text-success">
													{items[0].value.toFixed(1)} km
												</Text>
											</View>
										);
									},
								}}
							/>
						</View>
					) : (
						<View className="h-40 items-center justify-center">
							<StyledIcon
								name="activity"
								size={32}
								className="text-muted opacity-30 mb-2"
							/>
							<Text className="text-muted text-xs font-bold uppercase tracking-widest">
								Gráfico Indisponível
							</Text>
						</View>
					)}
				</Card>
			</Animated.View>

			{/* INSIGHTS CARDS */}
			<Animated.View entering={FadeInDown.delay(500).springify()}>
				<View className="flex-row gap-3 mb-3">
					<Card
						variant="secondary"
						className="flex-1 items-start justify-center p-4 bg-surface border border-surface-secondary shadow-sm"
					>
						<Text className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">
							{chartStats.mainLabel}
						</Text>
						<Text className="text-3xl font-black text-foreground">
							{chartStats.mainValue.toFixed(1)}
						</Text>
					</Card>
					<Card
						variant="secondary"
						className="flex-1 items-start justify-center p-4 bg-surface border border-surface-secondary shadow-sm"
					>
						<Text className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">
							{chartStats.avgLabel}
						</Text>
						<Text className="text-3xl font-black text-primary">
							{chartStats.avgValue.toFixed(1)}
						</Text>
					</Card>
				</View>

				<View className="flex-row gap-3">
					<Card
						variant="secondary"
						className="flex-1 items-start justify-center p-4 bg-surface border border-surface-secondary shadow-sm"
					>
						<Text className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">
							{chartStats.maxLabel}
						</Text>
						<Text className="text-3xl font-black text-warning">
							{chartStats.maxValue.toFixed(1)}
						</Text>
					</Card>
					<Card
						variant="secondary"
						className="flex-1 items-start justify-center p-4 bg-surface border border-surface-secondary shadow-sm"
					>
						<Text className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">
							{chartStats.countLabel}
						</Text>
						<Text className="text-3xl font-black text-success">
							{chartStats.countValue}
						</Text>
					</Card>
				</View>
			</Animated.View>
		</ScreenWrapper>
	);
}
