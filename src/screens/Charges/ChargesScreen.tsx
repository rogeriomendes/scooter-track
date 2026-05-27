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
import { ChargeFormSheet } from "./components/ChargeFormSheet";
import { useScooterData } from "@/hooks/useScooterData";
import { useMemo } from "react";

export default function ChargesScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, refresh, stats, isLoading } = useScooterData(activeScooterId);
	const chargesList = useMemo(() => allLogs.filter(l => l.type === "charge"), [allLogs]);

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
				<Text className="text-xl font-bold text-foreground">Recargas</Text>
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
					<Text className="text-3xl font-bold text-foreground mb-1">
						Recargas
					</Text>
					<Text className="text-muted text-sm">
						{chargesList.length} registros · {scooter.name}
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

			<View className="flex-row gap-3 px-4 mb-4">
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center py-4 bg-surface border border-surface-secondary"
				>
					<StyledIcon name="zap" size={20} className="mb-2 text-info" />
					<Text className="text-xl font-bold text-foreground">
						{chargesList.length}
					</Text>
					<Text className="text-xs text-muted">Recargas</Text>
				</Card>
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center py-4 bg-surface border border-surface-secondary"
				>
					<StyledIcon
						name="navigation"
						size={20}
						className="mb-2 text-success"
					/>
					<Text className="text-xl font-bold text-foreground">
						{stats?.averageCycleKm.toFixed(1) || "0.0"}
					</Text>
					<Text className="text-xs text-muted">Km médio/ciclo</Text>
				</Card>
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center py-4 bg-surface border border-surface-secondary"
				>
					<StyledIcon
						name="trending-up"
						size={20}
						className="mb-2 text-warning"
					/>
					<Text className="text-xl font-bold text-foreground">
						{stats?.bestCycleKm.toFixed(1) || "0.0"}
					</Text>
					<Text className="text-xs text-muted">Melhor ciclo</Text>
				</Card>
			</View>

			<FlatList
				data={chargesList}
				keyExtractor={(item) => item.id.toString()}
				contentContainerClassName="px-4 pb-10 gap-3"
				ListEmptyComponent={
					<View className="items-center justify-center mt-20 opacity-60">
						<View className="bg-surface-secondary p-4 rounded-full mb-4">
							<StyledIcon name="zap" size={48} className="text-muted" />
						</View>
						<Text className="text-muted text-center text-lg font-bold">
							Nenhuma recarga registrada
						</Text>
						<Text className="text-muted text-center text-sm mt-1 px-10">
							Sempre que recarregar a bateria, adicione aqui para manter o controle de consumo.
						</Text>
					</View>
				}
				renderItem={({ item }) => (
					<Card variant="secondary" className="border border-surface-secondary">
						<View className="flex-row items-center justify-between">
							<View className="flex-row items-center gap-4">
								<View className="p-3 bg-surface rounded-2xl">
									<StyledIcon name="zap" size={24} className="text-info" />
								</View>
								<View>
									<Text className="text-base font-bold text-foreground">
										{stats?.cycles
											.find((c) => c.chargeLog.id === item.id)
											?.distance.toFixed(1) || "0.0"}{" "}
										km rodados
									</Text>
									<Text className="text-xs text-muted mt-1">
										{format(item.date, "dd/MM/yyyy, HH:mm", { locale: ptBR })}
									</Text>
									<Text className="text-xs text-muted mt-0.5">
										Voltagem: {item.batteryLevel}V{" "}
										{item.notes ? `· ${item.notes}` : ""}
									</Text>
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

			<ChargeFormSheet
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
				title="Excluir Recarga"
				description="Tem certeza que deseja excluir este registro de recarga? Essa ação não pode ser desfeita."
				onCancel={() => setLogToDelete(null)}
				onConfirm={() => logToDelete && handleDelete(logToDelete)}
			/>
		</ScreenWrapper>
	);
}
