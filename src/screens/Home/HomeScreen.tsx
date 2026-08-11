import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Image,
	Pressable,
	Text,
	useColorScheme,
	View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScooterDetailsSheet } from "@/components/ScooterDetailsSheet";
import { ScooterFormSheet } from "@/components/ScooterFormSheet";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, scooters } from "@/db/schema";
import { useMaintenanceHealth } from "@/hooks/useMaintenanceHealth";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { BatteryArc } from "./components/BatteryArc";
import { MonthSummaryCard } from "./components/MonthSummaryCard";
import { ScooterPickerSheet } from "./components/ScooterPickerSheet";
import { WeatherWidget } from "./components/WeatherWidget";

export default function DashboardScreen() {
	const colorScheme = useColorScheme();
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const router = useRouter();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isAddingNew, setIsAddingNew] = useState(false);
	const [editingScooter, setEditingScooter] = useState<
		typeof scooters.$inferSelect | null
	>(null);
	const [scooterToDelete, setScooterToDelete] = useState<number | null>(null);

	const { scooter, allLogs, maintenanceList, stats, totalScooters, isLoading } =
		useScooterData(activeScooterId);

	const healthStats = useMaintenanceHealth(maintenanceList, stats);
	const triggerRefresh = useAppStore((s) => s.triggerRefresh);
	const setActiveScooterId = useAppStore((s) => s.setActiveScooterId);
	const insets = useSafeAreaInsets();

	const executeDeleteScooter = async (id: number) => {
		await db.delete(logs).where(eq(logs.scooterId, id));
		await db.delete(scooters).where(eq(scooters.id, id));
		if (activeScooterId === id) setActiveScooterId(null);
		triggerRefresh();
		setScooterToDelete(null);
	};

	const latestLog = useMemo(
		() => (allLogs.length > 0 ? allLogs[0] : null),
		[allLogs],
	);
	const recentTrips = useMemo(
		() => allLogs.filter((l) => l.type === "trip").slice(0, 3),
		[allLogs],
	);

	const tripConsumptionMap = useMemo(() => {
		const map = new Map<number, { consumedPct: number; consumedValue: number }>();
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

	const batteryPercent = useMemo(() => {
		if (!scooter || !latestLog) return 100;
		if (scooter.trackingMode === "percent") return latestLog.batteryLevel;
		return calculateBatteryPercentage(
			latestLog.batteryLevel,
			scooter.batteryType,
		);
	}, [scooter, latestLog]);

	const batteryStyles = useMemo(() => {
		if (batteryPercent >= 30) {
			return {
				color: "#10b981", // success
				glow: "rgba(16, 185, 129, 0.3)",
				gradient: ["#34d399", "#059669"] as const,
			};
		}
		if (batteryPercent > 15) {
			return {
				color: "#f5a524", // warning
				glow: "rgba(245, 165, 36, 0.3)",
				gradient: ["#f5a524", "#c27d0e"] as const,
			};
		}
		return {
			color: "#f31260", // danger
			glow: "rgba(243, 18, 96, 0.3)",
			gradient: ["#f31260", "#c20e4d"] as const,
		};
	}, [batteryPercent]);

	const smartStatus = useMemo<{
		icon: StyledIcon;
		text: string;
		color: string;
	}>(() => {
		if (batteryPercent >= 90)
			return {
				text: "Pronto para decolar!",
				icon: "check-circle",
				color: "text-success",
			};
		if (batteryPercent >= 30)
			return {
				text: "Tudo certo para o uso.",
				icon: "zap",
				color: "text-info",
			};
		if (batteryPercent > 15)
			return {
				text: "Considere recarregar em breve.",
				icon: "alert-circle",
				color: "text-warning",
			};
		return {
			text: "Bateria muito baixa!",
			icon: "alert-triangle",
			color: "text-danger",
		};
	}, [batteryPercent]);

	const lastChargeText = useMemo(() => {
		if (!stats?.lastChargeDate) return "Sem registros";
		const days = differenceInDays(new Date(), stats.lastChargeDate);
		if (days === 0) return "Hoje";
		if (days === 1) return "Ontem";
		return `Há ${days} dias`;
	}, [stats]);

	if (isLoading) {
		return (
			<ScreenWrapper className="p-6 justify-center items-center">
				<ActivityIndicator size="large" color="#10b981" />
			</ScreenWrapper>
		);
	}

	if (!activeScooterId || !scooter) {
		return <EmptyScooterState />;
	}

	const bottomGradientColor = colorScheme === "dark" ? "#050605" : "#f4f5f4";

	return (
		<ScreenWrapper
			scrollable
			contentContainerClassName="pb-10"
			style={{ paddingTop: 0 }}
		>
			{/* HEADER - HERO SECTION EDGE-TO-EDGE */}
			<View
				className="relative w-full overflow-hidden"
				// style={{ paddingBottom: 24 }}
			>
				{/* Background Image / Gradient */}
				<Image
					source={require("../../../assets/images/hero_scooter.png")}
					className="absolute w-full h-100 opacity-20"
					resizeMode="cover"
					style={{ top: 0 }}
				/>
				<LinearGradient
					colors={["rgba(16, 185, 129, 0.15)", bottomGradientColor]}
					className="absolute w-full h-full"
				/>

				<View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16 }}>
					{/* Header Row */}
					<View className="flex-row items-center justify-between w-full mb-6 z-10">
						<View className="flex-row items-center flex-1 gap-2 mr-2">
							<Pressable
								className="flex-row items-center gap-2 py-1 shrink"
								onPress={() => setIsPickerOpen(true)}
							>
								<Text
									className="text-xl font-bold text-foreground uppercase tracking-widest"
									numberOfLines={1}
								>
									{scooter.name}
								</Text>
								<StyledIcon
									name="chevron-down"
									size={16}
									className="text-success"
								/>
							</Pressable>
						</View>
						<View className="flex-row items-center gap-2 ml-2">
							<Button
								size="sm"
								isIconOnly
								variant="secondary"
								className="rounded-full bg-surface-secondary/50 backdrop-blur-md border-transparent"
								onPress={() => {
									setIsDetailsOpen(true);
								}}
							>
								<StyledIcon name="file-text" size={18} className="text-muted" />
							</Button>
							<Button
								size="sm"
								isIconOnly
								variant="secondary"
								className="rounded-full bg-surface-secondary/50 backdrop-blur-md border-transparent"
								onPress={() => {
									router.push("/settings");
								}}
							>
								<StyledIcon name="settings" size={18} className="text-muted" />
							</Button>
						</View>
					</View>
					{/* Arc Battery Indicator */}
					<View className="items-center w-full z-10 mb-2">
						<BatteryArc
							percentage={batteryPercent}
							color={batteryStyles.color}
							glowColor={batteryStyles.glow}
							statusIcon={smartStatus.icon}
							statusText={smartStatus.text}
							statusColor={smartStatus.color}
						/>
					</View>
					{/* ESTATÍSTICAS RÁPIDAS (DASHBOARD GRID 2x2) */}
					<View className="mt-2 px-1 z-10 gap-2 w-full">
						<View className="flex-row gap-2">
							<Card
								variant="secondary"
								className="flex-1 p-3 bg-surface/90 border border-surface-secondary/80 shadow-sm rounded-2xl flex-row items-center gap-2.5"
							>
								<View className="w-8 h-8 rounded-xl bg-info/15 items-center justify-center">
									<StyledIcon name="clock" size={16} className="text-info" />
								</View>
								<View className="flex-1">
									<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
										Última Carga
									</Text>
									<Text className="text-sm font-black text-foreground" numberOfLines={1}>
										{lastChargeText}
									</Text>
								</View>
							</Card>

							<Card
								variant="secondary"
								className="flex-1 p-3 bg-surface/90 border border-surface-secondary/80 shadow-sm rounded-2xl flex-row items-center gap-2.5"
							>
								<View className="w-8 h-8 rounded-xl bg-success/15 items-center justify-center">
									<StyledIcon name="activity" size={16} className="text-success" />
								</View>
								<View className="flex-1">
									<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
										Ciclo Atual
									</Text>
									<Text className="text-sm font-black text-foreground">
										{stats?.currentCycleKm.toFixed(1) || "0.0"}{" "}
										<Text className="text-xs font-bold text-muted">km</Text>
									</Text>
								</View>
							</Card>
						</View>

						<View className="flex-row gap-2">
							<Card
								variant="secondary"
								className="flex-1 p-3 bg-surface/90 border border-surface-secondary/80 shadow-sm rounded-2xl flex-row items-center gap-2.5"
							>
								<View className="w-8 h-8 rounded-xl bg-accent/15 items-center justify-center">
									<StyledIcon name="map-pin" size={16} className="text-accent" />
								</View>
								<View className="flex-1">
									<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
										KM Total
									</Text>
									<Text className="text-sm font-black text-foreground">
										{stats?.totalKm.toFixed(0) || "0"}{" "}
										<Text className="text-xs font-bold text-muted">km</Text>
									</Text>
								</View>
							</Card>

							<Card
								variant="secondary"
								className="flex-1 p-3 bg-surface/90 border border-surface-secondary/80 shadow-sm rounded-2xl flex-row items-center gap-2.5"
							>
								<View className="w-8 h-8 rounded-xl bg-warning/15 items-center justify-center">
									<StyledIcon name="zap" size={16} className="text-warning" />
								</View>
								<View className="flex-1">
									<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
										Eficiência
									</Text>
									<Text className="text-sm font-black text-foreground">
										{stats?.averageCycleKm.toFixed(1) || "0.0"}{" "}
										<Text className="text-xs font-bold text-muted">km/c</Text>
									</Text>
								</View>
							</Card>
						</View>
					</View>
				</View>
			</View>

			<View className="px-4 mt-4">
				<WeatherWidget />

				<MonthSummaryCard allLogs={allLogs} />

				{/* AÇÕES RÁPIDAS (Hierarquia Clara de CTAs) */}
				<Animated.View entering={FadeInDown.delay(300).springify()}>
					<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider ml-1">
						Ações
					</Text>
					<View className="gap-3 mb-4 flex-row w-full">
						<Button
							variant="primary"
							className="flex-1"
							onPress={() => router.push("/(tabs)/trips")}
						>
							<StyledIcon name="map-pin" size={20} className="text-white" />
							<Button.Label className="text-white">Uso</Button.Label>
						</Button>

						<Button
							variant="secondary"
							className="flex-1"
							onPress={() => router.push("/(tabs)/charges")}
						>
							<StyledIcon name="zap" size={20} className="text-foreground" />
							<Button.Label className="text-foreground">Recarga</Button.Label>
						</Button>

						{scooter?.invoicePdfPath && (
							<Button
								variant="secondary"
								isIconOnly
								onPress={async () => {
									if (scooter.invoicePdfPath) {
										await Sharing.shareAsync(scooter.invoicePdfPath);
									}
								}}
							>
								<StyledIcon name="file-text" size={20} className="text-info" />
							</Button>
						)}
					</View>
				</Animated.View>

				{/* PRÓXIMA REVISÃO (Só exibe se a scooter tiver manutenção ativada e houver item próximo) */}
				{scooter?.showMaintenance &&
					healthStats.nextItem &&
					healthStats.isPriorityActive && (
						<Animated.View entering={FadeInDown.delay(300).springify()}>
							<Pressable onPress={() => router.push("/(tabs)/maintenance")}>
								<Card
									variant="secondary"
									className="bg-warning/10 border border-warning/30 p-4 mb-4 flex-row items-center"
								>
									<View className="bg-warning/20 p-3 rounded-full mr-4">
										<StyledIcon
											name="alert-triangle"
											size={24}
											className="text-warning"
										/>
									</View>
									<View className="flex-1">
										<Text className="text-xs font-bold text-warning uppercase tracking-wider mb-1">
											Atenção: Revisão Próxima
										</Text>
										<Text className="text-base font-bold text-foreground">
											{healthStats.nextItem.name}
										</Text>
										<Text className="text-sm text-muted">
											Faltam {healthStats.nextItemInfo.primary}{" "}
											{healthStats.nextItemInfo.secondary}
										</Text>
									</View>
									<StyledIcon
										name="chevron-right"
										size={20}
										className="text-muted"
									/>
								</Card>
							</Pressable>
						</Animated.View>
					)}

				{/* HISTÓRICO RECENTE */}
				<Animated.View
					entering={FadeInDown.delay(
						scooter?.showMaintenance &&
							healthStats.nextItem &&
							healthStats.isPriorityActive
							? 400
							: 300,
					).springify()}
				>
					<View className="flex-row justify-between items-center mb-3 ml-1">
						<Text className="text-xs font-bold text-muted uppercase tracking-wider">
							Últimos Usos
						</Text>
						{recentTrips.length > 0 && (
							<Button
								size="sm"
								variant="secondary"
								className="bg-transparent border-0 px-0 h-auto"
								onPress={() => router.push("/(tabs)/trips")}
							>
								<Button.Label className="text-success text-xs font-bold">
									Ver todos
								</Button.Label>
							</Button>
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
									<Card
										key={trip.id}
										variant="secondary"
										className="border border-surface-secondary/60 bg-surface shadow-sm p-0 rounded-xl"
									>
										<Pressable
											className="py-2.5 px-3"
											onPress={() => router.push("/(tabs)/trips")}
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
																{trip.distance.toFixed(1)}
															</Text>
															<Text className="font-bold text-muted text-xs">km</Text>
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
																	<Text className="text-[9px] font-bold text-danger">
																		-{consumption.consumedPct}%
																	</Text>
																</View>
															)}
														</View>
													</View>
												</View>

												<View className="bg-surface-tertiary px-2 py-0.5 rounded-md">
													<Text className="text-[10px] text-muted font-bold">
														{format(trip.date, "dd/MM • HH:mm", { locale: ptBR })}
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
							})
						)}
					</View>
				</Animated.View>
			</View>

			<ScooterPickerSheet
				isOpen={isPickerOpen}
				onOpenChange={setIsPickerOpen}
				onAddRequest={() => {
					setIsPickerOpen(false);
					setIsAddingNew(true);
					setIsFormOpen(true);
				}}
				onEditRequest={(itemToEdit) => {
					setEditingScooter(itemToEdit);
					setIsAddingNew(false);
					setIsFormOpen(true);
				}}
			/>

			<ScooterDetailsSheet
				isOpen={isDetailsOpen}
				onOpenChange={setIsDetailsOpen}
				scooter={scooter}
				totalKm={stats?.totalKm}
				onEditRequest={() => {
					setIsDetailsOpen(false);
					setEditingScooter(scooter);
					setIsAddingNew(false);
					setIsFormOpen(true);
				}}
			/>

			<ScooterFormSheet
				isOpen={isFormOpen}
				onOpenChange={setIsFormOpen}
				editItem={isAddingNew ? null : (editingScooter || scooter)}
				onSaved={() => {
					setEditingScooter(null);
					triggerRefresh();
				}}
				onDeleteRequest={(id) => {
					setIsFormOpen(false);
					setScooterToDelete(id);
				}}
			/>

			{/* Excluir Scooter Dialog */}
			<ConfirmDialog
				isOpen={scooterToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setScooterToDelete(null);
				}}
				title="Excluir Scooter"
				description="Tem certeza? Todos os usos e recargas desta scooter também serão perdidos permanentemente."
				onCancel={() => setScooterToDelete(null)}
				onConfirm={() =>
					scooterToDelete && executeDeleteScooter(scooterToDelete)
				}
			/>
		</ScreenWrapper>
	);
}
