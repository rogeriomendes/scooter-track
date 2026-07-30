import { isSameDay, subDays } from "date-fns";
import { Separator, useThemeColor } from "heroui-native";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
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
	date: Date;
	distance: number;
};

type UsageSparklineProps = {
	trips: TripLog[];
};

export function UsageSparkline({ trips }: UsageSparklineProps) {
	const [activePoint, setActivePoint] = useState<string | null>(null);
	const foregroundColor = useThemeColor("foreground") as unknown as string;

	// Group data by last 7 days
	const data = useMemo(() => {
		const result = [];
		const now = new Date();
		for (let i = 6; i >= 0; i--) {
			const targetDate = subDays(now, i);
			// Find total distance for this day
			const distance = trips
				.filter((t) => isSameDay(t.date, targetDate))
				.reduce((acc, curr) => acc + curr.distance, 0);
			result.push({ date: targetDate, distance });
		}
		return result;
	}, [trips]);

	const width = 250;
	const height = 40;
	const paddingTop = 6;
	const paddingBottom = 6;
	const paddingHorizontal = 6;

	// Find max distance to scale the graph
	const maxDistance = Math.max(...data.map((d) => d.distance), 1); // min 1 to avoid /0

	const points = data.map((d, i) => {
		const x =
			(i / (data.length - 1)) * (width - paddingHorizontal * 2) +
			paddingHorizontal;
		const y =
			height -
			(d.distance / maxDistance) * (height - paddingTop - paddingBottom) -
			paddingBottom;
		return { x, y, val: d.distance, date: d.date };
	});

	// Build SVG path
	const pathData = points.reduce((acc, point, i) => {
		if (i === 0) return `M ${point.x},${point.y}`;
		// simple line
		return `${acc} L ${point.x},${point.y}`;
	}, "");

	const activeDaysCount = useMemo(() => {
		return data.filter((d) => d.distance > 0).length;
	}, [data]);

	const prevStats = useMemo(() => {
		const now = new Date();
		let total = 0;
		let activeDays = 0;
		for (let i = 13; i >= 7; i--) {
			const targetDate = subDays(now, i);
			const dist = trips
				.filter((t) => isSameDay(t.date, targetDate))
				.reduce((acc, curr) => acc + curr.distance, 0);
			total += dist;
			if (dist > 0) activeDays++;
		}
		return { total, activeDays };
	}, [trips]);

	const totalDistance7Days = data.reduce((acc, d) => acc + d.distance, 0);

	if (totalDistance7Days === 0) {
		return null; // hide if no usage in 7 days
	}

	const dailyAverage =
		activeDaysCount > 0 ? totalDistance7Days / activeDaysCount : 0;
	const prevDailyAverage =
		prevStats.activeDays > 0 ? prevStats.total / prevStats.activeDays : 0;
	const trend =
		dailyAverage > prevDailyAverage
			? "up"
			: dailyAverage < prevDailyAverage
				? "down"
				: "flat";

	return (
		<View className="mb-6 z-10 w-full flex-row items-center gap-6">
			<View className="flex-1">
				<View className="flex-row justify-between items-center w-full mb-3">
					<Text className="text-xs font-bold text-muted uppercase tracking-wider">
						Últimos 7 dias
					</Text>
					<Text className="text-xs font-bold text-success">
						{totalDistance7Days.toFixed(1)} km
					</Text>
				</View>
				<View className="w-full items-center justify-center">
					<Svg width={width} height={height}>
						<Defs>
							<LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
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

						{/* Area under curve */}
						<Path
							d={`${pathData} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`}
							fill="url(#grad)"
						/>

						{/* Line */}
						<Path
							d={pathData}
							fill="none"
							stroke="rgb(16, 185, 129)"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>

						{/* Dots */}
						{points.map((p) => {
							const isActive = activePoint === p.date.toISOString();
							return (
								<G key={p.date.toISOString()}>
									<Circle
										cx={p.x}
										cy={p.y}
										r={isActive ? "5" : "3"}
										fill={isActive ? "#fff" : "rgb(16, 185, 129)"}
										stroke={isActive ? "rgb(16, 185, 129)" : "#18181b"}
										strokeWidth={isActive ? "2" : "1.5"}
									/>
									{/* Invisible touch area for easier clicking */}
									<Circle
										cx={p.x}
										cy={p.y}
										r="18"
										fill="transparent"
										onPress={() =>
											setActivePoint(isActive ? null : p.date.toISOString())
										}
										// // @ts-expect-error
										// onMouseEnter={() => setActivePoint(p.date.toISOString())}
										// // @ts-expect-error
										// onMouseLeave={() => setActivePoint(null)}
									/>
								</G>
							);
						})}

						{/* Tooltip */}
						{activePoint &&
							(() => {
								const activeData = points.find(
									(p) => p.date.toISOString() === activePoint,
								);
								if (!activeData) return null;

								// If the point is too close to the top, show tooltip below it.
								const isNearTop = activeData.y < 25;
								const tooltipY = isNearTop
									? activeData.y + 20
									: activeData.y - 12;

								// If it's the first or last point, change text anchor to avoid horizontal clipping
								const isFirst = activeData === points[0];
								const isLast = activeData === points[points.length - 1];
								const anchor = isFirst ? "start" : isLast ? "end" : "middle";

								return (
									<SvgText
										x={activeData.x}
										y={tooltipY}
										fill={foregroundColor}
										fontSize="11"
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

			<Separator orientation="vertical" thickness={1} className="h-10/12" />

			<View className="items-center justify-center">
				<Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
					Média Diária
				</Text>
				<View className="flex-row items-center gap-1 mb-0.5">
					<Text className="text-xl font-black text-foreground">
						{dailyAverage.toFixed(1)}
					</Text>
				</View>
				<View className="flex-row items-center gap-1">
					{trend === "up" && (
						<StyledIcon name="trending-up" size={12} className="text-success" />
					)}
					{trend === "down" && (
						<StyledIcon
							name="trending-down"
							size={12}
							className="text-warning"
						/>
					)}
					{trend === "flat" && (
						<StyledIcon name="minus" size={12} className="text-muted" />
					)}
					<Text className="text-[11px] text-muted font-bold">km/dia</Text>
				</View>
			</View>
		</View>
	);
}
