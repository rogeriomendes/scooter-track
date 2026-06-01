import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { eq } from "drizzle-orm";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { BottomSheet, Button, Label, TextField } from "heroui-native";
import { useEffect, useState } from "react";
import {
	Alert,
	Keyboard,
	Platform,
	Pressable,
	Switch,
	Text,
	View,
} from "react-native";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { StyledIcon } from "@/components/StyledIcon";
import { BATTERY_CHARTS } from "@/constants/batteryCharts";
import { db } from "@/db/client";
import { scooters } from "@/db/schema";
import { useAppStore } from "@/store/useAppStore";

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
				setPurchaseDate(new Date());
				setSerialNumber("");
				setMotorNumber("");
				setInvoicePdfPath(null);
			}
		}
	}, [isOpen, editItem]);

	const onChangeDate = (event: any, selectedDate?: Date) => {
		setShowDatePicker(Platform.OS === "ios");
		if (selectedDate) {
			setPurchaseDate(selectedDate);
		}
	};

	const pickInvoicePdf = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: "application/pdf",
				copyToCacheDirectory: false,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const pickedFile = result.assets[0];

				// Copiar para a pasta segura do app
				const fileName = `invoice_${Date.now()}_${pickedFile.name}`;
				const destPath = `${FileSystem.documentDirectory}${fileName}`;

				await FileSystem.copyAsync({
					from: pickedFile.uri,
					to: destPath,
				});

				setInvoicePdfPath(destPath);
			}
		} catch (error) {
			Alert.alert("Erro", "Não foi possível selecionar o PDF.");
		}
	};

	const viewInvoicePdf = async () => {
		if (invoicePdfPath) {
			try {
				const canShare = await Sharing.isAvailableAsync();
				if (canShare) {
					await Sharing.shareAsync(invoicePdfPath, {
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
				Alert.alert("Erro", "Não foi possível abrir o PDF.");
			}
		}
	};

	const removeInvoicePdf = () => {
		// Ideally we would delete from FileSystem here, but simple nullification works for now
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
					purchaseDate,
					serialNumber,
					motorNumber,
					invoicePdfPath,
					createdAt: new Date(),
				})
				.returning();

			// If it's the very first scooter added, auto-select it.
			// We rely on the parent to fetch scooters and update state.
			// However, we can just proactively set it if we know it's a new one.
			// It's safer if the parent passes activeScooterId or handles it, but since we have useAppStore:
			const existingScooters = await db.select().from(scooters);
			if (existingScooters.length === 1) {
				setActiveScooterId(newScooter.id);
			}
		}

		setInitialKm("0");
		setSerialNumber("");
		setMotorNumber("");
		setInvoicePdfPath(null);
		onOpenChange(false);
		onSaved();
	};

	return (
		<BottomSheet
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) Keyboard.dismiss();
				onOpenChange(open);
			}}
		>
			<BottomSheet.Portal>
				<BottomSheet.Overlay />
				<BottomSheet.Content
					keyboardBehavior="interactive"
					keyboardBlurBehavior="restore"
				>
					<BottomSheet.Title className="text-xl font-bold text-foreground mb-4">
						{editItem ? "Editar Scooter" : "Adicionar Scooter"}
					</BottomSheet.Title>

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
							onValueChange={(val) =>
								setTrackingMode(val ? "percent" : "voltage")
							}
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
					<TextField>
						<Label>Odômetro Inicial (KM)</Label>
						<BottomSheetInput
							placeholder="0"
							keyboardType="numeric"
							value={initialKm}
							onChangeText={setInitialKm}
							variant="secondary"
						/>
					</TextField>

					<TextField>
						<Label>Data de Compra</Label>
						<Pressable
							onPress={() => setShowDatePicker(true)}
							className="bg-surface-secondary h-12 rounded-xl justify-center px-4"
						>
							<Text className="text-foreground text-base">
								{format(purchaseDate, "dd/MM/yyyy", { locale: ptBR })}
							</Text>
						</Pressable>
					</TextField>

					<TextField>
						<Label>Número de Série / Chassi (Opcional)</Label>
						<BottomSheetInput
							placeholder="Ex: 9AABCD1234..."
							value={serialNumber}
							onChangeText={setSerialNumber}
							variant="secondary"
							autoCapitalize="characters"
						/>
					</TextField>

					<TextField>
						<Label>Número do Motor (Opcional)</Label>
						<BottomSheetInput
							placeholder="Ex: 60V1000W..."
							value={motorNumber}
							onChangeText={setMotorNumber}
							variant="secondary"
							autoCapitalize="characters"
						/>
					</TextField>

					<View className="mt-2 mb-2">
						<Label className="mb-2">Nota Fiscal (PDF)</Label>
						{invoicePdfPath ? (
							<View className="flex-row items-center bg-surface-secondary p-3 rounded-xl">
								<StyledIcon
									name="file-text"
									size={24}
									className="text-primary mr-3"
								/>
								<View className="flex-1">
									<Text className="text-foreground font-bold text-sm">
										Nota Fiscal Anexada
									</Text>
								</View>
								<View className="flex-row gap-2">
									<Pressable
										onPress={viewInvoicePdf}
										className="p-2 bg-primary/20 rounded-lg"
									>
										<StyledIcon name="eye" size={16} className="text-primary" />
									</Pressable>
									<Pressable
										onPress={removeInvoicePdf}
										className="p-2 bg-danger/20 rounded-lg"
									>
										<StyledIcon
											name="trash-2"
											size={16}
											className="text-danger"
										/>
									</Pressable>
								</View>
							</View>
						) : (
							<Button
								variant="secondary"
								className="border border-dashed border-muted/30"
								onPress={pickInvoicePdf}
							>
								<View className="flex-row items-center gap-2">
									<StyledIcon
										name="upload"
										size={18}
										className="text-foreground"
									/>
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
					<View className="flex-row gap-2 mt-4 w-full">
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
							<Button.Label>
								{editItem ? "Salvar" : "Salvar Scooter"}
							</Button.Label>
						</Button>
					</View>
				</BottomSheet.Content>
			</BottomSheet.Portal>
			{showDatePicker && (
				<DateTimePicker
					value={purchaseDate}
					mode="date"
					is24Hour={true}
					onValueChange={onChangeDate}
					onDismiss={() => setShowDatePicker(false)}
				/>
			)}
		</BottomSheet>
	);
}
