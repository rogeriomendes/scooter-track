import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScooterFormSheet } from "@/components/ScooterFormSheet";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, scooters } from "@/db/schema";
import { useMaintenanceHealth } from "@/hooks/useMaintenanceHealth";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { differenceInDays, format } from "date-fns";
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
import { BatteryArc } from "./components/BatteryArc";
import { ScooterPickerSheet } from "./components/ScooterPickerSheet";
import { UsageSparkline } from "./components/UsageSparkline";
import { WeatherWidget } from "./components/WeatherWidget";

export default function DashboardScreen() {
	const colorScheme = useColorScheme();
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const router = useRouter();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isAddingNew, setIsAddingNew] = useState(false);
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
									setIsAddingNew(false);
									setIsFormOpen(true);
								}}
							>
								<StyledIcon name="edit-2" size={18} className="text-white" />
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
					{/* INDICADORES LIMPOS (2 Linhas de Estatísticas) */}
					<View className="items-center mt-4 px-4 z-10 gap-y-2 w-full">
						{/* Primeira Linha: Carga e Ciclo */}
						<View className="flex-row justify-center items-center w-full">
							<View className="flex-1 flex-row items-center justify-end gap-1.5">
								<StyledIcon name="clock" size={14} className="text-info" />
								<Text className="text-xs font-bold text-muted uppercase">
									Carga:{" "}
									<Text className="text-foreground">{lastChargeText}</Text>
								</Text>
							</View>

							<View className="w-8 items-center">
								<Text className="text-muted/50">•</Text>
							</View>

							<View className="flex-1 flex-row items-center justify-start gap-1.5">
								<StyledIcon
									name="activity"
									size={14}
									className="text-success"
								/>
								<Text className="text-xs font-bold text-muted uppercase">
									Ciclo:{" "}
									<Text className="text-foreground">
										{stats?.currentCycleKm.toFixed(1) || "0.0"}km
									</Text>
								</Text>
							</View>
						</View>

						{/* Segunda Linha: Total e Eficiência */}
						<View className="flex-row justify-center items-center w-full">
							<View className="flex-1 flex-row items-center justify-end gap-1.5">
								<StyledIcon name="map-pin" size={14} className="text-primary" />
								<Text className="text-xs font-bold text-muted uppercase">
									Total:{" "}
									<Text className="text-foreground">
										{stats?.totalKm.toFixed(0) || "0"}km
									</Text>
								</Text>
							</View>

							<View className="w-8 items-center">
								<Text className="text-muted/50">•</Text>
							</View>

							<View className="flex-1 flex-row items-center justify-start gap-1.5">
								<StyledIcon name="zap" size={14} className="text-warning" />
								<Text className="text-xs font-bold text-muted uppercase">
									Efic:{" "}
									<Text className="text-foreground">
										{stats?.averageCycleKm.toFixed(1) || "0.0"}km/c
									</Text>
								</Text>
							</View>
						</View>
					</View>
				</View>
			</View>

			<View className="px-4 mt-9">
				<WeatherWidget />

				<UsageSparkline trips={allLogs.filter((l) => l.type === "trip")} />

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

					<View className="gap-3 mb-4">
						{recentTrips.length === 0 ? (
							<Text className="text-center text-muted mt-2">
								Nenhum uso registrado recentemente.
							</Text>
						) : (
							recentTrips.map((trip) => (
								<Card
									key={trip.id}
									variant="secondary"
									className="bg-surface border border-surface-secondary shadow-sm"
								>
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-3">
											<View className="bg-success/10 p-2 rounded-xl border border-success/20">
												<StyledIcon
													name="map-pin"
													size={16}
													className="text-success"
												/>
											</View>
											<View>
												<Text className="text-base font-bold text-foreground">
													{trip.distance} km
												</Text>
												<Text className="text-[10px] text-muted">
													{format(trip.date, "dd/MM/yyyy")}
												</Text>
											</View>
										</View>
										{trip.notes ? (
											<Text
												className="text-xs text-muted flex-1 text-right ml-4"
												numberOfLines={1}
											>
												{trip.notes}
											</Text>
										) : null}
									</View>
								</Card>
							))
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
			/>

			<ScooterFormSheet
				isOpen={isFormOpen}
				onOpenChange={setIsFormOpen}
				editItem={isAddingNew ? null : scooter}
				onSaved={() => triggerRefresh()}
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
