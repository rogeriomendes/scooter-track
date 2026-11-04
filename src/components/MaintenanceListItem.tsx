import { Card } from "heroui-native/card";
import { Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import type { maintenance } from "@/db/schema";
import { calculateMaintenanceWear } from "@/utils/maintenance";

export interface MaintenanceListItemProps {
	item: typeof maintenance.$inferSelect;
	currentTotalKm: number;
	onPress?: () => void;
}

function getMaintenanceItemStyle(
	item: typeof maintenance.$inferSelect,
	wearPercentage: number,
) {
	if (item.isCompleted) {
		return {
			statusColor: "text-cyan-400",
			barColor: "bg-cyan-500",
			bgGlow: "border-cyan-500/30 bg-cyan-500/5",
			iconColor: "text-cyan-400",
			iconBgBorder: "bg-cyan-500/10 border border-cyan-500/20",
			iconName: "check-circle" as const,
		};
	}
	if (!(item.hasWear ?? true)) {
		return {
			statusColor: "text-indigo-400",
			barColor: "bg-indigo-500",
			bgGlow: "border-indigo-500/30 bg-indigo-500/5",
			iconColor: "text-indigo-400",
			iconBgBorder: "bg-indigo-500/10 border border-indigo-500/20",
			iconName: "calendar" as const,
		};
	}
	if (wearPercentage >= 90) {
		return {
			statusColor: "text-danger",
			barColor: "bg-danger",
			bgGlow: "border-danger/30 bg-danger/5",
			iconColor: "text-danger",
			iconBgBorder: "bg-danger/10 border border-danger/20",
			iconName: "alert-circle" as const,
		};
	}
	if (wearPercentage >= 70) {
		return {
			statusColor: "text-warning",
			barColor: "bg-warning",
			bgGlow: "border-warning/30 bg-warning/5",
			iconColor: "text-warning",
			iconBgBorder: "bg-warning/10 border border-warning/20",
			iconName: "alert-triangle" as const,
		};
	}
	return {
		statusColor: "text-success",
		barColor: "bg-success",
		bgGlow: "border-surface-secondary/60",
		iconColor: "text-success",
		iconBgBorder: "bg-success/10 border border-success/20",
		iconName: "tool" as const,
	};
}

export function MaintenanceListItem({
	item,
	currentTotalKm,
	onPress,
}: MaintenanceListItemProps) {
	const { wearPercentage, primaryInfo, secondaryInfo } =
		calculateMaintenanceWear(item, currentTotalKm);

	const styles = getMaintenanceItemStyle(item, wearPercentage);

	return (
		<Card
			variant="default"
			className={`border ${styles.bgGlow} bg-surface shadow-sm p-0 rounded-xl overflow-hidden`}
		>
			{/* BACKGROUND PROGRESS BAR LAYER */}
			{!item.isCompleted && (item.hasWear ?? true) && (
				<View className="absolute bottom-0 left-0 right-0 h-1 bg-surface-secondary/50">
					<View
						className={`h-full ${styles.barColor}`}
						style={{ width: `${100 - wearPercentage}%` }}
					/>
				</View>
			)}

			<Pressable className="py-2.5 px-3" onPress={onPress}>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-2.5 flex-1">
						<View className={`p-2 rounded-lg ${styles.iconBgBorder}`}>
							<StyledIcon
								name={styles.iconName}
								size={15}
								className={styles.iconColor}
							/>
						</View>
						<View className="flex-1">
							<View className="flex-row items-baseline gap-1">
								<Text
									className="text-base font-black text-foreground"
									numberOfLines={1}
								>
									{item.name}
								</Text>
							</View>
							{item.isCompleted ? (
								<View className="flex-row items-center gap-1 mt-0.5">
									<StyledIcon
										name="check-circle"
										size={11}
										className="text-cyan-400"
									/>
									<Text className="text-[11px] font-bold text-cyan-400">
										Concluído / Resolvido
									</Text>
								</View>
							) : !(item.hasWear ?? true) ? (
								<View className="flex-row items-center gap-1 mt-0.5">
									<StyledIcon
										name="calendar"
										size={11}
										className="text-indigo-400"
									/>
									<Text className="text-[11px] font-bold text-indigo-400">
										Lembrete pontual
									</Text>
								</View>
							) : (
								<View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
									<Text
										className={`text-[11px] font-bold ${styles.statusColor}`}
									>
										{primaryInfo}
									</Text>
									<Text className="text-[10px] font-bold text-muted">
										• {secondaryInfo}
									</Text>
								</View>
							)}
						</View>
					</View>

					{/* STATUS BADGE / PERCENTAGE */}
					<View className="items-end pl-2 justify-center">
						{item.isCompleted ? (
							<View className="bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
								<Text className="text-[10px] font-bold text-cyan-400 uppercase">
									Concluído
								</Text>
							</View>
						) : !(item.hasWear ?? true) ? (
							<View className="bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
								<Text className="text-[10px] font-bold text-indigo-400 uppercase">
									Fixo
								</Text>
							</View>
						) : (
							<View className="items-end">
								<Text className={`text-base font-black ${styles.statusColor}`}>
									{wearPercentage.toFixed(0)}%
								</Text>
								<Text className="text-[9px] font-bold text-muted uppercase tracking-wider">
									Desgaste
								</Text>
							</View>
						)}
					</View>
				</View>
			</Pressable>
		</Card>
	);
}
