import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { BadgesSheet } from "@/components/BadgesSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { RangeCalculatorSheet } from "@/components/RangeCalculatorSheet";
import { ScooterDetailsSheet } from "@/components/ScooterDetailsSheet";
import { ScooterFormSheet } from "@/components/ScooterFormSheet";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { calculateBatteryPercentage } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, scooters } from "@/db/schema";
import { useBadges } from "@/hooks/useBadges";
import { useMaintenanceHealth } from "@/hooks/useMaintenanceHealth";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { openPdfFile } from "@/utils/fileViewer";
import { calculateTripConsumptionMap } from "@/utils/stats";
import { DashboardHero } from "./components/DashboardHero";
import { MaintenanceAlertCard } from "./components/MaintenanceAlertCard";
import { MonthSummaryCard } from "./components/MonthSummaryCard";
import { QuickActions } from "./components/QuickActions";
import { RecentTripsSection } from "./components/RecentTripsSection";
import { ScooterPickerSheet } from "./components/ScooterPickerSheet";

export default function DashboardScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const router = useRouter();
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isRangeCalcOpen, setIsRangeCalcOpen] = useState(false);
	const [isBadgesOpen, setIsBadgesOpen] = useState(false);
	const [isAddingNew, setIsAddingNew] = useState(false);
	const [editingScooter, setEditingScooter] = useState<
		typeof scooters.$inferSelect | null
	>(null);
	const [scooterToDelete, setScooterToDelete] = useState<number | null>(null);

	const { scooter, allLogs, maintenanceList, stats, isLoading } =
		useScooterData(activeScooterId);

	const healthStats = useMaintenanceHealth(maintenanceList, stats);
	const badgeData = useBadges(allLogs, stats, maintenanceList, scooter);
	const triggerRefresh = useAppStore((s) => s.triggerRefresh);
	const setActiveScooterId = useAppStore((s) => s.setActiveScooterId);

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

	const tripConsumptionMap = useMemo(
		() => calculateTripConsumptionMap(scooter, allLogs),
		[scooter, allLogs],
	);

	const batteryPercent = useMemo(() => {
		if (!scooter || !latestLog) return 100;
		if (scooter.trackingMode === "percent") return latestLog.batteryLevel;
		return calculateBatteryPercentage(
			latestLog.batteryLevel,
			scooter.batteryType,
		);
	}, [scooter, latestLog]);

	if (isLoading && !scooter) {
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
		<ScreenWrapper
			scrollable
			contentContainerClassName="pb-10"
			style={{ paddingTop: 0 }}
		>
			<DashboardHero
				scooter={scooter}
				batteryPercent={batteryPercent}
				latestBatteryLevel={latestLog?.batteryLevel}
				stats={stats}
				badgeCount={badgeData.unlockedCount}
				onOpenPicker={() => setIsPickerOpen(true)}
				onOpenBadges={() => setIsBadgesOpen(true)}
				onOpenDetails={() => setIsDetailsOpen(true)}
				onOpenSettings={() => router.push("/settings")}
			/>

			<View className="px-4 mt-4">
				<MonthSummaryCard allLogs={allLogs} />

				<QuickActions
					onTripsPress={() => router.push("/(tabs)/trips")}
					onChargesPress={() => router.push("/(tabs)/charges")}
					onRangeCalcPress={() => setIsRangeCalcOpen(true)}
					invoicePdfPath={scooter.invoicePdfPath}
					onInvoicePress={() => {
						if (scooter.invoicePdfPath) {
							void openPdfFile(scooter.invoicePdfPath);
						}
					}}
				/>

				{scooter.showMaintenance && (
					<MaintenanceAlertCard
						healthStats={healthStats}
						onPress={() => router.push("/(tabs)/maintenance")}
					/>
				)}

				<RecentTripsSection
					recentTrips={recentTrips}
					scooter={scooter}
					tripConsumptionMap={tripConsumptionMap}
					onViewAll={() => router.push("/(tabs)/trips")}
				/>
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
				editItem={isAddingNew ? null : editingScooter || scooter}
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

			{scooter && (
				<RangeCalculatorSheet
					isOpen={isRangeCalcOpen}
					onOpenChange={setIsRangeCalcOpen}
					scooter={scooter}
					currentBatteryPercent={batteryPercent}
					estimatedAutonomyKm={stats?.estimatedAutonomy || 0}
				/>
			)}

			<BadgesSheet
				isOpen={isBadgesOpen}
				onOpenChange={setIsBadgesOpen}
				badges={badgeData.badges}
				unlockedCount={badgeData.unlockedCount}
				totalCount={badgeData.totalCount}
				co2SavedKg={badgeData.co2SavedKg}
			/>
		</ScreenWrapper>
	);
}
