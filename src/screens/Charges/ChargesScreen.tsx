import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	SectionList,
	Text,
	View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { MonthSelector } from "@/components/MonthSelector";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { ChargeFormSheet } from "./components/ChargeFormSheet";

export default function ChargesScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, refresh, stats, isLoading } =
		useScooterData(activeScooterId);

	const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
	const [page, setPage] = useState(1);
	const itemsPerPage = 20;

	const totalChargesCount = useMemo(
		() => allLogs.filter((l) => l.type === "charge").length,
		[allLogs],
	);

	const chargesList = useMemo(() => {
		return allLogs.filter((l) => {
			if (l.type !== "charge") return false;
			if (!selectedMonth) return true;
			const logDate = new Date(l.date);
			return (
				logDate.getMonth() === selectedMonth.getMonth() &&
				logDate.getFullYear() === selectedMonth.getFullYear()
			);
		});
	}, [allLogs, selectedMonth]);

	const displayedCharges = useMemo(
		() => chargesList.slice(0, page * itemsPerPage),
		[chargesList, page],
	);

	const groupedCharges = useMemo(() => {
		const groups: { title: string; data: (typeof logs.$inferSelect)[] }[] = [];
		const currentYear = new Date().getFullYear();

		for (const charge of displayedCharges) {
			const chargeDate = new Date(charge.date);
			const groupTitle =
				chargeDate.getFullYear() === currentYear
					? format(chargeDate, "MMMM", { locale: ptBR })
					: format(chargeDate, "MMMM 'de' yyyy", { locale: ptBR });

			const existingGroup = groups.find((g) => g.title === groupTitle);
			if (existingGroup) {
				existingGroup.data.push(charge);
			} else {
				groups.push({ title: groupTitle, data: [charge] });
			}
		}
		return groups;
	}, [displayedCharges]);

	const minDate = useMemo(() => {
		let oldest = scooter?.createdAt ? new Date(scooter.createdAt) : new Date();
		for (const log of allLogs) {
			const d = new Date(log.date);
			if (d < oldest) oldest = d;
		}
		return oldest;
	}, [allLogs, scooter]);

	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
	const [logToDelete, setLogToDelete] = useState<number | null>(null);
	const [logToEdit, setLogToEdit] = useState<typeof logs.$inferSelect | null>(
		null,
	);

	const chargeGainMap = useMemo(() => {
		const map = new Map<number, { initialPct: number; gainedPct: number }>();
		if (!scooter) return map;
		const ascLogs = [...allLogs].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		let prevBatteryLevel: number | null = null;

		for (const log of ascLogs) {
			if (log.type === "charge") {
				if (prevBatteryLevel !== null && log.batteryLevel > prevBatteryLevel) {
					let prevPct = prevBatteryLevel;
					let currPct = log.batteryLevel;
					if (scooter.trackingMode === "voltage") {
						prevPct = calculateBatteryPercentage(
							prevBatteryLevel,
							scooter.batteryType,
						);
						currPct = calculateBatteryPercentage(
							log.batteryLevel,
							scooter.batteryType,
						);
					}
					const gainedPct = Math.max(0, Math.round(currPct - prevPct));
					map.set(log.id, {
						initialPct: Math.round(prevPct),
						gainedPct,
					});
				}
				prevBatteryLevel = log.batteryLevel;
			} else if (log.type === "trip") {
				prevBatteryLevel = log.batteryLevel;
			}
		}
		return map;
	}, [allLogs, scooter]);

	const handleDelete = async (id: number) => {
		await db.delete(logs).where(eq(logs.id, id));
		refresh();
		setLogToDelete(null);
	};

	const handleEdit = (item: typeof logs.$inferSelect) => {
		setLogToEdit(item);
		setIsBottomSheetOpen(true);
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
				title="Recargas"
				description="Adicione uma scooter primeiro para registrar recargas."
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
				Recargas
			</Animated.Text>

			{/* ESTATÍSTICAS RÁPIDAS (DASHBOARD GRID 2x2) */}
			<Animated.View
				entering={FadeInDown.delay(300).springify()}
				className="px-4 mb-3 mt-1 gap-2"
			>
				<View className="flex-row gap-2">
					<Card
						variant="secondary"
						className="flex-1 p-3.5 bg-surface border border-surface-secondary shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-info/15 items-center justify-center">
							<StyledIcon name="zap" size={18} className="text-info" />
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								{selectedMonth ? "Mês Selecionado" : "Total Cargas"}
							</Text>
							<Text className="text-lg font-black text-foreground">
								{chargesList.length}{" "}
								<Text className="text-xs font-bold text-muted">cargas</Text>
							</Text>
						</View>
					</Card>

					<Card
						variant="secondary"
						className="flex-1 p-3.5 bg-surface border border-surface-secondary shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-success/15 items-center justify-center">
							<StyledIcon
								name="navigation"
								size={18}
								className="text-success"
							/>
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								Média / Ciclo
							</Text>
							<Text className="text-lg font-black text-foreground">
								{stats?.averageCycleKm.toFixed(1) || "0.0"}{" "}
								<Text className="text-xs font-bold text-muted">km</Text>
							</Text>
						</View>
					</Card>
				</View>

				<View className="flex-row gap-2">
					<Card
						variant="secondary"
						className="flex-1 p-3.5 bg-surface border border-surface-secondary shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-warning/15 items-center justify-center">
							<StyledIcon
								name="trending-up"
								size={18}
								className="text-warning"
							/>
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								Melhor Ciclo
							</Text>
							<Text className="text-lg font-black text-foreground">
								{stats?.bestCycleKm.toFixed(1) || "0.0"}{" "}
								<Text className="text-xs font-bold text-muted">km</Text>
							</Text>
						</View>
					</Card>

					<Card
						variant="secondary"
						className="flex-1 p-3.5 bg-surface border border-surface-secondary shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-danger/15 items-center justify-center">
							<StyledIcon
								name="trending-down"
								size={18}
								className="text-danger"
							/>
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								Pior Ciclo
							</Text>
							<Text className="text-lg font-black text-foreground">
								{stats?.worstCycleKm.toFixed(1) || "0.0"}{" "}
								<Text className="text-xs font-bold text-muted">km</Text>
							</Text>
						</View>
					</Card>
				</View>
			</Animated.View>

			{/* SELETOR DE MÊS (Chips) */}
			<Animated.View
				entering={FadeInDown.delay(400).springify()}
				className="pl-4 pr-0"
			>
				<MonthSelector
					selectedMonth={selectedMonth}
					minDate={minDate}
					maxDate={new Date()}
					onChange={(newDate) => {
						setSelectedMonth(newDate);
						setPage(1);
					}}
				/>
			</Animated.View>

			{/* LISTA DE RECARGAS */}
			<SectionList
				sections={groupedCharges}
				onEndReached={() => {
					if (displayedCharges.length < chargesList.length) {
						setPage((p) => p + 1);
					}
				}}
				onEndReachedThreshold={0.5}
				ListFooterComponent={
					displayedCharges.length < chargesList.length ? (
						<ActivityIndicator size="small" color="#10b981" className="py-3" />
					) : null
				}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-24 gap-2 pt-1"
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					selectedMonth && totalChargesCount > 0 ? (
						<View className="items-center justify-center mt-8 px-6">
							<View className="bg-surface-secondary/60 p-4 rounded-full mb-3 border border-surface-secondary">
								<StyledIcon name="calendar" size={36} className="text-muted" />
							</View>
							<Text className="text-foreground text-center text-base font-bold capitalize">
								Nenhuma recarga em{" "}
								{format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
							</Text>
							<Text className="text-muted text-center text-xs mt-1 px-4 leading-4">
								Não há recargas registradas no mês selecionado.
							</Text>
							<Button
								size="sm"
								variant="secondary"
								className="mt-4 rounded-xl bg-surface-tertiary border-0 px-4"
								onPress={() => setSelectedMonth(null)}
							>
								<Button.Label className="text-info text-xs font-bold">
									Ver todas as recargas
								</Button.Label>
							</Button>
						</View>
					) : (
						<View className="items-center justify-center mt-10 opacity-60">
							<View className="bg-surface-secondary p-4 rounded-full mb-4">
								<StyledIcon name="zap" size={48} className="text-muted" />
							</View>
							<Text className="text-muted text-center text-lg font-bold">
								Nenhuma recarga registrada
							</Text>
							<Text className="text-muted text-center text-sm mt-1 px-10">
								Sempre que recarregar a bateria, adicione aqui para manter o
								controle.
							</Text>
						</View>
					)
				}
				renderSectionHeader={({ section: { title } }) => (
					<View className="bg-background/95 pb-1.5 flex-row items-center gap-1.5">
						<View className="w-1.5 h-1.5 rounded-full bg-info" />
						<Text className="text-[11px] font-bold text-muted capitalize">
							{title}
						</Text>
					</View>
				)}
				renderItem={({ item, index }) => {
					const cycle = stats?.cycles.find((c) => c.chargeLog.id === item.id);
					const autonomia = cycle ? cycle.distance.toFixed(1) : "0.0";
					const gain = chargeGainMap.get(item.id);

					return (
						<Animated.View entering={FadeInRight.delay(index * 40).springify()}>
							<Card
								variant="secondary"
								className="border border-surface-secondary/60 bg-surface shadow-sm p-0 rounded-xl"
							>
								<Pressable
									className="py-2.5 px-3"
									onPress={() => handleEdit(item)}
								>
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-2.5 flex-1">
											<View className="bg-info/10 p-2 rounded-lg border border-info/20">
												<StyledIcon
													name="zap"
													size={15}
													className="text-info"
												/>
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
					className="rounded-full shadow-md bg-success border-0 px-5 py-3 flex-row items-center gap-2 shadow-success/20"
					style={{
						elevation: 3,
						shadowColor: "#10b981",
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.2,
						shadowRadius: 4,
					}}
					onPress={() => {
						setLogToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={18} color="white" />
					<Button.Label className="text-white font-bold text-sm">
						Registrar Recarga
					</Button.Label>
				</Button>
			</Animated.View>

			<ChargeFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				onSaved={refresh}
				onDeleteRequest={(id) => {
					setIsBottomSheetOpen(false);
					setLogToDelete(id);
				}}
				editItem={logToEdit}
				scooter={scooter}
			/>

			<ConfirmDialog
				isOpen={logToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setLogToDelete(null);
				}}
				title="Excluir Recarga"
				description="Tem certeza? A exclusão afeta os cálculos de autonomia da scooter."
				onCancel={() => setLogToDelete(null)}
				onConfirm={() => logToDelete && handleDelete(logToDelete)}
			/>
		</ScreenWrapper>
	);
}
