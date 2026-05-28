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
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScooterFormSheet } from "./components/ScooterFormSheet";

export default function SettingsScreen() {
	const {
		theme,
		setTheme,
		activeScooterId,
		setActiveScooterId,
		triggerRefresh,
	} = useAppStore();

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
		triggerRefresh();
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
		triggerRefresh();
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

			{/* APARÊNCIA - Segmented Control */}
			<Animated.View entering={FadeInDown.delay(100).springify()}>
				<Text className="text-[10px] font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Tema do Aplicativo
				</Text>
				<Card
					variant="secondary"
					className="border border-surface-secondary bg-surface mb-8 p-1"
				>
					<View className="flex-row bg-surface-secondary/30 rounded-xl p-1">
						<Pressable
							className={`flex-1 py-2 rounded-lg flex-row justify-center items-center gap-2 ${
								theme === "light" ? "bg-surface shadow-sm" : ""
							}`}
							onPress={() => setTheme("light")}
						>
							<StyledIcon
								name="sun"
								size={14}
								className={theme === "light" ? "text-foreground" : "text-muted"}
							/>
							<Text
								className={`font-bold text-xs ${theme === "light" ? "text-foreground" : "text-muted"}`}
							>
								Claro
							</Text>
						</Pressable>

						<Pressable
							className={`flex-1 py-2 rounded-lg flex-row justify-center items-center gap-2 ${
								theme === "dark" ? "bg-surface shadow-sm" : ""
							}`}
							onPress={() => setTheme("dark")}
						>
							<StyledIcon
								name="moon"
								size={14}
								className={theme === "dark" ? "text-foreground" : "text-muted"}
							/>
							<Text
								className={`font-bold text-xs ${theme === "dark" ? "text-foreground" : "text-muted"}`}
							>
								Escuro
							</Text>
						</Pressable>

						<Pressable
							className={`flex-1 py-2 rounded-lg flex-row justify-center items-center gap-2 ${
								theme === "system" ? "bg-surface shadow-sm" : ""
							}`}
							onPress={() => setTheme("system")}
						>
							<StyledIcon
								name="monitor"
								size={14}
								className={
									theme === "system" ? "text-foreground" : "text-muted"
								}
							/>
							<Text
								className={`font-bold text-xs ${theme === "system" ? "text-foreground" : "text-muted"}`}
							>
								Auto
							</Text>
						</Pressable>
					</View>
				</Card>
			</Animated.View>

			{/* MINHAS SCOOTERS */}
			<Animated.View entering={FadeInDown.delay(200).springify()}>
				<Text className="text-[10px] font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Minhas Scooters
				</Text>

				{scootersList.length === 0 ? (
					<Text className="text-center text-muted mb-4 mt-2">
						Nenhuma scooter cadastrada.
					</Text>
				) : (
					<View className="gap-3 mb-4">
						{scootersList.map((item) => {
							const isActive = activeScooterId === item.id;
							return (
								<Card
									key={item.id}
									variant="secondary"
									className={`border ${
										isActive
											? "border-success/50 bg-success/5 shadow-sm"
											: "border-surface-secondary bg-surface"
									}`}
								>
									<View className="flex-row justify-between items-start mb-4">
										<View className="flex-row items-center gap-3">
											<View
												className={`p-3 rounded-2xl ${isActive ? "bg-success" : "bg-surface-secondary"}`}
											>
												<StyledIcon
													name="navigation"
													size={20}
													className={isActive ? "text-white" : "text-muted"}
												/>
											</View>
											<View>
												<View className="flex-row items-center gap-2 mb-1">
													<Text className="text-lg font-bold text-foreground">
														{item.name}
													</Text>
													{isActive && (
														<View className="bg-success/20 border border-success/30 px-2 py-0.5 rounded flex-row items-center gap-1">
															<View className="w-1.5 h-1.5 rounded-full bg-success" />
															<Text className="text-[9px] text-success font-black tracking-widest">
																ATIVA
															</Text>
														</View>
													)}
												</View>
												<Text className="text-[11px] text-muted font-medium">
													{item.initialKm} km ·{" "}
													{item.trackingMode === "percent"
														? "Porcentagem (%)"
														: "Voltagem (" +
																BATTERY_CHARTS[item.batteryType]?.label ||
															item.batteryType + ")"}
												</Text>
											</View>
										</View>
										{!isActive && (
											<Button
												size="sm"
												variant="outline"
												onPress={() => setActiveScooterId(item.id)}
												className="border-surface-secondary"
											>
												<Button.Label className="text-xs font-bold">
													Ativar
												</Button.Label>
											</Button>
										)}
									</View>

									<View className="flex-row gap-2 pt-3 border-t border-surface-secondary/50">
										<Button
											size="sm"
											variant="tertiary"
											onPress={() => handleEdit(item)}
											className="flex-1"
										>
											<StyledIcon
												name="edit-2"
												size={14}
												className="text-foreground"
											/>
											<Button.Label className="text-foreground font-bold">
												Editar
											</Button.Label>
										</Button>
										<Button
											size="sm"
											variant="secondary"
											feedbackVariant="scale-ripple"
											className="bg-danger/10 border border-danger/10"
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
							);
						})}
					</View>
				)}

				<Button
					variant="secondary"
					className="w-full bg-surface border border-success/30 shadow-sm mb-8"
					onPress={() => {
						setScooterToEdit(null);
						setIsBottomSheetOpen(true);
					}}
				>
					<StyledIcon name="plus" size={18} className="text-success" />
					<Button.Label className="text-success font-bold">
						Adicionar Scooter
					</Button.Label>
				</Button>
			</Animated.View>

			{/* BACKUP E RESTAURAÇÃO */}
			<Animated.View entering={FadeInDown.delay(300).springify()}>
				<Text className="text-[10px] font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Backup e Dados
				</Text>
				<Card
					variant="secondary"
					className="border border-surface-secondary bg-surface mb-8"
				>
					<View className="flex-row gap-3 mb-4">
						<Button
							variant="primary"
							className="flex-1 bg-info shadow-sm"
							feedbackVariant="scale-ripple"
							onPress={handleBackup}
						>
							<StyledIcon name="upload" size={16} color="white" />
							<Button.Label className="text-white font-bold">
								Exportar
							</Button.Label>
						</Button>
						<Button
							variant="outline"
							className="flex-1 border-surface-secondary bg-transparent"
							onPress={handleRestore}
						>
							<StyledIcon
								name="download"
								size={16}
								className="text-foreground"
							/>
							<Button.Label className="text-foreground font-bold">
								Restaurar
							</Button.Label>
						</Button>
					</View>
					<Text className="text-xs text-muted">
						Exporta todas as suas scooters, usos e recargas em um único arquivo
						para segurança ou migração de aparelho.
					</Text>
				</Card>
			</Animated.View>

			{/* ZONA DE PERIGO */}
			<Animated.View entering={FadeInDown.delay(400).springify()}>
				<Text className="text-[10px] font-bold text-danger mb-2 uppercase tracking-widest ml-1">
					Zona de Perigo
				</Text>
				<Card
					variant="secondary"
					className="border border-danger/20 bg-danger/5"
				>
					<Button
						variant="outline"
						className="w-full border-danger bg-transparent"
						onPress={() => setIsClearAllDialogOpen(true)}
					>
						<StyledIcon name="trash-2" size={16} className="text-danger" />
						<Button.Label className="text-danger font-bold">
							Apagar Todos os Dados
						</Button.Label>
					</Button>
					<Text className="text-[10px] text-danger/80 text-center mt-3 font-medium uppercase tracking-wider">
						Esta ação não pode ser desfeita.
					</Text>
				</Card>
			</Animated.View>

			<View className="items-center opacity-40 my-6">
				<StyledIcon name="zap" size={20} color="#10b981" className="mb-2" />
				<Text className="text-muted text-[10px] uppercase tracking-widest font-bold">
					ScooterTrack v1.0.0
				</Text>
			</View>

			<ScooterFormSheet
				isOpen={isBottomSheetOpen}
				onOpenChange={setIsBottomSheetOpen}
				onSaved={() => {
					fetchScooters();
					triggerRefresh();
				}}
				editItem={scooterToEdit}
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

			{/* Limpar Todos os Dados Dialog */}
			<ConfirmDialog
				isOpen={isClearAllDialogOpen}
				onOpenChange={setIsClearAllDialogOpen}
				title="Apagar todos os dados"
				description="CUIDADO: Você está prestes a apagar todas as scooters, usos e recargas. Essa ação remove seus dados permanentemente."
				confirmText="Apagar TUDO"
				onCancel={() => setIsClearAllDialogOpen(false)}
				onConfirm={executeClearAll}
			/>
		</ScreenWrapper>
	);
}
