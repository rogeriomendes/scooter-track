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
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
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

	const healthStats = useMemo(() => {
		let itemsInRisk = 0;
		let nextItem: typeof maintenance.$inferSelect | null = null;
		let minRemainingKm = Infinity;

		const currentTotalKm = stats?.totalKm || 0;

		for (const item of maintenanceList) {
			const wornKm = currentTotalKm - item.lastMaintenanceKm;
			const remainingKm = Math.max(0, item.intervalKm - wornKm);
			const wearPercentage = (wornKm / item.intervalKm) * 100;

			if (wearPercentage >= 70) itemsInRisk++;
			if (remainingKm < minRemainingKm) {
				minRemainingKm = remainingKm;
				nextItem = item;
			}
		}

		return { itemsInRisk, nextItem, minRemainingKm };
	}, [maintenanceList, stats]);

	const handleDelete = async (id: number) => {
		await db.delete(maintenance).where(eq(maintenance.id, id));
		refresh();
		setItemToDelete(null);
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
			{/* CABEÇALHO */}
			<View className="px-4 pt-4 pb-2">
				<Animated.Text
					entering={FadeInDown.delay(100).springify()}
					className="text-3xl font-bold text-foreground mb-1"
				>
					Manutenção
				</Animated.Text>
				<Animated.Text
					entering={FadeInDown.delay(200).springify()}
					className="text-xs font-bold text-muted uppercase tracking-wider"
				>
					{scooter.name}
				</Animated.Text>
			</View>

			<FlatList
				data={maintenanceList}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-24 pt-2 gap-3"
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					maintenanceList.length > 0 ? (
						<Animated.View
							entering={FadeInDown.delay(300).springify()}
							className="mb-4 mt-2"
						>
							<Text className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 px-1">
								Saúde da Frota
							</Text>
							<View className="flex-row gap-3">
								<Card
									variant="secondary"
									className="flex-1 items-center justify-center bg-surface border border-surface-secondary shadow-sm py-4"
								>
									<StyledIcon
										name="alert-triangle"
										size={18}
										className={
											healthStats.itemsInRisk > 0
												? "mb-2 text-warning"
												: "mb-2 text-success"
										}
									/>
									<View className="flex-row items-baseline gap-1">
										<Text className="text-2xl font-black text-foreground">
											{healthStats.itemsInRisk}
										</Text>
										<Text className="font-bold text-muted text-xs">
											peça(s)
										</Text>
									</View>
									<Text className="text-[10px] uppercase font-bold text-muted tracking-wider mt-0.5">
										Em Risco
									</Text>
								</Card>

								<Card
									variant="secondary"
									className="flex-[1.5] items-start justify-center bg-surface border border-surface-secondary shadow-sm py-4 px-4 overflow-hidden"
								>
									{healthStats.nextItem ? (
										<>
											<View className="flex-row items-center gap-1 mb-1 opacity-70">
												<StyledIcon
													name="calendar"
													size={12}
													className="text-info"
												/>
												<Text className="text-[10px] font-black text-info uppercase tracking-widest">
													Próxima Revisão
												</Text>
											</View>
											<Text
												className="text-sm font-black text-foreground mb-1"
												numberOfLines={1}
											>
												{healthStats.nextItem.name}
											</Text>
											<View className="flex-row items-baseline gap-1">
												<Text className="text-xl font-black text-foreground">
													{healthStats.minRemainingKm.toFixed(0)}
												</Text>
												<Text className="text-[10px] font-bold text-muted">
													km restantes
												</Text>
											</View>
										</>
									) : (
										<View className="items-center justify-center flex-1 w-full">
											<StyledIcon
												name="check-circle"
												size={18}
												className="text-success mb-1"
											/>
											<Text className="text-xs font-bold text-muted">
												Tudo em dia!
											</Text>
										</View>
									)}
								</Card>
							</View>
						</Animated.View>
					) : null
				}
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

					let statusColor = "text-success";
					let barColor = "bg-success";
					let bgGlow = "border-success/20";
					let iconColor = "text-success";

					if (isCritical) {
						statusColor = "text-danger";
						barColor = "bg-danger";
						bgGlow = "border-danger/30 bg-danger/5";
						iconColor = "text-danger";
					} else if (isWarning) {
						statusColor = "text-warning";
						barColor = "bg-warning";
						bgGlow = "border-warning/30 bg-warning/5";
						iconColor = "text-warning";
					}

					return (
						<Animated.View entering={FadeInRight.delay(index * 50).springify()}>
							<Card
								variant="secondary"
								className={`border ${bgGlow} bg-surface shadow-sm mb-3 p-0`}
							>
								{/* BACKGROUND PROGRESS BAR LAYER */}
								<View className="absolute bottom-0 left-0 right-0 h-1 bg-surface-secondary/50">
									<View
										className={`h-full ${barColor}`}
										style={{ width: `${100 - wearPercentage}%` }}
									/>
								</View>

								<Pressable
									className="px-4 py-4"
									onPress={() => {
										setItemToEdit(item);
										setIsBottomSheetOpen(true);
									}}
								>
									<View className="flex-row items-start justify-between">
										<View className="flex-row items-start gap-3 flex-1">
											<View
												className={`p-2.5 rounded-xl bg-surface-secondary/30 mt-0.5 ${isCritical || isWarning ? "border border-transparent" : "border border-surface-secondary"}`}
											>
												<StyledIcon
													name="tool"
													size={18}
													className={iconColor}
												/>
											</View>
											<View className="flex-1">
												<View className="flex-row items-baseline gap-1">
													<Text className="text-lg font-black text-foreground" numberOfLines={1}>
														{item.name}
													</Text>
												</View>
												<View className="flex-row items-center gap-1.5 mt-0.5">
													<Text className={`text-xs font-bold ${statusColor}`}>
														Restam {remainingKm.toFixed(0)} km
													</Text>
													<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
														• A CADA {item.intervalKm} KM
													</Text>
												</View>
											</View>
										</View>

										<View className="items-end pl-2">
											<Text className={`text-sm font-black ${statusColor}`}>
												{wearPercentage.toFixed(0)}%
											</Text>
											<Text className="text-[9px] font-bold text-muted uppercase tracking-wider mt-0.5">
												Desgaste
											</Text>
										</View>
									</View>
								</Pressable>
							</Card>
						</Animated.View>
					);
				}}
			/>

			{/* FLOATING ACTION BUTTON (FAB) */}
			<Animated.View
				entering={FadeInDown.delay(500).springify()}
				className="absolute bottom-6 right-6"
			>
				<Button
					size="lg"
					isIconOnly
					variant="primary"
					className="rounded-full shadow-lg bg-success border-0 h-16 w-16 shadow-success/40"
					style={{
						elevation: 10,
						shadowColor: "#10b981",
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.5,
						shadowRadius: 12,
					}}
					onPress={() => {
						setItemToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={28} color="white" />
				</Button>
			</Animated.View>

			<MaintenanceFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				onSaved={refresh}
				onDeleteRequest={(id) => {
					setIsBottomSheetOpen(false);
					setItemToDelete(id);
				}}
				editItem={itemToEdit}
				scooter={scooter}
				currentTotalKm={stats?.totalKm || 0}
			/>

			<ConfirmDialog
				isOpen={itemToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setItemToDelete(null);
				}}
				title="Excluir Peça"
				description="Tem certeza? Você perderá o histórico de manutenção deste item."
				onCancel={() => setItemToDelete(null)}
				onConfirm={() => itemToDelete && handleDelete(itemToDelete)}
			/>
		</ScreenWrapper>
	);
}
