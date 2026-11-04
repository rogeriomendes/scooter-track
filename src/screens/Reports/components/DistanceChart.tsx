import { Card } from "heroui-native/card";
import { Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { StyledIcon } from "@/components/StyledIcon";

export interface DistanceChartProps {
	chartData: { label: string; value: number; date: string }[];
	screenWidth: number;
	primaryLineColor: string;
	gridColor: string;
	mutedColor: string;
}

export function DistanceChart({
	chartData,
	screenWidth,
	primaryLineColor,
	gridColor,
	mutedColor,
}: DistanceChartProps) {
	return (
		<Card
			variant="default"
			className="mb-3 border border-border bg-surface shadow-sm rounded-2xl overflow-hidden p-0 pt-4 pb-2"
		>
			<View className="px-4 mb-3">
				<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
					Evolução de Distância
				</Text>
				<Text className="text-xl font-black text-foreground">
					{chartData.length > 0 ? "Registros do Período" : "Sem dados"}
				</Text>
			</View>

			{chartData.length > 0 ? (
				<View className="ml-2">
					<LineChart
						areaChart
						curved
						data={chartData}
						width={screenWidth - 80}
						height={150}
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
							pointerLabelComponent: (
								items: { date?: string; value: number }[],
							) => {
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
	);
}
