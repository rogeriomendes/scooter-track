import { addMonths, differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { maintenance } from "@/db/schema";
import { useMaintenanceHealth } from "@/hooks/useMaintenanceHealth";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
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

	const healthStats = useMaintenanceHealth(maintenanceList, stats);

	type FilterType = "all" | "pending" | "risk" | "admin" | "completed";
	const [activeFilter, setActiveFilter] = useState<FilterType>("all");

	const pendingCount = maintenanceList.filter((i) => !i.isCompleted).length;
	const completedCount = maintenanceList.filter((i) => i.isCompleted).length;
	const adminCount = maintenanceList.filter((i) => !(i.hasWear ?? true)).length;

	const filterOptions: { id: FilterType; label: string; count: number }[] = [
		{ id: "all", label: "Todos", count: maintenanceList.length },
		{ id: "pending", label: "Em Aberto", count: pendingCount },
		{ id: "risk", label: "Em Risco", count: healthStats.itemsInRisk },
		{ id: "admin", label: "Fixo", count: adminCount },
		{ id: "completed", label: "Concluídas", count: completedCount },
	];

	const filteredMaintenance = maintenanceList.filter((item) => {
		if (activeFilter === "pending") return !item.isCompleted;
		if (activeFilter === "completed") return item.isCompleted;
		if (activeFilter === "admin") return !(item.hasWear ?? true);
		if (activeFilter === "risk") {
			if (item.isCompleted || !(item.hasWear ?? true)) return false;
			const currentTotalKm = stats?.totalKm || 0;
			const wornKm = currentTotalKm - item.lastMaintenanceKm;
			const wearPercentageKm =
				item.intervalKm > 0 ? (wornKm / item.intervalKm) * 100 : 0;
			let wearPercentageMonths = 0;
			if (item.lastMaintenanceDate && item.intervalMonths) {
				const nextDate = addMonths(
					item.lastMaintenanceDate,
					item.intervalMonths,
				);
				const totalDays =
					differenceInDays(nextDate, item.lastMaintenanceDate) || 1;
				const daysPassed = differenceInDays(
					new Date(),
					item.lastMaintenanceDate,
				);
				wearPercentageMonths = (daysPassed / totalDays) * 100;
			}
			const wear = Math.max(wearPercentageKm, wearPercentageMonths);
			return wear >= 70;
		}
		return true;
	});

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
			<Animated.Text
				entering={FadeInDown.delay(100).springify()}
				className="text-3xl font-bold text-foreground px-4 py-2"
			>
				Manutenção
			</Animated.Text>

			<FlatList
				data={filteredMaintenance}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-24 gap-2 pt-2"
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					maintenanceList.length > 0 ? (
						<Animated.View
							entering={FadeInDown.delay(300).springify()}
							className="mb-1 mt-1"
						>
							<View className="flex-row gap-2">
								{/* CARD 1: EM RISCO */}
								<Card
									variant="default"
									className="flex-1 p-3 bg-surface border border-border shadow-sm rounded-xl flex-row items-center gap-2.5"
								>
									<View
										className={`w-9 h-9 rounded-xl items-center justify-center shrink-0 ${
											healthStats.itemsInRisk > 0
												? "bg-warning/15"
												: "bg-success/15"
										}`}
									>
										<StyledIcon
											name="alert-triangle"
											size={18}
											className={
												healthStats.itemsInRisk > 0
													? "text-warning"
													: "text-success"
											}
										/>
									</View>
									<View className="flex-1 min-w-0">
										<Text
											className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5"
											numberOfLines={1}
										>
											Em Risco
										</Text>
										<Text
											className="text-base font-black text-foreground"
											numberOfLines={1}
										>
											{healthStats.itemsInRisk}{" "}
											<Text className="text-xs font-bold text-muted">
												peça(s)
											</Text>
										</Text>
									</View>
								</Card>

								{/* CARD 2: PRÓXIMA REVISÃO */}
								<Card
									variant="default"
									className="flex-[1.3] p-3 bg-surface border border-border shadow-sm rounded-xl flex-row items-center gap-2.5 min-w-0"
								>
									<View className="w-9 h-9 rounded-xl bg-info/15 items-center justify-center shrink-0">
										<StyledIcon
											name="calendar"
											size={18}
											className="text-info"
										/>
									</View>
									<View className="flex-1 min-w-0">
										<Text
											className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5"
											numberOfLines={1}
										>
											Próxima Revisão
										</Text>
										{healthStats.nextItem ? (
											<View className="min-w-0">
												<Text
													className="text-sm font-black text-foreground"
													numberOfLines={1}
												>
													{healthStats.nextItem.name}
												</Text>
												<Text
													className="text-[10px] font-bold text-muted"
													numberOfLines={1}
												>
													{healthStats.nextItemInfo?.primary}{" "}
													{healthStats.nextItemInfo?.secondary}
												</Text>
											</View>
										) : (
											<Text
												className="text-sm font-bold text-success"
												numberOfLines={1}
											>
												Tudo em dia!
											</Text>
										)}
									</View>
								</Card>
							</View>

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
													Haptics.impactAsync(
														Haptics.ImpactFeedbackStyle.Light,
													);
													setActiveFilter(opt.id);
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
						</Animated.View>
					) : undefined
				}
				ListEmptyComponent={
					maintenanceList.length > 0 ? (
						<View className="items-center justify-center mt-12 px-6 opacity-80">
							<View className="bg-surface-secondary/60 p-3.5 rounded-full mb-2.5 border border-surface-secondary">
								<StyledIcon name="filter" size={28} className="text-muted" />
							</View>
							<Text className="text-foreground text-center text-sm font-bold">
								Nenhum item nesta categoria
							</Text>
							<Text className="text-muted text-center text-xs mt-0.5 px-4">
								Não há manutenções correspondentes ao filtro selecionado.
							</Text>
							<Button
								size="sm"
								variant="secondary"
								className="mt-3 rounded-xl bg-surface-tertiary border-0 px-3.5"
								onPress={() => setActiveFilter("all")}
							>
								<Button.Label className="text-success text-xs font-bold">
									Ver todas as manutenções
								</Button.Label>
							</Button>
						</View>
					) : (
						<View className="items-center justify-center mt-20 opacity-60">
							<View className="bg-surface-secondary p-4 rounded-full mb-4">
								<StyledIcon name="tool" size={48} className="text-muted" />
							</View>
							<Text className="text-muted text-center text-lg font-bold">
								Nenhum item cadastrado
							</Text>
							<Text className="text-muted text-center text-sm mt-1 px-10">
								Cadastre peças como pastilhas de freio ou pneus para acompanhar
								a vida útil.
							</Text>
						</View>
					)
				}
				renderItem={({ item, index }) => {
					const currentTotalKm = stats?.totalKm || 0;
					const itemType = item.type || "km";

					// KM logic
					const wornKm = currentTotalKm - item.lastMaintenanceKm;
					const remainingKm = Math.max(0, item.intervalKm - wornKm);
					const wearPercentageKm =
						item.intervalKm > 0 ? (wornKm / item.intervalKm) * 100 : 0;

					// Months logic
					let wearPercentageMonths = 0;
					let remainingDaysMonths = 0;
					if (item.lastMaintenanceDate && item.intervalMonths) {
						const nextDate = addMonths(
							item.lastMaintenanceDate,
							item.intervalMonths,
						);
						const totalDays =
							differenceInDays(nextDate, item.lastMaintenanceDate) || 1;
						const daysPassed = differenceInDays(
							new Date(),
							item.lastMaintenanceDate,
						);
						remainingDaysMonths = Math.max(0, totalDays - daysPassed);
						wearPercentageMonths = (daysPassed / totalDays) * 100;
					}

					// Date (Fixed) logic
					let wearPercentageFixedDate = 0;
					let remainingDaysFixedDate = 0;
					if (item.targetDate && item.lastMaintenanceDate) {
						const totalDays =
							differenceInDays(item.targetDate, item.lastMaintenanceDate) || 1;
						const daysPassed = differenceInDays(
							new Date(),
							item.lastMaintenanceDate,
						);
						remainingDaysFixedDate = Math.max(0, totalDays - daysPassed);
						wearPercentageFixedDate = (daysPassed / totalDays) * 100;
					}

					let wearPercentage = 0;
					let primaryInfo = "";
					let secondaryInfo = "";

					if (itemType === "km") {
						wearPercentage = wearPercentageKm;
						primaryInfo = `Restam ${remainingKm.toFixed(0)} km`;
						secondaryInfo = `A CADA ${item.intervalKm} KM`;
					} else if (itemType === "months") {
						wearPercentage = wearPercentageMonths;
						primaryInfo = `Faltam ${remainingDaysMonths} dias`;
						secondaryInfo = `A CADA ${item.intervalMonths} MESES`;
					} else if (itemType === "date") {
						wearPercentage = wearPercentageFixedDate;
						primaryInfo = `Faltam ${remainingDaysFixedDate} dias`;
						secondaryInfo = `VENCE EM ${format(item.targetDate || new Date(), "dd/MM/yyyy", { locale: ptBR })}`;
					} else if (itemType === "mixed") {
						wearPercentage = Math.max(wearPercentageKm, wearPercentageMonths);
						if (wearPercentageKm > wearPercentageMonths) {
							primaryInfo = `Restam ${remainingKm.toFixed(0)} km`;
							secondaryInfo = `OU ${remainingDaysMonths} DIAS`;
						} else {
							primaryInfo = `Faltam ${remainingDaysMonths} dias`;
							secondaryInfo = `OU ${remainingKm.toFixed(0)} KM`;
						}
					}

					wearPercentage = Math.min(100, Math.max(0, wearPercentage));

					const isCritical = wearPercentage >= 90;
					const isWarning = wearPercentage >= 70 && wearPercentage < 90;

					let statusColor = "text-success";
					let barColor = "bg-success";
					let bgGlow = "border-surface-secondary/60";
					let iconColor = "text-success";
					let iconBgBorder = "bg-success/10 border border-success/20";
					let iconName:
						| "tool"
						| "check-circle"
						| "calendar"
						| "alert-circle"
						| "alert-triangle" = "tool";

					if (item.isCompleted) {
						statusColor = "text-cyan-400";
						bgGlow = "border-cyan-500/30 bg-cyan-500/5";
						iconColor = "text-cyan-400";
						iconBgBorder = "bg-cyan-500/10 border border-cyan-500/20";
						iconName = "check-circle";
					} else if (!(item.hasWear ?? true)) {
						statusColor = "text-indigo-400";
						bgGlow = "border-indigo-500/30 bg-indigo-500/5";
						iconColor = "text-indigo-400";
						iconBgBorder = "bg-indigo-500/10 border border-indigo-500/20";
						iconName = "calendar";
					} else if (isCritical) {
						statusColor = "text-danger";
						barColor = "bg-danger";
						bgGlow = "border-danger/30 bg-danger/5";
						iconColor = "text-danger";
						iconBgBorder = "bg-danger/10 border border-danger/20";
						iconName = "alert-circle";
					} else if (isWarning) {
						statusColor = "text-warning";
						barColor = "bg-warning";
						bgGlow = "border-warning/30 bg-warning/5";
						iconColor = "text-warning";
						iconBgBorder = "bg-warning/10 border border-warning/20";
						iconName = "alert-triangle";
					}

					return (
						<Animated.View entering={FadeInRight.delay(index * 40).springify()}>
							<Card
								variant="default"
								className={`border ${bgGlow} bg-surface shadow-sm p-0 rounded-xl overflow-hidden`}
							>
								{/* BACKGROUND PROGRESS BAR LAYER */}
								{!item.isCompleted && (item.hasWear ?? true) && (
									<View className="absolute bottom-0 left-0 right-0 h-1 bg-surface-secondary/50">
										<View
											className={`h-full ${barColor}`}
											style={{ width: `${100 - wearPercentage}%` }}
										/>
									</View>
								)}

								<Pressable
									className="py-2.5 px-3"
									onPress={() => {
										setItemToEdit(item);
										setIsBottomSheetOpen(true);
									}}
								>
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-2.5 flex-1">
											<View className={`p-2 rounded-lg ${iconBgBorder}`}>
												<StyledIcon
													name={iconName}
													size={15}
													className={iconColor}
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
														<Text className="text-[11px] font-semibold text-cyan-400">
															Realizada
															{item.completedAt
																? ` em ${format(new Date(item.completedAt), "dd/MM/yyyy", { locale: ptBR })}`
																: ""}
														</Text>
													</View>
												) : (
													<View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
														<Text
															className={`text-[11px] font-bold ${statusColor}`}
														>
															{primaryInfo}
														</Text>
														<Text className="text-[10px] uppercase font-bold text-muted tracking-wider">
															• {secondaryInfo}
														</Text>
													</View>
												)}
											</View>
										</View>

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
													<Text
														className={`text-base font-black ${statusColor}`}
													>
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
						</Animated.View>
					);
				}}
			/>

			{/* FLOATING ACTION PILL */}
			<Animated.View
				entering={FadeInDown.delay(500).springify()}
				className="absolute bottom-6 left-0 right-0 items-center z-20 pointer-events-box-none"
			>
				<Button
					size="md"
					variant="primary"
					className="rounded-full shadow-md px-5 py-3 flex-row items-center gap-2"
					onPress={() => {
						setItemToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={18} className="text-white" />
					<Button.Label className="text-white font-bold text-sm">
						Nova Manutenção
					</Button.Label>
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
