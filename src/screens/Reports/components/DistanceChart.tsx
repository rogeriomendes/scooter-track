import * as Haptics from "expo-haptics";
import { Card } from "heroui-native/card";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BarChart, type barDataItem } from "react-native-gifted-charts";
import { StyledIcon } from "@/components/StyledIcon";

export interface ChartBarItem extends barDataItem {
	dateKey: string;
	fullDateLabel: string;
	rawDistance: number;
}

export interface DistanceChartProps {
	chartData: ChartBarItem[];
	screenWidth: number;
	gridColor: string;
	mutedColor: string;
	totalPeriodKm: number;
	timeframe: "7d" | "30d" | "month" | "all";
}

export function DistanceChart({
	chartData,
	screenWidth,
	gridColor,
	mutedColor,
	totalPeriodKm,
	timeframe,
}: DistanceChartProps) {
	const [selectedItem, setSelectedItem] = useState<ChartBarItem | null>(null);

	// Reset selected bar whenever timeframe changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset selection on timeframe change
	useEffect(() => {
		setSelectedItem(null);
	}, [timeframe]);

	// Calculate responsive bar width and spacing
	const chartConfig = useMemo(() => {
		const count = chartData.length;
		if (count === 0) return { barWidth: 18, spacing: 12, initialSpacing: 10 };

		if (timeframe === "7d") {
			// 7 daily bars fit comfortably on any screen width
			const availableWidth = screenWidth - 76;
			const barWidth = 22;
			const totalSpacing = availableWidth - barWidth * 7;
			const spacing = Math.max(10, Math.floor(totalSpacing / 8));
			const initialSpacing = Math.max(8, Math.floor(spacing / 2));
			return { barWidth, spacing, initialSpacing };
		}

		if (timeframe === "all") {
			// Monthly bars
			const barWidth = Math.min(
				26,
				Math.max(14, Math.floor((screenWidth - 90) / Math.max(count, 4))),
			);
			return { barWidth, spacing: 12, initialSpacing: 10 };
		}

		// 30d or month (up to 30 daily bars)
		const barWidth = count > 20 ? 6 : count > 10 ? 12 : 18;
		const spacing = count > 20 ? 3 : 8;
		const initialSpacing = 6;
		return { barWidth, spacing, initialSpacing };
	}, [chartData.length, timeframe, screenWidth]);

	const maxBarValue = useMemo(() => {
		let max = 0;
		for (const b of chartData) {
			if (b.rawDistance > max) max = b.rawDistance;
		}
		return max > 0 ? Math.ceil(max * 1.25) : 10;
	}, [chartData]);

	const mappedData = useMemo(() => {
		return chartData.map((item) => {
			const isSelected = selectedItem?.dateKey === item.dateKey;
			return {
				...item,
				frontColor: isSelected
					? "#10b981"
					: item.frontColor || "rgba(23, 201, 100, 0.75)",
				onPress: () => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					setSelectedItem(item);
				},
			};
		});
	}, [chartData, selectedItem]);

	const timeframeLabel = useMemo(() => {
		switch (timeframe) {
			case "7d":
				return "Últimos 7 dias";
			case "30d":
				return "Últimos 30 dias";
			case "month":
				return "Este mês";
			case "all":
				return "Todo histórico";
		}
	}, [timeframe]);

	return (
		<Card
			variant="default"
			className="mb-3 border border-border bg-surface shadow-sm rounded-2xl overflow-hidden p-0 pt-4 pb-2"
		>
			{/* HEADER DINÂMICO COM SELEÇÃO TÁTIL */}
			<View className="px-4 mb-3 flex-row items-center justify-between">
				<View className="flex-1 pr-2">
					<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
						{selectedItem
							? selectedItem.fullDateLabel
							: `Distância • ${timeframeLabel}`}
					</Text>
					<Text className="text-xl font-black text-foreground">
						{selectedItem
							? `${selectedItem.rawDistance.toFixed(1)} km`
							: `${totalPeriodKm.toFixed(1)} km`}
					</Text>
				</View>

				{selectedItem ? (
					<Pressable
						onPress={() => setSelectedItem(null)}
						className="px-2.5 py-1 bg-surface-secondary rounded-lg border border-border active:opacity-70"
					>
						<Text className="text-[10px] font-bold text-muted">Limpar</Text>
					</Pressable>
				) : (
					<View className="flex-row items-center gap-1.5 bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
						<View className="w-1.5 h-1.5 rounded-full bg-success" />
						<Text className="text-[10px] font-bold text-success">
							{timeframeLabel}
						</Text>
					</View>
				)}
			</View>

			{/* BARCHART */}
			{chartData.length > 0 ? (
				<View className="ml-1 mr-2">
					<BarChart
						data={mappedData}
						width={screenWidth - 84}
						height={160}
						barWidth={chartConfig.barWidth}
						spacing={chartConfig.spacing}
						initialSpacing={chartConfig.initialSpacing}
						roundedTop
						roundedBottom={false}
						noOfSections={3}
						maxValue={maxBarValue}
						yAxisColor="transparent"
						yAxisThickness={0}
						xAxisColor="transparent"
						xAxisThickness={0}
						rulesType="dashed"
						rulesColor={gridColor}
						yAxisTextStyle={{
							color: mutedColor,
							fontSize: 10,
							fontWeight: "bold",
						}}
						xAxisLabelTextStyle={{
							color: mutedColor,
							fontSize: 9,
							fontWeight: "bold",
						}}
						isAnimated
						animationDuration={300}
					/>
				</View>
			) : (
				<View className="h-40 items-center justify-center">
					<StyledIcon
						name="bar-chart-2"
						size={32}
						className="text-muted opacity-30 mb-2"
					/>
					<Text className="text-muted text-xs font-bold uppercase tracking-widest">
						Sem viagens registradas
					</Text>
				</View>
			)}
		</Card>
	);
}
