import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "heroui-native/card";
import { Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import type { logs, scooters } from "@/db/schema";

export interface TripListItemProps {
	trip: typeof logs.$inferSelect;
	scooter: typeof scooters.$inferSelect;
	consumption?: { consumedPct: number; consumedValue: number };
	onPress?: () => void;
}

export function TripListItem({
	trip,
	scooter,
	consumption,
	onPress,
}: TripListItemProps) {
	return (
		<Card
			variant="default"
			className="border border-border bg-surface shadow-sm p-0 rounded-xl"
		>
			<Pressable className="py-2.5 px-3" onPress={onPress}>
				<View className="flex-row items-center justify-between">
					<View className="flex-row items-center gap-2.5 flex-1">
						<View className="bg-success/10 p-2 rounded-lg border border-success/20">
							<StyledIcon name="map-pin" size={15} className="text-success" />
						</View>
						<View className="flex-1">
							<View className="flex-row items-baseline gap-1">
								<Text className="text-base font-black text-foreground">
									{trip.distance.toFixed(1)}
								</Text>
								<Text className="font-bold text-muted text-xs">km</Text>
							</View>
							<View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
								<View className="flex-row items-center gap-1">
									<StyledIcon name="battery" size={10} className="text-muted" />
									<Text className="text-[11px] font-semibold text-muted">
										Final:{" "}
										<Text className="text-foreground font-bold">
											{trip.batteryLevel}
											{scooter.trackingMode === "percent" ? "%" : "V"}
										</Text>
										{scooter.trackingMode === "voltage" && (
											<Text className="font-semibold text-muted text-[10px] ml-0.5">
												(
												{calculateBatteryPercentage(
													trip.batteryLevel,
													scooter.batteryType,
												)}
												%)
											</Text>
										)}
									</Text>
								</View>

								{consumption && consumption.consumedPct > 0 && (
									<View className="bg-danger/10 px-1.5 py-0.5 rounded-full border border-danger/20 flex-row items-center gap-0.5">
										<StyledIcon
											name="trending-down"
											size={9}
											className="text-danger"
										/>
										<Text className="text-[10px] font-bold text-danger">
											-{consumption.consumedPct.toFixed(0)}%
										</Text>
									</View>
								)}
							</View>
						</View>
					</View>

					<View className="bg-surface-tertiary px-2 py-0.5 rounded-md">
						<Text className="text-[10px] text-muted font-bold">
							{format(trip.date, "dd MMM • HH:mm", { locale: ptBR })}
						</Text>
					</View>
				</View>

				{trip.notes ? (
					<View className="mt-2 bg-surface-tertiary/50 p-2 rounded-lg border border-surface-secondary/30 flex-row items-start gap-1.5">
						<StyledIcon
							name="message-square"
							size={11}
							className="text-muted mt-0.5"
						/>
						<Text className="text-[11px] text-muted italic flex-1">
							"{trip.notes}"
						</Text>
					</View>
				) : null}
			</Pressable>
		</Card>
	);
}
