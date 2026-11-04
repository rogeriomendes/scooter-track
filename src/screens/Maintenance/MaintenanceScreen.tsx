import { eq } from "drizzle-orm";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text } from "react-native";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { FloatingActionPill } from "@/components/FloatingActionPill";
import { ListEmptyState } from "@/components/ListEmptyState";
import { MaintenanceListItem } from "@/components/MaintenanceListItem";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { db } from "@/db/client";
import { maintenance } from "@/db/schema";
import { useMaintenanceHealth } from "@/hooks/useMaintenanceHealth";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { MaintenanceFormSheet } from "./components/MaintenanceFormSheet";
import {
	type MaintenanceFilterType,
	MaintenanceHeader,
} from "./components/MaintenanceHeader";

export function MaintenanceScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);

	const { scooter, maintenanceList, stats, refresh, isLoading } =
		useScooterData(activeScooterId);

	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
	const [itemToEdit, setItemToEdit] = useState<
		typeof maintenance.$inferSelect | null
	>(null);
	const [itemToDelete, setItemToDelete] = useState<number | null>(null);
	const [activeFilter, setActiveFilter] =
		useState<MaintenanceFilterType>("all");

	const healthStats = useMaintenanceHealth(maintenanceList, stats);
	const currentTotalKm = stats?.totalKm || 0;

	const { pendingCount, completedCount, adminCount } = useMemo(() => {
		let pending = 0;
		let completed = 0;
		let admin = 0;

		for (const item of maintenanceList) {
			if (item.isCompleted) {
				completed++;
			} else {
				pending++;
			}
			if (!(item.hasWear ?? true)) {
				admin++;
			}
		}

		return {
			pendingCount: pending,
			completedCount: completed,
			adminCount: admin,
		};
	}, [maintenanceList]);

	const filterOptions = useMemo(
		() => [
			{ id: "all" as const, label: "Todos", count: maintenanceList.length },
			{ id: "pending" as const, label: "Em Aberto", count: pendingCount },
			{
				id: "risk" as const,
				label: "Em Risco",
				count: healthStats.itemsInRisk,
			},
			{ id: "admin" as const, label: "Fixo", count: adminCount },
			{ id: "completed" as const, label: "Concluídas", count: completedCount },
		],
		[
			maintenanceList.length,
			pendingCount,
			healthStats.itemsInRisk,
			adminCount,
			completedCount,
		],
	);

	const filteredMaintenance = useMemo(() => {
		return maintenanceList.filter((item) => {
			if (activeFilter === "pending") return !item.isCompleted;
			if (activeFilter === "completed") return item.isCompleted;
			if (activeFilter === "admin") return !(item.hasWear ?? true);
			if (activeFilter === "risk") return healthStats.riskItemIds.has(item.id);
			return true;
		});
	}, [maintenanceList, activeFilter, healthStats.riskItemIds]);

	const handleDelete = async (id: number) => {
		await db.delete(maintenance).where(eq(maintenance.id, id));
		refresh();
		setItemToDelete(null);
	};

	const keyExtractor = useCallback(
		(item: typeof maintenance.$inferSelect) => item.id.toString(),
		[],
	);

	const renderItem = useCallback(
		({ item }: { item: typeof maintenance.$inferSelect }) => (
			<MaintenanceListItem
				item={item}
				currentTotalKm={currentTotalKm}
				onPress={() => {
					setItemToEdit(item);
					setIsBottomSheetOpen(true);
				}}
			/>
		),
		[currentTotalKm],
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
				title="Manutenção"
				description="Adicione uma scooter primeiro para gerenciar suas peças."
			/>
		);
	}

	return (
		<ScreenWrapper>
			{/* CABEÇALHO */}
			<Text className="text-3xl font-bold text-foreground px-4 py-2">
				Manutenção
			</Text>

			<FlatList
				data={filteredMaintenance}
				keyExtractor={keyExtractor}
				contentContainerClassName="px-4 pb-24 gap-2"
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					maintenanceList.length > 0 ? (
						<MaintenanceHeader
							healthStats={healthStats}
							filterOptions={filterOptions}
							activeFilter={activeFilter}
							onSelectFilter={setActiveFilter}
						/>
					) : undefined
				}
				ListEmptyComponent={
					maintenanceList.length > 0 ? (
						<ListEmptyState
							icon="filter"
							title="Nenhum item nesta categoria"
							description="Não há manutenções correspondentes ao filtro selecionado."
							buttonLabel="Ver todas as manutenções"
							buttonColor="text-success"
							onButtonPress={() => setActiveFilter("all")}
							isFiltered
						/>
					) : (
						<ListEmptyState
							icon="tool"
							title="Nenhum item cadastrado"
							description="Cadastre peças como pastilhas de freio ou pneus para acompanhar a vida útil."
						/>
					)
				}
				renderItem={renderItem}
			/>

			<FloatingActionPill
				label="Nova Manutenção"
				onPress={() => {
					setItemToEdit(null);
					setIsBottomSheetOpen(true);
				}}
			/>

			<MaintenanceFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				onSaved={refresh}
				onDeleteRequest={(id) => {
					setIsBottomSheetOpen(false);
					setItemToDelete(id);
				}}
				editItem={itemToEdit}
				scooter={scooter}
				currentTotalKm={currentTotalKm}
			/>

			<ConfirmDialog
				isOpen={itemToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setItemToDelete(null);
				}}
				title="Excluir Peça"
				description="Tem certeza? Você perderá o histórico de manutenção deste item."
				onCancel={() => setItemToDelete(null)}
				onConfirm={() => itemToDelete && handleDelete(itemToDelete)}
			/>
		</ScreenWrapper>
	);
}
