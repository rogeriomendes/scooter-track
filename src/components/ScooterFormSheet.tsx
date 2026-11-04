import { eq } from "drizzle-orm";
import * as Haptics from "expo-haptics";
import { Button } from "heroui-native/button";
import { Label } from "heroui-native/label";
import { TextField } from "heroui-native/text-field";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { AppBottomSheet } from "@/components/AppBottomSheet";
import { BottomSheetInput } from "@/components/BottomSheetInput";
import { FormDateTimeField } from "@/components/FormDateTimeField";
import { InvoiceAttachmentField } from "@/components/InvoiceAttachmentField";
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
	const [autonomyGoal, setAutonomyGoal] = useState("0");
	const [batteryCapacityWh, setBatteryCapacityWh] = useState("");
	const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
	const [serialNumber, setSerialNumber] = useState("");
	const [motorNumber, setMotorNumber] = useState("");
	const [invoicePdfPath, setInvoicePdfPath] = useState<string | null>(null);

	const { setActiveScooterId } = useAppStore();

	const resetForm = useCallback(() => {
		setName("");
		setBatteryType("60V");
		setTrackingMode("voltage");
		setShowMaintenance(true);
		setInitialKm("0");
		setAutonomyGoal("0");
		setBatteryCapacityWh("");
		setPurchaseDate(new Date());
		setSerialNumber("");
		setMotorNumber("");
		setInvoicePdfPath(null);
	}, []);

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
				setBatteryCapacityWh(
					editItem.batteryCapacityWh
						? editItem.batteryCapacityWh.toString()
						: "",
				);
				setPurchaseDate(editItem.purchaseDate || new Date());
				setSerialNumber(editItem.serialNumber || "");
				setMotorNumber(editItem.motorNumber || "");
				setInvoicePdfPath(editItem.invoicePdfPath || null);
			} else {
				resetForm();
			}
		}
	}, [isOpen, editItem, resetForm]);

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
					batteryCapacityWh: parseFloat(batteryCapacityWh) || 0,
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
					batteryCapacityWh: parseFloat(batteryCapacityWh) || 0,
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

		resetForm();
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
				<View className="gap-1.5 mb-2">
					<Text className="text-sm font-medium text-foreground">
						Selecione a Voltagem
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerClassName="gap-2 py-0.5"
					>
						{Object.keys(BATTERY_CHARTS).map((key) => (
							<Button
								key={key}
								size="sm"
								variant={batteryType === key ? "primary" : "secondary"}
								className="px-3 py-1 h-8 min-h-0 rounded-xl"
								onPress={() => setBatteryType(key)}
							>
								<Button.Label className="text-xs font-bold">
									{BATTERY_CHARTS[key].label}
								</Button.Label>
							</Button>
						))}
					</ScrollView>
				</View>
			)}
			<View className="flex-row gap-3">
				<TextField className="flex-1">
					<Label>Odômetro (KM)</Label>
					<BottomSheetInput
						placeholder="0"
						keyboardType="numeric"
						value={initialKm}
						onChangeText={setInitialKm}
						variant="secondary"
					/>
				</TextField>

				<TextField className="flex-1">
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

			<View className="flex-row gap-3">
				<TextField className="flex-1">
					<Label>Bateria em Wh (opcional)</Label>
					<BottomSheetInput
						placeholder="Ex: 360"
						keyboardType="numeric"
						value={batteryCapacityWh}
						onChangeText={setBatteryCapacityWh}
						variant="secondary"
					/>
				</TextField>

				<FormDateTimeField
					label="Data da Compra"
					value={purchaseDate}
					className="flex-1"
					onChange={setPurchaseDate}
				/>
			</View>

			<TextField className="w-full">
				<Label>Nº Série / Chassi (opcional)</Label>
				<BottomSheetInput
					placeholder="Ex: 9AABCD..."
					value={serialNumber}
					onChangeText={setSerialNumber}
					variant="secondary"
					autoCapitalize="characters"
				/>
			</TextField>

			<TextField className="w-full">
				<Label>Nº do Motor (opcional)</Label>
				<BottomSheetInput
					placeholder="Ex: 60V1000W..."
					value={motorNumber}
					onChangeText={setMotorNumber}
					variant="secondary"
					autoCapitalize="characters"
				/>
			</TextField>

			<InvoiceAttachmentField
				invoicePdfPath={invoicePdfPath}
				onChange={setInvoicePdfPath}
			/>

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
		</AppBottomSheet>
	);
}
