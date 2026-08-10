import { StyledIcon } from "@/components/StyledIcon";
import { format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, Separator, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, {
	Circle,
	Defs,
	G,
	LinearGradient,
	Path,
	Stop,
	Text as SvgText,
} from "react-native-svg";

type TripLog = {
	date: Date;
	distance: number;
};

type UsageSparklineProps = {
	trips: TripLog[];
};

export function UsageSparkline({ trips }: UsageSparklineProps) {
	const [period, setPeriod] = useState<"month" | "7d">("month");
	const [activePoint, setActivePoint] = useState<string | null>(null);
	const foregroundColor = useThemeColor("foreground") as unknown as string;

	const now = useMemo(() => new Date(), []);
	const monthName = useMemo(() => {
		const raw = format(now, "MMMM", { locale: ptBR });
		return raw.charAt(0).toUpperCase() + raw.slice(1);
	}, [now]);

	// 7 Days Data
	const data7d = useMemo(() => {
		const result = [];
		for (let i = 6; i >= 0; i--) {
			const targetDate = subDays(now, i);
			const distance = trips
				.filter((t) => isSameDay(t.date, targetDate))
				.reduce((acc, curr) => acc + curr.distance, 0);
			result.push({ date: targetDate, distance });
		}
		return result;
	}, [trips, now]);

	// Month Data (day 1 to today)
	const dataMonth = useMemo(() => {
		const result = [];
		const year = now.getFullYear();
		const month = now.getMonth();
		const currentDay = now.getDate();

		for (let day = 1; day <= currentDay; day++) {
			const targetDate = new Date(year, month, day);
			const distance = trips
				.filter((t) => isSameDay(t.date, targetDate))
				.reduce((acc, curr) => acc + curr.distance, 0);
			result.push({ date: targetDate, distance });
		}
		return result;
	}, [trips, now]);

	const currentData = period === "month" ? dataMonth : data7d;
	const totalDistance = currentData.reduce((acc, d) => acc + d.distance, 0);
	const activeDaysCount = currentData.filter((d) => d.distance > 0).length;
	const dailyAverage =
		activeDaysCount > 0 ? totalDistance / activeDaysCount : 0;

	if (trips.length === 0) {
		return null;
	}

	const width = 190;
	const height = 40;
	const paddingTop = 6;
	const paddingBottom = 6;
	const paddingHorizontal = 6;

	const maxDistance = Math.max(...currentData.map((d) => d.distance), 1);

	const points = currentData.map((d, i) => {
		const x =
			currentData.length > 1
				? (i / (currentData.length - 1)) * (width - paddingHorizontal * 2) +
					paddingHorizontal
				: width / 2;
		const y =
			height -
			(d.distance / maxDistance) * (height - paddingTop - paddingBottom) -
			paddingBottom;
		return { x, y, val: d.distance, date: d.date };
	});

	const pathData = points.reduce((acc, point, i) => {
		if (i === 0) return `M ${point.x},${point.y}`;
		return `${acc} L ${point.x},${point.y}`;
	}, "");

	return (
		<Card
			variant="secondary"
			className="mb-6 bg-surface border border-surface-secondary shadow-sm p-4 rounded-2xl"
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
				<View className="flex-1">
					<View className="flex-row justify-between items-center mb-2">
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider">
							{period === "month" ? monthName : "Últimos 7 dias"}
						</Text>
						<Text className="text-xs font-black text-success">
							{totalDistance.toFixed(1)} km
						</Text>
					</View>
					<View className="w-full items-center justify-center">
						<Svg width={width} height={height}>
							<Defs>
								<LinearGradient id="gradUsage" x1="0" y1="0" x2="0" y2="1">
									<Stop
										offset="0"
										stopColor="rgba(16, 185, 129, 0.5)"
										stopOpacity="1"
									/>
									<Stop
										offset="1"
										stopColor="rgba(16, 185, 129, 0.0)"
										stopOpacity="0"
									/>
								</LinearGradient>
							</Defs>

							<Path
								d={`${pathData} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`}
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
												setActivePoint(isActive ? null : p.date.toISOString())
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
										? activeData.y + 18
										: activeData.y - 10;

									const isFirst = activeData === points[0];
									const isLast = activeData === points[points.length - 1];
									const anchor = isFirst ? "start" : isLast ? "end" : "middle";

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
						</Svg>
					</View>
				</View>

				<Separator orientation="vertical" thickness={1} className="h-full my-0.5" />

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
	);
}
