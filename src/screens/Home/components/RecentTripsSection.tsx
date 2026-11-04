import { Pressable, Text, View } from "react-native";
import { TripListItem } from "@/components/TripListItem";
import type { logs, scooters } from "@/db/schema";
import type { TripConsumption } from "@/utils/stats";

interface RecentTripsSectionProps {
	recentTrips: (typeof logs.$inferSelect)[];
	scooter: typeof scooters.$inferSelect;
	tripConsumptionMap: Map<number, TripConsumption>;
	onViewAll: () => void;
}

export function RecentTripsSection({
	recentTrips,
	scooter,
	tripConsumptionMap,
	onViewAll,
}: RecentTripsSectionProps) {
	return (
		<View>
			<View className="flex-row justify-between items-center mb-3 ml-1">
				<Text className="text-xs font-bold text-muted uppercase tracking-wider">
					Últimos Usos
				</Text>
				{recentTrips.length > 0 && (
					<Pressable
						onPress={onViewAll}
						className="active:opacity-70 py-1"
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					>
						<Text className="text-success text-xs font-bold">Ver todos</Text>
					</Pressable>
				)}
			</View>

			<View className="gap-2 mb-4">
				{recentTrips.length === 0 ? (
					<Text className="text-center text-muted mt-2">
						Nenhum uso registrado recentemente.
					</Text>
				) : (
					recentTrips.map((trip) => {
						const consumption = tripConsumptionMap.get(trip.id);
						return (
							<TripListItem
								key={trip.id}
								trip={trip}
								scooter={scooter}
								consumption={consumption}
								onPress={onViewAll}
							/>
						);
					})
				)}
			</View>
		</View>
	);
}
