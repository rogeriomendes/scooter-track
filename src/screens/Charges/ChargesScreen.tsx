import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, SectionList, Text, View } from "react-native";
import { ChargeListItem } from "@/components/ChargeListItem";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { FloatingActionPill } from "@/components/FloatingActionPill";
import { ListEmptyState } from "@/components/ListEmptyState";
import { ListSectionHeader } from "@/components/ListSectionHeader";
import { MonthSelector } from "@/components/MonthSelector";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StatGrid } from "@/components/StatGrid";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import {
	calculateChargeGainMap,
	filterLogsByMonth,
	getOldestLogDate,
	groupLogsByMonth,
} from "@/utils/stats";
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

	const chargesList = useMemo(
		() => filterLogsByMonth(allLogs, "charge", selectedMonth),
		[allLogs, selectedMonth],
	);

	const displayedCharges = useMemo(
		() => chargesList.slice(0, page * itemsPerPage),
		[chargesList, page],
	);

	const groupedCharges = useMemo(
		() => groupLogsByMonth(displayedCharges),
		[displayedCharges],
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

	const chargeGainMap = useMemo(
		() => calculateChargeGainMap(scooter, allLogs),
		[allLogs, scooter],
	);

	const cycleAutonomiaMap = useMemo(() => {
		const map = new Map<number, string>();
		for (const cycle of stats?.cycles || []) {
			map.set(cycle.chargeLog.id, cycle.distance.toFixed(1));
		}
		return map;
	}, [stats?.cycles]);

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
			const autonomia = cycleAutonomiaMap.get(item.id) ?? "0.0";
			const gain = chargeGainMap.get(item.id);

			return (
				<ChargeListItem
					item={item}
					scooter={scooter}
					autonomia={autonomia}
					gain={gain}
					onPress={() => handleEdit(item)}
				/>
			);
		},
		[cycleAutonomiaMap, chargeGainMap, scooter, handleEdit],
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
				title="Recargas"
				description="Adicione uma scooter primeiro para registrar recargas."
			/>
		);
	}

	return (
		<ScreenWrapper>
			{/* CABEÇALHO */}
			<Text className="text-3xl font-bold text-foreground px-4 py-2">
				Recargas
			</Text>

			{/* ESTATÍSTICAS RÁPIDAS (DASHBOARD GRID 2x2) */}
			<View className="px-4 mb-3 mt-1">
				<StatGrid
					items={[
						{
							icon: "zap",
							color: "info",
							label: selectedMonth ? "Mês Selecionado" : "Total Cargas",
							value: chargesList.length,
							unit: "cargas",
						},
						{
							icon: "navigation",
							color: "success",
							label: "Média / Ciclo",
							value: stats?.averageCycleKm.toFixed(1) || "0.0",
							unit: "km",
						},
						{
							icon: "trending-up",
							color: "warning",
							label: "Melhor Ciclo",
							value: stats?.bestCycleKm.toFixed(1) || "0.0",
							unit: "km",
						},
						{
							icon: "trending-down",
							color: "danger",
							label: "Pior Ciclo",
							value: stats?.worstCycleKm.toFixed(1) || "0.0",
							unit: "km",
						},
					]}
				/>
			</View>

			{/* SELETOR DE MÊS (Chips) */}
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
					) : undefined
				}
				keyExtractor={keyExtractor}
				contentContainerClassName="px-4 pb-24 gap-2 pt-1"
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					selectedMonth && totalChargesCount > 0 ? (
						<ListEmptyState
							icon="calendar"
							title={`Nenhuma recarga em ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}`}
							description="Não há recargas registradas no mês selecionado."
							buttonLabel="Ver todas as recargas"
							buttonColor="text-info"
							onButtonPress={() => setSelectedMonth(null)}
							isFiltered
						/>
					) : (
						<ListEmptyState
							icon="zap"
							title="Nenhuma recarga registrada"
							description="Sempre que recarregar a bateria, adicione aqui para manter o controle."
						/>
					)
				}
				renderSectionHeader={({ section: { title } }) => (
					<ListSectionHeader title={title} dotColor="bg-info" />
				)}
				renderItem={renderItem}
			/>

			<FloatingActionPill
				label="Registrar Recarga"
				onPress={() => {
					setLogToEdit(null);
					setIsBottomSheetOpen(true);
				}}
			/>

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
