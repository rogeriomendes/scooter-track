import { EmptyScooterState } from "@/components/EmptyScooterState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { differenceInDays, format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
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

	return (
		<ScreenWrapper scrollable contentContainerClassName="p-4 pb-10">
			{/* HEADER - HERO SECTION (PAINEL DO VEÍCULO) */}
			<Animated.View entering={FadeInDown.delay(100).springify()}>
				<View className="mb-6 rounded-3xl bg-surface border border-surface-secondary overflow-hidden shadow-2xl">
					{/* Gradient Background Subtle Glow */}
					<LinearGradient
						colors={["rgba(16, 185, 129, 0.1)", "rgba(0,0,0,0)"]}
						className="absolute w-full h-full"
					/>

					<View className="p-4 items-center">
						<View className="flex-row items-center justify-between w-full mb-4">
							<View className="flex-row items-center gap-1 flex-1">
								<Text className="text-xl font-bold text-foreground uppercase">
									{scooter.name}
								</Text>
								{totalScooters > 1 && (
									<StyledIcon
										name="chevron-down"
										size={16}
										className="text-success"
									/>
								)}
							</View>
							<Button
								size="sm"
								isIconOnly
								variant="secondary"
								className="rounded-full bg-surface-secondary border-transparent"
								onPress={() => router.push("/(tabs)/settings")}
							>
								<StyledIcon name="settings" size={18} className="text-muted" />
							</Button>
						</View>

						{/* Bateria Gigante */}
						<View className="items-center mb-6 w-full relative">
							{/* Texto com "Glow" Fake via text shadow na fonte (React Native não suporta box-shadow em texto tão fácil, então usamos cor forte) */}
							<Text
								className="text-7xl font-black tracking-tighter"
								style={{
									color: batteryStyles.color,
									textShadowColor: batteryStyles.glow,
									textShadowRadius: 20,
									textShadowOffset: { width: 0, height: 4 },
								}}
							>
								{batteryPercent}%
							</Text>

							{/* Status Dinâmico */}
							<View className="flex-row items-center gap-2 mt-2 bg-default-soft px-3 py-1.5 rounded-full">
								<StyledIcon
									name={smartStatus.icon}
									size={14}
									className={smartStatus.color}
								/>
								<Text className="text-xs font-bold text-foreground">
									{smartStatus.text}
								</Text>
							</View>
						</View>

						{/* Barra de Bateria Espessa */}
						<View className="w-full h-6 bg-surface-secondary rounded-full overflow-hidden mb-4 border border-default-soft">
							<LinearGradient
								colors={batteryStyles.gradient}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								className="h-full rounded-full"
								style={{ width: `${batteryPercent}%` }}
							/>
						</View>

						{/* Autonomia Restante */}
						<View className="flex-row items-center justify-between w-full px-2">
							<View className="flex-row items-center gap-1.5">
								<StyledIcon name="award" size={14} className="text-info" />
								<Text className="text-xs text-muted font-medium">
									Autonomia Estimada
								</Text>
							</View>

							<Text className="text-sm font-bold text-foreground">
								≈ {stats?.estimatedAutonomy.toFixed(0) || "--"} km
							</Text>
						</View>
					</View>
				</View>
			</Animated.View>

			{/* GRID STATS (Resumo do Dia/Ciclo) */}
			<Animated.View entering={FadeInDown.delay(200).springify()}>
				<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider ml-1">
					Uso Atual
				</Text>
				<View className="flex-row gap-3 mb-3">
					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary py-5 shadow-sm"
					>
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
							KM DO CICLO
						</Text>
						<View className="flex-row items-baseline gap-1">
							<Text className="text-3xl font-black text-foreground">
								{stats?.currentCycleKm.toFixed(1) || "0.0"}
							</Text>
							<Text className="text-xs font-bold text-muted">km</Text>
						</View>
						<Text className="text-[10px] text-muted mt-1">
							Desde a última carga
						</Text>
					</Card>

					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary py-5 shadow-sm"
					>
						<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
							ÚLTIMA CARGA
						</Text>
						<Text className="text-2xl font-black text-info">
							{lastChargeText}
						</Text>
						<Text className="text-[10px] text-muted mt-2">
							{stats?.chargesCount || 0} recargas no total
						</Text>
					</Card>
				</View>

				{/* Segunda Linha de Cards (Odômetro e Eficiência) */}
				<View className="flex-row gap-3 mb-6">
					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary p-4 shadow-sm justify-center"
					>
						<View className="flex-row items-center gap-3">
							<View className="bg-success/10 p-3 rounded-xl">
								<StyledIcon
									name="navigation"
									size={18}
									className="text-success"
								/>
							</View>
							<View className="flex-1 justify-center">
								<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
									Odômetro
								</Text>
								<View className="flex-row items-baseline gap-1">
									<Text className="text-xl font-black text-foreground leading-tight">
										{stats?.totalKm.toFixed(0) || "0"}
									</Text>
									<Text className="text-[10px] font-bold text-muted">km</Text>
								</View>
							</View>
						</View>
					</Card>

					<Card
						variant="secondary"
						className="flex-1 bg-surface border border-surface-secondary p-4 shadow-sm justify-center"
					>
						<View className="flex-row items-center gap-3">
							<View className="bg-info/10 p-3 rounded-xl">
								<StyledIcon name="target" size={18} className="text-info" />
							</View>
							<View className="flex-1 justify-center">
								<Text className="text-[10px] font-bold text-muted uppercase tracking-wider mb-0.5">
									Eficiência
								</Text>
								<View className="flex-row items-baseline gap-1">
									<Text className="text-xl font-black text-foreground leading-tight">
										{stats?.averageCycleKm.toFixed(1) || "0.0"}
									</Text>
									<Text className="text-[10px] font-bold text-muted">km/c</Text>
								</View>
							</View>
						</View>
					</Card>
				</View>
			</Animated.View>

			{/* AÇÕES RÁPIDAS (Hierarquia Clara de CTAs) */}
			<Animated.View entering={FadeInDown.delay(300).springify()}>
				<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider ml-1">
					Ações
				</Text>
				<View className="gap-3 mb-6 flex-row w-full">
					<Button
						variant="primary"
						className="flex-1"
						onPress={() => router.push("/(tabs)/trips")}
					>
						<StyledIcon name="play" size={20} className="text-white" />
						<Button.Label className="text-white">Registrar Uso</Button.Label>
					</Button>

					<Button
						variant="secondary"
						className="flex-1"
						onPress={() => router.push("/(tabs)/charges")}
					>
						<StyledIcon name="zap" size={20} className="text-foreground" />
						<Button.Label className="text-foreground">
							Registrar Recarga
						</Button.Label>
					</Button>
				</View>
			</Animated.View>

			{/* ÚLTIMOS USOS */}
			<Animated.View entering={FadeInDown.delay(400).springify()}>
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
										<View className="bg-success/10 p-2 rounded-full">
											<StyledIcon
												name="navigation"
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
		</ScreenWrapper>
	);
}
