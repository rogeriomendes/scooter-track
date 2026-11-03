import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "heroui-native/button";
import { Pressable, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { StyledIcon } from "@/components/StyledIcon";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import type { scooters } from "@/db/schema";

import { openPdfFile } from "@/utils/fileViewer";

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
			await openPdfFile(scooter.invoicePdfPath);
		}
	};

	return (
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title="Dados da Scooter"
		>
			<View className="mb-4">
				<View className="flex-row items-center justify-between">
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
			</View>

			<View className="gap-2.5 mb-4">
				{/* Linha 1: Total KM & Odômetro Inicial */}
				<View className="flex-row gap-2.5">
					<View className="flex-1 bg-surface p-3 rounded-xl border border-surface-secondary">
						<Text className="text-xs font-medium text-muted mb-1">
							Total KM (Geral)
						</Text>
						<Text className="text-sm font-bold text-foreground">
							{(totalKm ?? scooter.initialKm).toFixed(1)} km
						</Text>
					</View>

					<View className="flex-1 bg-surface p-3 rounded-xl border border-surface-secondary">
						<Text className="text-xs font-medium text-muted mb-1">
							Odômetro Inicial
						</Text>
						<Text className="text-sm font-bold text-foreground">
							{scooter.initialKm} km
						</Text>
					</View>
				</View>

				{/* Linha 2: Meta Autonomia & Data da Compra */}
				<View className="flex-row gap-2.5">
					<View className="flex-1 bg-surface p-3 rounded-xl border border-surface-secondary">
						<Text className="text-xs font-medium text-muted mb-1">
							Meta Autonomia
						</Text>
						<Text className="text-sm font-bold text-foreground">
							{scooter.autonomyGoal} km
						</Text>
					</View>

					<View className="flex-1 bg-surface p-3 rounded-xl border border-surface-secondary">
						<Text className="text-xs font-medium text-muted mb-1">
							Data da Compra
						</Text>
						<Text className="text-sm font-bold text-foreground">
							{scooter.purchaseDate
								? format(new Date(scooter.purchaseDate), "dd/MM/yyyy", {
										locale: ptBR,
									})
								: "Não informada"}
						</Text>
					</View>
				</View>

				{/* Linha 3: Nº Série & Nº Motor */}
				<View className="flex-row gap-2.5">
					<View className="flex-1 bg-surface p-3 rounded-xl border border-surface-secondary">
						<Text className="text-xs font-medium text-muted mb-1">
							Nº Série / Chassi
						</Text>
						<Text
							className="text-sm font-bold text-foreground"
							numberOfLines={1}
						>
							{scooter.serialNumber || "Não informado"}
						</Text>
					</View>

					<View className="flex-1 bg-surface p-3 rounded-xl border border-surface-secondary">
						<Text className="text-xs font-medium text-muted mb-1">
							Nº do Motor
						</Text>
						<Text
							className="text-sm font-bold text-foreground"
							numberOfLines={1}
						>
							{scooter.motorNumber || "Não informado"}
						</Text>
					</View>
				</View>

				{/* Linha 4: Aba Manutenção */}
				<View className="flex-row gap-2.5">
					<View className="flex-1 bg-surface p-3 rounded-xl border border-surface-secondary flex-row justify-between items-center">
						<Text className="text-xs font-medium text-muted">
							Aba Manutenção
						</Text>
						<Text
							className={`text-xs font-bold ${
								scooter.showMaintenance ? "text-success" : "text-muted"
							}`}
						>
							{scooter.showMaintenance ? "Ativada" : "Oculta"}
						</Text>
					</View>
				</View>
			</View>

			{scooter.invoicePdfPath && (
				<View className="mb-4">
					<Pressable
						onPress={viewInvoicePdf}
						className="flex-row items-center bg-surface/60 p-3.5 rounded-2xl active:opacity-80"
					>
						<View className="w-10 h-10 rounded-xl bg-success/15 items-center justify-center mr-3">
							<StyledIcon name="file-text" size={20} className="text-success" />
						</View>
						<View className="flex-1">
							<Text className="text-foreground font-bold text-sm">
								Nota Fiscal (PDF)
							</Text>
							<Text className="text-muted text-xs font-medium">
								Toque para abrir ou compartilhar
							</Text>
						</View>
						<StyledIcon name="eye" size={18} className="text-success" />
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
					<Button.Label>Editar Scooter</Button.Label>
				</Button>
			)}
		</AppBottomSheet>
	);
}
