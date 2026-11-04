import { format } from "date-fns";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";
import { Alert, Platform } from "react-native";
import { db, sqliteDb } from "@/db/client";
import { scooters } from "@/db/schema";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/utils/base64";

export async function readFileAsStringSafe(
	uri: string,
	encoding: "utf8" | "base64",
): Promise<string> {
	try {
		return await FileSystem.readAsStringAsync(uri, {
			encoding:
				encoding === "base64"
					? FileSystem.EncodingType.Base64
					: FileSystem.EncodingType.UTF8,
		});
	} catch (_fsError) {
		const response = await fetch(uri);
		if (encoding === "base64") {
			const blob = await response.blob();
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					const result = reader.result as string;
					const commaIdx = result.indexOf(",");
					resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
				};
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		}
		return await response.text();
	}
}

export async function performBackup(appVersion: string): Promise<boolean> {
	try {
		const dbBytes = await sqliteDb.serializeAsync();
		if (!dbBytes || dbBytes.length === 0) {
			Alert.alert("Aviso", "Nenhum banco de dados encontrado para backup.");
			return false;
		}

		const dbBase64 = uint8ArrayToBase64(dbBytes);

		const pdfInvoices: { filename: string; dataBase64: string }[] = [];
		if (FileSystem.documentDirectory) {
			const dirFiles = await FileSystem.readDirectoryAsync(
				FileSystem.documentDirectory,
			);
			const pdfFiles = dirFiles.filter((f) => f.endsWith(".pdf"));

			const invoices = await Promise.all(
				pdfFiles.map(async (fileName) => {
					const pdfPath = `${FileSystem.documentDirectory}${fileName}`;
					const pdfBase64 = await FileSystem.readAsStringAsync(pdfPath, {
						encoding: FileSystem.EncodingType.Base64,
					});
					return {
						filename: fileName,
						dataBase64: pdfBase64,
					};
				}),
			);
			pdfInvoices.push(...invoices);
		}

		const backupPayload = {
			version: appVersion,
			timestamp: Date.now(),
			dbBase64,
			invoices: pdfInvoices,
		};

		const backupFileName = `scootertrack_backup_${format(new Date(), "yyyyMMdd_HHmm")}.scootertrack`;
		const backupContent = JSON.stringify(backupPayload);

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
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					Alert.alert(
						"Backup Salvo!",
						`O arquivo de backup (${backupFileName}) foi salvo na pasta selecionada com sucesso.`,
					);
					return true;
				}
			} catch (safError) {
				console.log("SAF canceled or failed, falling back to share", safError);
			}
		}

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
		return true;
	} catch (e) {
		Alert.alert("Erro", `Não foi possível gerar o backup: ${e}`);
		return false;
	}
}

export async function performRestore(options: {
	onScooterRestored: (scooterId: number | null) => void;
	onSuccess: () => Promise<void>;
}): Promise<boolean> {
	try {
		const result = await DocumentPicker.getDocumentAsync({
			copyToCacheDirectory: Platform.OS !== "android",
		});

		if (result.canceled || !result.assets || result.assets.length === 0) {
			return false;
		}

		const fileAsset = result.assets[0];
		const fileUri = fileAsset.uri;
		const fileName = (fileAsset.name || "").toLowerCase();

		let dbBytes: Uint8Array | null = null;
		let dbBase64Data = "";
		let invoices: { filename: string; dataBase64: string }[] = [];

		if (fileName.endsWith(".db")) {
			dbBase64Data = await readFileAsStringSafe(fileUri, "base64");
			dbBytes = base64ToUint8Array(dbBase64Data);
		} else {
			const rawContent = await readFileAsStringSafe(fileUri, "utf8");
			const payload = JSON.parse(rawContent);

			if (!payload.dbBase64) {
				Alert.alert("Erro", "Arquivo de backup inválido ou corrompido.");
				return false;
			}

			dbBase64Data = payload.dbBase64;
			dbBytes = base64ToUint8Array(payload.dbBase64);
			if (Array.isArray(payload.invoices)) {
				invoices = payload.invoices;
			}
		}

		const targetDbPaths = [
			`${FileSystem.documentDirectory}SQLite/scootertrack.db`,
		];
		if (
			sqliteDb.databasePath &&
			!targetDbPaths.includes(sqliteDb.databasePath)
		) {
			targetDbPaths.push(sqliteDb.databasePath);
		}

		for (const p of targetDbPaths) {
			try {
				const parent = p.substring(0, p.lastIndexOf("/"));
				const dirInfo = await FileSystem.getInfoAsync(parent);
				if (!dirInfo.exists) {
					await FileSystem.makeDirectoryAsync(parent, {
						intermediates: true,
					});
				}
				await FileSystem.writeAsStringAsync(p, dbBase64Data, {
					encoding: FileSystem.EncodingType.Base64,
				});
			} catch (diskErr) {
				console.log("Aviso ao gravar cópia do banco em disco:", p, diskErr);
			}
		}

		if (dbBytes && dbBytes.length > 0) {
			try {
				const memoryDb = await SQLite.deserializeDatabaseAsync(dbBytes);
				await SQLite.backupDatabaseAsync({
					sourceDatabase: memoryDb,
					destDatabase: sqliteDb,
				});
				await memoryDb.closeAsync();
				await sqliteDb.execAsync("PRAGMA wal_checkpoint(TRUNCATE);");
			} catch (backupErr) {
				console.log("Aviso ao aplicar backup na conexão ativa:", backupErr);
			}
		}

		try {
			sqliteDb.execSync(
				"ALTER TABLE maintenance ADD COLUMN isCompleted INTEGER NOT NULL DEFAULT 0;",
			);
		} catch {}
		try {
			sqliteDb.execSync(
				"ALTER TABLE maintenance ADD COLUMN completedAt INTEGER;",
			);
		} catch {}
		try {
			sqliteDb.execSync(
				"ALTER TABLE maintenance ADD COLUMN hasWear INTEGER NOT NULL DEFAULT 1;",
			);
		} catch {}

		await Promise.all(
			invoices.map(async (inv) => {
				if (inv.filename && inv.dataBase64) {
					const destPath = `${FileSystem.documentDirectory}${inv.filename}`;
					await FileSystem.writeAsStringAsync(destPath, inv.dataBase64, {
						encoding: FileSystem.EncodingType.Base64,
					});
				}
			}),
		);

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		const restoredScooters = await db.select().from(scooters);
		if (restoredScooters.length > 0) {
			options.onScooterRestored(restoredScooters[0].id);
		} else {
			options.onScooterRestored(null);
		}

		await options.onSuccess();

		Alert.alert(
			"Restauração Concluída!",
			`O backup foi restaurado com sucesso! (${invoices.length} comprovante(s)/nota(s) recuperada(s)).`,
		);
		return true;
	} catch (e) {
		Alert.alert("Erro", `Não foi possível restaurar o backup: ${e}`);
		return false;
	}
}
