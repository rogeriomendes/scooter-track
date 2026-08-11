import { format } from "date-fns";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { Button } from "heroui-native/button";
import { Card } from "heroui-native/card";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { StyledIcon } from "@/components/StyledIcon";
import { db } from "@/db/client";
import { logs, maintenance, scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";

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
			const sList = await db.select().from(scooters);
			const lList = await db.select().from(logs);
			const mList = await db.select().from(maintenance);

			let pdfCount = 0;
			if (FileSystem.documentDirectory) {
				const files = await FileSystem.readDirectoryAsync(
					FileSystem.documentDirectory,
				);
				pdfCount = files.filter((f) => f.endsWith(".pdf")).length;
			}

			setDbStats({
				scootersCount: sList.length,
				logsCount: lList.length,
				maintenanceCount: mList.length,
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
		try {
			const dbPath = `${FileSystem.documentDirectory}SQLite/scootertrack.db`;
			const fileInfo = await FileSystem.getInfoAsync(dbPath);
			if (!fileInfo.exists) {
				Alert.alert("Aviso", "Nenhum banco de dados encontrado para backup.");
				return;
			}

			// Ler Banco SQLite em Base64
			const dbBase64 = await FileSystem.readAsStringAsync(dbPath, {
				encoding: FileSystem.EncodingType.Base64,
			});

			// Ler Notas Fiscais em PDF anexadas
			const pdfInvoices: { filename: string; dataBase64: string }[] = [];
			if (FileSystem.documentDirectory) {
				const dirFiles = await FileSystem.readDirectoryAsync(
					FileSystem.documentDirectory,
				);
				const pdfFiles = dirFiles.filter((f) => f.endsWith(".pdf"));

				for (const fileName of pdfFiles) {
					const pdfPath = `${FileSystem.documentDirectory}${fileName}`;
					const pdfBase64 = await FileSystem.readAsStringAsync(pdfPath, {
						encoding: FileSystem.EncodingType.Base64,
					});
					pdfInvoices.push({
						filename: fileName,
						dataBase64: pdfBase64,
					});
				}
			}

			// Pacote Completo de Backup (Banco + Notas Fiscais em PDF)
			const backupPayload = {
				version: appVersion,
				timestamp: Date.now(),
				dbBase64,
				invoices: pdfInvoices,
			};

			const backupFileName = `scootertrack_backup_${format(new Date(), "yyyyMMdd_HHmm")}.scootertrack`;
			const backupContent = JSON.stringify(backupPayload);

			// No Android, permitir que o usuário escolha a pasta de destino (Storage Access Framework)
			if (Platform.OS === "android") {
				try {
					const permissions =
						await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
					if (permissions.granted) {
						const createdUri =
							await FileSystem.StorageAccessFramework.createFileAsync(
								permissions.directoryUri,
								backupFileName,
								"application/json",
							);
						await FileSystem.writeAsStringAsync(createdUri, backupContent, {
							encoding: FileSystem.EncodingType.UTF8,
						});
						Haptics.notificationAsync(
							Haptics.NotificationFeedbackType.Success,
						);
						Alert.alert(
							"Backup Salvo!",
							`O arquivo de backup (${backupFileName}) foi salvo na pasta selecionada com sucesso.`,
						);
						return;
					}
				} catch (safError) {
					console.log("SAF canceled or failed, falling back to share", safError);
				}
			}

			// Fallback para Compartilhamento (ou no iOS)
			const backupFilePath = `${FileSystem.cacheDirectory}${backupFileName}`;

			await FileSystem.writeAsStringAsync(backupFilePath, backupContent, {
				encoding: FileSystem.EncodingType.UTF8,
			});

			await Sharing.shareAsync(backupFilePath, {
				dialogTitle: "Backup ScooterTrack (Banco + Notas Fiscais)",
				mimeType: "application/json",
				UTI: "public.json",
			});

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch (e) {
			Alert.alert("Erro", `Não foi possível gerar o backup: ${e}`);
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

			const fileAsset = result.assets[0];
			const fileUri = fileAsset.uri;
			const fileName = fileAsset.name.toLowerCase();

			const dbPath = `${FileSystem.documentDirectory}SQLite/scootertrack.db`;

			// 1. Backup legado apenas com extensão .db
			if (fileName.endsWith(".db")) {
				await FileSystem.copyAsync({
					from: fileUri,
					to: dbPath,
				});
			} else {
				// 2. Pacote Completo .scootertrack ou .json
				const rawContent = await FileSystem.readAsStringAsync(fileUri, {
					encoding: FileSystem.EncodingType.UTF8,
				});

				const payload = JSON.parse(rawContent);

				if (!payload.dbBase64) {
					Alert.alert("Erro", "Arquivo de backup inválido ou corrompido.");
					return;
				}

				// Restaurar Banco SQLite
				await FileSystem.writeAsStringAsync(dbPath, payload.dbBase64, {
					encoding: FileSystem.EncodingType.Base64,
				});

				// Restaurar Notas Fiscais em PDF
				if (Array.isArray(payload.invoices)) {
					for (const inv of payload.invoices) {
						if (inv.filename && inv.dataBase64) {
							const destPath = `${FileSystem.documentDirectory}${inv.filename}`;
							await FileSystem.writeAsStringAsync(destPath, inv.dataBase64, {
								encoding: FileSystem.EncodingType.Base64,
							});
						}
					}
				}
			}

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			setActiveScooterId(null);
			triggerRefresh();
			await loadStats();

			Alert.alert(
				"Restauração Concluída!",
				"O banco de dados e todas as Notas Fiscais salvas foram restaurados com sucesso.",
			);
		} catch (e) {
			Alert.alert("Erro", `Não foi possível restaurar o backup: ${e}`);
		}
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
			<Animated.View entering={FadeInDown.delay(100).springify()}>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Tema do Aplicativo
				</Text>
				<View className="flex-row gap-2.5 mb-6">
					{/* CLARO */}
					<Pressable
						onPress={() => {
							setTheme("light");
							Haptics.selectionAsync();
						}}
						className={`flex-1 p-3 rounded-2xl border flex-col items-center justify-between gap-2 ${
							theme === "light"
								? "bg-warning/10 border-warning/50 shadow-sm"
								: "bg-surface border-surface-secondary/70"
						}`}
					>
						<View
							className={`w-9 h-9 rounded-xl items-center justify-center ${
								theme === "light" ? "bg-warning/20" : "bg-surface-secondary/50"
							}`}
						>
							<StyledIcon
								name="sun"
								size={18}
								className={theme === "light" ? "text-warning" : "text-muted"}
							/>
						</View>
						<Text
							className={`text-xs font-bold ${
								theme === "light" ? "text-foreground" : "text-muted"
							}`}
						>
							Claro
						</Text>
						{theme === "light" ? (
							<View className="w-1.5 h-1.5 rounded-full bg-warning" />
						) : (
							<View className="w-1.5 h-1.5" />
						)}
					</Pressable>

					{/* ESCURO */}
					<Pressable
						onPress={() => {
							setTheme("dark");
							Haptics.selectionAsync();
						}}
						className={`flex-1 p-3 rounded-2xl border flex-col items-center justify-between gap-2 ${
							theme === "dark"
								? "bg-info/10 border-info/50 shadow-sm"
								: "bg-surface border-surface-secondary/70"
						}`}
					>
						<View
							className={`w-9 h-9 rounded-xl items-center justify-center ${
								theme === "dark" ? "bg-info/20" : "bg-surface-secondary/50"
							}`}
						>
							<StyledIcon
								name="moon"
								size={18}
								className={theme === "dark" ? "text-info" : "text-muted"}
							/>
						</View>
						<Text
							className={`text-xs font-bold ${
								theme === "dark" ? "text-foreground" : "text-muted"
							}`}
						>
							Escuro
						</Text>
						{theme === "dark" ? (
							<View className="w-1.5 h-1.5 rounded-full bg-info" />
						) : (
							<View className="w-1.5 h-1.5" />
						)}
					</Pressable>

					{/* SISTEMA / AUTO */}
					<Pressable
						onPress={() => {
							setTheme("system");
							Haptics.selectionAsync();
						}}
						className={`flex-1 p-3 rounded-2xl border flex-col items-center justify-between gap-2 ${
							theme === "system"
								? "bg-success/10 border-success/50 shadow-sm"
								: "bg-surface border-surface-secondary/70"
						}`}
					>
						<View
							className={`w-9 h-9 rounded-xl items-center justify-center ${
								theme === "system" ? "bg-success/20" : "bg-surface-secondary/50"
							}`}
						>
							<StyledIcon
								name="monitor"
								size={18}
								className={theme === "system" ? "text-success" : "text-muted"}
							/>
						</View>
						<Text
							className={`text-xs font-bold ${
								theme === "system" ? "text-foreground" : "text-muted"
							}`}
						>
							Sistema
						</Text>
						{theme === "system" ? (
							<View className="w-1.5 h-1.5 rounded-full bg-success" />
						) : (
							<View className="w-1.5 h-1.5" />
						)}
					</Pressable>
				</View>
			</Animated.View>

			{/* PAINEL DE DADOS E ARMAZENAMENTO */}
			<Animated.View entering={FadeInDown.delay(200).springify()}>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Resumo de Dados
				</Text>
				<Card
					variant="secondary"
					className="border border-surface-secondary bg-surface mb-6 p-4 rounded-2xl"
				>
					<View className="flex-row gap-2">
						<View className="flex-1 bg-surface-secondary/40 p-2.5 rounded-xl border border-surface-secondary/50 items-center">
							<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
								Scooters
							</Text>
							<Text className="text-base font-black text-foreground">
								{dbStats.scootersCount}
							</Text>
						</View>

						<View className="flex-1 bg-surface-secondary/40 p-2.5 rounded-xl border border-surface-secondary/50 items-center">
							<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
								Registros
							</Text>
							<Text className="text-base font-black text-foreground">
								{dbStats.logsCount}
							</Text>
						</View>

						<View className="flex-1 bg-surface-secondary/40 p-2.5 rounded-xl border border-surface-secondary/50 items-center">
							<Text className="text-[10px] font-bold text-muted uppercase mb-0.5">
								Notas PDF
							</Text>
							<Text className="text-base font-black text-foreground">
								{dbStats.invoicesCount}
							</Text>
						</View>
					</View>
				</Card>
			</Animated.View>

			{/* BACKUP E RESTAURAÇÃO COMPLETA */}
			<Animated.View entering={FadeInDown.delay(300).springify()}>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Backup Completo (Banco + Notas Fiscais)
				</Text>
				<Card
					variant="secondary"
					className="border border-surface-secondary bg-surface mb-6 p-4 rounded-2xl"
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
			</Animated.View>

			{/* ZONA DE PERIGO */}
			<Animated.View entering={FadeInDown.delay(400).springify()}>
				<Text className="text-xs font-bold text-muted mb-2 uppercase tracking-widest ml-1">
					Zona de Perigo
				</Text>
				<Card
					variant="secondary"
					className="border border-surface-secondary/80 bg-surface p-4 rounded-2xl mb-8"
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
			</Animated.View>

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
