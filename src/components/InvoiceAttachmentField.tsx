import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { StyledIcon } from "@/components/StyledIcon";
import { readFileAsStringSafe } from "@/utils/backupRestore";
import { openPdfFile } from "@/utils/fileViewer";

interface InvoiceAttachmentFieldProps {
	invoicePdfPath: string | null;
	onChange: (path: string | null) => void;
	label?: string;
}

export function InvoiceAttachmentField({
	invoicePdfPath,
	onChange,
	label = "Nota Fiscal (PDF) (opcional)",
}: InvoiceAttachmentFieldProps) {
	const pickInvoicePdf = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "application/pdf",
				copyToCacheDirectory: Platform.OS !== "android",
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const asset = result.assets[0];
				const fileName = `nota_fiscal_${Date.now()}.pdf`;
				const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

				try {
					await FileSystem.copyAsync({
						from: asset.uri,
						to: destinationUri,
					});
				} catch {
					// Fallback com fetch/FileReader para contornar restrições de permissão
					const base64Data = await readFileAsStringSafe(asset.uri, "base64");
					await FileSystem.writeAsStringAsync(destinationUri, base64Data, {
						encoding: FileSystem.EncodingType.Base64,
					});
				}

				onChange(destinationUri);
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			}
		} catch (_error) {
			Alert.alert("Erro", "Não foi possível selecionar o PDF da Nota Fiscal.");
		}
	};

	const viewInvoicePdf = async () => {
		if (invoicePdfPath) {
			await openPdfFile(invoicePdfPath);
		}
	};

	return (
		<View className="mt-2">
			<Label className="mb-2">{label}</Label>
			{invoicePdfPath ? (
				<View className="flex-row items-center bg-surface/60 p-3 rounded-2xl border border-surface-secondary">
					<View className="w-9 h-9 rounded-xl bg-success/15 items-center justify-center mr-3">
						<StyledIcon name="file-text" size={18} className="text-success" />
					</View>
					<View className="flex-1">
						<Text className="text-foreground font-bold text-sm">
							Nota Fiscal Anexada
						</Text>
					</View>
					<View className="flex-row gap-2">
						<Pressable
							onPress={viewInvoicePdf}
							className="p-2 bg-success/15 rounded-lg active:opacity-70"
						>
							<StyledIcon name="eye" size={16} className="text-success" />
						</Pressable>
						<Pressable
							onPress={() => onChange(null)}
							className="p-2 bg-danger/15 rounded-lg active:opacity-70"
						>
							<StyledIcon name="trash-2" size={16} className="text-danger" />
						</Pressable>
					</View>
				</View>
			) : (
				<Button
					variant="secondary"
					className="bg-surface-secondary/60 border border-surface-secondary rounded-2xl"
					onPress={pickInvoicePdf}
				>
					<View className="flex-row items-center justify-center gap-2">
						<StyledIcon name="upload" size={18} className="text-foreground" />
						<Button.Label>Anexar Arquivo PDF</Button.Label>
					</View>
				</Button>
			)}
		</View>
	);
}
