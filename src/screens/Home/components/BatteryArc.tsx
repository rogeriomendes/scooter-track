import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
	useAnimatedProps,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { StyledIcon } from "@/components/StyledIcon";

type BatteryArcProps = {
	percentage: number;
	color: string;
	glowColor: string;
	statusIcon: StyledIcon;
	statusText: string;
	statusColor: string;
	gradientColors?: readonly [string, string];
	secondaryLabel?: string | null;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function BatteryArc({
	percentage,
	color,
	glowColor,
	statusIcon,
	statusText,
	statusColor,
	gradientColors = ["#34d399", "#059669"],
	secondaryLabel,
}: BatteryArcProps) {
	const size = 240;
	const strokeWidth = 14;
	const center = size / 2;
	const radius = center - strokeWidth - 2;

	const startX = strokeWidth + 2;
	const startY = center;
	const endX = size - (strokeWidth + 2);
	const endY = startY;

	const d = `M ${startX},${startY} A ${radius},${radius} 0 0,1 ${endX},${endY}`;
	const pathLength = Math.PI * radius; // length of half circle

	const progress = useSharedValue(0);

	useEffect(() => {
		progress.value = withSpring(Math.max(0, Math.min(100, percentage)), {
			damping: 18,
			stiffness: 90,
		});
	}, [percentage, progress]);

	const animatedPathProps = useAnimatedProps(() => {
		const strokeDashoffset = pathLength - (pathLength * progress.value) / 100;
		return {
			strokeDashoffset,
		};
	});

	// Calculo do ponto da ponta da arc (ponto final)
	const clampPct = Math.max(0, Math.min(100, percentage));
	const angleRad = Math.PI - (clampPct / 100) * Math.PI;
	const tipX = center + radius * Math.cos(angleRad);
	const tipY = center - radius * Math.sin(angleRad);

	return (
		<View style={{ width: size, alignItems: "center" }}>
			<View
				style={{
					height: center + strokeWidth + 4,
					width: size,
					overflow: "hidden",
				}}
			>
				<Svg width={size} height={size}>
					<Defs>
						<LinearGradient id="batteryArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
							<Stop offset="0%" stopColor={gradientColors[0]} />
							<Stop offset="100%" stopColor={gradientColors[1]} />
						</LinearGradient>
					</Defs>

					{/* Brilho Ambiente Externo */}
					<Path
						d={d}
						stroke={color}
						strokeWidth={strokeWidth + 6}
						fill="none"
						opacity={0.12}
						strokeLinecap="round"
					/>

					{/* Trilho de Fundo */}
					<Path
						d={d}
						stroke="rgba(150, 150, 150, 0.12)"
						strokeWidth={strokeWidth}
						fill="none"
						strokeLinecap="round"
					/>

					{/* Arco Animado com Gradiente */}
					<AnimatedPath
						d={d}
						stroke="url(#batteryArcGrad)"
						strokeWidth={strokeWidth}
						fill="none"
						strokeLinecap="round"
						strokeDasharray={pathLength}
						animatedProps={animatedPathProps}
					/>

					{/* Indicador de Ponta (End Cap Dot) */}
					{clampPct > 2 && clampPct < 98 && (
						<>
							<Circle
								cx={tipX}
								cy={tipY}
								r={strokeWidth / 2 + 3}
								fill={gradientColors[0]}
								opacity={0.4}
							/>
							<Circle
								cx={tipX}
								cy={tipY}
								r={strokeWidth / 2 - 2}
								fill="#ffffff"
							/>
						</>
					)}
				</Svg>
			</View>

			{/* Porcentagem Central & Status */}
			<View style={{ marginTop: -(center * 0.74), alignItems: "center" }}>
				<Text
					className="text-[60px] font-black tracking-tighter"
					style={{
						color: color,
						textShadowColor: glowColor,
						textShadowRadius: 18,
						textShadowOffset: { width: 0, height: 4 },
					}}
				>
					{Math.round(percentage)}%
				</Text>

				{/* Subtítulo Inteligente (Voltagem / Autonomia Est.) embaixo da Porcentagem */}
				{secondaryLabel && (
					<View className="bg-surface-secondary/90 px-2.5 py-0.5 rounded-full border border-surface-secondary/80 -mt-1 mb-1.5">
						<Text className="text-[11px] font-bold text-muted">
							{secondaryLabel}
						</Text>
					</View>
				)}

				<View className="flex-row items-center gap-1.5 bg-surface-secondary/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-surface-secondary/80 shadow-sm">
					<StyledIcon name={statusIcon} size={14} className={statusColor} />
					<Text className="text-xs font-bold text-foreground">
						{statusText}
					</Text>
				</View>
			</View>
		</View>
	);
}
