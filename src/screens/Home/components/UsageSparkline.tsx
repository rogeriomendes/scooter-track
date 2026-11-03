import { format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useThemeColor } from "heroui-native";
import { Card } from "heroui-native/card";
import { Separator } from "heroui-native/separator";
import { useMemo, useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, {
	Circle,
	Defs,
	G,
	LinearGradient,
	Path,
	Stop,
	Text as SvgText,
} from "react-native-svg";
import { StyledIcon } from "@/components/StyledIcon";

type TripLog = {
	date: Date | string | number;
	distance: number;
};

type UsageSparklineProps = {
	trips: TripLog[];
};

export function UsageSparkline({ trips }: UsageSparklineProps) {
	const [period, setPeriod] = useState<"month" | "7d">("month");
	const [activePoint, setActivePoint] = useState<string | null>(null);
	const [containerWidth, setContainerWidth] = useState<number>(180);
	const foregroundColor = useThemeColor("foreground") as unknown as string;

	const monthName = useMemo(() => {
		const raw = format(new Date(), "MMMM", { locale: ptBR });
		return raw.charAt(0).toUpperCase() + raw.slice(1);
	}, []);

	// 7 Days Data
	const data7d = useMemo(() => {
		const result = [];
		const baseDate = new Date();
		for (let i = 6; i >= 0; i--) {
			const targetDate = subDays(baseDate, i);
			const distance = trips
				.filter((t) => {
					try {
						return isSameDay(new Date(t.date), targetDate);
					} catch {
						return false;
					}
				})
				.reduce((acc, curr) => acc + (Number(curr.distance) || 0), 0);
			result.push({ date: targetDate, distance });
		}
		return result;
	}, [trips]);

	// Month Data (day 1 to today)
	const dataMonth = useMemo(() => {
		const result = [];
		const baseDate = new Date();
		const year = baseDate.getFullYear();
		const month = baseDate.getMonth();
		const currentDay = baseDate.getDate();

		for (let day = 1; day <= currentDay; day++) {
			const targetDate = new Date(year, month, day);
			const distance = trips
				.filter((t) => {
					try {
						return isSameDay(new Date(t.date), targetDate);
					} catch {
						return false;
					}
				})
				.reduce((acc, curr) => acc + (Number(curr.distance) || 0), 0);
			result.push({ date: targetDate, distance });
		}
		return result;
	}, [trips]);

	const currentData = period === "month" ? dataMonth : data7d;
	const totalDistance = currentData.reduce((acc, d) => acc + d.distance, 0);
	const activeDaysCount = currentData.filter((d) => d.distance > 0).length;
	const dailyAverage =
		activeDaysCount > 0 ? totalDistance / activeDaysCount : 0;

	const svgWidth = Math.max(100, containerWidth);
	const svgHeight = 45;
	const paddingTop = 8;
	const paddingBottom = 6;
	const paddingHorizontal = 8;

	const maxDistance = Math.max(...currentData.map((d) => d.distance), 1);

	const points = currentData.map((d, i) => {
		const x =
			currentData.length > 1
				? (i / (currentData.length - 1)) * (svgWidth - paddingHorizontal * 2) +
					paddingHorizontal
				: svgWidth / 2;
		const y =
			svgHeight -
			(d.distance / maxDistance) * (svgHeight - paddingTop - paddingBottom) -
			paddingBottom;
		return { x, y, val: d.distance, date: d.date };
	});

	const pathData = points.reduce((acc, point, i) => {
		if (i === 0) return `M ${point.x},${point.y}`;
		return `${acc} L ${point.x},${point.y}`;
	}, "");

	const onLayoutContainer = (e: LayoutChangeEvent) => {
		const { width: w } = e.nativeEvent.layout;
		if (w > 0) {
			setContainerWidth(w);
		}
	};

	return (
		<Animated.View entering={FadeInDown.delay(200).springify()}>
			<Card
				variant="default"
				className="mb-4 bg-surface border border-border shadow-sm p-4 rounded-2xl"
			>
				{/* HEADER WITH TOGGLE PILLS */}
				<View className="flex-row justify-between items-center mb-3">
					<View className="flex-row items-center gap-1.5">
						<StyledIcon name="activity" size={16} className="text-success" />
						<Text className="text-xs font-black text-foreground uppercase tracking-wider">
							Uso & Desempenho
						</Text>
					</View>

					{/* SELECTOR */}
					<View className="flex-row bg-surface-secondary/60 p-0.5 rounded-lg border border-surface-secondary">
						<Pressable
							onPress={() => {
								setPeriod("month");
								setActivePoint(null);
							}}
							className={`px-2.5 py-1 rounded-md ${period === "month" ? "bg-success" : "bg-transparent"}`}
						>
							<Text
								className={`text-[10px] font-bold ${period === "month" ? "text-white" : "text-muted"}`}
							>
								Este Mês
							</Text>
						</Pressable>
						<Pressable
							onPress={() => {
								setPeriod("7d");
								setActivePoint(null);
							}}
							className={`px-2.5 py-1 rounded-md ${period === "7d" ? "bg-success" : "bg-transparent"}`}
						>
							<Text
								className={`text-[10px] font-bold ${period === "7d" ? "text-white" : "text-muted"}`}
							>
								7 Dias
							</Text>
						</Pressable>
					</View>
				</View>

				{/* GRAPH + STATS ROW */}
				<View className="flex-row items-stretch gap-3">
					{/* SPARKLINE */}
					<View className="flex-1 overflow-hidden" onLayout={onLayoutContainer}>
						<View className="flex-row justify-between items-center mb-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider">
								{period === "month" ? monthName : "Últimos 7 dias"}
							</Text>
							<Text className="text-xs font-black text-success">
								{totalDistance.toFixed(1)} km
							</Text>
						</View>
						<View className="w-full items-center justify-center">
							<Svg width={svgWidth} height={svgHeight}>
								<Defs>
									<LinearGradient id="gradUsage" x1="0" y1="0" x2="0" y2="1">
										<Stop
											offset="0"
											stopColor="rgba(16, 185, 129, 0.4)"
											stopOpacity="1"
										/>
										<Stop
											offset="1"
											stopColor="rgba(16, 185, 129, 0.0)"
											stopOpacity="0"
										/>
									</LinearGradient>
								</Defs>

								{points.length > 0 && (
									<>
										<Path
											d={`${pathData} L ${points[points.length - 1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`}
											fill="url(#gradUsage)"
										/>

										<Path
											d={pathData}
											fill="none"
											stroke="rgb(16, 185, 129)"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>

										{points.map((p) => {
											const isActive = activePoint === p.date.toISOString();
											return (
												<G key={p.date.toISOString()}>
													<Circle
														cx={p.x}
														cy={p.y}
														r={isActive ? "4" : "2.5"}
														fill={isActive ? "#fff" : "rgb(16, 185, 129)"}
														stroke={isActive ? "rgb(16, 185, 129)" : "#18181b"}
														strokeWidth={isActive ? "2" : "1"}
													/>
													<Circle
														cx={p.x}
														cy={p.y}
														r="14"
														fill="transparent"
														onPress={() =>
															setActivePoint(
																isActive ? null : p.date.toISOString(),
															)
														}
													/>
												</G>
											);
										})}

										{activePoint &&
											(() => {
												const activeData = points.find(
													(p) => p.date.toISOString() === activePoint,
												);
												if (!activeData) return null;

												const isNearTop = activeData.y < 22;
												const tooltipY = isNearTop
													? activeData.y + 16
													: activeData.y - 8;

												const isFirst = activeData === points[0];
												const isLast = activeData === points[points.length - 1];
												const anchor = isFirst
													? "start"
													: isLast
														? "end"
														: "middle";

												return (
													<SvgText
														x={activeData.x}
														y={tooltipY}
														fill={foregroundColor}
														fontSize="10"
														fontWeight="bold"
														textAnchor={anchor}
													>
														{activeData.val.toFixed(1)}km
													</SvgText>
												);
											})()}
									</>
								)}
							</Svg>
						</View>
					</View>

					<Separator
						orientation="vertical"
						thickness={1}
						className="h-full my-0.5"
					/>

					{/* DAILY AVERAGE */}
					<View className="items-center justify-between px-1 py-0.5">
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
							Média / Dia
						</Text>
						<View className="items-center">
							<View className="flex-row items-baseline gap-0.5 mb-0.5">
								<Text className="text-xl font-black text-foreground">
									{dailyAverage.toFixed(1)}
								</Text>
								<Text className="text-[10px] text-muted font-bold">km</Text>
							</View>
							<Text className="text-[9px] text-muted font-bold text-center">
								{activeDaysCount === 0
									? "sem uso"
									: activeDaysCount === 1
										? "em 1 dia rodado"
										: `em ${activeDaysCount} dias rodados`}
							</Text>
						</View>
					</View>
				</View>
			</Card>
		</Animated.View>
	);
}
