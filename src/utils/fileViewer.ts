import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

export async function openPdfFile(filePath: string) {
	if (!filePath) return;

	try {
		if (Platform.OS === "android") {
			const contentUri = await FileSystem.getContentUriAsync(filePath);
			await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
				data: contentUri,
				flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
				type: "application/pdf",
			});
			return;
		}

		const canShare = await Sharing.isAvailableAsync();
		if (canShare) {
			await Sharing.shareAsync(filePath, {
				mimeType: "application/pdf",
				dialogTitle: "Nota Fiscal",
				UTI: "com.adobe.pdf",
			});
		} else {
			Alert.alert(
				"Erro",
				"Não foi possível abrir a Nota Fiscal neste dispositivo.",
			);
		}
	} catch (error) {
		console.error("Error opening PDF with IntentLauncher:", error);
		try {
			await Sharing.shareAsync(filePath, {
				mimeType: "application/pdf",
				dialogTitle: "Nota Fiscal",
			});
		} catch {
			Alert.alert("Erro", "Não foi possível abrir a Nota Fiscal em PDF.");
		}
	}
}
