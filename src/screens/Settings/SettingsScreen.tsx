import { count } from "drizzle-orm";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { logs, maintenance, scooters } from "@/db/schema";
import { EnergySettingsSection } from "@/screens/Settings/components/EnergySettingsSection";
import { ThemeSelector } from "@/screens/Settings/components/ThemeSelector";
import { useAppStore } from "@/store/useAppStore";
import { performBackup, performRestore } from "@/utils/backupRestore";

export default function SettingsScreen() {
	const router = useRouter();
	const { theme, setTheme, setActiveScooterId, triggerRefresh } = useAppStore();

	const [isClearAllDialogOpen, setIsClearAllDialogOpen] = useState(false);
	const [dbStats, setDbStats] = useState({
		scootersCount: 0,
		logsCount: 0,
		maintenanceCount: 0,
		invoicesCount: 0,
	});

	const appVersion = Constants.expoConfig?.version || "1.1.0";

	const loadStats = useCallback(async () => {
		try {
			const [sCountRes, lCountRes, mCountRes, files] = await Promise.all([
				db.select({ value: count() }).from(scooters),
				db.select({ value: count() }).from(logs),
				db.select({ value: count() }).from(maintenance),
				FileSystem.documentDirectory
					? FileSystem.readDirectoryAsync(FileSystem.documentDirectory)
					: Promise.resolve([]),
			]);

			const pdfCount = files.filter((f) => f.endsWith(".pdf")).length;

			setDbStats({
				scootersCount: sCountRes[0]?.value ?? 0,
				logsCount: lCountRes[0]?.value ?? 0,
				maintenanceCount: mCountRes[0]?.value ?? 0,
				invoicesCount: pdfCount,
			});
		} catch (error) {
			console.error("Error loading settings stats:", error);
		}
	}, []);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	const executeClearAll = async () => {
		try {
			await db.delete(logs);
			await db.delete(maintenance);
			await db.delete(scooters);

			// Apagar PDFs salvos no diretório local
			if (FileSystem.documentDirectory) {
				const files = await FileSystem.readDirectoryAsync(
					FileSystem.documentDirectory,
				);
				const pdfFiles = files.filter((f) => f.endsWith(".pdf"));
				for (const f of pdfFiles) {
					await FileSystem.deleteAsync(`${FileSystem.documentDirectory}${f}`, {
						idempotent: true,
					});
				}
			}

			setActiveScooterId(null);
			triggerRefresh();
			setIsClearAllDialogOpen(false);
			await loadStats();
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch (e) {
			Alert.alert("Erro", `Erro ao apagar dados: ${e}`);
		}
	};

	const handleBackup = async () => {
		await performBackup(appVersion);
	};

	const handleRestore = async () => {
		await performRestore({
			onScooterRestored: (id) => setActiveScooterId(id),
			onSuccess: async () => {
				triggerRefresh();
				await loadStats();
			},
		});
	};

	return (
		<ScreenWrapper scrollable contentContainerClassName="p-4 pb-10">
			{/* CABEÇALHO DA TELA */}
			<View className="flex-row items-center gap-3 mb-6">
				<Pressable
					onPress={() => {
						if (router.canGoBack()) {
							router.back();
						} else {
							router.replace("/");
						}
					}}
					className="p-2.5 rounded-xl bg-surface-secondary/80 active:bg-surface-secondary"
					hitSlop={8}
				>
					<StyledIcon name="arrow-left" size={20} className="text-foreground" />
				</Pressable>
				<Text className="text-2xl font-bold text-foreground">
					Configurações
				</Text>
			</View>

			{/* APARÊNCIA - TEMAS */}
			<View>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Tema do Aplicativo
				</Text>
				<ThemeSelector currentTheme={theme} onSelectTheme={setTheme} />
			</View>

			{/* TARIFAS DE ENERGIA & ECONOMIA */}
			<View>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Tarifas de Energia & Economia
				</Text>
				<EnergySettingsSection />
			</View>

			{/* PAINEL DE DADOS E ARMAZENAMENTO */}
			<View>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Resumo de Dados
				</Text>
				<Card
					variant="default"
					className="mb-6 bg-surface border border-border shadow-sm p-4 rounded-2xl"
				>
					<View className="flex-row gap-2">
						<View className="flex-1 bg-surface-secondary p-2.5 rounded-xl items-center">
							<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
								Scooters
							</Text>
							<Text className="text-base font-black text-foreground">
								{dbStats.scootersCount}
							</Text>
						</View>

						<View className="flex-1 bg-surface-secondary p-2.5 rounded-xl items-center">
							<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
								Registros
							</Text>
							<Text className="text-base font-black text-foreground">
								{dbStats.logsCount}
							</Text>
						</View>

						<View className="flex-1 bg-surface-secondary p-2.5 rounded-xl items-center">
							<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
								Notas PDF
							</Text>
							<Text className="text-base font-black text-foreground">
								{dbStats.invoicesCount}
							</Text>
						</View>
					</View>
				</Card>
			</View>

			{/* BACKUP E RESTAURAÇÃO COMPLETA */}
			<View>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Backup Completo (Banco + Notas Fiscais)
				</Text>
				<Card
					variant="default"
					className="border border-border bg-surface mb-6 p-4 rounded-2xl shadow-sm"
				>
					<View className="flex-row gap-3 mb-3">
						<Button
							variant="primary"
							className="flex-1 bg-info shadow-sm"
							feedbackVariant="scale-ripple"
							onPress={handleBackup}
						>
							<StyledIcon name="upload" size={16} color="white" />
							<Button.Label className="text-white">Exportar</Button.Label>
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
							<Button.Label className="text-foreground">Restaurar</Button.Label>
						</Button>
					</View>
					<Text className="text-xs text-muted leading-5">
						Gera um pacote de segurança contendo todas as scooters, viagens,
						recargas, manutenções e{" "}
						<Text className="font-bold text-foreground">
							Notas Fiscais em PDF
						</Text>{" "}
						salvas no aparelho.
					</Text>
				</Card>
			</View>

			{/* ZONA DE PERIGO */}
			<View>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Zona de Perigo
				</Text>
				<Card
					variant="default"
					className="border border-border bg-surface p-4 rounded-2xl mb-8 shadow-sm"
				>
					<Button
						variant="outline"
						className="w-full border-danger/30 bg-danger/5 active:bg-danger/10"
						onPress={() => setIsClearAllDialogOpen(true)}
					>
						<StyledIcon name="trash-2" size={16} className="text-danger" />
						<Button.Label className="text-danger font-bold">
							Apagar Todos os Dados
						</Button.Label>
					</Button>
					<Text className="text-[11px] text-muted text-center mt-2.5 leading-4">
						Esta ação apaga todas as scooters, registros e notas fiscais
						permanentemente.
					</Text>
				</Card>
			</View>

			{/* VERSÃO DINÂMICA DE APP.JSON */}
			<View className="items-center opacity-50 my-4">
				<StyledIcon name="zap" size={22} color="#10b981" className="mb-2" />
				<Text className="text-muted text-xs uppercase tracking-widest font-bold">
					ScooterTrack v{appVersion}
				</Text>
			</View>

			{/* Limpar Todos os Dados Dialog */}
			<ConfirmDialog
				isOpen={isClearAllDialogOpen}
				onOpenChange={setIsClearAllDialogOpen}
				title="Apagar todos os dados"
				description="CUIDADO: Você está prestes a apagar todas as scooters, usos, recargas e notas fiscais salvas. Essa ação não pode ser desfeita."
				confirmText="Apagar TUDO"
				onCancel={() => setIsClearAllDialogOpen(false)}
				onConfirm={executeClearAll}
			/>
		</ScreenWrapper>
	);
}
