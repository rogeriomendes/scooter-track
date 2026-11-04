import { differenceInDays } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "heroui-native/button";
import { useMemo } from "react";
import { Image, Pressable, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatCard } from "@/components/StatCard";
import { StatGrid } from "@/components/StatGrid";
import { StyledIcon } from "@/components/StyledIcon";
import type { scooters } from "@/db/schema";
import type { calculateScooterStats } from "@/utils/stats";
import { BatteryArc } from "./BatteryArc";

export interface DashboardHeroProps {
	scooter: typeof scooters.$inferSelect;
	batteryPercent: number;
	latestBatteryLevel?: number;
	stats: ReturnType<typeof calculateScooterStats> | null;
	badgeCount: number;
	onOpenPicker: () => void;
	onOpenBadges: () => void;
	onOpenDetails: () => void;
	onOpenSettings: () => void;
}

export function DashboardHero({
	scooter,
	batteryPercent,
	latestBatteryLevel,
	stats,
	badgeCount,
	onOpenPicker,
	onOpenBadges,
	onOpenDetails,
	onOpenSettings,
}: DashboardHeroProps) {
	const colorScheme = useColorScheme();
	const insets = useSafeAreaInsets();
	const bottomGradientColor = colorScheme === "dark" ? "#050605" : "#f4f5f4";

	const batteryStyles = useMemo(() => {
		if (batteryPercent >= 30) {
			return {
				color: "#10b981",
				glow: "rgba(16, 185, 129, 0.3)",
				gradient: ["#34d399", "#059669"] as const,
			};
		}
		if (batteryPercent > 15) {
			return {
				color: "#f5a524",
				glow: "rgba(245, 165, 36, 0.3)",
				gradient: ["#f5a524", "#c27d0e"] as const,
			};
		}
		return {
			color: "#f31260",
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
	}, [stats?.lastChargeDate]);

	const secondaryBatteryLabel = useMemo(() => {
		if (!scooter) return null;
		if (
			scooter.trackingMode === "voltage" &&
			latestBatteryLevel !== undefined
		) {
			return `${latestBatteryLevel.toFixed(1)}V`;
		}
		if (stats?.averageCycleKm) {
			const estKm = (batteryPercent / 100) * stats.averageCycleKm;
			return `~${estKm.toFixed(0)} km est.`;
		}
		return null;
	}, [scooter, latestBatteryLevel, stats?.averageCycleKm, batteryPercent]);

	return (
		<View className="relative w-full overflow-hidden">
			{/* Background Image / Gradient */}
			<Image
				source={require("../../../../assets/images/hero_scooter.png")}
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
							onPress={onOpenPicker}
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
						<View className="relative">
							<Button
								size="sm"
								isIconOnly
								variant="secondary"
								className="rounded-full bg-surface-secondary/50 backdrop-blur-md border-transparent"
								onPress={onOpenBadges}
							>
								<StyledIcon name="award" size={18} className="text-warning" />
							</Button>
							{badgeCount > 0 && (
								<View className="absolute -top-1 -right-1 bg-warning px-1 rounded-full min-w-[16px] h-4 items-center justify-center border border-background shadow-sm pointer-events-none">
									<Text className="text-[9px] font-black text-black">
										{badgeCount}
									</Text>
								</View>
							)}
						</View>
						<Button
							size="sm"
							isIconOnly
							variant="secondary"
							className="rounded-full bg-surface-secondary/50 backdrop-blur-md border-transparent"
							onPress={onOpenDetails}
						>
							<StyledIcon name="file-text" size={18} className="text-muted" />
						</Button>
						<Button
							size="sm"
							isIconOnly
							variant="secondary"
							className="rounded-full bg-surface-secondary/50 backdrop-blur-md border-transparent"
							onPress={onOpenSettings}
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
						gradientColors={batteryStyles.gradient}
						secondaryLabel={secondaryBatteryLabel}
						statusIcon={smartStatus.icon}
						statusText={smartStatus.text}
						statusColor={smartStatus.color}
					/>
				</View>

				{/* ESTATÍSTICAS RÁPIDAS (DASHBOARD GRID 2x2) */}
				<StatGrid className="mt-2 z-10 gap-2 w-full">
					<StatCard
						icon="clock"
						color="info"
						label="Última Carga"
						value={lastChargeText}
						size="sm"
					/>
					<StatCard
						icon="activity"
						color="success"
						label="Ciclo Atual"
						value={stats?.currentCycleKm.toFixed(1) || "0.0"}
						unit="km"
						size="sm"
					/>
					<StatCard
						icon="map-pin"
						color="accent"
						label="KM Total"
						value={stats?.totalKm.toFixed(0) || "0"}
						unit="km"
						size="sm"
					/>
					<StatCard
						icon="zap"
						color="warning"
						label="Eficiência"
						value={stats?.averageCycleKm.toFixed(1) || "0.0"}
						unit="km/c"
						size="sm"
					/>
				</StatGrid>
			</View>
		</View>
	);
}
