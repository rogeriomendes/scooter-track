import { StyledIcon } from "@/components/StyledIcon";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type BatteryArcProps = {
	percentage: number;
	color: string;
	glowColor: string;
	statusIcon: any;
	statusText: string;
	statusColor: string;
};

export function BatteryArc({
	percentage,
	color,
	glowColor,
	statusIcon,
	statusText,
	statusColor,
}: BatteryArcProps) {
	const size = 240;
	const strokeWidth = 14;
	const center = size / 2;
	const radius = center - strokeWidth;

	// Start from the middle Y
	const startX = strokeWidth;
	const startY = center;
	const endX = size - strokeWidth;
	const endY = startY;

	const d = `M ${startX},${startY} A ${radius},${radius} 0 0,1 ${endX},${endY}`;

	const pathLength = Math.PI * radius; // length of the half circle
	const strokeDashoffset = pathLength - (pathLength * percentage) / 100;

	return (
		<View style={{ width: size, alignItems: "center" }}>
			<View
				style={{
					height: center + strokeWidth,
					width: size,
					overflow: "hidden",
				}}
			>
				<Svg width={size} height={size}>
					{/* Background Arc */}
					<Path
						d={d}
						stroke="rgba(255,255,255,0.05)"
						strokeWidth={strokeWidth}
						fill="none"
						strokeLinecap="round"
					/>
					{/* Foreground Arc */}
					<Path
						d={d}
						stroke={color}
						strokeWidth={strokeWidth}
						fill="none"
						strokeLinecap="round"
						strokeDasharray={pathLength}
						strokeDashoffset={strokeDashoffset}
					/>
				</Svg>
			</View>

			{/* Center Text (Battery %) - pulled up to sit inside the arc */}
			<View style={{ marginTop: -(center * 0.7), alignItems: "center" }}>
				<Text
					className="text-[64px] font-black tracking-tighter"
					style={{
						color: color,
						textShadowColor: glowColor,
						textShadowRadius: 15,
						textShadowOffset: { width: 0, height: 4 },
					}}
				>
					{percentage}%
				</Text>
				<View className="flex-row items-center gap-1.5 mt-3 bg-surface-secondary/80 backdrop-blur-md px-3 py-1 rounded-full border border-surface-secondary">
					<StyledIcon name={statusIcon} size={14} className={statusColor} />
					<Text className="text-xs font-bold text-foreground">
						{statusText}
					</Text>
				</View>
			</View>
		</View>
	);
}
