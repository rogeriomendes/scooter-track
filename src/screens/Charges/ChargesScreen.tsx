import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyScooterState } from "@/components/EmptyScooterState";
import { MonthSelector } from "@/components/MonthSelector";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { useScooterData } from "@/hooks/useScooterData";
import { useAppStore } from "@/store/useAppStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import { Button } from "heroui-native";
import { Card } from "heroui-native/card";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { ChargeFormSheet } from "./components/ChargeFormSheet";

export default function ChargesScreen() {
	const activeScooterId = useAppStore((s) => s.activeScooterId);
	const { scooter, allLogs, refresh, stats, isLoading } =
		useScooterData(activeScooterId);
	const [currentMonth, setCurrentMonth] = useState(
		new Date(new Date().getFullYear(), new Date().getMonth(), 1),
	);
	const [page, setPage] = useState(1);
	const itemsPerPage = 20;

	const chargesList = useMemo(() => {
		return allLogs.filter((l) => {
			if (l.type !== "charge") return false;
			const logDate = new Date(l.date);
			return (
				logDate.getMonth() === currentMonth.getMonth() &&
				logDate.getFullYear() === currentMonth.getFullYear()
			);
		});
	}, [allLogs, currentMonth]);

	const displayedCharges = useMemo(
		() => chargesList.slice(0, page * itemsPerPage),
		[chargesList, page],
	);

	const minDate = useMemo(() => {
		let oldest = scooter?.createdAt ? new Date(scooter.createdAt) : new Date();
		for (const log of allLogs) {
			const d = new Date(log.date);
			if (d < oldest) oldest = d;
		}
		return oldest;
	}, [allLogs, scooter]);

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
			<EmptyScooterState
				title="Recargas"
				description="Adicione uma scooter primeiro para registrar recargas."
			/>
		);
	}

	return (
		<ScreenWrapper>
			<View className="p-4 flex-row justify-between items-center">
				<View>
					<Text className="text-3xl font-bold text-foreground mb-1">
						Recargas
					</Text>
					<Text className="text-sm font-bold text-muted mt-1 uppercase tracking-wider">
						{/* {chargesList.length} registros ·  */}
						{scooter.name}
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
					className="flex-1 items-center justify-center bg-surface border border-surface-secondary"
				>
					<StyledIcon name="zap" size={20} className="mb-2 text-info" />
					<Text className="text-xl font-bold text-foreground">
						{chargesList.length}
					</Text>
					<Text className="text-xs text-muted">Recargas</Text>
				</Card>
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center bg-surface border border-surface-secondary"
				>
					<StyledIcon
						name="navigation"
						size={20}
						className="mb-2 text-success"
					/>
					<Text className="text-xl font-bold text-foreground">
						{stats?.averageCycleKm.toFixed(1) || "0.0"}{" "}
						<Text className="font-normal text-muted text-xs">km</Text>
					</Text>
					<Text className="text-xs text-muted">médio/ciclo</Text>
				</Card>
				<Card
					variant="secondary"
					className="flex-1 items-center justify-center bg-surface border border-surface-secondary"
				>
					<StyledIcon
						name="trending-up"
						size={20}
						className="mb-2 text-warning"
					/>
					<Text className="text-xl font-bold text-foreground">
						{stats?.bestCycleKm.toFixed(1) || "0.0"}{" "}
						<Text className="font-normal text-muted text-xs">km</Text>
					</Text>
					<Text className="text-xs text-muted">Melhor ciclo</Text>
				</Card>
			</View>

			<View className="px-4">
				<MonthSelector
					currentDate={currentMonth}
					minDate={minDate}
					maxDate={new Date()}
					onChange={(newDate) => {
						setCurrentMonth(newDate);
						setPage(1);
					}}
				/>
			</View>

			<FlatList
				data={displayedCharges}
				onEndReached={() => {
					if (displayedCharges.length < chargesList.length) {
						setPage((p) => p + 1);
					}
				}}
				onEndReachedThreshold={0.5}
				ListFooterComponent={
					displayedCharges.length < chargesList.length ? (
						<ActivityIndicator size="small" color="#10b981" className="py-4" />
					) : null
				}
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
							Sempre que recarregar a bateria, adicione aqui para manter o
							controle de consumo.
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
