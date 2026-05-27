import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { logs, scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { eq } from "drizzle-orm";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Text } from "heroui-native";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { ScooterFormSheet } from "./components/ScooterFormSheet";

export default function SettingsScreen() {
	const { theme, setTheme, activeScooterId, setActiveScooterId } =
		useAppStore();

	const [scootersList, setScootersList] = useState<
		(typeof scooters.$inferSelect)[]
	>([]);
	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
	const [scooterToDelete, setScooterToDelete] = useState<number | null>(null);
	const [scooterToEdit, setScooterToEdit] = useState<
		typeof scooters.$inferSelect | null
	>(null);
	const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);

	const fetchScooters = useCallback(async () => {
		const data = await db.select().from(scooters);
		setScootersList(data);

		// Auto-select scooter if there's only one and none is currently active
		if (data.length === 1 && !activeScooterId) {
			setActiveScooterId(data[0].id);
		}
	}, [activeScooterId, setActiveScooterId]);

	useEffect(() => {
		fetchScooters();
	}, [fetchScooters]);

	const executeDeleteScooter = async (id: number) => {
		await db.delete(logs).where(eq(logs.scooterId, id));
		await db.delete(scooters).where(eq(scooters.id, id));
		if (activeScooterId === id) setActiveScooterId(null);
		fetchScooters();
		setScooterToDelete(null);
	};

	const handleEdit = (item: typeof scooters.$inferSelect) => {
		setScooterToEdit(item);
		setIsBottomSheetOpen(true);
	};

	const executeClearAll = async () => {
		await db.delete(logs);
		await db.delete(scooters);
		setActiveScooterId(null);
		fetchScooters();
		setIsClearAllDialogOpen(false);
	};

	const handleBackup = async () => {
		try {
			const dbPath = `${FileSystem.documentDirectory}SQLite/scootertrack.db`;
			const fileInfo = await FileSystem.getInfoAsync(dbPath);
			if (!fileInfo.exists) {
				alert("Nenhum banco de dados encontrado para backup.");
				return;
			}
			await Sharing.shareAsync(dbPath, {
				dialogTitle: "Backup ScooterTrack DB",
			});
		} catch (e) {
			alert(`Erro ao fazer backup: ${e}`);
		}
	};

	const handleRestore = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				copyToCacheDirectory: true,
			});

			if (result.canceled || !result.assets || result.assets.length === 0) {
				return;
			}

			const fileUri = result.assets[0].uri;
			const dbPath = `${FileSystem.documentDirectory}SQLite/scootertrack.db`;

			// Copy selected file to DB location
			await FileSystem.copyAsync({
				from: fileUri,
				to: dbPath,
			});

			alert("Banco de dados restaurado com sucesso! Reinicie o aplicativo.");
		} catch (e) {
			alert(`Erro ao restaurar: ${e}`);
		}
	};

	return (
		<ScreenWrapper scrollable contentContainerClassName="p-4 pb-10">
			<Text className="text-3xl font-bold text-foreground mb-6">
				Configurações
			</Text>

			{/* APARÊNCIA */}
			<View className="mb-8">
				<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
					Aparência
				</Text>
				<Card variant="secondary" className="border border-surface-secondary">
					<View className="flex-row items-center justify-between mb-4">
						<View className="flex-row items-center gap-3">
							<View className="p-2 bg-surface rounded-xl">
								<StyledIcon name="moon" size={20} className="text-foreground" />
							</View>
							<Text className="text-base font-bold text-foreground">
								Tema Escuro
							</Text>
						</View>
					</View>
					<View className="flex-row gap-2">
						<Button
							className="flex-1"
							variant={theme === "light" ? "primary" : "secondary"}
							onPress={() => setTheme("light")}
						>
							<StyledIcon
								name="sun"
								size={16}
								className={
									theme === "light" ? "text-white" : "text-default-foreground"
								}
							/>
							<Button.Label>Claro</Button.Label>
						</Button>
						<Button
							className="flex-1"
							variant={theme === "dark" ? "primary" : "secondary"}
							onPress={() => setTheme("dark")}
						>
							<StyledIcon
								name="moon"
								size={16}
								className={
									theme === "dark" ? "text-white" : "text-default-foreground"
								}
							/>
							<Button.Label>Escuro</Button.Label>
						</Button>
						<Button
							className="flex-1"
							variant={theme === "system" ? "primary" : "secondary"}
							onPress={() => setTheme("system")}
						>
							<StyledIcon
								name="monitor"
								size={16}
								className={
									theme === "system" ? "text-white" : "text-default-foreground"
								}
							/>
							<Button.Label>Auto</Button.Label>
						</Button>
					</View>
				</Card>
			</View>

			{/* MINHAS SCOOTERS */}
			<View className="mb-8">
				<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
					Minhas Scooters
				</Text>

				{scootersList.length === 0 ? (
					<Text className="text-center text-muted mb-4">
						Nenhuma scooter cadastrada.
					</Text>
				) : (
					<View className="gap-4 mb-4">
						{scootersList.map((item) => (
							<Card
								key={item.id}
								variant="secondary"
								className={`border ${
									activeScooterId === item.id
										? "border-success bg-success-soft"
										: "border-surface-secondary bg-surface"
								}`}
							>
								<View className="flex-row justify-between items-start mb-4">
									<View className="flex-row items-center gap-3">
										<View
											className={`p-3 rounded-2xl ${activeScooterId === item.id ? "bg-success" : "bg-surface-secondary"}`}
										>
											<StyledIcon
												name="navigation"
												size={24}
												className={
													activeScooterId === item.id
														? "text-white"
														: "text-default-foreground"
												}
											/>
										</View>
										<View>
											<View className="flex-row items-center gap-2">
												<Text className="text-xl font-bold text-foreground">
													{item.name}
												</Text>
												{activeScooterId === item.id && (
													<View className="bg-success px-2 py-0.5 rounded text-white">
														<Text className="text-[10px] text-white font-bold">
															ATIVA
														</Text>
													</View>
												)}
											</View>
											<Text className="text-xs text-muted mt-1">
												KM inicial: {item.initialKm} · Bateria:{" "}
												{BATTERY_CHARTS[item.batteryType]?.label ||
													item.batteryType}
											</Text>
										</View>
									</View>
									{activeScooterId !== item.id && (
										<Button
											size="sm"
											variant="outline"
											onPress={() => setActiveScooterId(item.id)}
										>
											<Button.Label>Ativar</Button.Label>
										</Button>
									)}
								</View>

								<View className="flex-row gap-2 pt-3 border-t border-surface-secondary">
									<Button
										size="sm"
										variant="secondary"
										className="flex-1 bg-transparent border border-surface-secondary"
										onPress={() => {}}
									>
										<StyledIcon
											name="tool"
											size={14}
											className="text-default-foreground"
										/>
										<Button.Label>Manutenção</Button.Label>
									</Button>
									<Button
										size="sm"
										variant="secondary"
										onPress={() => handleEdit(item)}
									>
										<StyledIcon
											name="edit-2"
											size={14}
											className="text-accent"
										/>
										<Button.Label>Editar</Button.Label>
									</Button>
									<Button
										size="sm"
										variant="danger-soft"
										onPress={() => setScooterToDelete(item.id)}
									>
										<StyledIcon
											name="trash-2"
											size={14}
											className="text-danger"
										/>
									</Button>
								</View>
							</Card>
						))}
					</View>
				)}

				<Button
					variant="outline"
					className="w-full border-dashed border-2 border-success"
					onPress={() => {
						setScooterToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={18} color="#17C964" />
					<Text className="text-success font-bold">Adicionar scooter</Text>
				</Button>
			</View>

			{/* BACKUP E RESTAURAÇÃO */}
			<View className="mb-8">
				<Text className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">
					Backup e Restauração
				</Text>
				<Card variant="secondary" className="border border-surface-secondary">
					<View className="flex-row gap-3 mb-3">
						<Button variant="primary" className="flex-1" onPress={handleBackup}>
							<StyledIcon name="upload" size={18} color="white" />
							<Button.Label>Exportar</Button.Label>
						</Button>
						<Button
							variant="outline"
							className="flex-1 border-accent"
							onPress={handleRestore}
						>
							<StyledIcon name="download" size={18} color="#006FEE" />
							<Text className="text-[#006FEE] font-bold">Restaurar</Text>
						</Button>
					</View>
					<Text className="text-xs text-muted">
						Exporta todas as suas scooters, usos e recargas em formato de banco
						de dados para segurança ou migração de aparelho.
					</Text>
				</Card>
			</View>

			{/* ZONA DE PERIGO */}
			<View className="mb-8">
				<Text className="text-xs font-bold text-[#f87171] mb-3 uppercase tracking-wider">
					Zona de Perigo
				</Text>
				<Card
					variant="secondary"
					className="border border-danger/30 bg-danger/5"
				>
					<Button
						variant="outline"
						className="w-full border-danger"
						onPress={() => setIsClearAllDialogOpen(true)}
					>
						<StyledIcon name="trash-2" size={18} color="#f87171" />
						<Text className="text-[#f87171] font-bold">
							Apagar todos os dados
						</Text>
					</Button>
				</Card>
			</View>

			<View className="items-center opacity-50 my-6">
				<StyledIcon name="zap" size={24} color="#17C964" className="mb-2" />
				<Text className="text-muted text-xs">ScooterTrack v1.0.0</Text>
			</View>

			<ScooterFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				onSaved={fetchScooters}
				editItem={scooterToEdit}
			/>

			{/* Excluir Scooter Dialog */}
			<ConfirmDialog
				isOpen={scooterToDelete !== null}
				onOpenChange={(open) => {
					if (!open) setScooterToDelete(null);
				}}
				title="Excluir Scooter"
				description="Tem certeza? Todos os usos e recargas desta scooter também serão perdidos."
				onCancel={() => setScooterToDelete(null)}
				onConfirm={() =>
					scooterToDelete && executeDeleteScooter(scooterToDelete)
				}
			/>

			{/* Limpar Todos os Dados Dialog */}
			<ConfirmDialog
				isOpen={isClearAllDialogOpen}
				onOpenChange={setIsClearAllDialogOpen}
				title="Apagar todos os dados"
				description="CUIDADO: Você está prestes a apagar todas as scooters e registros. Deseja continuar?"
				confirmText="Apagar TUDO"
				onCancel={() => setIsClearAllDialogOpen(false)}
				onConfirm={executeClearAll}
			/>
		</ScreenWrapper>
	);
}
