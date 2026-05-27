import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { maintenance } from "@/db/schema";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { eq } from "drizzle-orm";
import { Button } from "heroui-native";
import { Card } from "heroui-native/card";
import { useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaintenanceFormSheet } from "./components/MaintenanceFormSheet";

export function MaintenanceScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);

	const { scooter, maintenanceList, stats, refresh, isLoading } =
		useScooterData(activeScooterId);

	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
	const [itemToEdit, setItemToEdit] = useState<
		typeof maintenance.$inferSelect | null
	>(null);

	const [itemToDelete, setItemToDelete] = useState<number | null>(null);
	const [itemToReset, setItemToReset] = useState<
		typeof maintenance.$inferSelect | null
	>(null);

	const handleDelete = async (id: number) => {
		await db.delete(maintenance).where(eq(maintenance.id, id));
		refresh();
		setItemToDelete(null);
	};

	const handleResetWear = async (item: typeof maintenance.$inferSelect) => {
		const currentTotalKm = stats?.totalKm || 0;
		await db
			.update(maintenance)
			.set({ lastMaintenanceKm: currentTotalKm })
			.where(eq(maintenance.id, item.id));
		refresh();
		setItemToReset(null);
	};

	if (isLoading) {
		return (
			<ScreenWrapper className="p-6 justify-center items-center">
				<ActivityIndicator size="large" color="#10b981" />
			</ScreenWrapper>
		);
	}

	if (!activeScooterId || !scooter) {
		return (
			<EmptyScooterState
				title="Manutenção"
				description="Adicione uma scooter primeiro para gerenciar suas peças."
			/>
		);
	}

	return (
		<ScreenWrapper>
			<View className="p-4 flex-row justify-between items-center">
				<View>
					<Text className="text-3xl font-bold text-foreground mb-1">
						Manutenção
					</Text>
					<Text className="text-sm font-bold text-muted mt-1 uppercase tracking-wider">
						{/* {maintenanceList.length} registros ·  */}
						{scooter.name}
					</Text>
				</View>
				<Button
					size="md"
					isIconOnly
					variant="primary"
					className="rounded-full shadow-lg"
					onPress={() => {
						setItemToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={24} color="white" />
				</Button>
			</View>

			<FlatList
				data={maintenanceList}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-10 gap-3 mt-4"
				ListEmptyComponent={
					<View className="items-center justify-center mt-20 opacity-60">
						<View className="bg-surface-secondary p-4 rounded-full mb-4">
							<StyledIcon name="tool" size={48} className="text-muted" />
						</View>
						<Text className="text-muted text-center text-lg font-bold">
							Nenhum item cadastrado
						</Text>
						<Text className="text-muted text-center text-sm mt-1 px-10">
							Cadastre peças como pastilhas de freio ou pneus para acompanhar a
							vida útil.
						</Text>
					</View>
				}
				renderItem={({ item, index }) => {
					const currentTotalKm = stats?.totalKm || 0;
					const wornKm = currentTotalKm - item.lastMaintenanceKm;
					const remainingKm = Math.max(0, item.intervalKm - wornKm);
					let wearPercentage = (wornKm / item.intervalKm) * 100;
					wearPercentage = Math.min(100, Math.max(0, wearPercentage));

					const isCritical = wearPercentage >= 90;
					const isWarning = wearPercentage >= 70 && wearPercentage < 90;

					let progressColorClass = "bg-success";
					if (isCritical) progressColorClass = "bg-danger";
					else if (isWarning) progressColorClass = "bg-warning";

					return (
						<Animated.View entering={FadeInDown.delay(index * 100).springify()}>
							<Card
								variant="secondary"
								className="border border-surface-secondary"
							>
								<View className="flex-row items-center justify-between mb-3">
									<View className="flex-row items-center gap-3">
										<View className="p-2 bg-surface rounded-xl border border-surface-secondary">
											<StyledIcon
												name="settings"
												size={20}
												className="text-muted"
											/>
										</View>
										<View>
											<Text className="text-base font-bold text-foreground">
												{item.name}
											</Text>
											<Text className="text-xs text-muted">
												Troca a cada {item.intervalKm} km
											</Text>
										</View>
									</View>
									<View className="flex-row gap-2">
										<Button
											size="sm"
											isIconOnly
											variant="secondary"
											onPress={() => {
												setItemToEdit(item);
												setIsBottomSheetOpen(true);
											}}
										>
											<StyledIcon
												name="edit-2"
												size={16}
												className="text-accent"
											/>
										</Button>
										<Button
											size="sm"
											isIconOnly
											variant="secondary"
											onPress={() => setItemToReset(item)}
										>
											<StyledIcon
												name="refresh-cw"
												size={16}
												className="text-success"
											/>
										</Button>
										<Button
											size="sm"
											isIconOnly
											variant="secondary"
											onPress={() => setItemToDelete(item.id)}
										>
											<StyledIcon
												name="trash-2"
												size={16}
												className="text-danger"
											/>
										</Button>
									</View>
								</View>

								<View className="mt-2">
									<View className="flex-row justify-between mb-1">
										<Text className="text-xs font-bold text-foreground">
											Desgaste Estimado
										</Text>
										<Text
											className={`text-xs font-bold ${isCritical ? "text-danger" : isWarning ? "text-warning" : "text-success"}`}
										>
											{wearPercentage.toFixed(0)}%
										</Text>
									</View>
									<View className="h-3 bg-surface-secondary rounded-full overflow-hidden mb-1">
										<View
											className={`h-full rounded-full ${progressColorClass}`}
											style={{ width: `${wearPercentage}%` }}
										/>
									</View>
									<Text className="text-[10px] text-muted text-right">
										Resta aprox. {remainingKm.toFixed(0)} km
									</Text>
								</View>
							</Card>
						</Animated.View>
					);
				}}
			/>

			<MaintenanceFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				scooter={scooter}
				onSaved={refresh}
				editItem={itemToEdit}
				currentTotalKm={stats?.totalKm || 0}
			/>

			<ConfirmDialog
				isOpen={itemToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setItemToDelete(null);
				}}
				title="Excluir Item"
				description="Tem certeza que deseja excluir este item de manutenção? O histórico de desgaste será perdido."
				onConfirm={() => {
					if (itemToDelete) handleDelete(itemToDelete);
				}}
				onCancel={() => setItemToDelete(null)}
			/>

			<ConfirmDialog
				isOpen={itemToReset !== null}
				onOpenChange={(open) => {
					if (!open) setItemToReset(null);
				}}
				title="Zerar Desgaste"
				description={`Tem certeza que deseja registrar a troca/manutenção de "${itemToReset?.name}"? O desgaste voltará para 0%.`}
				confirmText="Zerar"
				confirmVariant="primary"
				onConfirm={() => {
					if (itemToReset) handleResetWear(itemToReset);
				}}
				onCancel={() => setItemToReset(null)}
			/>
		</ScreenWrapper>
	);
}
