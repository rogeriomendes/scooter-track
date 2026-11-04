import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "heroui-native/card";
import { Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import type { logs, scooters } from "@/db/schema";

export interface ChargeListItemProps {
	item: typeof logs.$inferSelect;
	scooter: typeof scooters.$inferSelect;
	autonomia: string;
	gain?: { initialPct: number; gainedPct: number };
	onPress?: () => void;
}

export function ChargeListItem({
	item,
	scooter,
	autonomia,
	gain,
	onPress,
}: ChargeListItemProps) {
	return (
		<Card
			variant="default"
			className="border border-border bg-surface shadow-sm p-0 rounded-xl"
		>
			<Pressable className="py-2.5 px-3" onPress={onPress}>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-2.5 flex-1">
						<View className="bg-info/10 p-2 rounded-lg border border-info/20">
							<StyledIcon name="zap" size={15} className="text-info" />
						</View>
						<View className="flex-1">
							<View className="flex-row items-baseline gap-1">
								<Text className="text-base font-black text-foreground">
									{item.batteryLevel}
								</Text>
								<Text className="font-bold text-muted text-xs">
									{scooter.trackingMode === "percent" ? "%" : "V"}
								</Text>
								{scooter.trackingMode === "voltage" && (
									<Text className="font-semibold text-muted text-[10px] ml-0.5">
										(
										{calculateBatteryPercentage(
											item.batteryLevel,
											scooter.batteryType,
										)}
										%)
									</Text>
								)}
							</View>
							<View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
								<View className="flex-row items-center gap-1">
									<StyledIcon
										name="navigation"
										size={10}
										className="text-success"
									/>
									<Text className="text-[11px] font-semibold text-muted">
										Ciclo:{" "}
										<Text className="text-success font-bold">
											+{autonomia} km
										</Text>
									</Text>
								</View>

								{gain && gain.gainedPct > 0 && (
									<View className="bg-success/10 px-1.5 py-0.5 rounded-full border border-success/20 flex-row items-center gap-0.5">
										<StyledIcon
											name="trending-up"
											size={9}
											className="text-success"
										/>
										<Text className="text-[9px] font-bold text-success">
											+{gain.gainedPct}% ({gain.initialPct}% ➔{" "}
											{scooter.trackingMode === "percent"
												? item.batteryLevel
												: calculateBatteryPercentage(
														item.batteryLevel,
														scooter.batteryType,
													)}
											%)
										</Text>
									</View>
								)}
							</View>
						</View>
					</View>

					<View className="bg-surface-tertiary px-2 py-0.5 rounded-md">
						<Text className="text-[10px] text-muted font-bold">
							{format(item.date, "dd MMM • HH:mm", { locale: ptBR })}
						</Text>
					</View>
				</View>

				{item.notes ? (
					<View className="mt-2 bg-surface-tertiary/50 p-2 rounded-lg border border-surface-secondary/30 flex-row items-start gap-1.5">
						<StyledIcon
							name="message-square"
							size={11}
							className="text-muted mt-0.5"
						/>
						<Text className="text-[11px] text-muted italic flex-1">
							"{item.notes}"
						</Text>
					</View>
				) : null}
			</Pressable>
		</Card>
	);
}
