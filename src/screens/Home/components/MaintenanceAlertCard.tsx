import { Card } from "heroui-native/card";
import { Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import type { useMaintenanceHealth } from "@/hooks/useMaintenanceHealth";

export interface MaintenanceAlertCardProps {
	healthStats: ReturnType<typeof useMaintenanceHealth>;
	onPress: () => void;
}

export function MaintenanceAlertCard({
	healthStats,
	onPress,
}: MaintenanceAlertCardProps) {
	if (!healthStats.nextItem || !healthStats.isPriorityActive) {
		return null;
	}

	return (
		<View className="mb-4">
			<Card
				variant="default"
				className="border border-warning/30 bg-warning/5 shadow-sm p-0 rounded-xl"
			>
				<Pressable className="py-2.5 px-3" onPress={onPress}>
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-2.5 flex-1">
							<View className="bg-warning/10 p-2 rounded-lg border border-warning/20">
								<StyledIcon
									name="alert-triangle"
									size={15}
									className="text-warning"
								/>
							</View>
							<View className="flex-1 min-w-0">
								<View className="flex-row items-baseline gap-1">
									<Text
										className="text-base font-black text-foreground"
										numberOfLines={1}
									>
										{healthStats.nextItem.name}
									</Text>
								</View>
								<View className="flex-row items-center gap-1.5 mt-0.5">
									<Text className="text-[11px] font-bold text-warning">
										Atenção: Faltam {healthStats.nextItemInfo.primary}{" "}
										{healthStats.nextItemInfo.secondary}
									</Text>
								</View>
							</View>
						</View>

						<View className="items-end pl-2">
							<StyledIcon
								name="chevron-right"
								size={18}
								className="text-warning"
							/>
						</View>
					</View>
				</Pressable>
			</Card>
		</View>
	);
}
