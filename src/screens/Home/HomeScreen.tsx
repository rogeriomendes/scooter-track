import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { differenceInDays, format } from "date-fns";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useMemo, useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DashboardScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const router = useRouter();

	const { scooter, allLogs, stats, totalScooters, isLoading } =
		useScooterData(activeScooterId);

	const latestLog = useMemo(
		() => (allLogs.length > 0 ? allLogs[0] : null),
		[allLogs],
	);
	const recentTrips = useMemo(
		() => allLogs.filter((l) => l.type === "trip").slice(0, 3),
		[allLogs],
	);

	const [alertDismissed, setAlertDismissed] = useState(false);

	const batteryPercent = useMemo(() => {
		if (!scooter || !latestLog) return 100;
		return calculateBatteryPercentage(
			latestLog.batteryLevel,
			scooter.batteryType,
		);
	}, [scooter, latestLog]);

	const lastChargeDays = stats?.lastChargeDate
		? differenceInDays(new Date(), stats.lastChargeDate)
		: null;
	const goalPercentage = stats?.estimatedAutonomy
		? Math.min(
				100,
				Math.round((stats.currentCycleKm / stats.estimatedAutonomy) * 100),
			)
		: 0;

	const isBatteryLow = goalPercentage >= 80;
	const showLowBatteryAlert = isBatteryLow && !alertDismissed;

	if (isLoading) {
		return (
			<ScreenWrapper className="p-6 justify-center items-center">
				<ActivityIndicator size="large" color="#10b981" />
			</ScreenWrapper>
		);
	}

	if (!activeScooterId || !scooter) {
		return (
			<ScreenWrapper className="p-6">
				<Text className="text-xl font-bold text-foreground">Início</Text>
				<Text className="text-muted mt-4">
					Nenhuma scooter ativa selecionada. Vá em configurações para adicionar
					uma scooter.
				</Text>
			</ScreenWrapper>
		);
	}

	return (
		<ScreenWrapper scrollable contentContainerClassName="p-4 pb-10">
			{/* HEADER */}
			<View className="flex-row justify-between items-start mb-6">
				<View>
					<Text className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
						DASHBOARD
					</Text>
					<View className="flex-row items-center gap-1">
						<Text className="text-3xl font-bold text-foreground">
							{scooter.name}
						</Text>
						{totalScooters > 1 && (
							<StyledIcon
								name="chevron-down"
								size={24}
								className="text-success"
							/>
						)}
					</View>
				</View>
				<Button
					size="md"
					isIconOnly
					variant="outline"
					className="rounded-full shadow-lg"
					onPress={() => router.push("/(tabs)/charges")}
				>
					<StyledIcon name="zap" size={24} className="text-info" />
				</Button>
			</View>

			{/* BATTERY CARD */}
			<Animated.View entering={FadeInDown.delay(100).springify()}>
				<Card
					variant="secondary"
					className="border-2 border-success/30 bg-surface mb-3"
				>
					<View className="flex-row justify-between items-center mb-2">
						<Text className="text-sm font-bold text-muted">
							Bateria estimada
						</Text>
						<Text className="text-xl font-black text-success">
							{batteryPercent}%
						</Text>
					</View>
					<View className="h-4 bg-surface-secondary rounded-full mb-3 overflow-hidden">
						<LinearGradient
							colors={["#4ade80", "#16a34a"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							className="h-full rounded-full"
							style={{ width: `${batteryPercent}%` }}
						/>
					</View>
					<View className="flex-row justify-between">
						<Text className="text-[10px] text-muted">
							{stats?.currentCycleKm.toFixed(1) || "0.0"} km desde última carga
						</Text>
						<Text className="text-[10px] text-muted">
							Autonomia est. {stats?.estimatedAutonomy.toFixed(0) || "0"} km
						</Text>
					</View>
				</Card>
			</Animated.View>

			{/* GOAL CARD */}
			<Animated.View entering={FadeInDown.delay(200).springify()}>
				<Card
					variant="secondary"
					className="border-2 border-info/30 bg-surface mb-4"
				>
					<View className="flex-row justify-between items-center mb-2">
						<View className="flex-row items-center gap-2">
							<StyledIcon name="award" size={14} className="text-info" />
							<Text className="text-sm font-bold text-muted">
								Meta de autonomia
							</Text>
						</View>
						<Text className="text-xl font-black text-accent">
							{goalPercentage}%
						</Text>
					</View>
					<View className="h-3 bg-surface-secondary rounded-full mb-3 overflow-hidden">
						<LinearGradient
							colors={["#60a5fa", "#2563eb"]}
							start={{ x: 0, y: 0 }}
							end={{ x: 1, y: 0 }}
							className="h-full rounded-full"
							style={{ width: `${goalPercentage}%` }}
						/>
					</View>
					<View className="flex-row justify-between">
						<Text className="text-[10px] text-muted">
							{stats?.currentCycleKm.toFixed(1) || "0.0"} km neste ciclo
						</Text>
						<Text className="text-[10px] text-muted">
							Meta: {stats?.estimatedAutonomy.toFixed(0) || "0"} km
						</Text>
					</View>
				</Card>
			</Animated.View>

			{/* GRID STATS */}
			<Animated.View entering={FadeInDown.delay(300).springify()}>
				<View className="flex-row gap-3 mb-3">
					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary py-5"
					>
						<View className="bg-surface-secondary self-start p-2 rounded-xl mb-3">
							<StyledIcon
								name="navigation"
								size={18}
								className="text-success"
							/>
						</View>
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
							KM TOTAL
						</Text>
						<View className="flex-row items-baseline gap-1">
							<Text className="text-3xl font-black text-success">
								{stats?.totalKm.toFixed(0) || "0"}
							</Text>
							<Text className="text-xs text-muted font-bold">km</Text>
						</View>
					</Card>

					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary py-5"
					>
						<View className="bg-surface-secondary self-start p-2 rounded-xl mb-3">
							<StyledIcon name="zap" size={18} className="text-info" />
						</View>
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
							ÚLTIMA CARGA
						</Text>
						<Text className="text-2xl font-black text-info">
							{lastChargeDays !== null
								? `há ${lastChargeDays} dia${lastChargeDays === 1 ? "" : "s"}`
								: "N/A"}
						</Text>
					</Card>
				</View>
			</Animated.View>

			<Animated.View entering={FadeInDown.delay(400).springify()}>
				<View className="flex-row gap-3 mb-3">
					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary py-5"
					>
						<View className="bg-surface-secondary self-start p-2 rounded-xl mb-3">
							<StyledIcon name="battery" size={18} className="text-success" />
						</View>
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
							AUTONOMIA EST.
						</Text>
						<Text className="text-2xl font-black text-success mb-1">
							{stats?.estimatedAutonomy.toFixed(0) || "--"}
						</Text>
						<Text className="text-[10px] text-muted">
							{stats?.averageCycleKm ? "Baseada no uso" : "Meta cadastrada"}
						</Text>
					</Card>

					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary py-5"
					>
						<View className="bg-surface-secondary self-start p-2 rounded-xl mb-3">
							<StyledIcon
								name="refresh-cw"
								size={18}
								className="text-warning"
							/>
						</View>
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
							RECARGAS
						</Text>
						<Text className="text-2xl font-black text-warning mb-1">
							{stats?.chargesCount || 0}
						</Text>
						<Text className="text-[10px] text-muted">
							{stats?.tripsCount || 0} uso(s)
						</Text>
					</Card>
				</View>
			</Animated.View>

			{/* AÇÕES RÁPIDAS */}
			<Animated.View entering={FadeInDown.delay(500).springify()}>
				<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
					Ações Rápidas
				</Text>
				<View className="flex-row gap-3 mb-4">
					<Card
						variant="secondary"
						className="flex-1 bg-success/5 border border-success p-0"
					>
						<Button
							variant="secondary"
							className="bg-transparent h-24 flex-col justify-center items-center gap-2"
							onPress={() => router.push("/(tabs)/trips")}
						>
							<View className="bg-success p-2 rounded-full">
								<StyledIcon name="plus" size={16} className="text-white" />
							</View>
							<Text className="text-success font-bold text-sm">
								Registrar uso
							</Text>
						</Button>
					</Card>

					<Card
						variant="secondary"
						className="flex-1 bg-info/5 border border-info p-0"
					>
						<Button
							variant="secondary"
							className="bg-transparent h-24 flex-col justify-center items-center gap-2"
							onPress={() => router.push("/(tabs)/charges")}
						>
							<StyledIcon name="zap" size={24} className="text-info" />
							<Text className="text-info font-bold text-sm">
								Registrar recarga
							</Text>
						</Button>
					</Card>
				</View>
			</Animated.View>

			{/* ÚLTIMOS USOS */}
			<Animated.View entering={FadeInDown.delay(600).springify()}>
				<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
					Últimos Usos
				</Text>
				<View className="gap-3 mb-4">
					{recentTrips.length === 0 ? (
						<Text className="text-center text-muted">
							Nenhum uso registrado recentemente.
						</Text>
					) : (
						recentTrips.map((trip) => (
							<Card
								key={trip.id}
								variant="secondary"
								className="bg-surface border border-surface-secondary"
							>
								<View className="flex-row items-center justify-between">
									<View className="flex-row items-center gap-3">
										<StyledIcon
											name="navigation"
											size={18}
											className="text-success"
										/>
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
										<Text className="text-xs text-muted">{trip.notes}</Text>
									) : null}
								</View>
							</Card>
						))
					)}
				</View>
			</Animated.View>

			<Modal
				visible={showLowBatteryAlert}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setAlertDismissed(true)}
			>
				<BlurView
					intensity={80}
					tint="dark"
					className="flex-1 justify-center items-center p-6"
				>
					<Animated.View entering={FadeInDown.springify()} className="w-full">
						<Card
							variant="secondary"
							className="bg-surface border-2 border-danger shadow-xl p-6"
						>
							<View className="items-center mb-4">
								<View className="bg-danger/20 p-4 rounded-full mb-3">
									<StyledIcon
										name="battery"
										size={48}
										className="text-danger"
									/>
								</View>
								<Text className="text-2xl font-black text-foreground text-center">
									Bateria Baixa!
								</Text>
								<Text className="text-muted text-center mt-2">
									Sua scooter já rodou {stats?.currentCycleKm.toFixed(1)} km
									desde a última recarga. Isso representa {goalPercentage}% da
									autonomia estimada.
								</Text>
								<Text className="text-foreground font-bold text-center mt-4">
									Considere recarregar em breve para evitar ficar na mão.
								</Text>
							</View>
							<Button
								variant="primary"
								className="w-full bg-danger"
								onPress={() => setAlertDismissed(true)}
							>
								<Button.Label className="text-white font-bold">
									Ciente, obrigado!
								</Button.Label>
							</Button>
						</Card>
					</Animated.View>
				</BlurView>
			</Modal>
		</ScreenWrapper>
	);
}
