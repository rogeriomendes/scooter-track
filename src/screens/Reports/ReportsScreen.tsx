import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { format } from "date-fns";
import { useThemeColor } from "heroui-native";
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
import { BarChart } from "react-native-gifted-charts";

const screenWidth = Dimensions.get("window").width;

export default function ReportsScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, stats, isLoading } =
		useScooterData(activeScooterId);
	const [viewMode, setViewMode] = useState<"day" | "cycle">("day");

	const successColor = useThemeColor("success");

	// For reports we need ascending order
	const logsList = useMemo(() => [...allLogs].reverse(), [allLogs]);

	const tripsOnly = useMemo(
		() => logsList.filter((l) => l.type === "trip"),
		[logsList],
	);

	const distanceData = useMemo(() => {
		if (viewMode === "day") {
			// Group trips by day? Right now it's just the last 10 trips.
			// Let's group by day to make the 'Por dia' label accurate
			const dailyMap = new Map<string, number>();
			tripsOnly.forEach((t) => {
				const d = format(t.date, "dd/MM");
				dailyMap.set(d, (dailyMap.get(d) || 0) + t.distance);
			});
			const arr = Array.from(dailyMap.entries()).map(([label, value]) => ({
				label,
				value,
			}));
			return arr.slice(-10).map((log) => ({
				value: log.value,
				label: log.label,
				topLabelComponent: () => (
					<Text className="text-[10px] text-muted mb-1">
						{log.value.toFixed(1)}
					</Text>
				),
			}));
		} else {
			// Por ciclo
			return (
				stats?.cycles.slice(-10).map((c: any, i: number) => ({
					value: c.distance,
					label: `C${i + 1}`,
					topLabelComponent: () => (
						<Text className="text-[10px] text-muted mb-1">
							{c.distance.toFixed(1)}
						</Text>
					),
				})) || []
			);
		}
	}, [tripsOnly, stats?.cycles, viewMode]);

	const theme = useAppStore((s) => s.theme);
	const colorScheme = useColorScheme();
	const isDark =
		theme === "dark" || (theme === "system" && colorScheme === "dark");

	const mutedColor = isDark ? "#a1a1aa" : "#71717a";

	if (isLoading) {
		return (
			<ScreenWrapper className="p-6 justify-center items-center">
				<ActivityIndicator size="large" color="#10b981" />
			</ScreenWrapper>
		);
	}

	if (!activeScooterId || !scooter) {
		return (
			<EmptyScooterState
				title="Gráficos"
				description="Adicione uma scooter primeiro para visualizar os gráficos de desempenho."
			/>
		);
	}

	return (
		<ScreenWrapper scrollable contentContainerClassName="p-4 pb-10">
			<View className="mb-6">
				<Text className="text-3xl font-bold text-foreground mb-1">
					Gráficos
				</Text>
				<Text className="text-sm font-bold text-muted mt-1 uppercase tracking-wider">
					{scooter.name}
				</Text>
			</View>

			<View className="flex-row gap-3 mb-3">
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center py-4 bg-surface border border-surface-secondary"
				>
					<StyledIcon
						name="navigation"
						size={20}
						className="mb-2 text-success"
					/>
					<Text className="text-xl font-bold text-foreground">
						{stats?.totalKm.toFixed(0) || "0"}
					</Text>
					<Text className="text-[10px] text-muted">km total rodado</Text>
				</Card>
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center py-4 bg-surface border border-surface-secondary"
				>
					<StyledIcon
						name="trending-up"
						size={20}
						className="mb-2 text-warning"
					/>
					<Text className="text-xl font-bold text-foreground">
						{tripsOnly.length > 0
							? Math.max(...tripsOnly.map((t) => t.distance)).toFixed(1)
							: "0.0"}
					</Text>
					<Text className="text-[10px] text-muted">km melhor uso</Text>
				</Card>
			</View>

			<View className="flex-row gap-3 mb-6">
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center py-4 bg-surface border border-surface-secondary"
				>
					<StyledIcon
						name="bar-chart-2"
						size={20}
						className="mb-2 text-default-foreground"
					/>
					<Text className="text-xl font-bold text-foreground">
						{stats?.averageCycleKm.toFixed(1) || "0.0"}
					</Text>
					<Text className="text-[10px] text-muted">km médio/ciclo</Text>
				</Card>
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center py-4 bg-surface border border-surface-secondary"
				>
					<StyledIcon name="battery" size={20} className="mb-2 text-success" />
					<Text className="text-xl font-bold text-foreground">
						{stats?.bestCycleKm.toFixed(1) || "0.0"}
					</Text>
					<Text className="text-[10px] text-muted">km melhor ciclo</Text>
				</Card>
			</View>

			{/* Segmented Control */}
			<View className="flex-row gap-2 mb-6">
				<Pressable
					onPress={() => setViewMode("day")}
					className={`flex-1 rounded-xl py-3 border ${viewMode === "day" ? "bg-surface-secondary border-success" : "bg-transparent border-surface-secondary"}`}
				>
					<Text
						className={`text-center font-bold ${viewMode === "day" ? "text-success" : "text-muted"}`}
					>
						Por dia (30d)
					</Text>
				</Pressable>
				<Pressable
					onPress={() => setViewMode("cycle")}
					className={`flex-1 rounded-xl py-3 border ${viewMode === "cycle" ? "bg-surface-secondary border-success" : "bg-transparent border-surface-secondary"}`}
				>
					<Text
						className={`text-center font-bold ${viewMode === "cycle" ? "text-success" : "text-muted"}`}
					>
						Por ciclo
					</Text>
				</Pressable>
			</View>

			<Card
				className="mb-4 border border-surface-secondary"
				variant="secondary"
			>
				<Text className="text-sm font-bold text-foreground mb-6 mt-2">
					{viewMode === "day"
						? "Últimos 10 dias de uso"
						: "Últimos 10 ciclos completos"}
				</Text>
				{distanceData.length > 0 ? (
					<View className="items-center">
						<BarChart
							data={distanceData}
							width={screenWidth - 80}
							height={160}
							barWidth={Math.max((screenWidth - 120) / distanceData.length, 20)}
							spacing={8}
							initialSpacing={0}
							frontColor={successColor}
							barBorderRadius={8}
							xAxisLabelTextStyle={{ color: mutedColor, fontSize: 10 }}
							yAxisTextStyle={{ color: mutedColor, fontSize: 10 }}
							yAxisColor="transparent"
							xAxisColor="transparent"
							hideRules
							hideYAxisText
							isAnimated
						/>
						<Text className="text-[10px] text-muted text-right w-full mt-2">
							valores em km
						</Text>
					</View>
				) : (
					<Text className="text-muted text-center py-10">
						Nenhuma viagem registrada
					</Text>
				)}
			</Card>
		</ScreenWrapper>
	);
}
