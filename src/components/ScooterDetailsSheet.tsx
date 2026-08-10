import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as Sharing from "expo-sharing";
import { Button } from "heroui-native";
import { Alert, Pressable, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { StyledIcon } from "@/components/StyledIcon";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import type { scooters } from "@/db/schema";

interface ScooterDetailsSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	scooter: typeof scooters.$inferSelect | null;
	totalKm?: number;
	onEditRequest?: () => void;
}

export function ScooterDetailsSheet({
	isOpen,
	onOpenChange,
	scooter,
	totalKm,
	onEditRequest,
}: ScooterDetailsSheetProps) {
	if (!scooter) return null;

	const batteryInfo =
		BATTERY_CHARTS[scooter.batteryType]?.label || scooter.batteryType;

	const viewInvoicePdf = async () => {
		if (scooter.invoicePdfPath) {
			try {
				const canShare = await Sharing.isAvailableAsync();
				if (canShare) {
					await Sharing.shareAsync(scooter.invoicePdfPath, {
						mimeType: "application/pdf",
						dialogTitle: "Nota Fiscal",
					});
				} else {
					Alert.alert(
						"Erro",
						"Compartilhamento/Visualização não disponível neste dispositivo.",
					);
				}
			} catch (error) {
				Alert.alert("Erro", "Não foi possível abrir a Nota Fiscal em PDF.");
			}
		}
	};

	return (
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title="Dados da Scooter"
		>
			<View className="bg-surface-secondary/40 p-4 rounded-2xl border border-surface-secondary mb-4">
				<View className="flex-row items-center justify-between mb-2">
					<Text className="text-xl font-bold text-foreground">
						{scooter.name}
					</Text>
					<View className="bg-success/10 px-3 py-1 rounded-full border border-success/20">
						<Text className="text-xs font-bold text-success">
							{scooter.trackingMode === "percent"
								? "Bateria em %"
								: `Voltagem (${batteryInfo})`}
						</Text>
					</View>
				</View>
				<Text className="text-xs text-muted">
					Cadastrada em{" "}
					{scooter.createdAt
						? format(new Date(scooter.createdAt), "dd/MM/yyyy", {
								locale: ptBR,
							})
						: "-"}
				</Text>
			</View>

			<View className="gap-3 mb-4">
				<View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-secondary">
					<Text className="text-sm font-medium text-muted">Total KM (Geral)</Text>
					<Text className="text-sm font-bold text-foreground">
						{(totalKm ?? scooter.initialKm).toFixed(1)} km
					</Text>
				</View>

				<View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-secondary">
					<Text className="text-sm font-medium text-muted">Odômetro Inicial</Text>
					<Text className="text-sm font-bold text-foreground">
						{scooter.initialKm} km
					</Text>
				</View>

				<View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-secondary">
					<Text className="text-sm font-medium text-muted">Meta de Autonomia</Text>
					<Text className="text-sm font-bold text-foreground">
						{scooter.autonomyGoal} km
					</Text>
				</View>

				<View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-secondary">
					<Text className="text-sm font-medium text-muted">Data da Compra</Text>
					<Text className="text-sm font-bold text-foreground">
						{scooter.purchaseDate
							? format(new Date(scooter.purchaseDate), "dd/MM/yyyy", {
									locale: ptBR,
								})
							: "Não informada"}
					</Text>
				</View>

				<View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-secondary">
					<Text className="text-sm font-medium text-muted">
						Número de Série / Chassi
					</Text>
					<Text className="text-sm font-bold text-foreground">
						{scooter.serialNumber || "Não informado"}
					</Text>
				</View>

				<View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-secondary">
					<Text className="text-sm font-medium text-muted">Número do Motor</Text>
					<Text className="text-sm font-bold text-foreground">
						{scooter.motorNumber || "Não informado"}
					</Text>
				</View>

				<View className="flex-row justify-between items-center bg-surface p-3 rounded-xl border border-surface-secondary">
					<Text className="text-sm font-medium text-muted">Aba Manutenção</Text>
					<Text
						className={`text-sm font-bold ${
							scooter.showMaintenance ? "text-success" : "text-muted"
						}`}
					>
						{scooter.showMaintenance ? "Ativada" : "Oculta"}
					</Text>
				</View>
			</View>

			{scooter.invoicePdfPath && (
				<View className="mb-4">
					<Pressable
						onPress={viewInvoicePdf}
						className="flex-row items-center bg-surface-secondary p-3.5 rounded-xl border border-primary/20"
					>
						<StyledIcon
							name="file-text"
							size={22}
							className="text-primary mr-3"
						/>
						<View className="flex-1">
							<Text className="text-foreground font-bold text-sm">
								Visualizar Nota Fiscal (PDF)
							</Text>
							<Text className="text-muted text-xs">Clique para abrir</Text>
						</View>
						<StyledIcon name="eye" size={18} className="text-primary" />
					</Pressable>
				</View>
			)}

			{onEditRequest && (
				<Button
					variant="primary"
					className="w-full"
					onPress={() => {
						onOpenChange(false);
						onEditRequest();
					}}
				>
					<StyledIcon name="edit-2" size={16} className="text-white mr-2" />
					<Button.Label>Editar Scooter</Button.Label>
				</Button>
			)}
		</AppBottomSheet>
	);
}
