import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { desc, eq } from "drizzle-orm";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { logs, scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { TripFormSheet } from "./components/TripFormSheet";
import { useScooterData } from "@/hooks/useScooterData";
import { useMemo } from "react";

export default function TripsScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, refresh, isLoading } = useScooterData(activeScooterId);
	const tripsList = useMemo(() => allLogs.filter(l => l.type === "trip"), [allLogs]);

	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
	const [logToDelete, setLogToDelete] = useState<number | null>(null);
	const [logToEdit, setLogToEdit] = useState<typeof logs.$inferSelect | null>(
		null,
	);

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
			<ScreenWrapper className="p-6">
				<Text className="text-xl font-bold text-foreground">Usos</Text>
				<Text className="text-muted mt-4">
					Nenhuma scooter ativa selecionada.
				</Text>
			</ScreenWrapper>
		);
	}

	return (
		<ScreenWrapper>
			<View className="p-4 flex-row justify-between items-center">
				<View>
					<Text className="text-3xl font-bold text-foreground mb-1">Usos</Text>
					<Text className="text-muted text-sm">
						{tripsList.length} registros · {scooter.name}
					</Text>
				</View>
				<Button
					size="md"
					isIconOnly
					variant="primary"
					className="rounded-full shadow-lg"
					onPress={() => {
						setLogToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={24} color="white" />
				</Button>
			</View>

			<FlatList
				data={tripsList}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-10 gap-3"
				ListEmptyComponent={
					<View className="items-center justify-center mt-20 opacity-60">
						<View className="bg-surface-secondary p-4 rounded-full mb-4">
							<StyledIcon name="navigation" size={48} className="text-muted" />
						</View>
						<Text className="text-muted text-center text-lg font-bold">
							Nenhum uso registrado
						</Text>
						<Text className="text-muted text-center text-sm mt-1 px-10">
							Clique no botão de + acima para adicionar sua primeira viagem com a scooter.
						</Text>
					</View>
				}
				renderItem={({ item }) => (
					<Card variant="secondary" className="border border-surface-secondary">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-4">
								<View className="p-3 bg-surface rounded-2xl">
									<StyledIcon
										name="navigation"
										size={24}
										className="text-success"
									/>
								</View>
								<View>
									<Text className="text-xl font-bold text-foreground">
										{item.distance} km
									</Text>
									<Text className="text-xs text-muted mt-1">
										{format(item.date, "dd/MM/yyyy, HH:mm", { locale: ptBR })}
									</Text>
									{item.notes ? (
										<Text className="text-xs text-muted">{item.notes}</Text>
									) : null}
								</View>
							</View>

							<View className="flex-row gap-2">
								<Button
									size="sm"
									isIconOnly
									variant="secondary"
									onPress={() => handleEdit(item)}
								>
									<StyledIcon name="edit-2" size={18} className="text-accent" />
								</Button>
								<Button
									size="sm"
									isIconOnly
									variant="secondary"
									onPress={() => setLogToDelete(item.id)}
								>
									<StyledIcon
										name="trash-2"
										size={18}
										className="text-danger"
									/>
								</Button>
							</View>
						</View>
					</Card>
				)}
			/>

			<TripFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				scooter={scooter}
				onSaved={refresh}
				editItem={logToEdit}
			/>

			{/* Delete Confirmation Dialog */}
			<ConfirmDialog
				isOpen={logToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setLogToDelete(null);
				}}
				title="Excluir Uso"
				description="Tem certeza que deseja excluir este registro de uso? Essa ação não pode ser desfeita."
				onCancel={() => setLogToDelete(null)}
				onConfirm={() => logToDelete && handleDelete(logToDelete)}
			/>
		</ScreenWrapper>
	);
}
