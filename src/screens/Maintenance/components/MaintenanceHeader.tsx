import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatGrid } from "@/components/StatGrid";
import type { useMaintenanceHealth } from "@/hooks/useMaintenanceHealth";

export type MaintenanceFilterType =
	| "all"
	| "pending"
	| "risk"
	| "admin"
	| "completed";

export interface FilterOption {
	id: MaintenanceFilterType;
	label: string;
	count: number;
}

interface MaintenanceHeaderProps {
	healthStats: ReturnType<typeof useMaintenanceHealth>;
	filterOptions: FilterOption[];
	activeFilter: MaintenanceFilterType;
	onSelectFilter: (filter: MaintenanceFilterType) => void;
}

export function MaintenanceHeader({
	healthStats,
	filterOptions,
	activeFilter,
	onSelectFilter,
}: MaintenanceHeaderProps) {
	return (
		<View className="mb-2 mt-1">
			<StatGrid
				items={[
					{
						icon: "alert-triangle",
						color: healthStats.itemsInRisk > 0 ? "warning" : "success",
						label: "Em Risco",
						value: healthStats.itemsInRisk,
						unit: "peça(s)",
					},
					{
						icon: "calendar",
						color: "info",
						label: "Próxima Revisão",
						value: healthStats.nextItem ? (
							healthStats.nextItem.name
						) : (
							<Text className="text-sm font-bold text-success">
								Tudo em dia!
							</Text>
						),
						subtitle: healthStats.nextItem
							? `${healthStats.nextItemInfo?.primary} ${healthStats.nextItemInfo?.secondary}`
							: undefined,
						className: "flex-[1.2]",
					},
				]}
			/>

			{/* CHIPS DE FILTRO DE MANUTENÇÃO */}
			<View className="mt-3">
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName="gap-2"
				>
					{filterOptions.map((opt) => {
						const isSelected = activeFilter === opt.id;
						return (
							<Pressable
								key={opt.id}
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									onSelectFilter(opt.id);
								}}
								className={`px-2.5 py-2 rounded-xl flex-row items-center gap-1 ${
									isSelected
										? "bg-success/15 border border-success/30 shadow-sm"
										: "bg-surface-tertiary border border-transparent active:opacity-70"
								}`}
							>
								{isSelected && (
									<View className="w-1.5 h-1.5 rounded-full bg-success" />
								)}
								<Text
									className={`text-xs font-bold ${
										isSelected ? "text-success" : "text-muted"
									}`}
								>
									{opt.label} ({opt.count})
								</Text>
							</Pressable>
						);
					})}
				</ScrollView>
			</View>
		</View>
	);
}
