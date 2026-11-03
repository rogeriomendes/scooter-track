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
import { TripFormSheet } from "./components/TripFormSheet";

export default function TripsScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, refresh, isLoading } =
		useScooterData(activeScooterId);

	const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
	const [page, setPage] = useState(1);
	const itemsPerPage = 30; // Increased since we use section list

	const totalTripsCount = useMemo(
		() => allLogs.filter((l) => l.type === "trip").length,
		[allLogs],
	);

	const tripsList = useMemo(() => {
		return allLogs.filter((l) => {
			if (l.type !== "trip") return false;
			if (!selectedMonth) return true;
			const logDate = new Date(l.date);
			return (
				logDate.getMonth() === selectedMonth.getMonth() &&
				logDate.getFullYear() === selectedMonth.getFullYear()
			);
		});
	}, [allLogs, selectedMonth]);

	const dashboardStats = useMemo(() => {
		if (tripsList.length === 0)
			return { totalKm: 0, avgKm: 0, maxKm: 0, activeDays: 0, tripCount: 0 };

		let totalKm = 0;
		let maxKm = 0;
		const uniqueDays = new Set<string>();

		for (const trip of tripsList) {
			totalKm += trip.distance;
			if (trip.distance > maxKm) maxKm = trip.distance;
			uniqueDays.add(format(new Date(trip.date), "yyyy-MM-dd"));
		}

		const activeDays = uniqueDays.size;
		const avgKm = activeDays > 0 ? totalKm / activeDays : 0;

		return { totalKm, avgKm, maxKm, activeDays, tripCount: tripsList.length };
	}, [tripsList]);

	const displayedTrips = useMemo(
		() => tripsList.slice(0, page * itemsPerPage),
		[tripsList, page],
	);

	const groupedTrips = useMemo(() => {
		const groups: { title: string; data: (typeof logs.$inferSelect)[] }[] = [];
		const currentYear = new Date().getFullYear();

		for (const trip of displayedTrips) {
			const tripDate = new Date(trip.date);
			const groupTitle =
				tripDate.getFullYear() === currentYear
					? format(tripDate, "MMMM", { locale: ptBR })
					: format(tripDate, "MMMM 'de' yyyy", { locale: ptBR });

			const existingGroup = groups.find((g) => g.title === groupTitle);
			if (existingGroup) {
				existingGroup.data.push(trip);
			} else {
				groups.push({ title: groupTitle, data: [trip] });
			}
		}
		return groups;
	}, [displayedTrips]);

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

	const tripConsumptionMap = useMemo(() => {
		const map = new Map<
			number,
			{ consumedPct: number; consumedValue: number }
		>();
		if (!scooter) return map;
		const ascLogs = [...allLogs].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		let prevBatteryLevel: number | null = null;

		for (const log of ascLogs) {
			if (log.type === "trip") {
				if (prevBatteryLevel !== null && prevBatteryLevel > log.batteryLevel) {
					const diff = prevBatteryLevel - log.batteryLevel;
					let consumedPct = diff;
					if (scooter.trackingMode === "voltage") {
						const prevPct = calculateBatteryPercentage(
							prevBatteryLevel,
							scooter.batteryType,
						);
						const currPct = calculateBatteryPercentage(
							log.batteryLevel,
							scooter.batteryType,
						);
						consumedPct = Math.max(0, prevPct - currPct);
					}
					map.set(log.id, {
						consumedPct: Math.round(consumedPct),
						consumedValue: diff,
					});
				}
				prevBatteryLevel = log.batteryLevel;
			} else if (log.type === "charge") {
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
				title="Usos"
				description="Adicione uma scooter primeiro para registrar viagens."
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
				Usos
			</Animated.Text>

			{/* ESTATÍSTICAS RÁPIDAS (DASHBOARD GRID 2x2) */}
			<Animated.View
				entering={FadeInDown.delay(300).springify()}
				className="px-4 mb-3 mt-1 gap-2"
			>
				<View className="flex-row gap-2">
					<Card
						variant="default"
						className="flex-1 p-3.5 bg-surface border border-border shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-success/15 items-center justify-center">
							<StyledIcon name="map-pin" size={18} className="text-success" />
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								{selectedMonth ? "Total Mês" : "Total Geral"}
							</Text>
							<Text className="text-lg font-black text-foreground">
								{dashboardStats.totalKm.toFixed(1)}{" "}
								<Text className="text-xs font-bold text-muted">km</Text>
							</Text>
						</View>
					</Card>

					<Card
						variant="default"
						className="flex-1 p-3.5 bg-surface border border-border shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-accent/15 items-center justify-center">
							<StyledIcon
								name="bar-chart-2"
								size={18}
								className="text-accent"
							/>
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								Média / Dia
							</Text>
							<Text className="text-lg font-black text-foreground">
								{dashboardStats.avgKm.toFixed(1)}{" "}
								<Text className="text-xs font-bold text-muted">km</Text>
							</Text>
						</View>
					</Card>
				</View>

				<View className="flex-row gap-2">
					<Card
						variant="default"
						className="flex-1 p-3.5 bg-surface border border-border shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-warning/15 items-center justify-center">
							<StyledIcon name="award" size={18} className="text-warning" />
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								Recorde
							</Text>
							<Text className="text-lg font-black text-foreground">
								{dashboardStats.maxKm.toFixed(1)}{" "}
								<Text className="text-xs font-bold text-muted">km</Text>
							</Text>
						</View>
					</Card>

					<Card
						variant="default"
						className="flex-1 p-3.5 bg-surface border border-border shadow-sm rounded-2xl flex-row items-center gap-3"
					>
						<View className="w-9 h-9 rounded-xl bg-info/15 items-center justify-center">
							<StyledIcon name="hash" size={18} className="text-info" />
						</View>
						<View className="flex-1">
							<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
								Viagens
							</Text>
							<Text className="text-lg font-black text-foreground">
								{dashboardStats.tripCount}
							</Text>
						</View>
					</Card>
				</View>
			</Animated.View>

			{/* SELETOR DE MÊS */}
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

			{/* LISTA E DASHBOARD AGRUPADO */}
			<SectionList
				sections={groupedTrips}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-24 gap-2 pt-1"
				showsVerticalScrollIndicator={false}
				onEndReached={() => {
					if (displayedTrips.length < tripsList.length) {
						setPage((p) => p + 1);
					}
				}}
				onEndReachedThreshold={0.5}
				ListFooterComponent={
					displayedTrips.length < tripsList.length ? (
						<ActivityIndicator size="small" color="#10b981" className="py-3" />
					) : undefined
				}
				ListEmptyComponent={
					selectedMonth && totalTripsCount > 0 ? (
						<View className="items-center justify-center mt-8 px-6">
							<View className="bg-surface-secondary/60 p-4 rounded-full mb-3 border border-surface-secondary">
								<StyledIcon name="calendar" size={36} className="text-muted" />
							</View>
							<Text className="text-foreground text-center text-base font-bold capitalize">
								Nenhum uso em{" "}
								{format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
							</Text>
							<Text className="text-muted text-center text-xs mt-1 px-4 leading-4">
								Não há viagens registradas no mês selecionado.
							</Text>
							<Button
								size="sm"
								variant="secondary"
								className="mt-4 rounded-xl bg-surface-tertiary border-0 px-4"
								onPress={() => setSelectedMonth(null)}
							>
								<Button.Label className="text-success text-xs font-bold">
									Ver todos os usos
								</Button.Label>
							</Button>
						</View>
					) : (
						<View className="items-center justify-center mt-6 opacity-60">
							<View className="bg-surface-secondary p-4 rounded-full mb-4">
								<StyledIcon name="map-pin" size={48} className="text-muted" />
							</View>
							<Text className="text-muted text-center text-lg font-bold">
								Nenhum uso registrado
							</Text>
							<Text className="text-muted text-center text-sm mt-1 px-10">
								Suas viagens aparecerão aqui para ajudar a calcular a autonomia
								real.
							</Text>
						</View>
					)
				}
				renderSectionHeader={({ section: { title } }) => (
					<View className="bg-background/95 pb-1.5 flex-row items-center gap-1.5">
						<View className="w-1.5 h-1.5 rounded-full bg-success" />
						<Text className="text-xs font-bold text-muted uppercase tracking-wider">
							{title}
						</Text>
					</View>
				)}
				renderItem={({ item, index }) => {
					const consumption = tripConsumptionMap.get(item.id);

					return (
						<Animated.View entering={FadeInRight.delay(index * 40).springify()}>
							<Card
								variant="default"
								className="border border-border bg-surface shadow-sm p-0 rounded-xl"
							>
								<Pressable
									className="py-2.5 px-3"
									onPress={() => handleEdit(item)}
								>
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-2.5 flex-1">
											<View className="bg-success/10 p-2 rounded-lg border border-success/20">
												<StyledIcon
													name="map-pin"
													size={15}
													className="text-success"
												/>
											</View>
											<View className="flex-1">
												<View className="flex-row items-baseline gap-1">
													<Text className="text-base font-black text-foreground">
														{item.distance.toFixed(1)}
													</Text>
													<Text className="font-bold text-muted text-xs">
														km
													</Text>
												</View>
												<View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
													<View className="flex-row items-center gap-1">
														<StyledIcon
															name="battery"
															size={10}
															className="text-muted"
														/>
														<Text className="text-[11px] font-semibold text-muted">
															Final:{" "}
															<Text className="text-foreground font-bold">
																{item.batteryLevel}
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
					className="rounded-full shadow-md px-5 py-3 flex-row items-center gap-2"
					onPress={() => {
						setLogToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={18} className="text-white" />
					<Button.Label className="text-white font-bold text-sm">
						Registrar Uso
					</Button.Label>
				</Button>
			</Animated.View>

			<TripFormSheet
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
				title="Excluir Uso"
				description="Tem certeza? A exclusão afeta os cálculos de autonomia da scooter."
				onCancel={() => setLogToDelete(null)}
				onConfirm={() => logToDelete && handleDelete(logToDelete)}
			/>
		</ScreenWrapper>
	);
}
