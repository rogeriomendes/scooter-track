import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, SectionList, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { FloatingActionPill } from "@/components/FloatingActionPill";
import { ListEmptyState } from "@/components/ListEmptyState";
import { ListSectionHeader } from "@/components/ListSectionHeader";
import { MonthSelector } from "@/components/MonthSelector";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StatGrid } from "@/components/StatGrid";
import { TripListItem } from "@/components/TripListItem";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import {
	calculateTripConsumptionMap,
	calculateTripPeriodStats,
	filterLogsByMonth,
	getOldestLogDate,
	groupLogsByMonth,
} from "@/utils/stats";
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

	const tripsList = useMemo(
		() => filterLogsByMonth(allLogs, "trip", selectedMonth),
		[allLogs, selectedMonth],
	);

	const dashboardStats = useMemo(
		() => calculateTripPeriodStats(tripsList),
		[tripsList],
	);

	const displayedTrips = useMemo(
		() => tripsList.slice(0, page * itemsPerPage),
		[tripsList, page],
	);

	const groupedTrips = useMemo(
		() => groupLogsByMonth(displayedTrips),
		[displayedTrips],
	);

	const minDate = useMemo(
		() => getOldestLogDate(scooter, allLogs),
		[allLogs, scooter],
	);

	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
	const [logToDelete, setLogToDelete] = useState<number | null>(null);
	const [logToEdit, setLogToEdit] = useState<typeof logs.$inferSelect | null>(
		null,
	);

	const tripConsumptionMap = useMemo(
		() => calculateTripConsumptionMap(scooter, allLogs),
		[scooter, allLogs],
	);

	const handleDelete = async (id: number) => {
		await db.delete(logs).where(eq(logs.id, id));
		refresh();
		setLogToDelete(null);
	};

	const handleEdit = useCallback((item: typeof logs.$inferSelect) => {
		setLogToEdit(item);
		setIsBottomSheetOpen(true);
	}, []);

	const keyExtractor = useCallback(
		(item: typeof logs.$inferSelect) => item.id.toString(),
		[],
	);

	const renderItem = useCallback(
		({ item }: { item: typeof logs.$inferSelect }) => {
			if (!scooter) return null;
			const consumption = tripConsumptionMap.get(item.id);

			return (
				<TripListItem
					trip={item}
					scooter={scooter}
					consumption={consumption}
					onPress={() => handleEdit(item)}
				/>
			);
		},
		[tripConsumptionMap, scooter, handleEdit],
	);

	if (isLoading && !scooter) {
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
			<Text className="text-3xl font-bold text-foreground px-4 py-2">Usos</Text>

			{/* ESTATÍSTICAS RÁPIDAS (DASHBOARD GRID 2x2) */}
			<View className="px-4 mb-3 mt-1">
				<StatGrid
					items={[
						{
							icon: "map-pin",
							color: "success",
							label: selectedMonth ? "Total Mês" : "Total Geral",
							value: dashboardStats.totalKm.toFixed(1),
							unit: "km",
						},
						{
							icon: "bar-chart-2",
							color: "accent",
							label: "Média / Dia",
							value: dashboardStats.avgKm.toFixed(1),
							unit: "km",
						},
						{
							icon: "award",
							color: "warning",
							label: "Recorde",
							value: dashboardStats.maxKm.toFixed(1),
							unit: "km",
						},
						{
							icon: "hash",
							color: "info",
							label: "Viagens",
							value: dashboardStats.tripCount,
						},
					]}
				/>
			</View>

			{/* SELETOR DE MÊS */}
			<View className="pl-4 pr-0">
				<MonthSelector
					selectedMonth={selectedMonth}
					minDate={minDate}
					maxDate={new Date()}
					onChange={(newDate) => {
						setSelectedMonth(newDate);
						setPage(1);
					}}
				/>
			</View>

			{/* LISTA E DASHBOARD AGRUPADO */}
			<SectionList
				sections={groupedTrips}
				keyExtractor={keyExtractor}
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
						<ListEmptyState
							icon="calendar"
							title={`Nenhum uso em ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}`}
							description="Não há viagens registradas no mês selecionado."
							buttonLabel="Ver todos os usos"
							buttonColor="text-success"
							onButtonPress={() => setSelectedMonth(null)}
							isFiltered
						/>
					) : (
						<ListEmptyState
							icon="map-pin"
							title="Nenhum uso registrado"
							description="Suas viagens aparecerão aqui para ajudar a calcular a autonomia real."
						/>
					)
				}
				renderSectionHeader={({ section: { title } }) => (
					<ListSectionHeader title={title} dotColor="bg-success" />
				)}
				renderItem={renderItem}
			/>

			<FloatingActionPill
				label="Registrar Uso"
				onPress={() => {
					setLogToEdit(null);
					setIsBottomSheetOpen(true);
				}}
			/>

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
