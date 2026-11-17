import { format } from "date-fns";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { db } from "@/db/client";
import { batteryConfigs, logs, maintenance, scooters } from "@/db/schema";

/**
 * Escapa valores para o padrão CSV (RFC 4180):
 * - Strings com vírgula, aspas ou quebras de linha são envolvidas em aspas duplas.
 * - Aspas duplas internas são duplicadas ("").
 * - Null/undefined viram string vazia.
 * - Datas são convertidas em ISO string para legibilidade no Excel / Planilhas.
 */
function escapeCsvValue(val: unknown): string {
	if (val === null || val === undefined) return "";
	if (val instanceof Date) return val.toISOString();
	if (typeof val === "boolean") return val ? "true" : "false";

	const str = String(val);
	if (
		str.includes(",") ||
		str.includes('"') ||
		str.includes("\n") ||
		str.includes("\r")
	) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function generateCsvSection(
	title: string,
	headers: string[],
	rows: unknown[][],
): string {
	const headerLine = headers.join(",");
	const dataLines = rows.map((r) => r.map(escapeCsvValue).join(",")).join("\n");
	return `# === ${title} ===\n${headerLine}\n${dataLines}\n`;
}

export async function exportDatabaseToCsv(): Promise<boolean> {
	try {
		const [allScooters, allLogs, allMaintenance, allBatteryConfigs] =
			await Promise.all([
				db.select().from(scooters),
				db.select().from(logs),
				db.select().from(maintenance),
				db.select().from(batteryConfigs),
			]);

		// 1. Tabela Scooters
		const scootersHeaders = [
			"id",
			"name",
			"batteryType",
			"trackingMode",
			"initialKm",
			"autonomyGoal",
			"batteryCapacityWh",
			"showMaintenance",
			"motorPower",
			"purchaseDate",
			"serialNumber",
			"motorNumber",
			"invoicePdfPath",
			"createdAt",
		];
		const scootersRows = allScooters.map((s) => [
			s.id,
			s.name,
			s.batteryType,
			s.trackingMode,
			s.initialKm,
			s.autonomyGoal,
			s.batteryCapacityWh,
			s.showMaintenance,
			s.motorPower,
			s.purchaseDate,
			s.serialNumber,
			s.motorNumber,
			s.invoicePdfPath,
			s.createdAt,
		]);

		// 2. Tabela Logs (Viagens e Recargas)
		const logsHeaders = [
			"id",
			"scooterId",
			"type",
			"distance",
			"batteryLevel",
			"notes",
			"date",
		];
		const logsRows = allLogs.map((l) => [
			l.id,
			l.scooterId,
			l.type,
			l.distance,
			l.batteryLevel,
			l.notes,
			l.date,
		]);

		// 3. Tabela Maintenance (Manutenções e Trocas de Peças)
		const maintenanceHeaders = [
			"id",
			"scooterId",
			"name",
			"type",
			"intervalKm",
			"lastMaintenanceKm",
			"intervalMonths",
			"lastMaintenanceDate",
			"targetDate",
			"isCompleted",
			"completedAt",
			"hasWear",
			"createdAt",
		];
		const maintenanceRows = allMaintenance.map((m) => [
			m.id,
			m.scooterId,
			m.name,
			m.type,
			m.intervalKm,
			m.lastMaintenanceKm,
			m.intervalMonths,
			m.lastMaintenanceDate,
			m.targetDate,
			m.isCompleted,
			m.completedAt,
			m.hasWear,
			m.createdAt,
		]);

		// 4. Tabela Battery Configs (Voltagens e Configurações de Bateria)
		const batteryConfigsHeaders = [
			"id",
			"key",
			"label",
			"nominalVoltage",
			"cells",
			"maxVoltage",
			"minVoltage",
			"isDefault",
			"createdAt",
		];
		const batteryConfigsRows = allBatteryConfigs.map((b) => [
			b.id,
			b.key,
			b.label,
			b.nominalVoltage,
			b.cells,
			b.maxVoltage,
			b.minVoltage,
			b.isDefault,
			b.createdAt,
		]);

		// Monta o arquivo CSV unificado com cabeçalhos e metadados
		const exportDateStr = format(new Date(), "yyyy-MM-dd HH:mm:ss");
		const csvSections = [
			`# ScooterTrack CSV Database Export - ${exportDateStr}`,
			"# Este arquivo contém o backup legível de todas as tabelas do banco de dados.",
			"",
			generateCsvSection("SCOOTERS", scootersHeaders, scootersRows),
			generateCsvSection("LOGS", logsHeaders, logsRows),
			generateCsvSection("MAINTENANCE", maintenanceHeaders, maintenanceRows),
			generateCsvSection(
				"BATTERY_CONFIGS",
				batteryConfigsHeaders,
				batteryConfigsRows,
			),
		];

		// Adiciona BOM UTF-8 (\uFEFF) para garantir que Excel e editores de planilha abram acentos perfeitamente
		const csvContent = `\uFEFF${csvSections.join("\n")}`;

		const fileName = `scootertrack_export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;

		if (Platform.OS === "android") {
			try {
				const permissions =
					await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
				if (permissions.granted) {
					const createdUri =
						await FileSystem.StorageAccessFramework.createFileAsync(
							permissions.directoryUri,
							fileName,
							"text/csv",
						);
					await FileSystem.writeAsStringAsync(createdUri, csvContent, {
						encoding: FileSystem.EncodingType.UTF8,
					});
					Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					Alert.alert(
						"Exportação Concluída!",
						`O arquivo CSV (${fileName}) foi salvo com sucesso na pasta selecionada.`,
					);
					return true;
				}
			} catch (safError) {
				console.log(
					"SAF cancelado ou falhou, usando compartilhamento:",
					safError,
				);
			}
		}

		// Fallback para compartilhamento direto (iOS e Android quando SAF for cancelado)
		const cacheFilePath = `${FileSystem.cacheDirectory}${fileName}`;
		await FileSystem.writeAsStringAsync(cacheFilePath, csvContent, {
			encoding: FileSystem.EncodingType.UTF8,
		});

		await Sharing.shareAsync(cacheFilePath, {
			dialogTitle: "Exportar Banco de Dados em CSV",
			mimeType: "text/csv",
			UTI: "public.comma-separated-values-text",
		});

		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		return true;
	} catch (error) {
		console.error("Erro ao exportar CSV:", error);
		Alert.alert("Erro", `Não foi possível gerar a exportação em CSV: ${error}`);
		return false;
	}
}
