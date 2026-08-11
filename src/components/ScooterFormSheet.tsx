import DateTimePicker, {
	type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, Switch, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { StyledIcon } from "@/components/StyledIcon";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";
import { openPdfFile } from "@/utils/fileViewer";

interface ScooterFormSheetProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	onDeleteRequest?: (id: number) => void;
	editItem?: typeof scooters.$inferSelect | null;
}

export function ScooterFormSheet({
	isOpen,
	onOpenChange,
	onSaved,
	onDeleteRequest,
	editItem,
}: ScooterFormSheetProps) {
	const [name, setName] = useState("");
	const [batteryType, setBatteryType] = useState("60V");
	const [trackingMode, setTrackingMode] = useState<"voltage" | "percent">(
		"voltage",
	);
	const [showMaintenance, setShowMaintenance] = useState(true);
	const [initialKm, setInitialKm] = useState("0");
	const [autonomyGoal, setAutonomyGoal] = useState("0");
	const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [serialNumber, setSerialNumber] = useState("");
	const [motorNumber, setMotorNumber] = useState("");
	const [invoicePdfPath, setInvoicePdfPath] = useState<string | null>(null);

	const { setActiveScooterId } = useAppStore();

	useEffect(() => {
		if (isOpen) {
			if (editItem) {
				setName(editItem.name);
				setBatteryType(editItem.batteryType);
				setTrackingMode(editItem.trackingMode as "voltage" | "percent");
				setShowMaintenance(editItem.showMaintenance);
				setInitialKm(editItem.initialKm.toString());
				setAutonomyGoal(
					editItem.autonomyGoal ? editItem.autonomyGoal.toString() : "0",
				);
				setPurchaseDate(editItem.purchaseDate || new Date());
				setSerialNumber(editItem.serialNumber || "");
				setMotorNumber(editItem.motorNumber || "");
				setInvoicePdfPath(editItem.invoicePdfPath || null);
			} else {
				setName("");
				setBatteryType("60V");
				setTrackingMode("voltage");
				setShowMaintenance(true);
				setInitialKm("0");
				setAutonomyGoal("0");
				setPurchaseDate(new Date());
				setSerialNumber("");
				setMotorNumber("");
				setInvoicePdfPath(null);
			}
		}
	}, [isOpen, editItem]);

	const onChangeDate = (
		_event: DateTimePickerChangeEvent,
		selectedDate?: Date,
	) => {
		setShowDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setPurchaseDate(selectedDate);
		}
	};

	const pickInvoicePdf = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "application/pdf",
				copyToCacheDirectory: true,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const asset = result.assets[0];

				const fileName = `nota_fiscal_${Date.now()}.pdf`;
				const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

				await FileSystem.copyAsync({
					from: asset.uri,
					to: destinationUri,
				});

				setInvoicePdfPath(destinationUri);
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

	const removeInvoicePdf = () => {
		setInvoicePdfPath(null);
	};

	const handleSaveScooter = async () => {
		if (!name.trim()) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

		if (editItem) {
			await db
				.update(scooters)
				.set({
					name,
					batteryType,
					trackingMode,
					showMaintenance,
					initialKm: parseFloat(initialKm) || 0,
					autonomyGoal: parseFloat(autonomyGoal) || 0,
					purchaseDate,
					serialNumber,
					motorNumber,
					invoicePdfPath,
				})
				.where(eq(scooters.id, editItem.id));
		} else {
			const [newScooter] = await db
				.insert(scooters)
				.values({
					name,
					batteryType,
					trackingMode,
					showMaintenance,
					initialKm: parseFloat(initialKm) || 0,
					autonomyGoal: parseFloat(autonomyGoal) || 0,
					purchaseDate,
					serialNumber,
					motorNumber,
					invoicePdfPath,
					createdAt: new Date(),
				})
				.returning();

			const existingScooters = await db.select().from(scooters);
			if (existingScooters.length === 1) {
				setActiveScooterId(newScooter.id);
			}
		}

		setInitialKm("0");
		setAutonomyGoal("0");
		setSerialNumber("");
		setMotorNumber("");
		setInvoicePdfPath(null);
		onOpenChange(false);
		onSaved();
	};

	return (
		<AppBottomSheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={editItem ? "Editar Scooter" : "Adicionar Scooter"}
		>
			<TextField>
				<Label>Nome da Scooter</Label>
				<BottomSheetInput
					placeholder="Ex: Scooter 1"
					value={name}
					onChangeText={setName}
					variant="secondary"
				/>
			</TextField>
			<View className="flex-row items-center justify-between mt-2">
				<Text className="text-sm font-medium text-foreground flex-1 pr-4">
					O painel exibe a bateria em Porcentagem (%)?
				</Text>
				<Switch
					value={trackingMode === "percent"}
					onValueChange={(val) => setTrackingMode(val ? "percent" : "voltage")}
					trackColor={{ false: "#3f3f46", true: "#10b981" }}
					thumbColor="#ffffff"
				/>
			</View>

			{trackingMode === "voltage" && (
				<View className="gap-2 my-2">
					<Text className="text-sm font-medium text-foreground">
						Selecione a Voltagem
					</Text>
					<View className="flex-row flex-wrap gap-2">
						{Object.keys(BATTERY_CHARTS).map((key) => (
							<Button
								key={key}
								size="sm"
								variant={batteryType === key ? "primary" : "secondary"}
								onPress={() => setBatteryType(key)}
							>
								<Button.Label>{BATTERY_CHARTS[key].label}</Button.Label>
							</Button>
						))}
					</View>
				</View>
			)}
			<View className="flex-row gap-3">
				<View className="flex-1">
					<TextField>
						<Label>Odômetro (KM)</Label>
						<BottomSheetInput
							placeholder="0"
							keyboardType="numeric"
							value={initialKm}
							onChangeText={setInitialKm}
							variant="secondary"
						/>
					</TextField>
				</View>

				<View className="flex-1">
					<TextField>
						<Label>Autonomia (opcional)</Label>
						<BottomSheetInput
							placeholder="Ex: 50"
							keyboardType="numeric"
							value={autonomyGoal}
							onChangeText={setAutonomyGoal}
							variant="secondary"
						/>
					</TextField>
				</View>
			</View>

			<TextField>
				<Label>Data de Compra (opcional)</Label>
				<Pressable
					onPress={() => setShowDatePicker(true)}
					className="bg-surface-tertiary border border-surface-tertiary h-12 rounded-xl flex-row items-center justify-between px-4 active:opacity-80"
				>
					<Text className="text-foreground text-sm">
						{format(purchaseDate, "dd/MM/yyyy", { locale: ptBR })}
					</Text>
					<StyledIcon name="calendar" size={18} className="text-muted" />
				</Pressable>
			</TextField>

			<View className="flex-row gap-3">
				<View className="flex-1">
					<TextField>
						<Label>Nº Série / Chassi (opcional)</Label>
						<BottomSheetInput
							placeholder="Ex: 9AABCD..."
							value={serialNumber}
							onChangeText={setSerialNumber}
							variant="secondary"
							autoCapitalize="characters"
						/>
					</TextField>
				</View>

				<View className="flex-1">
					<TextField>
						<Label>Nº do Motor (opcional)</Label>
						<BottomSheetInput
							placeholder="Ex: 60V1000W..."
							value={motorNumber}
							onChangeText={setMotorNumber}
							variant="secondary"
							autoCapitalize="characters"
						/>
					</TextField>
				</View>
			</View>

			<View className="mt-2">
				<Label className="mb-2">Nota Fiscal (PDF) (opcional)</Label>
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
								onPress={removeInvoicePdf}
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

			<View className="flex-row items-center justify-between mt-2 mb-2">
				<Text className="text-sm font-medium text-foreground flex-1 pr-4">
					Exibir aba de Manutenção para esta scooter?
				</Text>
				<Switch
					value={showMaintenance}
					onValueChange={setShowMaintenance}
					trackColor={{ false: "#3f3f46", true: "#10b981" }}
					thumbColor="#ffffff"
				/>
			</View>
			<View className="flex-row gap-2 mt-2 w-full">
				{editItem && onDeleteRequest && (
					<Button
						variant="secondary"
						className="flex-1 bg-danger/10 border border-danger/10"
						feedbackVariant="scale-ripple"
						onPress={() => onDeleteRequest(editItem.id)}
					>
						<Button.Label className="text-danger">Excluir</Button.Label>
					</Button>
				)}
				<Button
					variant="primary"
					className="flex-1"
					onPress={handleSaveScooter}
				>
					<Button.Label>{editItem ? "Salvar" : "Salvar Scooter"}</Button.Label>
				</Button>
			</View>

			{showDatePicker && (
				<DateTimePicker
					value={purchaseDate}
					mode="date"
					is24Hour={true}
					onValueChange={onChangeDate}
					onDismiss={() => setShowDatePicker(false)}
				/>
			)}
		</AppBottomSheet>
	);
}
