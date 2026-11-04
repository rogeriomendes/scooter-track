import { Card } from "heroui-native/card";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";

export type StatCardColor =
	| "success"
	| "info"
	| "warning"
	| "danger"
	| "accent";

export interface StatCardProps {
	icon: StyledIcon;
	color?: StatCardColor;
	label: string;
	value: ReactNode;
	unit?: string;
	subtitle?: ReactNode;
	size?: "sm" | "md";
	className?: string;
}

const colorStyles: Record<StatCardColor, { bg: string; text: string }> = {
	success: { bg: "bg-success/15", text: "text-success" },
	info: { bg: "bg-info/15", text: "text-info" },
	warning: { bg: "bg-warning/15", text: "text-warning" },
	danger: { bg: "bg-danger/15", text: "text-danger" },
	accent: { bg: "bg-accent/15", text: "text-accent" },
};

export function StatCard({
	icon,
	color = "success",
	label,
	value,
	unit,
	subtitle,
	size = "md",
	className = "",
}: StatCardProps) {
	const currentStyle = colorStyles[color];
	const isSm = size === "sm";

	return (
		<Card
			variant="default"
			className={`flex-1 ${
				isSm ? "p-3 gap-2.5" : "p-3.5 gap-3"
			} bg-surface border border-border shadow-sm rounded-2xl flex-row items-center ${className}`}
		>
			<View
				className={`${
					isSm ? "w-8 h-8" : "w-9 h-9"
				} rounded-xl ${currentStyle.bg} items-center justify-center shrink-0`}
			>
				<StyledIcon
					name={icon}
					size={isSm ? 16 : 18}
					className={currentStyle.text}
				/>
			</View>
			<View className="flex-1 min-w-0">
				<Text
					className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5"
					numberOfLines={1}
				>
					{label}
				</Text>
				<Text
					className={`${
						isSm ? "text-sm" : "text-lg"
					} font-black text-foreground`}
					numberOfLines={1}
				>
					{value}
					{unit ? (
						<Text className="text-xs font-bold text-muted"> {unit}</Text>
					) : null}
				</Text>
				{subtitle ? (
					typeof subtitle === "string" ? (
						<Text
							className="text-[10px] font-bold text-muted mt-0.5"
							numberOfLines={1}
						>
							{subtitle}
						</Text>
					) : (
						subtitle
					)
				) : null}
			</View>
		</Card>
	);
}
